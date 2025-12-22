/**
 * @tvs/veilforms - VeilForms Integration for TVS
 *
 * Provides encrypted form submissions via the VeilForms SaaS platform.
 * VeilForms ensures vote data is encrypted client-side before transmission.
 *
 * @example
 * ```typescript
 * import { VeilFormsClient, createVoteCommitment } from '@tvs/veilforms';
 *
 * const client = new VeilFormsClient({
 *   apiUrl: 'https://api.veilforms.com',
 *   apiKey: process.env.VEILFORMS_API_KEY,
 *   formId: 'election-form-id',
 *   enabled: true,
 * });
 *
 * // Submit encrypted vote (received from client)
 * const result = await client.submitEncrypted(encryptedPayload);
 * ```
 */

// VeilForms client
export {
  VeilFormsClient,
  createVoteCommitment,
  verifyVoteCommitment,
  type VeilFormsConfig,
  type EncryptedPayload,
  type VoteData,
  type SubmissionResult,
  type FormPublicKey,
} from './client.js';

// Local encryption (for development/testing)
export {
  encryptVoteLocal,
  decryptVoteLocal,
  generateTestKey,
  generateTestKeypair,
} from './encryption.js';
