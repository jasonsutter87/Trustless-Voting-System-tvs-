/**
 * @tvs/veilforms - TVS Wrapper for VeilForms
 *
 * Provides encrypted form submission via the VeilForms SaaS platform.
 * VeilForms handles client-side encryption so vote data is never exposed.
 *
 * @see https://veilforms.com/docs/
 */

import { sha256, randomBytesHex } from '@tvs/core';

// ============================================================================
// Types
// ============================================================================

export interface VeilFormsConfig {
  /** VeilForms API URL (default: https://api.veilforms.com) */
  apiUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Form ID for vote submissions */
  formId: string;
  /** Whether to use VeilForms API (false = local dev mode) */
  enabled: boolean;
}

export interface EncryptedPayload {
  /** AES-encrypted ciphertext (hex) */
  ciphertext: string;
  /** Initialization vector (hex) */
  iv: string;
  /** GCM authentication tag (hex) */
  tag: string;
  /** Key identifier for decryption */
  keyId: string;
}

export interface VoteData {
  /** Selected candidate ID */
  candidateId: string;
  /** Timestamp of vote */
  timestamp: number;
  /** Election ID */
  electionId: string;
}

export interface SubmissionResult {
  /** Unique submission ID from VeilForms */
  submissionId: string;
  /** Timestamp of submission */
  submittedAt: string;
}

export interface FormPublicKey {
  /** RSA public key (PEM format) */
  publicKey: string;
  /** Key ID */
  keyId: string;
  /** Algorithm (RSA-OAEP) */
  algorithm: string;
}

// ============================================================================
// VeilForms Client
// ============================================================================

/**
 * VeilForms client for encrypted form submissions
 *
 * In production, vote data is encrypted client-side using the VeilForms SDK
 * before being transmitted. This wrapper provides the server-side API client.
 */
export class VeilFormsClient {
  private config: VeilFormsConfig;

  constructor(config: Partial<VeilFormsConfig> = {}) {
    this.config = {
      apiUrl: config.apiUrl ?? 'https://api.veilforms.com',
      apiKey: config.apiKey ?? '',
      formId: config.formId ?? '',
      enabled: config.enabled ?? false,
    };
  }

  /**
   * Check if VeilForms integration is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Get the public key for encrypting submissions
   */
  async getPublicKey(): Promise<FormPublicKey> {
    if (!this.isEnabled()) {
      // Dev mode - return placeholder
      return {
        publicKey: 'dev-mode-public-key',
        keyId: 'dev-key-001',
        algorithm: 'RSA-OAEP',
      };
    }

    const response = await fetch(
      `${this.config.apiUrl}/v1/forms/${this.config.formId}/key`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VeilForms: Failed to get public key - ${error}`);
    }

    return response.json() as Promise<FormPublicKey>;
  }

  /**
   * Submit encrypted vote data to VeilForms
   *
   * Note: In production, encryption happens client-side via VeilForms SDK.
   * This method receives already-encrypted data from the client.
   */
  async submitEncrypted(encryptedPayload: EncryptedPayload): Promise<SubmissionResult> {
    if (!this.isEnabled()) {
      // Dev mode - return mock result
      return {
        submissionId: `dev-${randomBytesHex(16)}`,
        submittedAt: new Date().toISOString(),
      };
    }

    const response = await fetch(
      `${this.config.apiUrl}/v1/forms/${this.config.formId}/submit`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encrypted: encryptedPayload,
          metadata: {
            source: 'tvs',
            version: '0.1.0',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VeilForms: Submission failed - ${error}`);
    }

    return response.json() as Promise<SubmissionResult>;
  }

  /**
   * Retrieve submissions (admin only, requires decryption key)
   */
  async getSubmissions(options: {
    limit?: number;
    offset?: number;
    since?: Date;
  } = {}): Promise<{
    submissions: Array<{
      id: string;
      encrypted: EncryptedPayload;
      submittedAt: string;
    }>;
    total: number;
  }> {
    if (!this.isEnabled()) {
      return { submissions: [], total: 0 };
    }

    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.since) params.set('since', options.since.toISOString());

    const response = await fetch(
      `${this.config.apiUrl}/v1/forms/${this.config.formId}/submissions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VeilForms: Failed to get submissions - ${error}`);
    }

    return response.json() as Promise<{
      submissions: Array<{
        id: string;
        encrypted: EncryptedPayload;
        submittedAt: string;
      }>;
      total: number;
    }>;
  }

  /**
   * Create a form for an election (admin setup)
   */
  async createElectionForm(election: {
    id: string;
    name: string;
    candidates: Array<{ id: string; name: string }>;
  }): Promise<{ formId: string; publicKey: string }> {
    if (!this.isEnabled()) {
      return {
        formId: `dev-form-${election.id}`,
        publicKey: 'dev-mode-public-key',
      };
    }

    const response = await fetch(
      `${this.config.apiUrl}/v1/forms`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `TVS Election: ${election.name}`,
          type: 'encrypted',
          fields: [
            { name: 'candidateId', type: 'select', required: true },
            { name: 'electionId', type: 'hidden', value: election.id },
            { name: 'timestamp', type: 'hidden' },
          ],
          metadata: {
            source: 'tvs',
            electionId: election.id,
            candidates: election.candidates,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VeilForms: Failed to create form - ${error}`);
    }

    const data = await response.json() as { id: string; publicKey: string };
    return {
      formId: data.id,
      publicKey: data.publicKey,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a vote commitment (hash of vote + salt)
 * Used for verification without revealing the vote
 */
export function createVoteCommitment(
  candidateId: string,
  salt?: string
): { commitment: string; salt: string } {
  const voteSalt = salt ?? randomBytesHex(32);
  const commitment = sha256(`${candidateId}:${voteSalt}`);
  return { commitment, salt: voteSalt };
}

/**
 * Verify a vote commitment
 */
export function verifyVoteCommitment(
  candidateId: string,
  salt: string,
  commitment: string
): boolean {
  const computed = sha256(`${candidateId}:${salt}`);
  return computed === commitment;
}
