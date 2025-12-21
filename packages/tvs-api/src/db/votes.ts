/**
 * Votes Repository
 */

import { sql } from './connection.js';

export interface Vote {
  id: string;
  election_id: string;
  encrypted_vote: string;
  commitment: string;
  zk_proof: string;
  credential_nullifier: string;
  merkle_position: number;
  confirmation_code: string;
  created_at: Date;
}

// Store vote
export async function storeVote(data: {
  electionId: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  nullifier: string;
  merklePosition: number;
  confirmationCode: string;
}): Promise<Vote> {
  const [vote] = await sql<Vote[]>`
    INSERT INTO votes (
      election_id, encrypted_vote, commitment, zk_proof,
      credential_nullifier, merkle_position, confirmation_code
    )
    VALUES (
      ${data.electionId}, ${data.encryptedVote}, ${data.commitment}, ${data.zkProof},
      ${data.nullifier}, ${data.merklePosition}, ${data.confirmationCode}
    )
    RETURNING *
  `;
  return vote!;
}

// Check if nullifier is used
export async function isNullifierUsed(nullifier: string): Promise<boolean> {
  const [result] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM votes WHERE credential_nullifier = ${nullifier}
    ) as exists
  `;
  return result?.exists || false;
}

// Get vote by nullifier
export async function getVoteByNullifier(electionId: string, nullifier: string): Promise<Vote | null> {
  const [vote] = await sql<Vote[]>`
    SELECT * FROM votes
    WHERE election_id = ${electionId} AND credential_nullifier = ${nullifier}
  `;
  return vote || null;
}

// Get vote count
export async function getVoteCount(electionId: string): Promise<number> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM votes WHERE election_id = ${electionId}
  `;
  return result?.count || 0;
}

// Get all votes (for Merkle tree rebuild)
export async function getAllVotes(electionId: string): Promise<Vote[]> {
  return sql<Vote[]>`
    SELECT * FROM votes WHERE election_id = ${electionId}
    ORDER BY merkle_position ASC
  `;
}

// Get max merkle position
export async function getMaxMerklePosition(electionId: string): Promise<number> {
  const [result] = await sql<{ max: number | null }[]>`
    SELECT MAX(merkle_position) as max FROM votes WHERE election_id = ${electionId}
  `;
  return result?.max ?? -1;
}

// Store Merkle root snapshot
export async function storeMerkleRoot(electionId: string, rootHash: string, voteCount: number): Promise<void> {
  await sql`
    INSERT INTO merkle_roots (election_id, root_hash, vote_count)
    VALUES (${electionId}, ${rootHash}, ${voteCount})
  `;
}

// Get latest Merkle root
export async function getLatestMerkleRoot(electionId: string): Promise<{ rootHash: string; voteCount: number; createdAt: Date } | null> {
  const [result] = await sql<{ root_hash: string; vote_count: number; created_at: Date }[]>`
    SELECT root_hash, vote_count, created_at FROM merkle_roots
    WHERE election_id = ${electionId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!result) return null;
  return {
    rootHash: result.root_hash,
    voteCount: result.vote_count,
    createdAt: result.created_at,
  };
}
