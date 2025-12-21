---
title: "How Blind Signatures Enable Anonymous Voting"
date: 2024-12-20
author: "TVS Team"
tags: ["cryptography", "tutorial", "veilsign"]
---

Blind signatures are the cryptographic foundation of anonymous credentials in TVS. Here's how they work.

## The Challenge

We need to solve a paradox:
1. **Verify eligibility**: Ensure only registered voters can vote
2. **Ensure anonymity**: Prevent anyone from linking a voter to their vote

Traditional systems fail at this. If you verify identity at voting time, you can link the voter to their ballot.

## The Magic Trick

Blind signatures solve this with a clever protocol:

### Step 1: Voter Creates Credential
The voter generates a random credential locally:
```
credential = hash(electionId + randomNullifier)
```

### Step 2: Voter Blinds the Credential
Before sending to the authority, the voter "blinds" the credential:
```
blindedCredential = credential × r^e mod n
```
Where `r` is a random blinding factor known only to the voter.

### Step 3: Authority Signs (Blindly)
The election authority verifies the voter is registered, then signs the blinded credential:
```
blindedSignature = blindedCredential^d mod n
```

**The authority never sees the actual credential!**

### Step 4: Voter Unblinds
The voter removes the blinding factor to get a valid signature:
```
signature = blindedSignature × r^(-1) mod n
```

### Step 5: Verification
Anyone can verify the signature is valid:
```
signature^e mod n === credential ✓
```

## Why This Works

1. The authority signed something, so the credential is authentic
2. The authority never saw what they signed, so they can't link it
3. The voter has a valid, anonymous credential

## In TVS

VeilSign implements this protocol using the battle-tested `blind-signatures` library. When you register to vote, you receive a credential that proves you're eligible without revealing who you are.

The `nullifier` in your credential is used to prevent double-voting — it's checked when you submit your vote, but can't be traced back to your identity.

## Further Reading

- [Chaum, D. (1983) "Blind Signatures for Untraceable Payments"](https://www.chaum.com/publications/Blind_Signatures_for_Untraceable_Payments.pdf)
- [VeilSign Source Code](https://github.com/your-org/tvs/tree/main/packages/veilsign)
