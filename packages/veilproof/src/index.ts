// @tvs/veilproof - Zero-knowledge proofs
// TVS-specific wrappers
export * from './prover.js';
export * from './verifier.js';

// Re-export commonly used types from @veilproof/core
export type {
  Proof,
  Groth16Proof,
  PlonkProof,
  VerificationKey,
  ProofResult,
} from '@veilproof/core';
