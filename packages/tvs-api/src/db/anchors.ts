/**
 * Bitcoin Anchors Repository
 *
 * Manages bitcoin_anchors table for storing Merkle root anchoring records.
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
  op_return_data: string;
  bitcoin_txid: string | null;
  bitcoin_block_height: number | null;
  bitcoin_block_hash: string | null;
  confirmations: number;
  status: 'pending' | 'broadcast' | 'confirmed' | 'failed';
  error_message: string | null;
  created_at: Date;
  broadcast_at: Date | null;
  confirmed_at: Date | null;
}

export interface CreateAnchorInput {
  electionId: string;
  anchorType: 'start' | 'close';
  dataHash: string;
  opReturnData: string;
}

export interface UpdateAnchorInput {
  txid?: string;
  blockHeight?: number;
  blockHash?: string;
  confirmations?: number;
  status?: 'pending' | 'broadcast' | 'confirmed' | 'failed';
  errorMessage?: string;
}

// ============================================================================
// Create / Read
// ============================================================================

/**
 * Create a new anchor record (before broadcasting)
 */
export async function createAnchor(input: CreateAnchorInput): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    INSERT INTO bitcoin_anchors (
      election_id, anchor_type, data_hash, op_return_data
    )
    VALUES (
      ${input.electionId}, ${input.anchorType}, ${input.dataHash}, ${input.opReturnData}
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
// Update
// ============================================================================

/**
 * Update anchor after broadcast
 */
export async function markAnchorBroadcast(
  id: string,
  txid: string
): Promise<BitcoinAnchor> {
  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      bitcoin_txid = ${txid},
      status = 'broadcast',
      broadcast_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return anchor!;
}

/**
 * Update anchor confirmation status
 */
export async function updateAnchorConfirmations(
  id: string,
  confirmations: number,
  blockHeight?: number,
  blockHash?: string
): Promise<BitcoinAnchor> {
  const isConfirmed = confirmations >= 6;

  const [anchor] = await sql<BitcoinAnchor[]>`
    UPDATE bitcoin_anchors
    SET
      confirmations = ${confirmations},
      bitcoin_block_height = COALESCE(${blockHeight ?? null}, bitcoin_block_height),
      bitcoin_block_hash = COALESCE(${blockHash ?? null}, bitcoin_block_hash),
      status = ${isConfirmed ? 'confirmed' : 'broadcast'},
      confirmed_at = ${isConfirmed ? sql`NOW()` : sql`confirmed_at`}
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

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all anchors pending confirmation (for background refresh)
 */
export async function getPendingAnchors(): Promise<BitcoinAnchor[]> {
  return sql<BitcoinAnchor[]>`
    SELECT * FROM bitcoin_anchors
    WHERE status = 'broadcast' AND confirmations < 6
    ORDER BY created_at ASC
  `;
}

/**
 * Check if election has both anchors confirmed
 */
export async function isElectionFullyAnchored(electionId: string): Promise<boolean> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM bitcoin_anchors
    WHERE election_id = ${electionId} AND status = 'confirmed'
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
    start?.status === 'confirmed' && close?.status === 'confirmed';

  return { start, close, fullyAnchored };
}
