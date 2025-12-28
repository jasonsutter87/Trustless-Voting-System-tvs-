/**
 * Cloud Sync Server - Runs on Central Cloud
 *
 * Handles:
 * - Receiving vote batches from edge nodes
 * - Node authentication via RSA signature verification
 * - Nullifier conflict resolution (first-write-wins)
 * - Merkle proof verification
 * - Aggregation into master VeilCloud
 * - Idempotency via batch ID caching
 */

import { createVerify, createHash } from 'crypto';
import {
  getVeilCloudStorage,
  getBufferedVeilCloudWriter,
  type StoredVote,
  type StoredNullifier,
} from '../veilcloud-storage.js';
import type {
  EdgeNode,
  EdgeNodeRegistration,
  VoteSyncBatch,
  SyncResult,
  RejectedVote,
  CloudSyncConfig,
} from './types.js';

// Default configuration
const DEFAULT_CONFIG: CloudSyncConfig = {
  maxBatchSize: 1000,
  idempotencyCacheTtl: 3600000, // 1 hour
};

// In-memory storage for MVP (use database in production)
const registeredNodes = new Map<string, EdgeNode>();
const processedBatches = new Map<string, { result: SyncResult; expiresAt: number }>();
const nullifierIndex = new Map<string, string>(); // nullifier -> nodeId that first submitted

export class CloudSyncServer {
  private readonly config: CloudSyncConfig;

