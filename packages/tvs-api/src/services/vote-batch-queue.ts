/**
 * Vote Batch Queue Service
 *
 * Collects votes and flushes in batches to reduce per-vote overhead.
 * Dramatically improves throughput by batching:
 * - Merkle tree appends
 * - VeilCloud writes (streaming JSONL)
 * - Nullifier updates
 *
 * @example
 * const queue = getVoteBatchQueue();
 * queue.enqueue(vote, ledger, callback);
 * // Vote will be processed in next batch flush
 */

import { VoteLedger, type VoteEntry } from '@tvs/veilchain';
import { getVeilCloudStorage, getBufferedVeilCloudWriter, type StoredVote, type StoredNullifier } from './veilcloud-storage.js';

// ============================================================================
// Configuration
// ============================================================================

export interface BatchQueueConfig {
  /** Maximum votes per batch (default: 100) */
  batchSize: number;
  /** Max time to wait before flushing (ms, default: 100) */
  flushIntervalMs: number;
  /** Enable batch processing (default: true) */
  enabled: boolean;
}

const defaultConfig: BatchQueueConfig = {
  batchSize: parseInt(process.env['BATCH_SIZE'] || '100', 10),
  flushIntervalMs: parseInt(process.env['BATCH_FLUSH_MS'] || '100', 10),
  enabled: process.env['BATCH_ENABLED'] !== 'false',
};

// ============================================================================
// Types
// ============================================================================

export interface QueuedVote {
  entry: VoteEntry;
  questionId: string;
  electionId: string;
  ledger: VoteLedger;
  resolve: (result: VoteResult) => void;
  reject: (error: Error) => void;
}

export interface VoteResult {
  position: number;
  merkleRoot: string;
  proof: {
    leaf: string;
    proof: string[];
    positions: ('left' | 'right')[];
    root: string;
  };
}

export interface BatchStats {
  totalBatches: number;
  totalVotes: number;
  avgBatchSize: number;
  avgFlushTimeMs: number;
  lastFlushTimeMs: number;
}

// ============================================================================
// Vote Batch Queue
// ============================================================================

