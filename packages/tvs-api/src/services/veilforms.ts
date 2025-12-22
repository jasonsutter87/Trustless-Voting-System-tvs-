/**
 * VeilForms Service
 *
 * Uses @tvs/veilforms for encrypted form submissions.
 * This is a thin wrapper that configures the client from environment.
 */

import {
  VeilFormsClient,
  createVoteCommitment,
  verifyVoteCommitment,
  encryptVoteLocal,
  type EncryptedPayload,
  type VoteData,
  type SubmissionResult,
} from '@tvs/veilforms';
import { config } from '../config.js';

// ============================================================================
// Client Instance
// ============================================================================

/**
 * Singleton VeilForms client configured from environment
 */
export const veilformsClient = new VeilFormsClient({
  apiUrl: config.veilformsApiUrl,
  apiKey: config.veilformsApiKey,
  formId: config.veilformsFormId,
  enabled: config.useVeilForms,
});

// ============================================================================
// Re-exports for convenience
// ============================================================================

export {
  createVoteCommitment,
  verifyVoteCommitment,
  encryptVoteLocal,
  type EncryptedPayload,
  type VoteData,
  type SubmissionResult,
};

// ============================================================================
// TVS-specific helpers
// ============================================================================

/**
 * Encrypt a vote for submission
 *
 * In production, this happens client-side via VeilForms SDK.
 * This function is for development/testing only.
 */
export function encryptVote(
  candidateId: string,
  electionId: string
): EncryptedPayload {
  const vote: VoteData = {
    candidateId,
    electionId,
    timestamp: Date.now(),
  };

  return encryptVoteLocal(vote);
}

/**
 * Submit an encrypted vote to VeilForms
 */
export async function submitEncryptedVote(
  encryptedPayload: EncryptedPayload
): Promise<SubmissionResult> {
  return veilformsClient.submitEncrypted(encryptedPayload);
}

/**
 * Get the public key for a form (used by client-side SDK)
 */
export async function getFormPublicKey(): Promise<string> {
  const keyInfo = await veilformsClient.getPublicKey();
  return keyInfo.publicKey;
}
