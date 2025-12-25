import { describe, it, expect } from 'vitest';
import {
  sha256,
  sha256Buffer,
  randomBytesHex,
  uuid,
  hashPair,
  hashPairSorted,
  bigintToHex,
  hexToBigint,
  constantTimeEqual,
} from '../crypto';

describe('sha256', () => {
  it('should hash a string correctly', () => {
    const result = sha256('hello');
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should hash a buffer correctly', () => {
    const buffer = Buffer.from('hello');
    const result = sha256(buffer);
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should produce consistent results', () => {
    const hash1 = sha256('test');
    const hash2 = sha256('test');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = sha256('input1');
    const hash2 = sha256('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return 64 character hex string', () => {
    const result = sha256('any input');
    expect(result.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(result)).toBe(true);
  });
});

describe('sha256Buffer', () => {
  it('should return a Buffer', () => {
    const result = sha256Buffer('hello');
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('should return 32 bytes', () => {
    const result = sha256Buffer('hello');
    expect(result.length).toBe(32);
  });

  it('should match hex sha256 when converted', () => {
    const buffer = sha256Buffer('hello');
    const hex = buffer.toString('hex');
    expect(hex).toBe(sha256('hello'));
  });
});

describe('randomBytesHex', () => {
  it('should return correct length', () => {
    const result = randomBytesHex(16);
    expect(result.length).toBe(32); // 16 bytes = 32 hex chars
  });

  it('should return hex string', () => {
    const result = randomBytesHex(16);
    expect(/^[a-f0-9]+$/.test(result)).toBe(true);
  });

  it('should produce unique values', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(randomBytesHex(32));
    }
    expect(results.size).toBe(100);
  });

  it('should handle various lengths', () => {
    expect(randomBytesHex(1).length).toBe(2);
    expect(randomBytesHex(8).length).toBe(16);
    expect(randomBytesHex(32).length).toBe(64);
    expect(randomBytesHex(64).length).toBe(128);
  });
});

describe('uuid', () => {
  it('should return a valid UUID v4 format', () => {
    const result = uuid();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(result)).toBe(true);
  });

  it('should produce unique values', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(uuid());
    }
    expect(results.size).toBe(100);
  });
});

describe('hashPair', () => {
  it('should hash two hex strings', () => {
    const left = 'aa'.repeat(32);
    const right = 'bb'.repeat(32);
    const result = hashPair(left, right);
    expect(result.length).toBe(64);
  });

  it('should be position-aware (not commutative)', () => {
    const a = 'aa'.repeat(32);
    const b = 'bb'.repeat(32);
    const hash1 = hashPair(a, b);
    const hash2 = hashPair(b, a);
    // Position-aware hashing should NOT be commutative
    expect(hash1).not.toBe(hash2);
  });

  it('should produce consistent results', () => {
    const left = 'cc'.repeat(32);
    const right = 'dd'.repeat(32);
    const hash1 = hashPair(left, right);
    const hash2 = hashPair(left, right);
    expect(hash1).toBe(hash2);
  });
});

describe('hashPairSorted (deprecated)', () => {
  it('should be commutative (sorted)', () => {
    const a = 'aa'.repeat(32);
    const b = 'bb'.repeat(32);
    const hash1 = hashPairSorted(a, b);
    const hash2 = hashPairSorted(b, a);
    expect(hash1).toBe(hash2);
  });
});

describe('bigintToHex', () => {
  it('should convert small bigints', () => {
    expect(bigintToHex(BigInt(0), 1)).toBe('00');
    expect(bigintToHex(BigInt(255), 1)).toBe('ff');
    expect(bigintToHex(BigInt(256), 2)).toBe('0100');
  });

  it('should pad to correct length', () => {
    const result = bigintToHex(BigInt(1), 32);
    expect(result.length).toBe(64);
    expect(result).toBe('0'.repeat(63) + '1');
  });

  it('should truncate large values to fit length', () => {
    const large = BigInt('0x' + 'ff'.repeat(64));
    const result = bigintToHex(large, 32);
    expect(result.length).toBe(64);
  });

  it('should handle default 32-byte length', () => {
    const result = bigintToHex(BigInt(42));
    expect(result.length).toBe(64);
  });
});

describe('hexToBigint', () => {
  it('should convert hex to bigint', () => {
    expect(hexToBigint('00')).toBe(BigInt(0));
    expect(hexToBigint('ff')).toBe(BigInt(255));
    expect(hexToBigint('0100')).toBe(BigInt(256));
  });

  it('should handle large hex strings', () => {
    const hex = 'ff'.repeat(32);
    const result = hexToBigint(hex);
    expect(result > BigInt(0)).toBe(true);
  });

  it('should be inverse of bigintToHex', () => {
    const original = BigInt('123456789012345678901234567890');
    const hex = bigintToHex(original, 32);
    const recovered = hexToBigint(hex);
    expect(recovered).toBe(original);
  });
});

describe('constantTimeEqual', () => {
  it('should return true for equal strings', () => {
    expect(constantTimeEqual('hello', 'hello')).toBe(true);
    expect(constantTimeEqual('', '')).toBe(true);
    expect(constantTimeEqual('a'.repeat(100), 'a'.repeat(100))).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(constantTimeEqual('hello', 'world')).toBe(false);
    expect(constantTimeEqual('hello', 'Hello')).toBe(false);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
  });

  it('should return false for different lengths', () => {
    expect(constantTimeEqual('short', 'longer string')).toBe(false);
    expect(constantTimeEqual('a', 'aa')).toBe(false);
  });

  it('should work with hex strings (nullifier comparison)', () => {
    const nullifier1 = 'ab'.repeat(32);
    const nullifier2 = 'ab'.repeat(32);
    const nullifier3 = 'cd'.repeat(32);

    expect(constantTimeEqual(nullifier1, nullifier2)).toBe(true);
    expect(constantTimeEqual(nullifier1, nullifier3)).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(constantTimeEqual('', '')).toBe(true);
    expect(constantTimeEqual('', 'a')).toBe(false);
    expect(constantTimeEqual('a', '')).toBe(false);
  });
});