export class VoteBatchQueue {
  private readonly config: BatchQueueConfig;
  private queue: QueuedVote[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;

  // Stats tracking
  private stats: BatchStats = {
    totalBatches: 0,
    totalVotes: 0,
    avgBatchSize: 0,
    avgFlushTimeMs: 0,
    lastFlushTimeMs: 0,
  };

  constructor(config?: Partial<BatchQueueConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Enqueue a vote for batch processing
   * Returns a promise that resolves when the vote is committed
   */
  enqueue(
    entry: VoteEntry,
    questionId: string,
    electionId: string,
    ledger: VoteLedger
  ): Promise<VoteResult> {
    // If batching disabled, process immediately
    if (!this.config.enabled) {
      return this.processImmediately(entry, questionId, electionId, ledger);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        entry,
        questionId,
        electionId,
        ledger,
        resolve,
        reject,
      });

      // Check if we should flush
      if (this.queue.length >= this.config.batchSize) {
        this.flush();
      } else if (!this.flushTimer) {
        // Start timer for time-based flush
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.config.flushIntervalMs);
      }
    });
  }

  /**
   * Process vote immediately (bypass batching)
   */
  private async processImmediately(
    entry: VoteEntry,
    questionId: string,
    electionId: string,
    ledger: VoteLedger
  ): Promise<VoteResult> {
    const { position, proof } = ledger.append(entry);

    // Store to VeilCloud if enabled
    const veilcloud = getVeilCloudStorage();
    if (veilcloud.isEnabled()) {
      const storedVote: StoredVote = {
        id: entry.id,
        questionId,
        electionId,
        encryptedVote: entry.encryptedVote,
        commitment: entry.commitment,
        zkProof: entry.zkProof,
        nullifier: entry.nullifier,
        timestamp: entry.timestamp,
        position,
        merkleRoot: proof.root,
      };

      await veilcloud.storeVote(storedVote);
    }

    return { position, merkleRoot: proof.root, proof };
  }

  /**
   * Flush all queued votes
   */
  async flush(): Promise<void> {
    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Skip if already flushing or queue empty
    if (this.flushing || this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    const startTime = Date.now();

    // Take snapshot of queue
    const batch = this.queue;
    this.queue = [];

    try {
      await this.processBatch(batch);

      // Update stats
      const flushTime = Date.now() - startTime;
      this.stats.totalBatches++;
      this.stats.totalVotes += batch.length;
      this.stats.avgBatchSize = this.stats.totalVotes / this.stats.totalBatches;
      this.stats.lastFlushTimeMs = flushTime;
      this.stats.avgFlushTimeMs =
        (this.stats.avgFlushTimeMs * (this.stats.totalBatches - 1) + flushTime) /
        this.stats.totalBatches;
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Process a batch of votes
   */
  private async processBatch(batch: QueuedVote[]): Promise<void> {
    // Group by ledger for efficient Merkle updates
    const byLedger = new Map<VoteLedger, QueuedVote[]>();
    for (const vote of batch) {
      const list = byLedger.get(vote.ledger) || [];
      list.push(vote);
      byLedger.set(vote.ledger, list);
    }

    const veilcloud = getVeilCloudStorage();
    const votesToStore: StoredVote[] = [];
    const nullifiersToStore: Map<string, StoredNullifier[]> = new Map();

    // Process each ledger's votes
    for (const [ledger, votes] of byLedger) {
      // Batch append to Merkle tree
      const entries = votes.map(v => v.entry);
      const results = ledger.appendBatch(entries);

      // Prepare storage and resolve promises
      for (let i = 0; i < votes.length; i++) {
        const vote = votes[i]!;
        const result = results[i]!;

        // Prepare VeilCloud storage
        if (veilcloud.isEnabled()) {
          const storedVote: StoredVote = {
            id: vote.entry.id,
            questionId: vote.questionId,
            electionId: vote.electionId,
            encryptedVote: vote.entry.encryptedVote,
            commitment: vote.entry.commitment,
            zkProof: vote.entry.zkProof,
            nullifier: vote.entry.nullifier,
            timestamp: vote.entry.timestamp,
            position: result.position,
            merkleRoot: result.proof.root,
          };
          votesToStore.push(storedVote);

          // Group nullifiers by election
          const nullifiers = nullifiersToStore.get(vote.electionId) || [];
          nullifiers.push({
            nullifier: vote.entry.nullifier,
            questionId: vote.questionId,
            timestamp: vote.entry.timestamp,
          });
          nullifiersToStore.set(vote.electionId, nullifiers);
        }

        // Resolve the vote's promise
        vote.resolve({
          position: result.position,
          merkleRoot: result.proof.root,
          proof: result.proof,
        });
      }
    }

    // Buffer writes to VeilCloud (non-blocking, high performance)
    if (veilcloud.isEnabled() && votesToStore.length > 0) {
      try {
        const bufferedWriter = getBufferedVeilCloudWriter();

        // Use buffered writer for high-throughput (non-blocking)
        bufferedWriter.bufferVotes(votesToStore);

        // Buffer nullifiers
        for (const [electionId, nullifiers] of nullifiersToStore) {
          bufferedWriter.bufferNullifiers(electionId, nullifiers);
        }

        // Note: Data is flushed asynchronously in batches of 1000
        // Use bufferedWriter.drain() to wait for all writes to complete
      } catch (err) {
        console.error('VeilCloud batch storage error:', err);
        // Don't fail the votes - they're already in the Merkle tree
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): BatchStats & { pendingVotes: number; config: BatchQueueConfig } {
    return {
      ...this.stats,
      pendingVotes: this.queue.length,
      config: this.config,
    };
  }

  /**
   * Force flush and wait for completion (including VeilCloud writes)
   */
  async drain(): Promise<void> {
    await this.flush();

    // Also drain the buffered VeilCloud writer
    const veilcloud = getVeilCloudStorage();
    if (veilcloud.isEnabled()) {
      const bufferedWriter = getBufferedVeilCloudWriter();
      await bufferedWriter.drain();
    }
  }

  /**
   * Check if batching is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: VoteBatchQueue | null = null;

export function getVoteBatchQueue(): VoteBatchQueue {
  if (!instance) {
    instance = new VoteBatchQueue();
  }
  return instance;
}

/**
 * Initialize with custom config (for testing)
 */
export function initVoteBatchQueue(config: Partial<BatchQueueConfig>): VoteBatchQueue {
  instance = new VoteBatchQueue(config);
  return instance;
}
