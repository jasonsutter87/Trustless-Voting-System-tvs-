---
title: "Voting API"
description: "API reference for vote submission."
---

## Submit Vote

```http
POST /api/vote
Content-Type: application/json

{
  "electionId": "550e8400-e29b-41d4-a716-446655440000",
  "credential": {
    "electionId": "550e8400-...",
    "nullifier": "a1b2c3d4e5f6...",
    "message": "hash...",
    "signature": "sig..."
  },
  "encryptedVote": "base64_encrypted_vote...",
  "commitment": "vote_hash...",
  "zkProof": "proof_data..."
}
```

### Response

```json
{
  "success": true,
  "confirmationCode": "ABC123XYZ",
  "position": 42,
  "merkleRoot": "root_hash...",
  "merkleProof": {
    "leaf": "...",
    "proof": ["hash1", "hash2", "..."],
    "positions": ["left", "right", "..."],
    "root": "..."
  },
  "message": "Your vote has been recorded. Save your confirmation code to verify later."
}
```

---

## Get Voting Stats

```http
GET /api/vote/stats/:electionId
```

### Response

```json
{
  "electionId": "550e8400-...",
  "electionName": "Student Government 2025",
  "status": "voting",
  "voteCount": 234,
  "merkleRoot": "current_root...",
  "lastUpdated": 1703123456789
}
```

---

## Get Merkle Root

For public verification and anchoring.

```http
GET /api/vote/root/:electionId
```

### Response

```json
{
  "electionId": "550e8400-...",
  "root": "merkle_root_hash...",
  "voteCount": 234,
  "timestamp": 1703123456789
}
```

---

## Error Responses

### Invalid Credential

```json
{
  "error": "Invalid credential signature"
}
```

### Already Voted

```json
{
  "error": "Credential already used to vote"
}
```

### Voting Not Open

```json
{
  "error": "Voting not open. Current status: registration"
}
```

---

## Vote Encryption

Votes should be encrypted client-side before submission. The `encryptedVote` field should contain:

```javascript
// Example vote encryption
const vote = {
  candidateId: "candidate-uuid",
  timestamp: Date.now()
};

const encryptedVote = btoa(JSON.stringify(vote)); // Base64 encode
// In production: use AES-256-GCM with VeilForms
```

## ZK Proof

The `zkProof` field proves the vote is valid without revealing the choice. For the MVP, this can be a placeholder. In production, generate using VeilProof:

```javascript
import { generateVoteProof } from '@tvs/veilproof';

const proof = await generateVoteProof({
  electionId: BigInt('0x' + electionId),
  vote: candidateIndex,
  credentialSecret: BigInt('0x' + credential.nullifier),
  numCandidates: candidates.length
});
```
