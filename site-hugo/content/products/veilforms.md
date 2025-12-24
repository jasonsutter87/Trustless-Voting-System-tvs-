---
title: "VeilForms"
description: "Client-side vote encryption - your vote is encrypted before it leaves your device"
weight: 3
---

## The Problem

Even with HTTPS, the server receives plaintext form data. In voting, this means the server sees every vote—a critical privacy violation.

## The Solution

VeilForms encrypts votes in the voter's browser before transmission. The server only ever sees ciphertext it cannot decrypt.

### Key Features

| Feature | Description |
|---------|-------------|
| **AES-256-GCM** | Authenticated encryption for vote content |
| **Hybrid Encryption** | RSA-OAEP for key encapsulation |
| **Browser-Native** | Uses WebCrypto API, no external dependencies |
| **Form Integration** | Drop-in replacement for standard form submission |
| **Zero Server Trust** | Server cannot decrypt without election key |

### How It Works

```javascript
// In Voter's Browser
const vote = { candidateId: "alice", timestamp: Date.now() };

// Generate random AES key
const aesKey = await VeilForms.generateKey();

// Encrypt vote with AES
const ciphertext = await VeilForms.encrypt(vote, aesKey);

// Encrypt AES key with election public key
const encryptedKey = await VeilForms.wrapKey(aesKey, electionPublicKey);

// Send to server - server CANNOT decrypt
await fetch('/api/vote', {
  body: JSON.stringify({ ciphertext, encryptedKey, iv, tag })
});
```

### What the Server Receives

```json
{
  "ciphertext": "a7f2c9e1b4d8f3a2c7e9b1d4f8a3c2e7...",
  "iv": "3b8c2f9a1e7d4c6b",
  "tag": "f2e1d4c7b9a3f8e2d1c4b7a9f3e8d2c1",
  "encryptedKey": "d4a9c2e7b1f8d3a6..."
}
```

The server stores this ciphertext but **cannot decrypt it**. Only the threshold trustees can decrypt during tallying.

### Security Properties

- **End-to-end encryption** - vote encrypted before leaving browser
- **Forward secrecy** - unique key per vote
- **Authenticated encryption** - tampering detected
- **Zero server knowledge** - server only sees ciphertext

## Links

- [GitHub Repository](https://github.com/jasonsutter87/veilforms)
- [VeilForms Website](https://veilforms.com)
- [Live Demo](https://veilforms.com/demo/)
