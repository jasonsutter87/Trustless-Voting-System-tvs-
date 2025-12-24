---
title: "VeilChain"
description: "Merkle tree vote ledger - tamper-evident vote storage"
weight: 4
---

## The Problem

How do you prove votes haven't been modified, deleted, or added after the election? Traditional databases allow administrators to silently alter records.

## The Solution

VeilChain implements a Merkle tree data structure that makes any modification cryptographically detectable.

### Key Features

| Feature | Description |
|---------|-------------|
| **SHA-256 Merkle Tree** | Tamper-evident data structure |
| **Inclusion Proofs** | Prove a vote exists in the tree |
| **Append-Only** | No modifications or deletions |
| **Root Anchoring** | Publish root to external systems |
| **Merkle Mountain Range** | Efficient updates at scale |

### How It Works

```
Vote Storage:
┌─────────────────────────────────────────────────────┐
│                    Root Hash                        │
│                   (published)                       │
│                   /         \                       │
│                  /           \                      │
│            Hash(0,1)        Hash(2,3)               │
│            /      \         /      \                │
│           /        \       /        \               │
│      Hash(V₀)  Hash(V₁) Hash(V₂)  Hash(V₃)         │
│         │         │        │         │              │
│        V₀        V₁       V₂        V₃              │
│   (enc vote) (enc vote) (enc vote) (enc vote)       │
└─────────────────────────────────────────────────────┘
```

### Voter Verification

After voting, each voter receives:
- **Merkle position** (e.g., 42)
- **Merkle proof** (sibling hashes)
- **Current root hash**

Later, the voter can verify their vote is included:

```javascript
const isIncluded = VeilChain.verifyInclusion(
  myVoteHash,
  merkleProof,
  publishedRoot
);

if (!isIncluded) {
  alert("Vote may have been tampered!");
}
```

### External Anchoring

The root hash can be anchored to external systems:

- **Bitcoin** (OP_RETURN transaction)
- **Ethereum** (smart contract event)
- **Multiple newspapers**
- **Government archives**

Once anchored, tampering requires modifying ALL anchor points—practically impossible.

### Security Properties

- **Tamper-evident** - any modification changes the root hash
- **Publicly verifiable** - anyone can verify the tree
- **Individual verification** - each voter can verify their vote
- **Immutable** - append-only, no deletions

## Links

- [GitHub Repository](https://github.com/jasonsutter87/veilchain)
- [VeilChain Website](https://veilchain.io)
