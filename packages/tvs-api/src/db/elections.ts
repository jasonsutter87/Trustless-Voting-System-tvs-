/**
 * Elections Repository
 */

import { sql } from './connection.js';
import type { AuthorityKeys } from '@tvs/veilsign';

export interface Election {
  id: string;
  name: string;
  description: string;
  start_time: Date;
  end_time: Date;
  status: 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
  created_at: Date;
}

export interface Candidate {
  id: string;
  election_id: string;
  name: string;
  position: number;
}

// Create election
export async function createElection(data: {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  publicKey: string;
}): Promise<Election> {
  const [election] = await sql<Election[]>`
    INSERT INTO elections (name, description, start_time, end_time, public_key, status)
    VALUES (${data.name}, ${data.description}, ${data.startTime}, ${data.endTime}, ${data.publicKey}, 'draft')
    RETURNING *
  `;
  return election!;
}

// Add candidates
export async function addCandidates(electionId: string, candidates: { name: string }[]): Promise<Candidate[]> {
  const results: Candidate[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const [candidate] = await sql<Candidate[]>`
      INSERT INTO candidates (election_id, name, position)
      VALUES (${electionId}, ${candidates[i]!.name}, ${i})
      RETURNING *
    `;
    results.push(candidate!);
  }
  return results;
}

// Get election by ID
export async function getElection(id: string): Promise<Election | null> {
  const [election] = await sql<Election[]>`
    SELECT * FROM elections WHERE id = ${id}
  `;
  return election || null;
}

// Get election with candidates
export async function getElectionWithCandidates(id: string): Promise<{ election: Election; candidates: Candidate[] } | null> {
  const [election] = await sql<Election[]>`
    SELECT * FROM elections WHERE id = ${id}
  `;
  if (!election) return null;

  const candidates = await sql<Candidate[]>`
    SELECT * FROM candidates WHERE election_id = ${id} ORDER BY position
  `;

  return { election, candidates };
}

// Get election public key
export async function getElectionPublicKey(id: string): Promise<string | null> {
  const [result] = await sql<{ public_key: string }[]>`
    SELECT public_key FROM elections WHERE id = ${id}
  `;
  return result?.public_key || null;
}

// List all elections
export async function listElections(): Promise<(Election & { candidate_count: number })[]> {
  return sql<(Election & { candidate_count: number })[]>`
    SELECT e.*, COUNT(c.id)::int as candidate_count
    FROM elections e
    LEFT JOIN candidates c ON c.election_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;
}

// Update election status
export async function updateElectionStatus(id: string, status: Election['status']): Promise<Election | null> {
  const [election] = await sql<Election[]>`
    UPDATE elections SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return election || null;
}

// Store signing keys (encrypted)
export async function storeSigningKeys(electionId: string, publicKey: string, encryptedPrivateKey: string): Promise<void> {
  await sql`
    INSERT INTO signing_keys (election_id, public_key, private_key_encrypted)
    VALUES (${electionId}, ${publicKey}, ${encryptedPrivateKey})
    ON CONFLICT (election_id) DO UPDATE SET
      public_key = ${publicKey},
      private_key_encrypted = ${encryptedPrivateKey}
  `;
}

// Get signing keys
export async function getSigningKeys(electionId: string): Promise<{ publicKey: string; privateKeyEncrypted: string } | null> {
  const [result] = await sql<{ public_key: string; private_key_encrypted: string }[]>`
    SELECT public_key, private_key_encrypted FROM signing_keys WHERE election_id = ${electionId}
  `;
  if (!result) return null;
  return {
    publicKey: result.public_key,
    privateKeyEncrypted: result.private_key_encrypted,
  };
}
