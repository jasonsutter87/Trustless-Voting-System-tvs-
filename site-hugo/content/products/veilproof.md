---
title: "VeilProof"
description: "Zero-knowledge proofs - prove vote validity without revealing the vote"
weight: 5
---

## The Problem

How do you ensure only valid votes are counted without revealing what those votes are? Traditional systems must either:

- **Inspect votes** to validate them (privacy violation)
- **Trust voters** submitted valid votes (integrity risk)

## The Solution

VeilProof uses zero-knowledge proofs (zk-SNARKs) to prove a vote is valid without revealing its contents.

### Key Features

| Feature | Description |
|---------|-------------|
| **Groth16 zk-SNARKs** | Succinct, non-interactive proofs |
| **Vote Validity Circuit** | Proves vote is for valid candidate |
| **Nullifier System** | Prevents double voting |
| **Commitment Scheme** | Hides vote while proving validity |
| **Browser-Based** | Proof generation in the browser |

### How It Works

The voter generates a proof that their vote satisfies these constraints:

```circom
template VoteProof() {
    // Public inputs
    signal input electionId;
    signal input nullifier;
    signal input commitment;

    // Private inputs (witness) - NOT revealed
    signal input vote;
    signal input credentialSecret;
    signal input salt;

    // Constraints

    // 1. Vote is valid (0 ≤ vote < numCandidates)
    assert(vote >= 0 && vote < numCandidates);

    // 2. Nullifier correctly computed
    assert(nullifier == Hash(electionId, credentialSecret));

    // 3. Commitment correctly computed
    assert(commitment == Hash(vote, salt));
}
```

### Security Properties

| Property | Meaning |
|----------|---------|
| **Completeness** | Valid votes always produce valid proofs |
| **Soundness** | Invalid votes cannot produce valid proofs |
| **Zero-Knowledge** | Proofs reveal nothing about the vote |

### Verification

Anyone can verify a proof is valid:

```javascript
const isValid = await VeilProof.verify(
  proof,
  publicInputs  // electionId, nullifier, commitment
);

// isValid = true means:
// - Vote is for a valid candidate
// - Nullifier is correctly computed
// - Commitment matches the vote
//
// But we learned NOTHING about what the vote actually is!
```

### Double-Vote Prevention

The nullifier is derived from the voter's credential secret:

```
nullifier = Hash(electionId, credentialSecret)
```

- Same voter + same election = same nullifier
- Second vote attempt → nullifier already used → rejected
- Nullifier reveals nothing about voter identity

## Links

- [GitHub Repository](https://github.com/jasonsutter87/VeilProof)
