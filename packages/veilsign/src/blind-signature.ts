/**
 * @tvs/veilsign - TVS Wrapper for VeilSign
 *
 * Provides a simplified API for the Trustless Voting System.
 * Uses @veilsign/core for the underlying cryptography.
 */

import {
  generateKeyPairSync,
  exportKeyPair,
  blind,
  signBlinded as veilSignBlinded,
  unblind,
  verify,
} from '@veilsign/core';
import { sha256, randomBytesHex } from '@tvs/core';

// ============================================================================
// Types - Simplified for TVS
// ============================================================================

export interface AuthorityKeys {
  keyId: string;
  publicKey: {
    n: string;  // Modulus (hex)
    e: string;  // Public exponent (hex)
    pem: string; // PEM format for @veilsign/core
  };
  privateKey: {
    n: string;
    e: string;
    d: string;  // Private exponent (hex)
    pem: string; // PEM format for @veilsign/core
  };
}

export interface Credential {
  electionId: string;
  nullifier: string;
  message: string;
}

export interface BlindedData {
  blinded: string;
  r: string;
}

export interface SignedCredential extends Credential {
  signature: string;
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Generate RSA keypair for blind signatures
 */
export function generateAuthorityKeys(bits: number = 2048): AuthorityKeys {
  const keyPair = generateKeyPairSync(bits as 1024 | 2048 | 4096);
  const serialized = exportKeyPair(keyPair);

  // Extract raw components from JWK
  const pubJwk = keyPair.publicKey.export({ format: 'jwk' });
  const privJwk = keyPair.privateKey.export({ format: 'jwk' });

  const b64ToHex = (b64: string) => Buffer.from(b64, 'base64url').toString('hex');

  const n = b64ToHex(pubJwk.n as string);
  const e = b64ToHex(pubJwk.e as string);
  const d = b64ToHex(privJwk.d as string);

  const keyId = randomBytesHex(16);

  return {
    keyId,
    publicKey: {
      n,
      e,
      pem: serialized.publicKey,
    },
    privateKey: {
      n,
      e,
      d,
      pem: serialized.privateKey,
    },
  };
}

// ============================================================================
// Credential Management
// ============================================================================

/**
 * Create a credential for a voter
 */
export function createCredential(electionId: string): Credential {
  const nullifier = randomBytesHex(32);
  const message = sha256(`${electionId}:${nullifier}`);

  return {
    electionId,
    nullifier,
    message,
  };
}

/**
 * Blind a message before sending to authority
 */
export function blindMessage(
  message: string,
  publicKey: AuthorityKeys['publicKey']
): BlindedData {
  const messageBuffer = Buffer.from(message, 'hex');
  const result = blind(messageBuffer, publicKey.pem);

  return {
    blinded: result.blinded,
    r: result.blindingFactor,
  };
}

/**
 * Authority signs blinded message (cannot see original)
 */
export function signBlinded(
  blinded: string,
  privateKey: AuthorityKeys['privateKey']
): string {
  const result = veilSignBlinded(blinded, privateKey.pem);
  return result.blindedSignature;
}

/**
 * Unblind the signature
 */
export function unblindSignature(
  signed: string,
  r: string,
  publicKey: AuthorityKeys['publicKey']
): string {
  const result = unblind(signed, r, publicKey.pem);
  return result.signature;
}

/**
 * Verify a signature
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: AuthorityKeys['publicKey']
): boolean {
  const messageBuffer = Buffer.from(message, 'hex');
  return verify(messageBuffer, signature, publicKey.pem);
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Complete credential issuance flow
 */
export function issueCredential(
  electionId: string,
  keys: AuthorityKeys
): SignedCredential {
  // 1. Create credential
  const credential = createCredential(electionId);

  // 2. Blind the message
  const { blinded, r } = blindMessage(credential.message, keys.publicKey);

  // 3. Authority signs (cannot see original message)
  const signedBlinded = signBlinded(blinded, keys.privateKey);

  // 4. Unblind to get final signature
  const signature = unblindSignature(signedBlinded, r, keys.publicKey);

  return {
    ...credential,
    signature,
  };
}

/**
 * Verify a signed credential
 */
export function verifyCredential(
  credential: SignedCredential,
  publicKey: AuthorityKeys['publicKey']
): boolean {
  return verifySignature(credential.message, credential.signature, publicKey);
}

// ============================================================================
// Legacy Exports
// ============================================================================

export function blindCredential(credential: Credential, publicKey: AuthorityKeys['publicKey']) {
  const { blinded, r } = blindMessage(credential.message, publicKey);
  return { blinded, blindingFactor: r };
}

export function signBlindedCredential(blinded: string, privateKey: AuthorityKeys['privateKey']): string {
  return signBlinded(blinded, privateKey);
}
