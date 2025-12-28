/**
 * Edge Sync Protocol Types
 *
 * Defines interfaces for syncing votes from Raspberry Pi edge nodes
 * to the central cloud VeilCloud.
 */

/**
 * Edge node registration and identification
 */
export interface EdgeNode {
  id: string;                    // UUID of the Pi edge node
  name: string;                  // Human-readable name (e.g., "Precinct 42A")
  jurisdictionId: string;        // Which jurisdiction this node serves
  publicKey: string;             // RSA public key for node authentication
  lastSyncAt: number | null;     // Last successful sync timestamp
  registeredAt: number;
  status: EdgeNodeStatus;
}

export type EdgeNodeStatus = 'pending' | 'active' | 'inactive' | 'syncing' | 'revoked';

/**
 * Edge node registration request
 */
export interface EdgeNodeRegistration {
  name: string;
  jurisdictionId: string;
  publicKey: string;
  metadata?: Record<string, unknown>;
}

/**
 * Vote data within a sync batch
 */
export interface SyncVote {
  id: string;
  questionId: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  nullifier: string;
  timestamp: number;
  localPosition: number;       // Position in local ledger
  localMerkleRoot: string;     // Merkle root after this vote on edge
}

/**
 * Vote batch for sync upload from edge to cloud
 */
export interface VoteSyncBatch {
  batchId: string;               // UUID for idempotent retries
  nodeId: string;                // Source edge node ID
  electionId: string;
  votes: SyncVote[];
  batchMerkleRoot: string;       // Merkle root of batch votes
  signature: string;             // Node signature of batch
  submittedAt: number;
}

/**
 * Result of processing a sync batch
 */
export interface SyncResult {
  batchId: string;
  accepted: number;
  rejected: RejectedVote[];
  cloudMerkleRoot: string;       // Updated cloud Merkle root
  cloudStartPosition: number;    // Starting position in cloud ledger
  processedAt: number;
}

/**
 * Rejected vote with reason
 */
export interface RejectedVote {
  voteId: string;
  reason: RejectionReason;
}

export type RejectionReason =
  | 'duplicate_nullifier'
  | 'invalid_proof'
  | 'already_synced'
  | 'invalid_signature'
  | 'election_closed';

/**
 * Sync status tracking for an edge node
 */
export interface SyncStatus {
  nodeId: string;
  nodeName: string;
  lastSyncedPosition: number;    // Last local position synced to cloud
  lastSyncedRoot: string;
  pendingVotes: number;
  syncInProgress: boolean;
  lastSyncAt: number | null;
  lastError?: string;
  cloudConnection: 'connected' | 'disconnected' | 'syncing';
}

/**
 * Sync checkpoint persisted to disk
 */
export interface SyncCheckpoint {
  nodeId: string;
  electionId: string;
  lastSyncedPosition: number;
  lastSyncedBatchId: string;
  lastSyncAt: number;
  cloudMerkleRoot: string;
}

/**
 * Edge sync client configuration
 */
export interface EdgeSyncConfig {
  nodeId: string;
  nodeName: string;
  privateKeyPath: string;
  cloudSyncUrl: string;
  batchSize: number;             // Votes per batch (default 1000)
  syncIntervalMs: number;        // Sync interval in ms (default 30000)
  maxRetries: number;            // Max retries per batch (default 3)
  checkpointPath: string;        // Path to persist checkpoint
}

/**
 * Cloud sync server configuration
 */
export interface CloudSyncConfig {
  maxBatchSize: number;          // Max votes per batch (default 1000)
  idempotencyCacheTtl: number;   // TTL for processed batch cache (ms)
}

/**
 * Deployment mode for the API
 */
export type DeploymentMode = 'edge' | 'cloud' | 'standalone';

/**
 * Health check response with deployment info
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  deploymentMode: DeploymentMode;
  nodeId?: string;
  nodeName?: string;
  jurisdictionCode?: string;
  version: string;
  uptime: number;
  syncStatus?: {
    connected: boolean;
    pendingVotes: number;
    lastSyncAt: number | null;
  };
}
