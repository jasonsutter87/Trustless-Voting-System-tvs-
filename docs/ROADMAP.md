# TVS Development Roadmap

**Last Updated: December 2025**

> Building a trustless voting system through modular cryptographic components.

---

## Vision

TVS aims to become the gold standard for secure, verifiable, and private electronic voting. Our approach: build each cryptographic component as a standalone, auditable library, then integrate them into a complete voting system.

---

## The Veil Product Suite

| Product | Repository | Status | Description |
|---------|------------|--------|-------------|
| **VeilKey** | [github.com/jasonsutter87/VeilKey](https://github.com/jasonsutter87/VeilKey) | ✅ Complete | Threshold cryptography (Shamir, Feldman VSS, DKG) |
| **VeilSign** | [github.com/jasonsutter87/VeilSign](https://github.com/jasonsutter87/VeilSign) | 🔄 In Progress | Blind signatures for anonymous credentials |
| **VeilForms** | [github.com/jasonsutter87/veilforms](https://github.com/jasonsutter87/veilforms) | 🔄 In Progress | Client-side vote encryption |
| **VeilChain** | [github.com/jasonsutter87/veilchain](https://github.com/jasonsutter87/veilchain) | 🔄 In Progress | Merkle tree vote ledger |
| **VeilProof** | TBD | 📋 Planned | Zero-knowledge vote validity proofs |
| **TVS** | [github.com/jasonsutter87/Trustless-Voting-System-tvs-](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-) | 🔄 In Progress | Complete voting system integration |

---

## Development Phases

### Phase 1: Core Cryptography ✅

**Status: Complete**

Build the foundational threshold cryptography library.

- [x] Shamir Secret Sharing
- [x] Feldman Verifiable Secret Sharing
- [x] Ceremony Coordinator for key generation
- [x] Threshold share verification
- [x] Proactive share refresh
- [x] Comprehensive test suite

**Deliverable**: [@veilkey/core](https://github.com/jasonsutter87/VeilKey)

---

### Phase 2: TVS API Integration ✅

**Status: Complete**

Integrate VeilKey into TVS for threshold key ceremonies.

- [x] Add VeilKey dependency to TVS API
- [x] Trustee registration routes
- [x] Feldman commitment submission
- [x] Key ceremony finalization
- [x] Election creation with threshold config
- [x] 30, 300, 3000 voter E2E tests passing

**Deliverables**:
- Trustee management API (`/api/elections/:id/trustees`)
- Key ceremony workflow
- Threshold decryption routes

---

### Phase 3: Blind Signatures 🔄

**Status: In Progress**

Implement anonymous credential issuance via VeilSign.

- [ ] RSA blind signature scheme
- [ ] Threshold signing integration (with VeilKey)
- [ ] Credential issuance protocol
- [ ] Batch signature verification
- [ ] Integration with TVS registration flow

**Deliverable**: [@veilsign/core](https://github.com/jasonsutter87/VeilSign)

---

### Phase 4: Client-Side Encryption 🔄

**Status: In Progress**

Ensure votes are encrypted in the browser, never seen by server.

- [ ] AES-256-GCM vote encryption
- [ ] Hybrid encryption with election public key
- [ ] WebCrypto API integration
- [ ] React/Vue component library
- [ ] Form replacement drop-in

**Deliverable**: [@veilforms/core](https://github.com/jasonsutter87/veilforms)

---

### Phase 5: Immutable Vote Ledger 🔄

**Status: In Progress**

Build tamper-evident vote storage.

- [ ] SHA-256 Merkle tree implementation
- [ ] Append-only ledger
- [ ] Inclusion proof generation
- [ ] Root hash anchoring (Bitcoin, Ethereum)
- [ ] Merkle Mountain Range for scale

**Deliverable**: [@veilchain/core](https://github.com/jasonsutter87/veilchain)

---

### Phase 6: Zero-Knowledge Proofs 📋

**Status: Planned**

Prove vote validity without revealing the vote.

- [ ] Vote validity circuit (Circom)
- [ ] Groth16 proof generation
- [ ] Nullifier computation
- [ ] Commitment verification
- [ ] Browser-based proof generation

**Deliverable**: @veilproof/core

---

### Phase 7: Production Scaling 📋

**Status: Planned**

Scale to handle 350+ million votes.

**Target Specifications:**
| Metric | Target |
|--------|--------|
| Voters | 350,000,000 |
| Throughput | 100,000 votes/sec |
| Voting Window | 12-24 hours |
| Availability | 99.99% |

**Architecture Changes:**
- [ ] PostgreSQL Citus (sharded database)
- [ ] Kafka message queue
- [ ] Redis caching layer
- [ ] Kubernetes horizontal scaling
- [ ] Merkle Mountain Range optimization
- [ ] Load testing at 10K, 50K, 100K votes/sec

**Reference**: [architecture-350m-scale.md](./architecture-350m-scale.md)

---

### Phase 8: Security Audit 📋

**Status: Planned**

External cryptographic audit and hardening.

- [ ] Third-party code audit
- [ ] Formal verification of critical paths
- [ ] Penetration testing
- [ ] Bug bounty program
- [ ] Security documentation

---

### Phase 9: Pilot Deployment 📋

**Status: Planned**

Real-world testing with small elections.

- [ ] University student government elections
- [ ] Club/organization voting
- [ ] Corporate board elections
- [ ] Performance monitoring
- [ ] User feedback integration

---

## Current Performance

| Test | Voters | Throughput | Status |
|------|--------|------------|--------|
| Unit Tests | - | - | ✅ Passing |
| 30 Voter E2E | 30 | ~300 votes/sec | ✅ Passing |
| 300 Voter E2E | 300 | ~2,000 votes/sec | ✅ Passing |
| 3,000 Voter E2E | 3,000 | ~800 votes/sec | ✅ Passing |
| 350M Voter | 350,000,000 | 100,000 votes/sec | 📋 Planned |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TVS ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         VOTER BROWSER                                 │   │
│  │                                                                       │   │
│  │   VeilForms ──► Encrypt vote with election public key                │   │
│  │   VeilProof ──► Generate ZK proof of vote validity                   │   │
│  │                                                                       │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          TVS API                                      │   │
│  │                                                                       │   │
│  │   VeilSign ──► Issue anonymous credentials (blind signatures)        │   │
│  │   VeilChain ─► Store encrypted votes in Merkle tree                  │   │
│  │   VeilKey ───► Manage threshold key ceremonies                       │   │
│  │                                                                       │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TRUSTEES (5)                                  │   │
│  │                                                                       │   │
│  │   VeilKey ──► Hold key shares, provide partial decryptions           │   │
│  │               No single trustee can decrypt                          │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Properties

| Property | How Achieved |
|----------|--------------|
| **Vote Privacy** | VeilForms encrypts in browser; server never sees plaintext |
| **Voter Anonymity** | VeilSign blind signatures unlink identity from vote |
| **Vote Integrity** | VeilChain Merkle tree makes tampering detectable |
| **No Single Point of Failure** | VeilKey threshold (3-of-5) splits key among trustees |
| **Vote Validity** | VeilProof ZK proofs ensure only valid votes counted |
| **Coercion Resistance** | Secret ballot; voter can't prove how they voted |

---

## Contributing

Each Veil product is independently developed and tested:

1. **VeilKey**: Threshold cryptography primitives
2. **VeilSign**: Blind signature protocols
3. **VeilForms**: Browser encryption library
4. **VeilChain**: Merkle tree implementation
5. **VeilProof**: Zero-knowledge circuits

Contributions welcome at each repository. See individual repos for contribution guidelines.

---

## Contact

- **GitHub**: [github.com/jasonsutter87](https://github.com/jasonsutter87)
- **TVS Main Repo**: [Trustless-Voting-System-tvs-](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-)

---

*Building trust through mathematics, not institutions.*
