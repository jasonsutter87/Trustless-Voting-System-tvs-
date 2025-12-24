---
title: "VeilSign"
description: "Blind signatures for anonymous credentials"
weight: 2
---

## The Problem

How do you prove someone is eligible to vote without revealing their identity when they vote? Traditional systems either:

- **Link votes to identities** (privacy violation)
- **Allow anyone to vote** (eligibility violation)

## The Solution

VeilSign implements Chaum's blind signature protocol, allowing the authority to sign a credential without seeing its contents.

### Key Features

| Feature | Description |
|---------|-------------|
| **RSA Blind Signatures** | Sign messages without seeing them |
| **Unlinkability** | Signature cannot be linked to signing session |
| **Threshold Signing** | Integration with VeilKey for distributed signing |
| **Batch Verification** | Efficient verification of multiple credentials |

### How It Works

```
Registration (Identity Verified):
┌─────────────────────────────────────────────────────┐
│  Voter                          Authority           │
│  ──────                          ─────────          │
│                                                     │
│  credential = random()                              │
│  blinded = VeilSign.blind(credential)               │
│                                                     │
│  ─── blinded ───────────────────►                   │
│                                  (can't see cred)   │
│                                  signed_blind =     │
│                                    sign(blinded)    │
│  ◄─────────────────── signed_blind ───              │
│                                                     │
│  signature = VeilSign.unblind(signed_blind)         │
│                                                     │
│  // Voter now has valid credential                  │
│  // Authority CANNOT link it to voter               │
└─────────────────────────────────────────────────────┘
```

### Security Properties

- **Authority blindness** - signer never sees what they're signing
- **Unlinkability** - registration session cannot be linked to vote
- **Eligibility** - only registered voters can obtain credentials
- **Uniqueness** - each voter gets exactly one credential

## Links

- [GitHub Repository](https://github.com/jasonsutter87/VeilSign)
