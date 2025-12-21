---
title: "Merkle Trees: The Backbone of Vote Integrity"
date: 2024-12-19
author: "TVS Team"
tags: ["cryptography", "tutorial", "veilchain"]
---

Merkle trees are how TVS ensures every vote is immutably recorded and verifiable. Here's how they work.

## The Structure

A Merkle tree is a binary tree where:
- **Leaves** contain hashes of data (votes)
- **Internal nodes** contain hashes of their children
- **Root** is a single hash representing all data

```
           Root Hash
          /         \
       Hash AB     Hash CD
       /    \      /    \
    Hash A  Hash B  Hash C  Hash D
      |       |       |       |
    Vote 1  Vote 2  Vote 3  Vote 4
```

## Why Merkle Trees?

### 1. Tamper Evidence
Change any vote → its hash changes → parent hash changes → root hash changes.

If someone publishes the root hash, any modification is immediately detectable.

### 2. Efficient Proofs
To prove a vote exists, you don't need the entire tree — just the path from leaf to root.

For a tree with 1 million votes, a proof is only ~20 hashes.

### 3. Append-Only
New votes are added as leaves. Old data is never modified.

## Inclusion Proofs

When you vote in TVS, you receive a **Merkle proof**:

```json
{
  "leaf": "abc123...",
  "path": ["def456...", "ghi789..."],
  "positions": ["left", "right"],
  "root": "xyz999..."
}
```

To verify:
1. Start with your vote's hash
2. Combine with each sibling hash in the path
3. Result should match the root

If it matches, your vote is definitely in the ledger.

## Public Verification

TVS publishes the Merkle root after each vote. Anyone can:
- Verify their own vote exists
- Confirm the root hasn't changed
- Audit the entire tree

The root can even be "anchored" to Bitcoin or Ethereum for additional tamper-evidence.

## In TVS

VeilChain implements a Merkle tree using the `merkletreejs` library. Every vote submission returns an inclusion proof that you can verify independently.

```typescript
import { VoteLedger } from '@tvs/veilchain';

// Verify your vote exists
const isValid = VoteLedger.verify(myProof);
console.log(isValid); // true
```

## Further Reading

- [Merkle, R. (1987) "A Digital Signature Based on a Conventional Encryption Function"](https://link.springer.com/chapter/10.1007/3-540-48184-2_32)
- [VeilChain Source Code](https://github.com/your-org/tvs/tree/main/packages/veilchain)
