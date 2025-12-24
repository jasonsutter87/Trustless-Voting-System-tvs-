---
title: "VeilKey"
description: "Threshold cryptography - the election key never exists in one place"
weight: 1
---

## The Problem

In traditional voting systems, a single election authority holds the private key that can decrypt all votes. This creates:

- **A single point of compromise** - steal one key, read all votes
- **A coercion target** - threaten one person, reveal the election
- **An insider threat** - one malicious admin can break privacy

## The Solution

VeilKey implements threshold cryptography ensuring the election private key **never exists in any single location**. Instead, the key is mathematically split among multiple trustees at creation time.

### Key Features

| Feature | Description |
|---------|-------------|
| **Shamir Secret Sharing** | Split secrets into n shares where any t can reconstruct |
| **Feldman VSS** | Verifiable secret sharing with public commitments |
| **Threshold RSA** | Distributed decryption without reconstructing the key |
| **Proactive Refresh** | Regenerate shares without changing the public key |
| **DKG Ceremonies** | Distributed key generation with no trusted dealer |

### How It Works

```
Election Setup (3-of-5 Threshold):
┌─────────────────────────────────────────────────────┐
│  VeilKey.createCeremony(threshold=3, trustees=5)    │
│                                                     │
│  Result:                                            │
│  • Public key → Published for vote encryption       │
│  • Share 1 → Trustee A (University)                 │
│  • Share 2 → Trustee B (Government)                 │
│  • Share 3 → Trustee C (NGO)                        │
│  • Share 4 → Trustee D (Opposition Party)           │
│  • Share 5 → Trustee E (Independent Auditor)        │
│                                                     │
│  Private key → NEVER EXISTS                         │
└─────────────────────────────────────────────────────┘
```

### Security Properties

- **No single trustee** can decrypt votes alone
- **Any 3 trustees** can cooperate to tally
- **1-2 compromised trustees** = election still secure
- **Key never reconstructed** during decryption

## Links

- [GitHub Repository](https://github.com/jasonsutter87/VeilKey)
