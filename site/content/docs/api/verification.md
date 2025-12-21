---
title: "Verification API"
description: "API reference for vote verification."
---

## Verify Vote by Nullifier

Check if a vote exists using the credential nullifier.

```http
GET /api/verify/:electionId/:nullifier
```

### Response (Vote Found)

```json
{
  "exists": true,
  "position": 42,
  "commitment": "vote_commitment_hash...",
  "timestamp": 1703123456789,
  "merkleProof": {
    "leaf": "...",
    "proof": ["hash1", "hash2"],
    "positions": ["left", "right"],
    "root": "..."
  },
  "message": "Your vote exists in the ledger"
}
```

### Response (Not Found)

```json
{
  "exists": false,
  "message": "Vote not found with this credential"
}
```

---

## Verify Merkle Proof

Independently verify a Merkle proof.

```http
POST /api/verify/proof
Content-Type: application/json

{
  "proof": {
    "leaf": "vote_hash...",
    "proof": ["sibling1", "sibling2"],
    "positions": ["left", "right"],
    "root": "expected_root..."
  }
}
```

### Response

```json
{
  "valid": true,
  "message": "Proof is valid - vote is included in the ledger"
}
```

---

## Get Integrity Summary

Overview of election integrity status.

```http
GET /api/verify/integrity/:electionId
```

### Response

```json
{
  "election": {
    "id": "550e8400-...",
    "name": "Student Government 2025",
    "status": "voting",
    "startTime": "2025-03-01T09:00:00Z",
    "endTime": "2025-03-03T17:00:00Z",
    "candidateCount": 5
  },
  "integrity": {
    "voteCount": 234,
    "merkleRoot": "current_root_hash...",
    "lastUpdate": 1703123456789
  },
  "verification": {
    "message": "Compare this Merkle root with published anchors",
    "instructions": [
      "1. Save the Merkle root displayed above",
      "2. Check published anchors (Bitcoin, Ethereum, etc.)",
      "3. Roots should match for integrity verification"
    ]
  }
}
```

---

## Export Ledger

Export full vote ledger for external auditing. Only available after voting ends.

```http
GET /api/verify/export/:electionId
```

### Response

```json
{
  "electionId": "550e8400-...",
  "electionName": "Student Government 2025",
  "merkleRoot": "final_root...",
  "voteCount": 567,
  "votes": [
    {
      "position": 0,
      "commitment": "...",
      "nullifier": "...",
      "timestamp": 1703100000000
    },
    {
      "position": 1,
      "commitment": "...",
      "nullifier": "...",
      "timestamp": 1703100001000
    }
  ]
}
```

---

## Client-Side Verification

Voters can verify proofs locally without trusting the API:

```javascript
import { VoteLedger } from '@tvs/veilchain';

// Verify your proof locally
const isValid = VoteLedger.verify(myMerkleProof);

if (isValid) {
  console.log('Your vote is definitely in the ledger!');
} else {
  console.log('Something is wrong - contact election officials');
}
```
