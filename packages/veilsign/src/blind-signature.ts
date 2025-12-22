/**
 * VeilSign - Chaum Blind Signatures
 *
 * Implemented from scratch using Node.js native crypto.
 * No external dependencies for the core cryptography.
 */

import * as crypto from 'crypto';
import { sha256, randomBytesHex } from '@tvs/core';

export interface AuthorityKeys {
  keyId: string;
  publicKey: {
    n: string;  // Modulus (hex)
    e: string;  // Public exponent (hex)
  };
  privateKey: {
    n: string;
    e: string;
    d: string;  // Private exponent (hex)
  };
}

export interface Credential {
  electionId: string;
  nullifier: string;
  message: string;
}

export interface BlindedData {
  blinded: string;      // Blinded message (hex)
  r: string;            // Blinding factor (hex) - keep secret
}

export interface SignedCredential extends Credential {
  signature: string;
}

// Modular arithmetic helpers using native BigInt
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function modInverse(a: bigint, m: bigint): bigint {
  const m0 = m;
  let x0 = 0n;
  let x1 = 1n;

  if (m === 1n) return 0n;

  while (a > 1n) {
    const q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < 0n) x1 += m0;
  return x1;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function randomBigInt(bits: number): bigint {
  const bytes = Math.ceil(bits / 8);
  const buf = crypto.randomBytes(bytes);
  return BigInt('0x' + buf.toString('hex'));
}

function hexToBigInt(hex: string): bigint {
  return BigInt('0x' + hex);
}

function bigIntToHex(n: bigint): string {
  return n.toString(16);
}

/**
 * Generate RSA keypair for blind signatures
 */
export function generateAuthorityKeys(bits: number = 2048): AuthorityKeys {
  // Generate RSA keypair using Node.js crypto
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicExponent: 65537,
  });

  // Export keys to get the raw components
  const pubKeyDer = publicKey.export({ type: 'pkcs1', format: 'der' });
  const privKeyDer = privateKey.export({ type: 'pkcs1', format: 'der' });

  // Parse the DER to extract n, e, d
  // For simplicity, use JWK export which gives us the values directly
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });

  // Convert base64url to hex
  const b64ToHex = (b64: string) => Buffer.from(b64, 'base64url').toString('hex');

  const n = b64ToHex(pubJwk.n!);
  const e = b64ToHex(pubJwk.e!);
  const d = b64ToHex(privJwk.d!);

  const keyId = randomBytesHex(16);

  return {
    keyId,
    publicKey: { n, e },
    privateKey: { n, e, d },
  };
}

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
 *
 * blinded = message * r^e mod n
 */
export function blindMessage(
  message: string,
  publicKey: AuthorityKeys['publicKey']
): BlindedData {
  const n = hexToBigInt(publicKey.n);
  const e = hexToBigInt(publicKey.e);
  const m = hexToBigInt(message);

  // Generate random blinding factor r where gcd(r, n) = 1
  let r: bigint;
  do {
    r = randomBigInt(256) % n;
  } while (r <= 1n || gcd(r, n) !== 1n);

  // blinded = m * r^e mod n
  const rE = modPow(r, e, n);
  const blinded = (m * rE) % n;

  return {
    blinded: bigIntToHex(blinded),
    r: bigIntToHex(r),
  };
}

/**
 * Authority signs blinded message (cannot see original)
 *
 * signed = blinded^d mod n
 */
export function signBlinded(
  blinded: string,
  privateKey: AuthorityKeys['privateKey']
): string {
  const n = hexToBigInt(privateKey.n);
  const d = hexToBigInt(privateKey.d);
  const b = hexToBigInt(blinded);

  const signed = modPow(b, d, n);
  return bigIntToHex(signed);
}

/**
 * Unblind the signature
 *
 * signature = signed * r^(-1) mod n
 */
export function unblindSignature(
  signed: string,
  r: string,
  publicKey: AuthorityKeys['publicKey']
): string {
  const n = hexToBigInt(publicKey.n);
  const s = hexToBigInt(signed);
  const rBig = hexToBigInt(r);

  const rInv = modInverse(rBig, n);
  const signature = (s * rInv) % n;
  return bigIntToHex(signature);
}

/**
 * Verify a signature
 *
 * valid if: signature^e mod n == message
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: AuthorityKeys['publicKey']
): boolean {
  const n = hexToBigInt(publicKey.n);
  const e = hexToBigInt(publicKey.e);
  const sig = hexToBigInt(signature);
  const m = hexToBigInt(message);

  const verified = modPow(sig, e, n);
  return verified === m;
}

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

// Legacy exports for API compatibility
export function blindCredential(credential: Credential, publicKey: AuthorityKeys['publicKey']) {
  const { blinded, r } = blindMessage(credential.message, publicKey);
  return { blinded, blindingFactor: r };
}

export function signBlindedCredential(blinded: string, privateKey: AuthorityKeys['privateKey']): string {
  return signBlinded(blinded, privateKey);
}
