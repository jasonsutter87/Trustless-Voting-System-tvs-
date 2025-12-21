/**
 * VeilProof - Zero-Knowledge Proof Verification
 *
 * Verifies proofs that votes are valid without learning the vote.
 */

import * as snarkjs from 'snarkjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CIRCUIT_DIR = path.join(__dirname, '..', 'build');

export interface VerificationResult {
  valid: boolean;
  nullifier: string;
  commitment: string;
  electionId: string;
  numCandidates: string;
}

/**
 * Load verification key from file
 */
let verificationKey: object | null = null;

async function getVerificationKey(): Promise<object> {
  if (verificationKey) return verificationKey;

  const vkeyPath = path.join(CIRCUIT_DIR, 'verification_key.json');
  const vkeyJson = readFileSync(vkeyPath, 'utf-8');
  verificationKey = JSON.parse(vkeyJson);
  return verificationKey!;
}

/**
 * Verify a vote proof
 */
export async function verifyVoteProof(
  proof: object,
  publicSignals: string[]
): Promise<VerificationResult> {
  const vkey = await getVerificationKey();

  // Verify the proof
  const valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

  // Parse public signals
  // Order: electionId, nullifier, commitment, numCandidates
  const [electionId, nullifier, commitment, numCandidates] = publicSignals;

  return {
    valid,
    nullifier: nullifier!,
    commitment: commitment!,
    electionId: electionId!,
    numCandidates: numCandidates!,
  };
}

/**
 * Verify a serialized proof (from API)
 */
export async function verifySerializedProof(proofJson: string): Promise<VerificationResult> {
  const { proof, publicSignals } = JSON.parse(proofJson);
  return verifyVoteProof(proof, publicSignals);
}

/**
 * Check if a nullifier has been used (double-vote prevention)
 * This is a placeholder - actual implementation would check database
 */
export function isNullifierUsed(
  nullifier: string,
  usedNullifiers: Set<string>
): boolean {
  return usedNullifiers.has(nullifier);
}

/**
 * Validate proof structure (without cryptographic verification)
 */
export function validateProofStructure(proof: unknown): proof is {
  proof: object;
  publicSignals: string[];
} {
  if (typeof proof !== 'object' || proof === null) return false;

  const p = proof as Record<string, unknown>;

  if (typeof p['proof'] !== 'object' || p['proof'] === null) return false;
  if (!Array.isArray(p['publicSignals'])) return false;
  if (p['publicSignals'].length !== 4) return false;

  return p['publicSignals'].every(s => typeof s === 'string');
}
