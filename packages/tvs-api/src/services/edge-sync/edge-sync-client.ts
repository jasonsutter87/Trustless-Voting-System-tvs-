/**
 * Edge Sync Client - Runs on Raspberry Pi Edge Nodes
 *
 * Handles:
 * - Batching votes for upload (1000 votes per batch)
 * - Offline queue management with disk persistence
 * - Retry with exponential backoff
 * - Idempotent uploads via batch IDs
 * - Network status detection
 * - RSA signing of batches for authentication
 */

import { createSign, createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { StoredVote } from '../veilcloud-storage.js';
import type {
  EdgeSyncConfig,
  VoteSyncBatch,
  SyncVote,
  SyncResult,
  SyncCheckpoint,
  SyncStatus,
} from './types.js';

// Default configuration
const DEFAULT_CONFIG: Partial<EdgeSyncConfig> = {
  batchSize: 1000,
  syncIntervalMs: 30000,
  maxRetries: 3,
};

export class EdgeSyncClient {
  private readonly config: EdgeSyncConfig;
  private privateKey: string | null = null;
  private pendingVotes: StoredVote[] = [];
  private syncQueue: VoteSyncBatch[] = [];
  private syncInProgress = false;
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;
  private checkpoint: SyncCheckpoint | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnlineCache = true;
  private onlineCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: EdgeSyncConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as EdgeSyncConfig;
  }

  /**
   * Initialize the sync client
   */
  async initialize(): Promise<void> {
    // Load private key for signing
    try {
      this.privateKey = await fs.readFile(this.config.privateKeyPath, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to load private key from ${this.config.privateKeyPath}: ${err}`);
    }

    // Load checkpoint if exists
    await this.loadCheckpoint();

    // Load any pending batches from disk
    await this.loadPendingBatches();

    console.log(`[EdgeSync] Initialized node ${this.config.nodeId} (${this.config.nodeName})`);
  }

  /**
   * Start background sync daemon
   */
  start(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    // Start periodic sync
    this.syncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (err) {
        console.error('[EdgeSync] Sync error:', err);
        this.lastError = err instanceof Error ? err.message : String(err);
      }
    }, this.config.syncIntervalMs);

    // Start online check
    this.onlineCheckInterval = setInterval(async () => {
      this.isOnlineCache = await this.checkOnline();
    }, 10000);

    console.log(`[EdgeSync] Started sync daemon (interval: ${this.config.syncIntervalMs}ms)`);
  }

  /**
   * Stop background sync daemon
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.onlineCheckInterval) {
      clearInterval(this.onlineCheckInterval);
      this.onlineCheckInterval = null;
    }
    console.log('[EdgeSync] Stopped sync daemon');
  }

  /**
   * Queue votes for sync (called after local storage)
   */
  async queueForSync(votes: StoredVote[]): Promise<void> {
    this.pendingVotes.push(...votes);

    // Create batch when threshold reached
    while (this.pendingVotes.length >= this.config.batchSize) {
      const batch = await this.createBatch();
      this.syncQueue.push(batch);
      await this.persistBatch(batch);
    }
  }

  /**
   * Force immediate sync
   */
  async sync(): Promise<SyncResult[]> {
    if (this.syncInProgress) {
      console.log('[EdgeSync] Sync already in progress, skipping');
      return [];
    }

    if (!this.isOnline()) {
      console.log('[EdgeSync] Offline, skipping sync');
      return [];
    }

    // Create batch from remaining pending votes if any
    if (this.pendingVotes.length > 0) {
      const batch = await this.createBatch();
      this.syncQueue.push(batch);
      await this.persistBatch(batch);
    }

    if (this.syncQueue.length === 0) {
      return [];
    }

    this.syncInProgress = true;
    const results: SyncResult[] = [];

    try {
      console.log(`[EdgeSync] Starting sync of ${this.syncQueue.length} batches`);

      for (const batch of [...this.syncQueue]) {
        try {
          const result = await this.uploadBatch(batch);
          results.push(result);

          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter((b) => b.batchId !== batch.batchId);
          await this.removeBatchFromDisk(batch.batchId);
          await this.updateCheckpoint(result);

          this.lastSyncAt = Date.now();
          this.lastError = null;

          console.log(
            `[EdgeSync] Batch ${batch.batchId} synced: ${result.accepted} accepted, ${result.rejected.length} rejected`
          );
        } catch (err) {
          console.error(`[EdgeSync] Failed to sync batch ${batch.batchId}:`, err);
          this.lastError = err instanceof Error ? err.message : String(err);
          // Keep batch in queue for retry
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    const pendingInQueue = this.syncQueue.reduce((sum, b) => sum + b.votes.length, 0);

    return {
      nodeId: this.config.nodeId,
      nodeName: this.config.nodeName,
      lastSyncedPosition: this.checkpoint?.lastSyncedPosition || 0,
      lastSyncedRoot: this.checkpoint?.cloudMerkleRoot || '',
      pendingVotes: this.pendingVotes.length + pendingInQueue,
      syncInProgress: this.syncInProgress,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError || undefined,
      cloudConnection: this.syncInProgress ? 'syncing' : this.isOnlineCache ? 'connected' : 'disconnected',
    };
  }

  /**
   * Check if cloud is reachable
   */
  isOnline(): boolean {
    return this.isOnlineCache;
  }

  /**
   * Drain all pending votes (flush before shutdown)
   */
  async drain(): Promise<void> {
    // Create final batch from remaining votes
    if (this.pendingVotes.length > 0) {
      const batch = await this.createBatch();
      this.syncQueue.push(batch);
      await this.persistBatch(batch);
    }

    // Try to sync all
    await this.sync();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create and sign a batch for upload
   */
  private async createBatch(): Promise<VoteSyncBatch> {
    const votes = this.pendingVotes.splice(0, this.config.batchSize);
    const batchId = randomUUID();

    const syncVotes: SyncVote[] = votes.map((v) => ({
      id: v.id,
      questionId: v.questionId,
      encryptedVote: v.encryptedVote,
      commitment: v.commitment,
      zkProof: v.zkProof,
      nullifier: v.nullifier,
      timestamp: v.timestamp,
      localPosition: v.position,
      localMerkleRoot: v.merkleRoot,
    }));

    // Compute Merkle root of batch for integrity
    const batchMerkleRoot = this.computeBatchMerkleRoot(syncVotes);

    // Sign batch with node's private key
    const signature = this.signBatch(batchId, batchMerkleRoot, votes[0]?.electionId || '');

    return {
      batchId,
      nodeId: this.config.nodeId,
      electionId: votes[0]?.electionId || '',
      votes: syncVotes,
      batchMerkleRoot,
      signature,
      submittedAt: Date.now(),
    };
  }

  /**
   * Compute Merkle root of batch votes
   */
  private computeBatchMerkleRoot(votes: SyncVote[]): string {
    if (votes.length === 0) {
      return createHash('sha256').update('empty').digest('hex');
    }

    // Simple hash of all vote commitments
    const hash = createHash('sha256');
    for (const vote of votes) {
      hash.update(vote.commitment);
    }
    return hash.digest('hex');
  }

  /**
   * Sign batch with node private key
   */
  private signBatch(batchId: string, merkleRoot: string, electionId: string): string {
    if (!this.privateKey) {
      throw new Error('Private key not loaded');
    }

    const message = `${batchId}:${merkleRoot}:${electionId}:${this.config.nodeId}`;
    const sign = createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Upload batch to cloud with retry
   */
  private async uploadBatch(batch: VoteSyncBatch): Promise<SyncResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.cloudSyncUrl}/api/sync/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Node-ID': this.config.nodeId,
          },
          body: JSON.stringify(batch),
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Upload failed (${response.status}): ${error}`);
        }

        return (await response.json()) as SyncResult;
      } catch (err) {
        lastError = err as Error;
        console.warn(`[EdgeSync] Upload attempt ${attempt + 1} failed:`, err);

        // Exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Upload failed after retries');
  }

  /**
   * Check if cloud is reachable
   */
  private async checkOnline(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.cloudSyncUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Load checkpoint from disk
   */
  private async loadCheckpoint(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.checkpointPath, 'utf-8');
      this.checkpoint = JSON.parse(data);
      console.log(`[EdgeSync] Loaded checkpoint: position ${this.checkpoint?.lastSyncedPosition}`);
    } catch {
      // No checkpoint exists yet
      this.checkpoint = null;
    }
  }

  /**
   * Update and persist checkpoint
   */
  private async updateCheckpoint(result: SyncResult): Promise<void> {
    this.checkpoint = {
      nodeId: this.config.nodeId,
      electionId: '', // Will be set per election
      lastSyncedPosition: result.cloudStartPosition + result.accepted,
      lastSyncedBatchId: result.batchId,
      lastSyncAt: result.processedAt,
      cloudMerkleRoot: result.cloudMerkleRoot,
    };

    await this.ensureDir(this.config.checkpointPath);
    await fs.writeFile(this.config.checkpointPath, JSON.stringify(this.checkpoint, null, 2));
  }

  /**
   * Persist batch to disk for recovery
   */
  private async persistBatch(batch: VoteSyncBatch): Promise<void> {
    const batchDir = join(dirname(this.config.checkpointPath), 'pending-batches');
    const batchPath = join(batchDir, `${batch.batchId}.json`);

    await this.ensureDir(batchPath);
    await fs.writeFile(batchPath, JSON.stringify(batch));
  }

  /**
   * Remove batch from disk after successful sync
   */
  private async removeBatchFromDisk(batchId: string): Promise<void> {
    const batchDir = join(dirname(this.config.checkpointPath), 'pending-batches');
    const batchPath = join(batchDir, `${batchId}.json`);

    try {
      await fs.unlink(batchPath);
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Load pending batches from disk (for recovery after restart)
   */
  private async loadPendingBatches(): Promise<void> {
    const batchDir = join(dirname(this.config.checkpointPath), 'pending-batches');

    try {
      const files = await fs.readdir(batchDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(join(batchDir, file), 'utf-8');
          const batch = JSON.parse(data) as VoteSyncBatch;
          this.syncQueue.push(batch);
        }
      }

      if (this.syncQueue.length > 0) {
        console.log(`[EdgeSync] Loaded ${this.syncQueue.length} pending batches from disk`);
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let edgeSyncClient: EdgeSyncClient | null = null;

export function getEdgeSyncClient(): EdgeSyncClient | null {
  return edgeSyncClient;
}

export function initializeEdgeSyncClient(config: EdgeSyncConfig): EdgeSyncClient {
  if (edgeSyncClient) {
    return edgeSyncClient;
  }
  edgeSyncClient = new EdgeSyncClient(config);
  return edgeSyncClient;
}
