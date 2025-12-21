import { createHash, randomBytes } from 'crypto';

/**
 * SHA-256 hash of a string or buffer
 */
export function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * SHA-256 hash returning a Buffer
 */
export function sha256Buffer(data: string | Buffer): Buffer {
  return createHash('sha256').update(data).digest();
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytesHex(length: number): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a random UUID v4
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Concatenate and hash two hex strings (for Merkle tree)
 */
export function hashPair(left: string, right: string): string {
  // Sort to ensure consistent ordering
  const sorted = left < right ? left + right : right + left;
  return sha256(Buffer.from(sorted, 'hex'));
}

/**
 * Convert a bigint to a fixed-length hex string
 */
export function bigintToHex(n: bigint, byteLength: number = 32): string {
  const hex = n.toString(16).padStart(byteLength * 2, '0');
  return hex.slice(-byteLength * 2);
}

/**
 * Convert a hex string to bigint
 */
export function hexToBigint(hex: string): bigint {
  return BigInt('0x' + hex);
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
