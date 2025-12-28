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
| **VeilSign** | [github.com/jasonsutter87/VeilSign](https://github.com/jasonsutter87/VeilSign) | ✅ Complete | Blind signatures for anonymous credentials |
| **VeilForms** | [github.com/jasonsutter87/veilforms](https://github.com/jasonsutter87/veilforms) | ✅ Complete | Client-side vote encryption |
| **VeilChain** | [github.com/jasonsutter87/veilchain](https://github.com/jasonsutter87/veilchain) | ✅ Complete | Merkle tree vote ledger |
| **VeilProof** | [github.com/jasonsutter87/VeilProof](https://github.com/jasonsutter87/VeilProof) | ✅ Complete | Zero-knowledge vote validity proofs |
| **VeilCloud** | [github.com/jasonsutter87/VeilCloud](https://github.com/jasonsutter87/VeilCloud) | 🔄 In Progress | Zero-knowledge cloud infrastructure |
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

### Phase 3: Blind Signatures ✅

**Status: Complete**

Implement anonymous credential issuance via VeilSign.

- [x] RSA blind signature scheme
- [x] Threshold signing integration (with VeilKey)
- [x] Credential issuance protocol
- [x] Batch signature verification
- [x] Integration with TVS registration flow

**Deliverable**: [@veilsign/core](https://github.com/jasonsutter87/VeilSign)

---

### Phase 4: Client-Side Encryption ✅

**Status: Complete**

Ensure votes are encrypted in the browser, never seen by server.

- [x] AES-256-GCM vote encryption
- [x] Hybrid encryption with election public key
- [x] WebCrypto API integration
- [x] React/Vue component library
- [x] Form replacement drop-in

**Deliverable**: [@veilforms/core](https://github.com/jasonsutter87/veilforms) | [veilforms.com](https://veilforms.com)

---

### Phase 5: Immutable Vote Ledger ✅

**Status: Complete**

Build tamper-evident vote storage.

- [x] SHA-256 Merkle tree implementation
- [x] Append-only ledger
- [x] Inclusion proof generation
- [x] Root hash anchoring (Bitcoin, Ethereum)
- [x] Merkle Mountain Range for scale
- [x] **FastMerkleTree O(log n) appends** - Eliminated O(n) rebuild bottleneck
- [x] **O(1) nullifier lookup** - Set-based duplicate detection at scale
- [x] **Memory optimization** - Threshold-based entry storage for 1M+ votes

**Deliverable**: [@veilchain/core](https://github.com/jasonsutter87/veilchain) | [veilchain.io](https://veilchain.io)

---

### Phase 6: Zero-Knowledge Proofs ✅

**Status: Complete**

Prove vote validity without revealing the vote.

- [x] Vote validity circuit (Circom)
- [x] Groth16 proof generation
- [x] Nullifier computation
- [x] Commitment verification
- [x] Browser-based proof generation

**Deliverable**: [@veilproof/core](https://github.com/jasonsutter87/VeilProof)

---

### Phase 7: Production Scaling via VeilCloud 🔄

**Status: In Progress**

Scale to handle 350+ million votes by integrating with **VeilCloud** as the infrastructure layer.

**Scaling Achievements (December 2025):**
- ✅ **1M voters → 3m 33s** (~4,682 votes/sec) with 100% success rate
- ✅ **FastMerkleTree O(log n)** - Eliminated O(n) rebuild bottleneck
- ✅ **O(1) nullifier lookup** - Set-based duplicate detection
- ✅ **8GB heap configuration** - Prevents GC pauses at scale

**The Remaining Challenge:**
- Single-node memory limit (~1-2M votes per instance)
- Need horizontal sharding for 350M+ scale

**The Solution: VeilCloud Integration**

Instead of building custom scaling infrastructure, TVS becomes a **VeilCloud consumer app**, inheriting horizontal scaling automatically:

```
┌─────────────────────────────────────────────────────────────┐
│                    TVS (Consumer App)                        │
│         Admin Dashboard  ←→  Voter App  ←→  Auditor         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      VEILCLOUD CORE                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ ZK Storage│  │ Auth &    │  │ Billing & │               │
│  │ (Sharded) │  │ Identity  │  │ Quotas    │               │
│  └───────────┘  └───────────┘  └───────────┘               │
│         Unified VeilSuite API (VeilKey, VeilSign,           │
│                 VeilProof, VeilChain)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  Kubernetes │ Kafka Queues │ Redis Cache │ PostgreSQL Citus │
│  CDN        │ Regional     │ Connection  │ S3 Blob Storage  │
│             │ Replicas     │ Pooling     │                  │
└─────────────────────────────────────────────────────────────┘
```

**Target Specifications:**
| Metric | Target |
|--------|--------|
| Voters | 350,000,000 |
| Throughput | 100,000 votes/sec |
| Voting Window | 12-24 hours |
| Availability | 99.99% |

**VeilCloud Provides:**
- [ ] Horizontal scaling via Kubernetes (Helm charts)
- [ ] Kafka-based async vote ingestion
- [ ] Redis caching for nullifier bloom filters
- [ ] Sharded PostgreSQL (Citus) for vote storage
- [ ] CDN distribution for encrypted vote blobs
- [ ] Regional replicas for geographic distribution
- [ ] Unified VeilSuite API (`/v1/veilkey/`, `/v1/veilsign/`, etc.)

**TVS Integration Work:**
- [ ] Migrate from direct VeilSuite imports to VeilCloud API
- [ ] Implement `@veilcloud/client` SDK integration
- [ ] Batch vote submissions (1000 votes per API call)
- [ ] Update Merkle tree to use VeilCloud's MMR service
- [ ] Add VeilCloud auth tokens to admin/voter apps

**VeilCloud Repository:** [github.com/jasonsutter87/VeilCloud](https://github.com/jasonsutter87/VeilCloud)

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

| Test | Voters | Throughput | Duration | Status |
|------|--------|------------|----------|--------|
| Unit Tests | - | - | - | ✅ Passing |
| 30 Voter E2E | 30 | ~300 votes/sec | <1s | ✅ Passing |
| 300 Voter E2E | 300 | ~2,000 votes/sec | <1s | ✅ Passing |
| 3,000 Voter E2E | 3,000 | ~800 votes/sec | ~4s | ✅ Passing |
| 10K Stress Test | 10,000 | ~5,000 votes/sec | ~2s | ✅ Passing |
| 100K Fast Merkle | 100,000 | ~6,000 votes/sec | ~17s | ✅ Passing |
| 250K VeilCloud | 252,000 | ~27 votes/sec* | ~3hrs | ✅ Passing |
| **500K O(1) Nullifier** | **500,000** | **~5,903 votes/sec** | **1m 24s** | ✅ **100% Success** |
| **1M 8GB Heap** | **1,000,000** | **~4,682 votes/sec** | **3m 33s** | ✅ **100% Success** |
| 350M Distributed | 350,000,000 | 100,000 votes/sec | ~1hr | 📋 Planned |

*250K test included VeilCloud persistence I/O overhead

**Key Optimizations:**
- FastMerkleTree: O(log n) appends instead of O(n) rebuild
- O(1) Nullifier: Set-based lookup instead of O(n) linear scan
- 8GB Heap: `NODE_OPTIONS="--max-old-space-size=8192"` prevents GC pauses

---

## Architecture Overview

### Current Architecture (MVP)

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

### Production Architecture (Phase 7 - VeilCloud Integration)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TVS + VEILCLOUD ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         VOTER BROWSER                                   │ │
│  │   VeilForms ──► Encrypt vote    VeilProof ──► Generate ZK proof       │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    TVS CONSUMER APPS (on VeilCloud)                     │ │
│  │           Admin Dashboard  │  Voter Portal  │  Auditor Tools           │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                        │
│  ═══════════════════════════════════╪═══════════════════════════════════════│
│                                     │                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         VEILCLOUD CORE                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  ZK Storage │  │    Auth     │  │   Billing   │  │   Unified   │   │ │
│  │  │  (Sharded)  │  │  Identity   │  │   Quotas    │  │  VeilSuite  │   │ │
│  │  │  Encrypted  │  │  WebAuthn   │  │  Rate Limit │  │     API     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     VEILSUITE PRIMITIVES                                │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │   │ VeilKey  │  │ VeilSign │  │VeilProof │  │VeilChain │              │ │
│  │   │Threshold │  │  Blind   │  │    ZK    │  │Immutable │              │ │
│  │   │  Crypto  │  │Signatures│  │  Proofs  │  │  Ledger  │              │ │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘              │ │
│  └──────────────────────────────────┬─────────────────────────────────────┘ │
│                                     │                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    INFRASTRUCTURE LAYER                                 │ │
│  │   Kubernetes  │  Kafka   │  Redis   │  PostgreSQL  │  S3/MinIO        │ │
│  │   (50+ pods)  │ (queues) │ (cache)  │   (Citus)    │  (blobs)         │ │
│  │               │          │          │  (sharded)   │                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         TRUSTEES (5-9)                                  │ │
│  │       HSM-backed key shares, geographically distributed                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
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
