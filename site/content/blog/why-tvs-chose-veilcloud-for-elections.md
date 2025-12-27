---
title: "Case Study: Why TVS Chose VeilCloud for Election Security"
date: 2024-12-16
author: "VeilSuite Team"
tags: ["veilcloud", "tvs", "voting", "case-study", "elections"]
---

The Trustless Voting System (TVS) is an end-to-end verifiable voting platform. When it came time to choose infrastructure for storing encrypted ballots at scale, we built VeilCloud. Here's why.

## The Challenge

TVS needed infrastructure that could:

1. **Store millions of encrypted votes** without seeing their contents
2. **Scale horizontally** for national-level elections (350M+ voters)
3. **Provide tamper-evident audit trails** for post-election verification
4. **Integrate with threshold cryptography** for distributed key management
5. **Maintain zero-knowledge guarantees** under all conditions

No existing cloud provider could satisfy all requirements.

## Why Traditional Cloud Failed

### AWS/GCP/Azure

We evaluated all major providers. The problems:

**Architecture**: Server-side encryption means the provider holds keys. For elections, this is unacceptable. A provider compromise would expose all votes.

**Key Management**: AWS KMS stores keys in AWS HSMs. Amazon can theoretically access them. For election integrity, "theoretically" isn't good enough.

**Audit Trails**: CloudTrail logs are stored in S3. Amazon can modify them. Election audits require tamper-proof logs.

**Scaling**: These providers scale well, but we'd need to layer client-side encryption on top, implement our own audit system, and build VeilKey integration from scratch.

### "Privacy-Focused" Storage Providers

We evaluated Tresorit, SpiderOak, and similar providers.

**Client-Side Encryption**: Yes, but...

**Closed Source**: We can't verify their encryption implementation.

**No VeilSuite Integration**: No support for threshold cryptography (VeilKey), tamper-evident audit logs (VeilChain), or blind signatures (VeilSign).

**Scaling Concerns**: Not designed for 350M+ record elections.

## Why We Built VeilCloud

VeilCloud is purpose-built for the VeilSuite ecosystem. Here's how it solves TVS's requirements:

### 1. Zero-Knowledge Vote Storage

Votes are encrypted in the voter's browser before transmission:

```
Voter Browser:
  ballot = { candidateId: 123, contestId: 456 }
  encryptedBallot = VeilForms.encrypt(ballot, electionPublicKey)
  → VeilCloud.storage.put(electionId, nullifier, encryptedBallot)

VeilCloud Server:
  Receives: encrypted blob
  Stores: encrypted blob
  Knows: nothing about the vote
```

Even if VeilCloud is completely compromised, vote contents remain secure.

### 2. Horizontal Scaling for National Elections

TVS's scaling challenge:

| Election Size | Current Performance | Target |
|---------------|---------------------|--------|
| 10,000 voters | 6 minutes | < 1 minute |
| 100,000 voters | 83 minutes | < 5 minutes |
| 350,000,000 voters | Infeasible | < 4 hours |

VeilCloud architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     VEILCLOUD PRODUCTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Load Balancer (Geographic)                                     │
│       │                                                          │
│       ├─── VeilCloud Region US-East                             │
│       ├─── VeilCloud Region US-West                             │
│       ├─── VeilCloud Region EU                                  │
│       └─── VeilCloud Region Asia                                │
│                                                                  │
│  Each Region:                                                   │
│       ├─── API Gateway (Fastify, stateless)                     │
│       ├─── Kafka Queue (async vote ingestion)                   │
│       ├─── Worker Pool (Merkle tree updates)                    │
│       └─── PostgreSQL Citus (sharded storage)                   │
│                                                                  │
│  Result: 100,000 votes/second ingestion                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. VeilChain Audit Integration

Every vote operation is logged to VeilChain:

```typescript
// Vote submission triggers audit entry
await veilcloud.storage.put(electionId, nullifier, encryptedVote);

// VeilCloud automatically logs:
{
  action: 'blob.write',
  electionId: hash(electionId),
  blobId: hash(nullifier),
  timestamp: Date.now(),
  merkleProof: { root, path, leaf }
}
```

Audit trail properties:
- **Tamper-evident**: Merkle tree structure
- **Publicly verifiable**: Anyone can verify proofs
- **Bitcoin-anchored**: Root hash anchored via OpenTimestamps
- **Immutable**: Cannot be modified after anchoring

### 4. VeilKey Threshold Integration

Election keys are managed with threshold cryptography:

```
Election Setup:
  └─── VeilKey.createCeremony(threshold=3, trustees=5)
         ├─── Share 1 → University Rep
         ├─── Share 2 → Government Official
         ├─── Share 3 → NGO Representative
         ├─── Share 4 → Opposition Party
         └─── Share 5 → Independent Auditor

Decryption (after election):
  └─── Any 3 trustees combine shares
         └─── Decryption key reconstructed
               └─── Votes tallied
                     └─── Key destroyed
```

VeilCloud integrates natively with VeilKey:

```typescript
// Team key derivation for election administrators
const adminKey = await veilcloud.keys.deriveTeamKey(
  electionId,
  await veilkey.getShare(currentUser)
);
```

### 5. Election-Specific Features

VeilCloud includes TVS-specific functionality:

**Nullifier Enforcement**: Each voter can only submit one vote per election. Nullifiers are stored in a bloom filter for O(1) duplicate detection.

```typescript
// Automatic duplicate rejection
await veilcloud.storage.put(electionId, nullifier, vote);
// Second submission with same nullifier: rejected
```

**Merkle Root Retrieval**: Election close requires the final Merkle root for anchoring.

```typescript
const { merkleRoot, voteCount } = await veilcloud.elections.finalize(electionId);
await bitcoin.anchor(merkleRoot);
```

**Batch Decryption Support**: For tallying, votes are retrieved in batches with parallel decryption.

```typescript
const voteBatches = await veilcloud.elections.getVotes(electionId, { batchSize: 10000 });
for (const batch of voteBatches) {
  const decrypted = await veilkey.batchDecrypt(batch, threshold);
  tally.add(decrypted);
}
```

## Results

With VeilCloud integration, TVS achieves:

| Metric | Before | After |
|--------|--------|-------|
| 100K election time | 83 minutes | < 5 minutes (target) |
| Max election size | ~100K | 350M+ |
| Provider key access | Possible | Impossible |
| Audit trail tamperability | Possible | Cryptographically impossible |
| Key compromise impact | All votes | None (threshold) |

## Lessons Learned

### 1. Build for Your Use Case

General-purpose cloud storage can't satisfy specialized privacy requirements. Building VeilCloud let us optimize for exactly what TVS needed.

### 2. Integration > Features

VeilCloud has fewer features than S3. But it integrates perfectly with VeilKey, VeilChain, VeilSign, and VeilProof. For TVS, that integration is worth more than features.

### 3. Verification is Essential

Every VeilCloud guarantee is verifiable. For elections, "trust us" isn't acceptable. "Verify us" is.

## Open Source

Both TVS and VeilCloud are open source:

- TVS: [github.com/jasonsutter87/Trustless-Voting-System-tvs-](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-)
- VeilCloud: [github.com/jasonsutter87/VeilCloud](https://github.com/jasonsutter87/VeilCloud)

We built VeilCloud for elections. But its zero-knowledge architecture applies to any application requiring true privacy at scale.

---

*"Democracy is too important to trust. It must be verified."*
