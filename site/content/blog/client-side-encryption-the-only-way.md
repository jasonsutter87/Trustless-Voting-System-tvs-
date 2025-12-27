---
title: "Client-Side Encryption: The Only Way to Keep Secrets in the Cloud"
date: 2024-12-24
author: "VeilSuite Team"
tags: ["encryption", "veilcloud", "security"]
---

There's only one way to guarantee privacy in cloud storage: encrypt before upload. Everything else is security theater.

## Server-Side vs Client-Side Encryption

### Server-Side Encryption (SSE)
What AWS, Google, and Azure offer by default:

```
1. You upload plaintext
2. Server receives plaintext
3. Server encrypts with server's key
4. Server stores ciphertext
```

The problem? Step 2. The server sees your plaintext. Game over for privacy.

### Client-Side Encryption (CSE)
What VeilCloud requires:

```
1. You encrypt with your key
2. You upload ciphertext
3. Server receives ciphertext
4. Server stores ciphertext
```

The server never sees plaintext. Not during upload, not during storage, not ever.

## Why This Matters

### The Honest Admin Problem
Even if every employee at AWS is honest today, can you guarantee:
- No employee will ever be bribed?
- No employee will ever be blackmailed?
- No insider threat will ever exist?

With client-side encryption, honest admins aren't required. Dishonest admins can't do anything because they can't read the data.

### The Breach Problem
Server-side encryption protects against:
- Stolen hard drives
- Unauthorized physical access

It doesn't protect against:
- Application vulnerabilities
- Stolen credentials
- Insider access
- Most actual attacks

Client-side encryption protects against all of these. Even if attackers get full database access, they only get ciphertext.

### The Legal Problem
Governments can compel companies to hand over data. With server-side encryption, companies can comply — they have the keys.

With client-side encryption, companies can't comply even if they want to. They literally don't have the keys.

## How VeilCloud Implements Client-Side Encryption

### The SDK Handles Everything

```typescript
import { VeilCloudClient } from '@veilcloud/sdk';

const client = new VeilCloudClient({
  baseUrl: 'https://api.veilcloud.io',
  encryptionKey: yourLocalKey  // Never leaves your device
});

// Encryption happens automatically
await client.storage.put('project', 'secret.pdf', {
  data: fileContents
});
```

The SDK encrypts before any network request. The server API rejects unencrypted uploads.

### Key Management Options

**Personal Use**: Key derived from your password using Argon2id
```typescript
const key = await deriveKey(password, salt);
```

**Team Use**: Keys managed through VeilKey threshold cryptography
```typescript
const teamKey = await veilkey.deriveTeamKey(teamId, userShare);
```

**Enterprise**: Hardware security modules (HSMs) for key storage

## "But What About Searching?"

Common objection: "If data is encrypted, how do I search it?"

Answer: You can't do server-side full-text search on encrypted data. That's the point.

For structured queries:
- Encrypt deterministically for equality searches
- Use order-preserving encryption for range queries
- Store encrypted metadata indexes

For full-text search:
- Decrypt client-side and search locally
- Use searchable encryption schemes (with tradeoffs)
- Accept that some features require plaintext

VeilCloud prioritizes privacy over features. If you need features that require server-side plaintext access, use a different provider. We won't pretend we can do both.

## The Bottom Line

There are only two states:
1. **Server can read your data** - Not private
2. **Server cannot read your data** - Private

Server-side encryption is state 1 dressed up to look like state 2.

Client-side encryption is the only way to achieve state 2.

VeilCloud is built on client-side encryption: [github.com/jasonsutter87/VeilCloud](https://github.com/jasonsutter87/VeilCloud)

---

*"Encrypt first. Upload second. There is no third option."*
