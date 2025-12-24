/**
 * Bitcoin Anchors Repository (OpenTimestamps)
 *
 * Manages bitcoin_anchors table for storing OpenTimestamps proofs.
 * OTS aggregates thousands of hashes into single Bitcoin transactions,
 * providing free, non-spammy Bitcoin timestamping.
 */

import { sql } from './connection.js';

// ============================================================================
// Types
// ============================================================================

export interface BitcoinAnchor {
  id: string;
  election_id: string;
  anchor_type: 'start' | 'close';
  data_hash: string;
  raw_data: string;
  ots_proof: string | null;
  bitcoin_txid: string | null;
  bitcoin_block_height: number | null;
  bitcoin_block_hash: string | null;
  attestation_time: number | null;
  status: 'pending' | 'submitted' | 'upgraded' | 'verified' | 'failed';
  error_message: string | null;
  created_at: Date;
  submitted_at: Date | null;
  upgraded_at: Date | null;
  verified_at: Date | null;
}

export interface CreateAnchorInput {
  electionId: string;
  anchorType: 'start' | 'close';
  dataHash: string;
  rawData: string;
}

// ============================================================================
// Create / Read
// ============================================================================

/**
 * Create a new anchor record (before submitting to OTS)
 */
export async function createAnchor(input: CreateAnchorInput): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    INSERT INTO bitcoin_anchors (
      election_id, anchor_type, data_hash, raw_data
    )
    VALUES (
      ${input.electionId}, ${input.anchorType}, ${input.dataHash}, ${input.rawData}
    )
    RETURNING *
  `;
  return anchor!;
}

/**
 * Get anchor by election and type
 */
export async function getAnchor(
  electionId: string,
  anchorType: 'start' | 'close'
): Promise<BitcoinAnchor | null> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE election_id = ${electionId} AND anchor_type = ${anchorType}
  `;
  return anchor || null;
}

/**
 * Get all anchors for an election
 */
export async function getAnchorsByElection(electionId: string): Promise<BitcoinAnchor[]> {
  return sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE election_id = ${electionId}
    ORDER BY anchor_type ASC
  `;
}

/**
 * Get anchor by Bitcoin transaction ID
 */
export async function getAnchorByTxid(txid: string): Promise<BitcoinAnchor | null> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE bitcoin_txid = ${txid}
  `;
  return anchor || null;
}

// ============================================================================
// OpenTimestamps Workflow Updates
// ============================================================================

/**
 * Mark anchor as submitted to OTS calendar and store proof
 */
export async function markAnchorSubmitted(
  id: string,
  otsProof: string
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      ots_proof = ${otsProof},
      status = 'submitted',
      submitted_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

/**
 * Mark anchor as upgraded (Bitcoin attestation received)
 */
export async function markAnchorUpgraded(
  id: string,
  upgradedProof: string
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      ots_proof = ${upgradedProof},
      status = 'upgraded',
      upgraded_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

/**
 * Mark anchor as verified with Bitcoin attestation details
 */
export async function markAnchorVerified(
  id: string,
  bitcoinDetails: {
    txid?: string;
    blockHeight?: number;
    blockHash?: string;
    attestationTime?: number;
  }
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      bitcoin_txid = COALESCE(${bitcoinDetails.txid ?? null}, bitcoin_txid),
      bitcoin_block_height = COALESCE(${bitcoinDetails.blockHeight ?? null}, bitcoin_block_height),
      bitcoin_block_hash = COALESCE(${bitcoinDetails.blockHash ?? null}, bitcoin_block_hash),
      attestation_time = COALESCE(${bitcoinDetails.attestationTime ?? null}, attestation_time),
      status = 'verified',
      verified_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

/**
 * Mark anchor as failed
 */
export async function markAnchorFailed(
  id: string,
  errorMessage: string
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      status = 'failed',
      error_message = ${errorMessage}
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

/**
 * Update OTS proof (for upgrading pending proofs)
 */
export async function updateOtsProof(
  id: string,
  otsProof: string
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET ots_proof = ${otsProof}
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get anchors pending Bitcoin attestation (submitted but not yet upgraded)
 */
export async function getPendingAnchors(): Promise<BitcoinAnchor[]> {
  return sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE status = 'submitted'
    ORDER BY created_at ASC
  `;
}

/**
 * Get anchors that have been upgraded but not verified
 */
export async function getUpgradedAnchors(): Promise<BitcoinAnchor[]> {
  return sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE status = 'upgraded'
    ORDER BY created_at ASC
  `;
}

/**
 * Check if election has both anchors verified
 */
export async function isElectionFullyAnchored(electionId: string): Promise<boolean> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM bitcoin_anchors
    WHERE election_id = ${electionId} AND status = 'verified'
  `;
  return (result?.count || 0) >= 2;
}

/**
 * Get anchor summary for an election
 */
export async function getAnchorSummary(electionId: string): Promise<{
  start: BitcoinAnchor | null;
  close: BitcoinAnchor | null;
  fullyAnchored: boolean;
}> {
  const anchors = await getAnchorsByElection(electionId);

  const start = anchors.find((a) => a.anchor_type === 'start') || null;
  const close = anchors.find((a) => a.anchor_type === 'close') || null;

  const fullyAnchored =
    start?.status === 'verified' && close?.status === 'verified';

  return { start, close, fullyAnchored };
}
