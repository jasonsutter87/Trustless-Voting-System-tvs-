/**
 * Voters Repository
 */

import { sql } from './connection.js';

export interface Voter {
  id: string;
  election_id: string;
  student_id_hash: string;
  registered_at: Date;
  credential_issued: boolean;
  credential_issued_at: Date | null;
}

// Register voter
export async function registerVoter(electionId: string, studentIdHash: string): Promise<Voter> {
  const [voter] = await sql<Voter[]>`
    INSERT INTO voters (election_id, student_id_hash)
    VALUES (${electionId}, ${studentIdHash})
    RETURNING *
  `;
  return voter!;
}

// Check if voter is registered
export async function isVoterRegistered(electionId: string, studentIdHash: string): Promise<boolean> {
  const [result] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM voters WHERE election_id = ${electionId} AND student_id_hash = ${studentIdHash}
    ) as exists
  `;
  return result?.exists || false;
}

// Mark credential as issued
export async function markCredentialIssued(electionId: string, studentIdHash: string): Promise<void> {
  await sql`
    UPDATE voters
    SET credential_issued = true, credential_issued_at = NOW()
    WHERE election_id = ${electionId} AND student_id_hash = ${studentIdHash}
  `;
}

// Get registration count
export async function getRegistrationCount(electionId: string): Promise<number> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM voters WHERE election_id = ${electionId}
  `;
  return result?.count || 0;
}

// Get credentials issued count
export async function getCredentialsIssuedCount(electionId: string): Promise<number> {
  const [result] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM voters
    WHERE election_id = ${electionId} AND credential_issued = true
  `;
  return result?.count || 0;
}
