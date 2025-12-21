---
title: "How It Works"
description: "The cryptographic architecture behind trustless voting."
---

TVS combines four cryptographic technologies to create end-to-end verifiable elections.

## The Voting Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Register  │ -> │    Vote     │ -> │   Record    │ -> │   Verify    │
│  (VeilSign) │    │ (VeilForms) │    │ (VeilChain) │    │ (VeilProof) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Step 1: Registration (VeilSign)

When you register to vote, you receive an **anonymous credential** via blind signatures:

1. You generate a secret credential locally
2. You "blind" it cryptographically before sending
3. The authority signs without seeing the credential
4. You "unblind" to get a valid, anonymous credential

**Result**: You can prove you're eligible without revealing your identity.

## Step 2: Voting (VeilForms)

When you cast your vote:

1. You select your candidate on a local interface
2. Your vote is **encrypted client-side** using RSA + AES-256-GCM
3. The encrypted vote is submitted with your anonymous credential
4. A zero-knowledge proof proves your vote is valid

**Result**: Servers never see your plaintext vote.

## Step 3: Recording (VeilChain)

Every vote is recorded in a **Merkle tree ledger**:

1. Your encrypted vote is hashed
2. The hash is added to the Merkle tree
3. You receive a **confirmation code** and **inclusion proof**
4. The Merkle root is published publicly

**Result**: Tamper-evident, append-only vote storage.

## Step 4: Verification (VeilProof)

After voting, you can verify:

1. Your vote exists in the ledger (Merkle proof)
2. The ledger hasn't been tampered with (root comparison)
3. All votes are valid (ZK proof aggregation)
4. Results are correctly tallied (public computation)

**Result**: Mathematical certainty without trusting anyone.

---

## Security Properties

| Property | How TVS Achieves It |
|----------|---------------------|
| **Eligibility** | Blind signatures verify voter registration |
| **Uniqueness** | Nullifiers prevent double voting |
| **Privacy** | Client-side encryption + ZK proofs |
| **Integrity** | Merkle tree + append-only storage |
| **Verifiability** | Every voter can verify their vote |

---

## Open Source

Every component of TVS is open source:

- [VeilSign](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/tree/main/packages/veilsign) - Blind signatures
- [VeilChain](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/tree/main/packages/veilchain) - Merkle ledger
- [VeilProof](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/tree/main/packages/veilproof) - ZK circuits
- [TVS API](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/tree/main/packages/tvs-api) - Integration layer

---

<a href="/docs/" class="btn btn-primary">Read the Documentation</a>
<a href="/universities/" class="btn btn-secondary">Get Started</a>
