/**
 * VeilCloud Storage Service for TVS API
 *
 * Persists votes and election data to local filesystem using VeilCloud's
 * zero-knowledge storage pattern. Configured via environment variables:
 *
 * - VEILCLOUD_STORAGE_PATH: Base path for storage (default: ./data/veilcloud)
 * - VEILCLOUD_ENABLED: Set to 'true' to enable persistent storage
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// Configuration
// ============================================================================

export interface VeilCloudStorageConfig {
  basePath: string;
  enabled: boolean;
}

export function getConfig(): VeilCloudStorageConfig {
  return {
    basePath: process.env['VEILCLOUD_STORAGE_PATH'] || './data/veilcloud',
    enabled: process.env['VEILCLOUD_ENABLED'] === 'true',
  };
}

// ============================================================================
// Types
// ============================================================================

export interface StoredVote {
  id: string;
  questionId: string;
  electionId: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  nullifier: string;
  timestamp: number;
  position: number;
  merkleRoot: string;
}

export interface StoredNullifier {
  nullifier: string;
  questionId: string;
  timestamp: number;
}

export interface ElectionSnapshot {
  electionId: string;
  questionId: string;
  voteCount: number;
  merkleRoot: string;
  lastUpdated: number;
}

// ============================================================================
// VeilCloud Storage Service
// ============================================================================

export class VeilCloudStorageService {
  private readonly basePath: string;
  private readonly enabled: boolean;

  constructor(config?: Partial<VeilCloudStorageConfig>) {
    const defaultConfig = getConfig();
    this.basePath = config?.basePath || defaultConfig.basePath;
    this.enabled = config?.enabled ?? defaultConfig.enabled;
  }

  /**
   * Check if storage is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Get path for election data
   */
  private getElectionPath(electionId: string): string {
    return join(this.basePath, 'elections', electionId);
  }

  /**
   * Get path for question data
   */
  private getQuestionPath(electionId: string, questionId: string): string {
    return join(this.getElectionPath(electionId), 'questions', questionId);
  }

  /**
   * Get path for votes
   */
  private getVotesPath(electionId: string, questionId: string): string {
    return join(this.getQuestionPath(electionId, questionId), 'votes');
  }

  /**
   * Get path for nullifiers
   */
  private getNullifiersPath(electionId: string): string {
    return join(this.getElectionPath(electionId), 'nullifiers.json');
  }

  /**
   * Get path for snapshot
   */
  private getSnapshotPath(electionId: string, questionId: string): string {
    return join(this.getQuestionPath(electionId, questionId), 'snapshot.json');
  }

  // =========================================================================
  // Vote Storage
  // =========================================================================

  /**
   * Store a vote
   */
  async storeVote(vote: StoredVote): Promise<void> {
    if (!this.enabled) return;

    const votePath = join(
      this.getVotesPath(vote.electionId, vote.questionId),
      `${vote.position.toString().padStart(8, '0')}-${vote.id}.json`
    );

    await this.ensureDir(votePath);
    await fs.writeFile(votePath, JSON.stringify(vote, null, 2));
  }

  /**
   * Store multiple votes in batch (legacy - individual files)
   */
  async storeVotesBatch(votes: StoredVote[]): Promise<void> {
    if (!this.enabled || votes.length === 0) return;

    // Group by question for efficient writing
    const byQuestion = new Map<string, StoredVote[]>();
    for (const vote of votes) {
      const key = `${vote.electionId}:${vote.questionId}`;
      const list = byQuestion.get(key) || [];
      list.push(vote);
      byQuestion.set(key, list);
    }

    // Write each group
    for (const [, questionVotes] of byQuestion) {
      for (const vote of questionVotes) {
        await this.storeVote(vote);
      }
    }
  }

  /**
   * Store multiple votes using streaming JSONL format (much faster)
   * Appends to a single votes.jsonl file per question
   */
  async storeVotesBatchStream(votes: StoredVote[]): Promise<void> {
    if (!this.enabled || votes.length === 0) return;

    // Group by question for efficient writing
    const byQuestion = new Map<string, StoredVote[]>();
    for (const vote of votes) {
      const key = `${vote.electionId}:${vote.questionId}`;
      const list = byQuestion.get(key) || [];
      list.push(vote);
      byQuestion.set(key, list);
    }

    // Write each question's votes to a JSONL file
    for (const [key, questionVotes] of byQuestion) {
      const parts = key.split(':');
      const electionId = parts[0]!;
      const questionId = parts[1]!;
      const jsonlPath = join(this.getQuestionPath(electionId, questionId), 'votes.jsonl');
      await this.ensureDir(jsonlPath);

      // Build JSONL content (one JSON object per line)
      const lines = questionVotes.map(vote => JSON.stringify(vote)).join('\n') + '\n';

      // Append to file
      await fs.appendFile(jsonlPath, lines);
    }
  }

  /**
   * Load votes from JSONL format
   */
  async loadVotesStream(electionId: string, questionId: string): Promise<StoredVote[]> {
    if (!this.enabled) return [];

    const jsonlPath = join(this.getQuestionPath(electionId, questionId), 'votes.jsonl');

    try {
      const content = await fs.readFile(jsonlPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Fall back to individual files
        return this.loadVotes(electionId, questionId);
      }
      throw error;
    }
  }

  /**
   * Load votes for a question
   */
  async loadVotes(electionId: string, questionId: string): Promise<StoredVote[]> {
    if (!this.enabled) return [];

    const votesDir = this.getVotesPath(electionId, questionId);
    const votes: StoredVote[] = [];

    try {
      const files = await fs.readdir(votesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort();

      for (const file of jsonFiles) {
        const content = await fs.readFile(join(votesDir, file), 'utf-8');
        votes.push(JSON.parse(content));
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return votes;
  }

  /**
   * Get vote count for a question
   */
  async getVoteCount(electionId: string, questionId: string): Promise<number> {
    if (!this.enabled) return 0;

    const votesDir = this.getVotesPath(electionId, questionId);

    try {
      const files = await fs.readdir(votesDir);
      return files.filter(f => f.endsWith('.json')).length;
    } catch {
      return 0;
    }
  }

  // =========================================================================
  // Nullifier Storage
  // =========================================================================

  /**
   * Store a nullifier
   */
  async storeNullifier(electionId: string, nullifier: StoredNullifier): Promise<void> {
    if (!this.enabled) return;

    const nullifiersPath = this.getNullifiersPath(electionId);
    await this.ensureDir(nullifiersPath);

    // Load existing nullifiers
    let nullifiers: StoredNullifier[] = [];
    try {
      const content = await fs.readFile(nullifiersPath, 'utf-8');
      nullifiers = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    // Add new nullifier
    nullifiers.push(nullifier);

    // Write back
    await fs.writeFile(nullifiersPath, JSON.stringify(nullifiers, null, 2));
  }

  /**
   * Store multiple nullifiers in batch using JSONL append
   */
  async storeNullifiersBatch(electionId: string, nullifiers: StoredNullifier[]): Promise<void> {
    if (!this.enabled || nullifiers.length === 0) return;

    const nullifiersJsonlPath = join(this.getElectionPath(electionId), 'nullifiers.jsonl');
    await this.ensureDir(nullifiersJsonlPath);

    // Build JSONL content
    const lines = nullifiers.map(n => JSON.stringify(n)).join('\n') + '\n';

    // Append to file
    await fs.appendFile(nullifiersJsonlPath, lines);
  }

  /**
   * Load nullifiers from JSONL format
   */
  async loadNullifiersStream(electionId: string): Promise<Set<string>> {
    if (!this.enabled) return new Set();

    const nullifiersJsonlPath = join(this.getElectionPath(electionId), 'nullifiers.jsonl');

    try {
      const content = await fs.readFile(nullifiersJsonlPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      const nullifiers: StoredNullifier[] = lines.map(line => JSON.parse(line));
      return new Set(nullifiers.map(n => `${n.questionId}:${n.nullifier}`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Fall back to JSON format
        return this.loadNullifiers(electionId);
      }
      throw error;
    }
  }

  /**
   * Load all nullifiers for an election
   */
  async loadNullifiers(electionId: string): Promise<Set<string>> {
    if (!this.enabled) return new Set();

    const nullifiersPath = this.getNullifiersPath(electionId);

    try {
      const content = await fs.readFile(nullifiersPath, 'utf-8');
      const nullifiers: StoredNullifier[] = JSON.parse(content);
      return new Set(nullifiers.map(n => `${n.questionId}:${n.nullifier}`));
    } catch {
      return new Set();
    }
  }

  /**
   * Check if a nullifier exists
   */
  async hasNullifier(electionId: string, questionId: string, nullifier: string): Promise<boolean> {
    const nullifiers = await this.loadNullifiers(electionId);
    return nullifiers.has(`${questionId}:${nullifier}`);
  }

  // =========================================================================
  // Snapshot Storage
  // =========================================================================

  /**
   * Store question snapshot (Merkle root, vote count)
   */
  async storeSnapshot(snapshot: ElectionSnapshot): Promise<void> {
    if (!this.enabled) return;

    const snapshotPath = this.getSnapshotPath(snapshot.electionId, snapshot.questionId);
    await this.ensureDir(snapshotPath);
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  }

  /**
   * Load question snapshot
   */
  async loadSnapshot(electionId: string, questionId: string): Promise<ElectionSnapshot | null> {
    if (!this.enabled) return null;

    const snapshotPath = this.getSnapshotPath(electionId, questionId);

    try {
      const content = await fs.readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // Stats & Utilities
  // =========================================================================

  /**
   * Get storage stats
   */
  async getStats(): Promise<{
    enabled: boolean;
    basePath: string;
    totalFiles: number;
    totalSizeBytes: number;
  }> {
    if (!this.enabled) {
      return {
        enabled: false,
        basePath: this.basePath,
        totalFiles: 0,
        totalSizeBytes: 0,
      };
    }

    let totalFiles = 0;
    let totalSizeBytes = 0;

    const countDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await countDir(fullPath);
          } else {
            totalFiles++;
            const stat = await fs.stat(fullPath);
            totalSizeBytes += stat.size;
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };

    await countDir(this.basePath);

    return {
      enabled: true,
      basePath: this.basePath,
      totalFiles,
      totalSizeBytes,
    };
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    if (!this.enabled) return;

    try {
      await fs.rm(this.basePath, { recursive: true, force: true });
    } catch {
      // Already empty
    }
  }
}

// ============================================================================
// Buffered Write Service (High-Performance I/O)
// ============================================================================

export interface BufferedWriteConfig {
  /** Buffer size before flush (default: 1000 votes) */
  bufferSize: number;
  /** Max time before flush (default: 500ms) */
  flushIntervalMs: number;
  /** Enable buffered writes (default: true when VEILCLOUD_ENABLED) */
  enabled: boolean;
}

/**
 * High-performance buffered VeilCloud writer
 * Accumulates writes in memory and flushes in large batches
 * Provides 10-50x throughput improvement over synchronous writes
 */
export class BufferedVeilCloudWriter {
  private readonly storage: VeilCloudStorageService;
  private readonly config: BufferedWriteConfig;

  private voteBuffer: StoredVote[] = [];
  private nullifierBuffer: Map<string, StoredNullifier[]> = new Map();
  private snapshotBuffer: Map<string, ElectionSnapshot> = new Map();

  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;
  private flushPromise: Promise<void> | null = null;

  // Stats
  private stats = {
    totalFlushes: 0,
    totalVotesWritten: 0,
    avgFlushTimeMs: 0,
    lastFlushTimeMs: 0,
    bufferHighWater: 0,
  };

  constructor(storage: VeilCloudStorageService, config?: Partial<BufferedWriteConfig>) {
    this.storage = storage;
    this.config = {
      bufferSize: parseInt(process.env['VEILCLOUD_BUFFER_SIZE'] || '1000', 10),
      flushIntervalMs: parseInt(process.env['VEILCLOUD_FLUSH_MS'] || '500', 10),
      enabled: process.env['VEILCLOUD_BUFFERED'] !== 'false',
      ...config,
    };
  }

  /**
   * Buffer a vote for later write (non-blocking)
   */
  bufferVote(vote: StoredVote): void {
    if (!this.storage.isEnabled()) return;

    this.voteBuffer.push(vote);
    this.stats.bufferHighWater = Math.max(this.stats.bufferHighWater, this.voteBuffer.length);

    this.scheduleFlush();
  }

  /**
   * Buffer multiple votes (non-blocking)
   */
  bufferVotes(votes: StoredVote[]): void {
    if (!this.storage.isEnabled() || votes.length === 0) return;

    this.voteBuffer.push(...votes);
    this.stats.bufferHighWater = Math.max(this.stats.bufferHighWater, this.voteBuffer.length);

    this.scheduleFlush();
  }

  /**
   * Buffer a nullifier for later write
   */
  bufferNullifier(electionId: string, nullifier: StoredNullifier): void {
    if (!this.storage.isEnabled()) return;

    const list = this.nullifierBuffer.get(electionId) || [];
    list.push(nullifier);
    this.nullifierBuffer.set(electionId, list);

    this.scheduleFlush();
  }

  /**
   * Buffer multiple nullifiers
   */
  bufferNullifiers(electionId: string, nullifiers: StoredNullifier[]): void {
    if (!this.storage.isEnabled() || nullifiers.length === 0) return;

    const list = this.nullifierBuffer.get(electionId) || [];
    list.push(...nullifiers);
    this.nullifierBuffer.set(electionId, list);

    this.scheduleFlush();
  }

  /**
   * Buffer a snapshot update
   */
  bufferSnapshot(snapshot: ElectionSnapshot): void {
    if (!this.storage.isEnabled()) return;

    // Snapshots are deduplicated by key (latest wins)
    const key = `${snapshot.electionId}:${snapshot.questionId}`;
    this.snapshotBuffer.set(key, snapshot);

    this.scheduleFlush();
  }

  /**
   * Schedule a flush if needed
   */
  private scheduleFlush(): void {
    // Immediate flush if buffer is full
    if (this.voteBuffer.length >= this.config.bufferSize) {
      this.flush();
      return;
    }

    // Start timer for time-based flush
    if (!this.flushTimer && !this.flushing) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flush();
      }, this.config.flushIntervalMs);
    }
  }

  /**
   * Flush all buffered data to storage
   */
  async flush(): Promise<void> {
    // Clear any pending timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // If already flushing, wait for current flush
    if (this.flushing && this.flushPromise) {
      await this.flushPromise;
      return;
    }

    // Check if there's anything to flush
    if (this.voteBuffer.length === 0 && this.nullifierBuffer.size === 0 && this.snapshotBuffer.size === 0) {
      return;
    }

    this.flushing = true;
    const startTime = Date.now();

    // Take snapshots of buffers
    const votes = this.voteBuffer;
    const nullifiers = new Map(this.nullifierBuffer);
    const snapshots = new Map(this.snapshotBuffer);

    // Clear buffers immediately (allows new writes during flush)
    this.voteBuffer = [];
    this.nullifierBuffer = new Map();
    this.snapshotBuffer = new Map();

    // Create flush promise
    this.flushPromise = this.doFlush(votes, nullifiers, snapshots);

    try {
      await this.flushPromise;

      // Update stats
      const flushTime = Date.now() - startTime;
      this.stats.totalFlushes++;
      this.stats.totalVotesWritten += votes.length;
      this.stats.lastFlushTimeMs = flushTime;
      this.stats.avgFlushTimeMs =
        (this.stats.avgFlushTimeMs * (this.stats.totalFlushes - 1) + flushTime) /
        this.stats.totalFlushes;
    } finally {
      this.flushing = false;
      this.flushPromise = null;
    }
  }

  /**
   * Perform the actual flush operations
   */
  private async doFlush(
    votes: StoredVote[],
    nullifiers: Map<string, StoredNullifier[]>,
    snapshots: Map<string, ElectionSnapshot>
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Write votes
    if (votes.length > 0) {
      promises.push(this.storage.storeVotesBatchStream(votes));
    }

    // Write nullifiers
    for (const [electionId, list] of nullifiers) {
      if (list.length > 0) {
        promises.push(this.storage.storeNullifiersBatch(electionId, list));
      }
    }

    // Write snapshots
    for (const snapshot of snapshots.values()) {
      promises.push(this.storage.storeSnapshot(snapshot));
    }

    // Execute all writes in parallel
    await Promise.all(promises);
  }

  /**
   * Wait for all pending writes to complete
   */
  async drain(): Promise<void> {
    await this.flush();
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      ...this.stats,
      pendingVotes: this.voteBuffer.length,
      pendingNullifiers: Array.from(this.nullifierBuffer.values()).reduce((a, b) => a + b.length, 0),
      pendingSnapshots: this.snapshotBuffer.size,
      config: this.config,
    };
  }

  /**
   * Check if buffered writing is enabled
   */
  isEnabled(): boolean {
    return this.storage.isEnabled() && this.config.enabled;
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

let instance: VeilCloudStorageService | null = null;
let bufferedWriter: BufferedVeilCloudWriter | null = null;

export function getVeilCloudStorage(): VeilCloudStorageService {
  if (!instance) {
    instance = new VeilCloudStorageService();
  }
  return instance;
}

/**
 * Get the high-performance buffered writer
 */
export function getBufferedVeilCloudWriter(): BufferedVeilCloudWriter {
  if (!bufferedWriter) {
    bufferedWriter = new BufferedVeilCloudWriter(getVeilCloudStorage());
  }
  return bufferedWriter;
}

/**
 * Initialize with custom config (for testing)
 */
export function initVeilCloudStorage(config: Partial<VeilCloudStorageConfig>): VeilCloudStorageService {
  instance = new VeilCloudStorageService(config);
  bufferedWriter = new BufferedVeilCloudWriter(instance);
  return instance;
}
