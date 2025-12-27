---
title: "VeilCloud vs Traditional Cloud: A Technical Deep Dive"
date: 2024-12-20
author: "VeilSuite Team"
tags: ["veilcloud", "technical", "architecture", "comparison"]
---

Let's get technical. Here's exactly how VeilCloud's architecture differs from traditional cloud providers at the protocol level.

## The Upload Flow

### Traditional Cloud (e.g., S3)

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT                                                           │
│                                                                  │
│  file.pdf (plaintext)                                           │
│       │                                                          │
│       ▼                                                          │
│  HTTP PUT /bucket/file.pdf                                       │
│  Authorization: AWS4-HMAC-SHA256 ...                            │
│  Body: [plaintext file contents]                                │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (TLS encrypted in transit)
┌─────────────────────────────────────────────────────────────────┐
│ SERVER                                                           │
│                                                                  │
│  Receives plaintext → Encrypts with AES-256 → Stores           │
│                              ↑                                   │
│                      Server holds key                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What the server sees**: Everything.

### VeilCloud

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT                                                           │
│                                                                  │
│  file.pdf (plaintext)                                           │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ VeilCloud SDK                                            │    │
│  │                                                          │    │
│  │ 1. Generate random 256-bit nonce                        │    │
│  │ 2. Encrypt with AES-256-GCM using YOUR key              │    │
│  │ 3. Compute HMAC for integrity                           │    │
│  │ 4. Base64 encode                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                          │
│       ▼                                                          │
│  HTTP PUT /v1/storage/project/blob-id                           │
│  Authorization: VeilSign ...                                     │
│  Body: { "data": "base64-encoded-ciphertext" }                  │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (TLS encrypted in transit)
┌─────────────────────────────────────────────────────────────────┐
│ SERVER                                                           │
│                                                                  │
│  Receives ciphertext → Validates format → Stores ciphertext    │
│                              ↑                                   │
│                      No key, no decryption                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What the server sees**: Random bytes.

## Encryption Specifications

### Algorithm Choice

| Component | VeilCloud | Why |
|-----------|-----------|-----|
| Symmetric encryption | AES-256-GCM | Authenticated encryption, hardware acceleration |
| Key derivation | Argon2id | Memory-hard, resistant to GPU attacks |
| Key exchange | X25519 | Modern ECDH, 128-bit security |
| Signatures | Ed25519 | Fast, deterministic, 128-bit security |
| Hashing | BLAKE3 | Fast, secure, parallelizable |

### Ciphertext Format

```
┌─────────────────────────────────────────────────────────────────┐
│ VeilCloud Blob Format                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┬────────────┬─────────────────────┬──────────────┐ │
│  │ Version  │   Nonce    │     Ciphertext      │   Auth Tag   │ │
│  │ (1 byte) │ (12 bytes) │    (variable)       │  (16 bytes)  │ │
│  └──────────┴────────────┴─────────────────────┴──────────────┘ │
│                                                                  │
│  Version: Format version for forward compatibility              │
│  Nonce: Random, unique per encryption                           │
│  Ciphertext: AES-256-GCM encrypted data                         │
│  Auth Tag: GCM authentication tag                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Management Architecture

### Personal Keys

```typescript
// Key derivation from password
const salt = crypto.getRandomValues(new Uint8Array(32));
const key = await argon2id({
  password: userPassword,
  salt: salt,
  parallelism: 4,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,
  hashLength: 32
});
```

### Team Keys (VeilKey Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│                     VEILKEY THRESHOLD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Master Key: Never exists in one place                          │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Share 1 │  │ Share 2 │  │ Share 3 │  │ Share 4 │  ...       │
│  │ User A  │  │ User B  │  │ User C  │  │ HSM     │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                  │
│  Threshold: 3-of-5                                              │
│  Any 3 shares can reconstruct the key                           │
│  VeilCloud holds 0 shares                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Comparison

### S3 PutObject
```http
PUT /bucket/key HTTP/1.1
Host: s3.amazonaws.com
Authorization: AWS4-HMAC-SHA256 Credential=...
Content-Type: application/octet-stream

[plaintext bytes]
```

### VeilCloud Storage Put
```http
PUT /v1/storage/project-id/blob-id HTTP/1.1
Host: api.veilcloud.io
Authorization: VeilSign credential=...,signature=...
Content-Type: application/json

{
  "data": "base64-encoded-ciphertext",
  "metadata": "base64-encoded-encrypted-metadata"
}
```

**Key difference**: The request body contains only ciphertext. Metadata is also encrypted.

## Audit Trail Architecture

### Traditional Cloud (CloudTrail)
```json
{
  "eventName": "PutObject",
  "bucket": "my-bucket",
  "key": "secret-document.pdf",
  "userIdentity": "arn:aws:iam::123456789012:user/admin",
  "timestamp": "2024-12-20T10:00:00Z"
}
```

**Problems**:
- Reveals file names
- Stored in provider's infrastructure
- Provider can modify logs

### VeilCloud (VeilChain)
```json
{
  "action": "blob.write",
  "project": "a7f3b2c1...",
  "blobId": "d4e5f6a7...",
  "principal": "hash(credential)",
  "timestamp": "2024-12-20T10:00:00Z",
  "merkleProof": {
    "root": "...",
    "path": [...]
  }
}
```

**Advantages**:
- No plaintext identifiers
- Merkle tree structure (tamper-evident)
- Can be anchored to Bitcoin
- Verifiable by anyone

## Performance Comparison

| Operation | S3 | VeilCloud | Overhead |
|-----------|-----|-----------|----------|
| Upload 1 MB | 50ms | 55ms | +10% (encryption) |
| Download 1 MB | 40ms | 45ms | +12% (decryption) |
| List objects | 20ms | 25ms | +25% (encrypted metadata) |

The overhead is client-side computation (AES-256-GCM). Modern CPUs with AES-NI instructions make this negligible.

## What VeilCloud Cannot Do

Transparency about limitations:

| Feature | Why Not |
|---------|---------|
| Server-side search | Can't search encrypted data |
| Thumbnails | Can't render encrypted images |
| Deduplication | Same file encrypts differently each time |
| CDN caching | Content varies by user key |
| Server-side processing | Can't process what we can't read |

These are features, not bugs. Each limitation is a privacy guarantee.

## Verification

### Verify Client-Side Encryption

```typescript
// Intercept the network request
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  console.log('Outgoing body:', options?.body);
  // Verify it's ciphertext, not plaintext
  return originalFetch(url, options);
};
```

### Verify Zero-Knowledge

```bash
# Get raw blob from API (even with admin access)
curl https://api.veilcloud.io/v1/storage/project/blob \
  -H "Authorization: AdminToken"

# Response: encrypted bytes with no way to decrypt
```

## Conclusion

The technical differences are fundamental:

- **Traditional cloud**: Encrypts on server, holds keys, can decrypt
- **VeilCloud**: Receives ciphertext, holds no keys, cannot decrypt

This isn't a policy difference. It's an architectural difference that makes privacy mathematically guaranteed.

---

*"The architecture is the policy."*