  constructor(config?: Partial<CloudSyncConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000);
  }

  /**
   * Register a new edge node
   */
  async registerNode(registration: EdgeNodeRegistration): Promise<EdgeNode> {
    const nodeId = createHash('sha256')
      .update(registration.publicKey)
      .digest('hex')
      .substring(0, 32);

    // Check if already registered
    const existing = registeredNodes.get(nodeId);
    if (existing) {
      return existing;
    }

    const node: EdgeNode = {
      id: nodeId,
      name: registration.name,
      jurisdictionId: registration.jurisdictionId,
      publicKey: registration.publicKey,
      lastSyncAt: null,
      registeredAt: Date.now(),
      status: 'pending', // Requires admin approval
    };

    registeredNodes.set(nodeId, node);
    console.log(`[CloudSync] Registered new node: ${node.name} (${nodeId})`);

    return node;
  }

  /**
   * Activate a pending node (admin action)
   */
  async activateNode(nodeId: string): Promise<EdgeNode | null> {
    const node = registeredNodes.get(nodeId);
    if (!node) {
      return null;
    }

    node.status = 'active';
    registeredNodes.set(nodeId, node);
    console.log(`[CloudSync] Activated node: ${node.name}`);

    return node;
  }

  /**
   * Revoke a node (admin action)
   */
  async revokeNode(nodeId: string): Promise<boolean> {
    const node = registeredNodes.get(nodeId);
    if (!node) {
      return false;
    }

    node.status = 'revoked';
    registeredNodes.set(nodeId, node);
    console.log(`[CloudSync] Revoked node: ${node.name}`);

    return true;
  }

  /**
   * Get all registered nodes
   */
  async listNodes(): Promise<EdgeNode[]> {
    return Array.from(registeredNodes.values());
  }

  /**
   * Get node by ID
   */
  async getNode(nodeId: string): Promise<EdgeNode | null> {
    return registeredNodes.get(nodeId) || null;
  }

  /**
   * Process incoming vote batch from edge node
   */
  async processBatch(batch: VoteSyncBatch): Promise<SyncResult> {
    // Idempotency check - return cached result if batch already processed
    const cached = processedBatches.get(batch.batchId);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[CloudSync] Returning cached result for batch ${batch.batchId}`);
      return cached.result;
    }

    // Validate batch size
    if (batch.votes.length > this.config.maxBatchSize) {
      throw new Error(`Batch exceeds maximum size of ${this.config.maxBatchSize}`);
    }

    // Verify node exists and is active
    const node = registeredNodes.get(batch.nodeId);
    if (!node) {
      throw new Error(`Unknown node: ${batch.nodeId}`);
    }
    if (node.status !== 'active') {
      throw new Error(`Node ${batch.nodeId} is not active (status: ${node.status})`);
    }

    // Verify node signature
    if (!this.verifyNodeSignature(batch, node.publicKey)) {
      throw new Error('Invalid node signature');
    }

    // Verify batch Merkle root
    if (!this.verifyBatchMerkleRoot(batch)) {
      throw new Error('Invalid batch Merkle root');
    }

    // Process votes with nullifier conflict resolution
    const accepted: StoredVote[] = [];
    const rejected: RejectedVote[] = [];
    const newNullifiers: StoredNullifier[] = [];

    const storage = getVeilCloudStorage();
    const startPosition = await this.getNextPosition(batch.electionId);

    for (let i = 0; i < batch.votes.length; i++) {
      const vote = batch.votes[i];
      const nullifierKey = `${batch.electionId}:${vote.questionId}:${vote.nullifier}`;

      // Check for duplicate nullifier (first-write-wins)
      if (nullifierIndex.has(nullifierKey)) {
        rejected.push({ voteId: vote.id, reason: 'duplicate_nullifier' });
        continue;
      }

      // Check in storage as well (in case of restart)
      if (storage.isEnabled()) {
        const exists = await this.checkNullifierExists(batch.electionId, vote.questionId, vote.nullifier);
        if (exists) {
          rejected.push({ voteId: vote.id, reason: 'duplicate_nullifier' });
          nullifierIndex.set(nullifierKey, batch.nodeId); // Cache for future checks
          continue;
        }
      }

      // Accept the vote
      const position = startPosition + accepted.length;
      const storedVote: StoredVote = {
        id: vote.id,
        questionId: vote.questionId,
        electionId: batch.electionId,
        encryptedVote: vote.encryptedVote,
        commitment: vote.commitment,
        zkProof: vote.zkProof,
        nullifier: vote.nullifier,
        timestamp: vote.timestamp,
        position,
        merkleRoot: '', // Will be computed when appended
      };

      accepted.push(storedVote);
      nullifierIndex.set(nullifierKey, batch.nodeId);
      newNullifiers.push({
        nullifier: vote.nullifier,
        questionId: vote.questionId,
        timestamp: vote.timestamp,
      });
    }

    // Store accepted votes
    let cloudMerkleRoot = '';
    if (accepted.length > 0 && storage.isEnabled()) {
      const writer = getBufferedVeilCloudWriter();
      writer.bufferVotes(accepted);

      for (const nullifier of newNullifiers) {
        writer.bufferNullifiers(batch.electionId, [nullifier]);
      }

      // Get current merkle root (simplified - in production use ledger)
      cloudMerkleRoot = this.computeCloudMerkleRoot(accepted);
    }

    // Update node sync status
    node.lastSyncAt = Date.now();
    node.status = 'active';
    registeredNodes.set(node.id, node);

    const result: SyncResult = {
      batchId: batch.batchId,
      accepted: accepted.length,
      rejected,
      cloudMerkleRoot,
      cloudStartPosition: startPosition,
      processedAt: Date.now(),
    };

    // Cache result for idempotency
    processedBatches.set(batch.batchId, {
      result,
      expiresAt: Date.now() + this.config.idempotencyCacheTtl,
    });

    console.log(
      `[CloudSync] Processed batch ${batch.batchId} from ${node.name}: ` +
        `${accepted.length} accepted, ${rejected.length} rejected`
    );

    return result;
  }

  /**
   * Get sync status for a node
   */
  async getNodeStatus(nodeId: string): Promise<{
    node: EdgeNode | null;
    totalVotesSynced: number;
    lastBatchId: string | null;
  }> {
    const node = registeredNodes.get(nodeId);
    if (!node) {
      return { node: null, totalVotesSynced: 0, lastBatchId: null };
    }

    // Count votes from this node (simplified)
    let totalVotesSynced = 0;
    let lastBatchId: string | null = null;

    for (const [batchId, cached] of processedBatches) {
      // This is simplified - in production, store this in database
      totalVotesSynced += cached.result.accepted;
      lastBatchId = batchId;
    }

    return { node, totalVotesSynced, lastBatchId };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Verify node signature on batch
   */
  private verifyNodeSignature(batch: VoteSyncBatch, publicKey: string): boolean {
    try {
      const message = `${batch.batchId}:${batch.batchMerkleRoot}:${batch.electionId}:${batch.nodeId}`;
      const verify = createVerify('RSA-SHA256');
      verify.update(message);
      return verify.verify(publicKey, batch.signature, 'base64');
    } catch (err) {
      console.error('[CloudSync] Signature verification error:', err);
      return false;
    }
  }

  /**
   * Verify batch Merkle root matches votes
   */
  private verifyBatchMerkleRoot(batch: VoteSyncBatch): boolean {
    if (batch.votes.length === 0) {
      const expectedRoot = createHash('sha256').update('empty').digest('hex');
      return batch.batchMerkleRoot === expectedRoot;
    }

    const hash = createHash('sha256');
    for (const vote of batch.votes) {
      hash.update(vote.commitment);
    }
    const computedRoot = hash.digest('hex');

    return batch.batchMerkleRoot === computedRoot;
  }

  /**
   * Get next position for votes in this election
   */
  private async getNextPosition(electionId: string): Promise<number> {
    // Simplified - in production, track this per-question in database
    // For now, return a timestamp-based position
    return Date.now();
  }

  /**
   * Check if nullifier exists in storage
   */
  private async checkNullifierExists(
    electionId: string,
    questionId: string,
    nullifier: string
  ): Promise<boolean> {
    // This would check the VeilCloud storage or database
    // For MVP, we rely on the in-memory index
    return false;
  }

  /**
   * Compute cloud Merkle root (simplified)
   */
  private computeCloudMerkleRoot(votes: StoredVote[]): string {
    const hash = createHash('sha256');
    for (const vote of votes) {
      hash.update(vote.commitment);
    }
    return hash.digest('hex');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [batchId, cached] of processedBatches) {
      if (cached.expiresAt <= now) {
        processedBatches.delete(batchId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CloudSync] Cleaned up ${cleaned} expired batch cache entries`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cloudSyncServer: CloudSyncServer | null = null;

export function getCloudSyncServer(): CloudSyncServer {
  if (!cloudSyncServer) {
    cloudSyncServer = new CloudSyncServer();
  }
  return cloudSyncServer;
}

export function initializeCloudSyncServer(config?: Partial<CloudSyncConfig>): CloudSyncServer {
  cloudSyncServer = new CloudSyncServer(config);
  return cloudSyncServer;
}
