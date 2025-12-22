/**
 * @tvs/veilproof - TVS Wrapper for VeilProof
 *
 * Provides a simplified API for the Trustless Voting System.
 * Uses @veilproof/core for the underlying ZK proof operations.
 */

import {
  verifyProof as veilproofVerify,
  loadVerificationKey,
  validatePublicSignals,
  type VerificationKey,
  type Proof,
} from '@veilproof/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CIRCUIT_DIR = path.join(__dirname, '..', 'build');

// ============================================================================
// Types
// ============================================================================

export interface TVSVerificationResult {
  valid: boolean;
  nullifier: string;
  commitment: string;
  electionId: string;
  numCandidates: string;
}

// ============================================================================
// Verification Key Management
// ============================================================================

let verificationKey: VerificationKey | null = null;

async function getVerificationKey(): Promise<VerificationKey> {
  if (verificationKey) return verificationKey;

  const vkeyPath = path.join(CIRCUIT_DIR, 'verification_key.json');
  verificationKey = await loadVerificationKey(vkeyPath);
  return verificationKey;
}

// ============================================================================
// Proof Verification
// ============================================================================

/**
 * Verify a vote proof using @veilproof/core
 */
export async function verifyVoteProof(
  proof: Proof,
  publicSignals: string[]
): Promise<TVSVerificationResult> {
  const vkey = await getVerificationKey();

  // Verify the proof using VeilProof
  const result = await veilproofVerify(vkey, publicSignals, proof);

  // Parse public signals
  // Order: electionId, nullifier, commitment, numCandidates
  const [electionId, nullifier, commitment, numCandidates] = publicSignals;

  return {
    valid: result.valid,
    nullifier: nullifier!,
    commitment: commitment!,
    electionId: electionId!,
    numCandidates: numCandidates!,
  };
}

/**
 * Verify a serialized proof (from API)
 */
export async function verifySerializedProof(proofJson: string): Promise<TVSVerificationResult> {
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
