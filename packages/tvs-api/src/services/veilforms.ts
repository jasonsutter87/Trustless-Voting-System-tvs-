/**
 * VeilForms Integration
 *
 * Uses the existing VeilForms API for client-side encryption.
 * For MVP, we provide a local encryption fallback.
 */

import { config } from '../config.js';
import { sha256, randomBytesHex } from '@tvs/core';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
}

/**
 * Encrypt vote data using AES-256-GCM (local fallback)
 * In production, this happens client-side via VeilForms SDK
 */
export function encryptVote(
  vote: { candidateId: string; timestamp: number },
  publicKey: string
): EncryptedPayload {
  // Generate a random AES key
  const aesKey = randomBytes(32);
  const iv = randomBytes(12);

  // Encrypt the vote
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const plaintext = JSON.stringify(vote);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  // In production: encrypt aesKey with RSA public key
  // For MVP: just include a hash-based key ID
  const keyId = sha256(aesKey.toString('hex')).slice(0, 16);

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag,
    keyId,
  };
}

/**
 * Create a commitment to the vote (hash)
 */
export function createCommitment(candidateId: string, salt?: string): {
  commitment: string;
  salt: string;
} {
  const voteSalt = salt || randomBytesHex(32);
  const commitment = sha256(`${candidateId}:${voteSalt}`);
  return { commitment, salt: voteSalt };
}

/**
 * VeilForms client for API integration
 */
export class VeilFormsClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = config.veilformsApiUrl;
    this.apiKey = config.veilformsApiKey;
  }

  /**
   * Get encryption public key for a form
   */
  async getPublicKey(formId: string): Promise<string> {
    if (!config.useVeilForms) {
      // Return placeholder for local dev
      return 'local-dev-key';
    }

    const res = await fetch(`${this.apiUrl}/forms/${formId}/key`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to get VeilForms public key');
    }

    const data = await res.json() as { publicKey: string };
    return data.publicKey;
  }

  /**
   * Submit encrypted data to VeilForms
   */
  async submit(formId: string, encryptedData: EncryptedPayload): Promise<{ submissionId: string }> {
    if (!config.useVeilForms) {
      // Local dev - just return a fake ID
      return { submissionId: randomBytesHex(16) };
    }

    const res = await fetch(`${this.apiUrl}/forms/${formId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedData }),
    });

    if (!res.ok) {
      throw new Error('Failed to submit to VeilForms');
    }

    return res.json() as Promise<{ submissionId: string }>;
  }
}

export const veilformsClient = new VeilFormsClient();
