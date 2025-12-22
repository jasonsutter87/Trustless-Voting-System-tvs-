/**
 * Local Encryption Module
 *
 * Provides AES-256-GCM encryption for development and testing.
 * In production, encryption happens client-side via VeilForms SDK.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { sha256 } from '@tvs/core';
import type { EncryptedPayload, VoteData } from './client.js';

// ============================================================================
// Encryption
// ============================================================================

/**
 * Encrypt vote data using AES-256-GCM
 *
 * This is used for local development/testing only.
 * Production uses VeilForms client-side encryption.
 */
export function encryptVoteLocal(vote: VoteData): EncryptedPayload {
  // Generate random AES-256 key and IV
  const aesKey = randomBytes(32);
  const iv = randomBytes(12); // 96-bit IV for GCM

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);

  // Encrypt the vote data
  const plaintext = JSON.stringify(vote);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  // Get authentication tag
  const tag = cipher.getAuthTag().toString('hex');

  // Create key ID (in production, this would be the RSA-encrypted AES key)
  const keyId = sha256(aesKey.toString('hex')).slice(0, 32);

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag,
    keyId,
  };
}

/**
 * Decrypt vote data (for testing/admin purposes)
 *
 * Note: In production, decryption happens with the election's private key
 * which is never exposed to the server.
 */
export function decryptVoteLocal(
  encrypted: EncryptedPayload,
  aesKeyHex: string
): VoteData {
  const aesKey = Buffer.from(aesKeyHex, 'hex');
  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return JSON.parse(plaintext) as VoteData;
}

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generate a random AES-256 key for testing
 */
export function generateTestKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate an election keypair for local testing
 *
 * In production, this is handled by VeilForms with proper key management.
 */
export async function generateTestKeypair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const { generateKeyPair } = await import('crypto');
  const { promisify } = await import('util');
  const generateKeyPairAsync = promisify(generateKeyPair);

  const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { publicKey, privateKey };
}
