/**
 * @tvs/veilproof - TVS Wrapper for VeilProof
 *
 * Generates proofs that a vote is valid without revealing the vote.
 * Uses @veilproof/core for the underlying proof generation.
 */

import {
  generateProof as veilproofGenerate,
  serializeProof,
  type Proof,
  type ProofResult,
} from '@veilproof/core';
import { sha256 } from '@tvs/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CIRCUIT_DIR = path.join(__dirname, '..', 'build');

export interface VoteInput {
  electionId: bigint;
  vote: number;
  credentialSecret: bigint;
  numCandidates: number;
}

export interface ProofOutput {
  proof: Proof;
  publicSignals: string[];
  nullifier: string;
  commitment: string;
}

/**
 * Generate a random field element for salting
 */
export function generateSalt(): bigint {
  const bytes = new Uint8Array(31); // 31 bytes to stay within field
  crypto.getRandomValues(bytes);
  return BigInt('0x' + Buffer.from(bytes).toString('hex'));
}

/**
 * Compute Poseidon hash (simplified version using SHA256 for now)
 * In production, use circomlibjs for actual Poseidon
 */
function poseidonHash(...inputs: bigint[]): bigint {
  // Simplified: concatenate and hash
  // TODO: Replace with actual Poseidon from circomlibjs
  const data = inputs.map(i => i.toString(16).padStart(64, '0')).join('');
  const hash = sha256(data);
  return BigInt('0x' + hash) % (2n ** 254n); // Keep in field
}

/**
 * Generate a ZK proof for a vote using @veilproof/core
 */
export async function generateVoteProof(input: VoteInput): Promise<ProofOutput> {
  const voteSalt = generateSalt();

  // Compute nullifier: H(electionId, credentialSecret)
  const nullifier = poseidonHash(input.electionId, input.credentialSecret);

  // Compute commitment: H(vote, voteSalt)
  const commitment = poseidonHash(BigInt(input.vote), voteSalt);

  // Prepare circuit inputs
  const circuitInput = {
    electionId: input.electionId.toString(),
    nullifier: nullifier.toString(),
    commitment: commitment.toString(),
    numCandidates: input.numCandidates.toString(),
    vote: input.vote.toString(),
    credentialSecret: input.credentialSecret.toString(),
    voteSalt: voteSalt.toString(),
  };

  // Load circuit files
  const wasmPath = path.join(CIRCUIT_DIR, 'vote_js', 'vote.wasm');
  const zkeyPath = path.join(CIRCUIT_DIR, 'vote_final.zkey');

  // Generate proof using @veilproof/core
  const result: ProofResult = await veilproofGenerate(wasmPath, zkeyPath, circuitInput, {
    logger: () => {}, // Silent
  });

  return {
    proof: result.proof,
    publicSignals: result.publicSignals,
    nullifier: nullifier.toString(),
    commitment: commitment.toString(),
  };
}

/**
 * Export proof for verification (converts to format suitable for on-chain or API verification)
 */
export function exportProof(proofOutput: ProofOutput): string {
  // Use @veilproof/core's serializeProof for the base serialization
  const baseProof = serializeProof(proofOutput.proof, proofOutput.publicSignals);
  const parsed = JSON.parse(baseProof);

  // Add TVS-specific fields
  return JSON.stringify({
    ...parsed,
    nullifier: proofOutput.nullifier,
    commitment: proofOutput.commitment,
  });
}

/**
 * Create a credential secret from a signed credential
 */
export function credentialToSecret(signedCredential: {
  nullifier: string;
  signature: string;
}): bigint {
  // Hash the credential components to get a field element
  const data = signedCredential.nullifier + signedCredential.signature;
  const hash = sha256(data);
  return BigInt('0x' + hash) % (2n ** 254n);
}
