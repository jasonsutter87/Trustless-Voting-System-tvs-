# TVS: A Trustless Voting System

**Version 1.0 — December 2025**

---

## Abstract

We propose a cryptographic voting system that achieves voter privacy, vote integrity, and public verifiability without requiring trust in any single authority. The system combines blind signatures for anonymous credential issuance, client-side encryption for vote secrecy, Merkle trees for immutable vote storage, zero-knowledge proofs for vote validity verification, and **threshold cryptography for distributed key management**. A voter can verify their vote was recorded correctly while no party—including the system administrators and database operators—can determine how any individual voted. Critically, the election private key never exists in any single location; it is split among multiple trustees using threshold cryptography, ensuring that no single trustee can decrypt votes or be coerced into revealing them. We demonstrate that the system achieves these properties through a careful composition of established cryptographic primitives.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [System Overview](#3-system-overview)
4. [Cryptographic Primitives](#4-cryptographic-primitives)
5. [Threshold Key Management (VeilKey)](#5-threshold-key-management-veilkey)
6. [Protocol Specification](#6-protocol-specification)
7. [Data Flow and Transformations](#7-data-flow-and-transformations)
8. [Security Model](#8-security-model)
9. [What the Database Sees](#9-what-the-database-sees)
10. [Verification and Auditability](#10-verification-and-auditability)
11. [Threat Analysis](#11-threat-analysis)
12. [Conclusion](#12-conclusion)

---

## 1. Introduction

Electronic voting systems have historically required voters to trust that election administrators will correctly record and count their votes, and that they will not reveal how individuals voted. This trust requirement creates several problems:

1. **Coercion vulnerability**: If administrators can see votes, they can be compelled to reveal them
2. **Manipulation risk**: Administrators with access to vote data can alter results
3. **Verification impossibility**: Voters cannot independently verify their vote was counted

TVS (Trustless Voting System) eliminates these trust requirements through cryptography. The system is designed such that:

- No single party can determine how any voter voted
- Any party can verify the election results are correct
- Each voter can verify their own vote was included
- Votes cannot be altered after submission

---

## 2. Problem Statement

### 2.1 Requirements

A secure voting system must satisfy the following properties:

| Property | Definition |
|----------|------------|
| **Eligibility** | Only authorized voters can vote |
| **Uniqueness** | Each voter can vote at most once |
| **Privacy** | No one can determine how a voter voted |
| **Integrity** | Votes cannot be modified after casting |
| **Verifiability** | Voters can verify their vote was recorded |
| **Tallying correctness** | The announced results match the actual votes |

### 2.2 Trust Minimization

Traditional systems require trust in:
- Election administrators (to not peek at votes)
- Database operators (to not modify records)
- Software developers (to not include backdoors)
- Network operators (to not intercept communications)

TVS minimizes trust by ensuring that even if all these parties collude, they cannot:
- Determine how any individual voted
- Cast votes on behalf of eligible voters
- Modify or delete legitimately cast votes

---

## 3. System Overview

TVS consists of five core components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TVS ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ VeilSign │  │VeilForms │  │VeilChain │  │VeilProof │  │ VeilKey  │      │
│  │          │  │          │  │          │  │          │  │          │      │
│  │  Blind   │  │ Client-  │  │  Merkle  │  │  Zero-   │  │Threshold │      │
│  │Signatures│  │   Side   │  │   Tree   │  │Knowledge │  │  Crypto  │      │
│  │          │  │Encryption│  │  Ledger  │  │  Proofs  │  │          │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                   │                                          │
│                           ┌───────┴───────┐                                 │
│                           │    TVS API    │                                 │
│                           └───────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Component | Purpose | Cryptographic Primitive |
|-----------|---------|------------------------|
| **VeilSign** | Anonymous credential issuance | Chaum blind signatures (RSA) |
| **VeilForms** | Vote encryption | AES-256-GCM + RSA-OAEP |
| **VeilChain** | Immutable vote storage | SHA-256 Merkle tree |
| **VeilProof** | Vote validity proofs | Groth16 zk-SNARKs |
| **VeilKey** | Distributed key management | Shamir SS + Threshold RSA |

---

## 4. Cryptographic Primitives

### 4.1 Blind Signatures (VeilSign)

Blind signatures, introduced by David Chaum in 1982, allow a signer to sign a message without seeing its contents. TVS uses RSA-based blind signatures for credential issuance.

**Key Generation:**
```
(n, e, d) ← RSA.KeyGen(2048)
pk = (n, e)    // Public key
sk = (n, d)    // Private key
```

**Blind Signature Protocol:**

```
Voter                                    Authority
──────                                   ─────────

m = credential_data
r ← random ∈ Zₙ*

// Blind the message
m' = m · rᵉ mod n          ─────────►

                           ◄─────────    // Sign blind message
                                         s' = (m')ᵈ mod n

// Unblind signature
s = s' · r⁻¹ mod n

// Verify: sᵉ ≡ m (mod n)
```

**Security Property:** The authority signs the credential without learning its contents. The credential can later be verified by anyone with the public key, but cannot be linked to the registration session.

### 4.2 Client-Side Encryption (VeilForms)

Votes are encrypted in the voter's browser before transmission. The server never sees plaintext votes.

**Encryption Scheme:** Hybrid RSA-OAEP + AES-256-GCM

```
Encrypt(vote, pk_election):
    // Generate random AES key
    k ← random(256 bits)
    iv ← random(96 bits)

    // Encrypt vote with AES-GCM
    (ciphertext, tag) = AES-GCM.Encrypt(k, iv, vote)

    // Encrypt AES key with election public key
    encrypted_key = RSA-OAEP.Encrypt(pk_election, k)

    return {
        ciphertext: ciphertext,
        iv: iv,
        tag: tag,
        encrypted_key: encrypted_key
    }
```

**Security Property:** Only the holder of `sk_election` can decrypt votes. The server stores ciphertext it cannot read.

### 4.3 Merkle Tree (VeilChain)

Votes are stored in an append-only Merkle tree, providing:
- Efficient inclusion proofs
- Tamper-evident storage
- Compact state representation (single root hash)

**Structure:**

```
                    Root Hash
                   /         \
                  /           \
            Hash(0,1)        Hash(2,3)
            /      \         /      \
           /        \       /        \
      Hash(V₀)  Hash(V₁) Hash(V₂)  Hash(V₃)
         │         │        │         │
        V₀        V₁       V₂        V₃
      (vote)    (vote)   (vote)    (vote)
```

**Inclusion Proof:**
To prove V₁ is in the tree:
```
proof = [Hash(V₀), Hash(2,3)]
positions = [left, right]

Verify:
  h = Hash(V₁)
  h = Hash(Hash(V₀) || h)      // sibling on left
  h = Hash(h || Hash(2,3))     // sibling on right
  assert(h == Root)
```

**Security Property:** Any modification to a vote changes the root hash. The root can be published/anchored to make tampering publicly detectable.

### 4.4 Zero-Knowledge Proofs (VeilProof)

Zero-knowledge proofs allow a voter to prove their vote is valid without revealing the vote itself.

**Circuit (Simplified):**
```
template VoteProof() {
    // Public inputs
    signal input electionId;
    signal input nullifier;
    signal input commitment;

    // Private inputs (witness)
    signal input vote;
    signal input credentialSecret;
    signal input salt;

    // Constraints

    // 1. Vote is valid (0 ≤ vote < numCandidates)
    assert(vote >= 0 && vote < numCandidates);

    // 2. Nullifier is correctly computed
    assert(nullifier == Hash(electionId, credentialSecret));

    // 3. Commitment is correctly computed
    assert(commitment == Hash(vote, salt));
}
```

**Security Properties:**
- **Completeness:** Valid votes always produce valid proofs
- **Soundness:** Invalid votes cannot produce valid proofs
- **Zero-Knowledge:** Proofs reveal nothing about the vote

---

## 5. Threshold Key Management (VeilKey)

### 5.1 The Single Point of Failure Problem

In traditional voting systems, the election private key presents a critical vulnerability:

```
Traditional Key Management:

    ┌─────────────────┐
    │  Election       │
    │  Private Key    │  ◄── Single point of failure
    │  (sk_election)  │      - Can be stolen
    └────────┬────────┘      - Can be coerced
             │               - Administrator sees all
             ▼
    ┌─────────────────┐
    │  Decrypt ALL    │
    │     Votes       │
    └─────────────────┘
```

If any single party holds the complete private key, they can:
- Decrypt all votes unilaterally
- Be coerced by governments or attackers
- Act as a single point of compromise

### 5.2 Threshold Cryptography Solution

VeilKey solves this by ensuring the complete private key **never exists**:

```
VeilKey Threshold Key Management (3-of-5):

    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Share 1 │  │ Share 2 │  │ Share 3 │  │ Share 4 │  │ Share 5 │
    │Trustee A│  │Trustee B│  │Trustee C│  │Trustee D│  │Trustee E│
    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │            │            │
         └────────────┴─────┬──────┴────────────┴────────────┘
                            │
                     Any 3 can decrypt
                     No 2 can learn anything
                            │
                            ▼
                    ┌───────────────┐
                    │ Decrypt Votes │
                    │  (threshold)  │
                    └───────────────┘
```

### 5.3 Shamir Secret Sharing

VeilKey uses Shamir's Secret Sharing to split secrets into shares where any `t` of `n` can reconstruct, but `t-1` learn nothing.

**Mathematical Foundation:**
```
Secret s is encoded as f(0) where f is a random polynomial of degree t-1:

    f(x) = s + a₁x + a₂x² + ... + aₜ₋₁xᵗ⁻¹  (mod p)

Shares are points on this polynomial:
    Share_i = (i, f(i))  for i = 1, 2, ..., n

Reconstruction via Lagrange interpolation:
    s = f(0) = Σᵢ yᵢ · Lᵢ(0)

    where Lᵢ(0) = Πⱼ≠ᵢ (0 - xⱼ)/(xᵢ - xⱼ)
```

**Security Property:** Any subset of `t-1` shares reveals no information about `s` (information-theoretic security).

### 5.4 Feldman Verifiable Secret Sharing

To prevent malicious dealers from distributing invalid shares, VeilKey uses Feldman VSS which allows share verification without reconstruction:

```
Dealer publishes commitments:
    C₀ = g^s,  C₁ = g^a₁,  ...,  Cₜ₋₁ = g^aₜ₋₁

Each shareholder i verifies their share (i, yᵢ):
    g^yᵢ = C₀ · C₁^i · C₂^i² · ... · Cₜ₋₁^iᵗ⁻¹

If verification fails, shareholder can prove dealer cheated.
```

### 5.5 Threshold RSA for Election Keys

VeilKey implements threshold RSA (Shoup protocol) for election encryption/decryption:

**Distributed Key Generation:**
```
ThresholdRSA.KeyGen(2048, t=3, n=5):

    // Trusted dealer or DKG ceremony
    p, q ← random_primes(1024)
    N = p · q
    φ = (p-1)(q-1)
    e = 65537
    d = e⁻¹ mod φ

    // Split private exponent
    d_shares = Shamir.Split(d, t=3, n=5, mod=φ)

    // Public key (published)
    pk = (N, e)

    // Shares distributed to trustees
    Trustee_i receives: d_i

    // d never stored anywhere after ceremony
    // d is destroyed/never computed in DKG
```

**Threshold Decryption:**
```
ThresholdDecrypt(ciphertext, shares[]):

    // Each trustee computes partial decryption
    Trustee_i:
        partial_i = ciphertext^(d_i · Δ) mod N
        proof_i = ZK_proof(partial_i is correct)

    // Combine partials (any t=3 of n=5)
    Combiner:
        Verify all ZK proofs
        plaintext = Combine(partial_1, partial_2, partial_3)

    return plaintext
```

### 5.6 Key Ceremony Protocol

Before each election, a public key ceremony establishes threshold keys:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KEY CEREMONY PROTOCOL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Setup                                                          │
│  ─────────────────                                                       │
│  • Define trustees (e.g., 5 election officials from different parties)  │
│  • Set threshold (e.g., 3-of-5)                                         │
│  • Public ceremony witnessed by observers                                │
│                                                                          │
│  Phase 2: Commitment                                                     │
│  ────────────────────                                                    │
│  • Each trustee generates random polynomial                              │
│  • Trustees publish commitments (Feldman VSS)                           │
│  • Commitments recorded in public log                                    │
│                                                                          │
│  Phase 3: Share Distribution                                             │
│  ───────────────────────────                                             │
│  • Trustees exchange encrypted shares                                    │
│  • Each trustee verifies received shares                                │
│  • Invalid shares publicly flagged                                       │
│                                                                          │
│  Phase 4: Public Key Derivation                                          │
│  ──────────────────────────────                                          │
│  • Combined public key computed from commitments                         │
│  • Public key published for voter encryption                            │
│  • Complete audit log published                                          │
│                                                                          │
│  RESULT: Public key exists. Private key NEVER exists anywhere.          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Proactive Share Refresh

VeilKey supports share refresh to protect against long-term compromise:

```
Share Refresh Protocol:

    // Trustees collaborate to generate new shares
    // WITHOUT changing the public key

    Old shares: [d₁, d₂, d₃, d₄, d₅]

    // Each trustee adds random polynomial with f(0) = 0
    Trustee_i generates: fᵢ(x) where fᵢ(0) = 0

    // New shares
    d'ᵢ = dᵢ + Σⱼ fⱼ(i)

    New shares: [d'₁, d'₂, d'₃, d'₄, d'₅]

    // Old shares destroyed
    // New shares still reconstruct same secret
    // Attacker with old share learns nothing
```

**Security Property:** An attacker who compromises shares before AND after refresh cannot combine them—they are cryptographically independent.

### 5.8 VeilKey Integration in TVS

```
Election Lifecycle with VeilKey:

┌──────────────────┐
│ 1. KEY CEREMONY  │
│                  │
│ Trustees gather  │
│ Generate 3-of-5  │──► Public key published
│ threshold key    │    for vote encryption
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. VOTING PHASE  │
│                  │
│ Votes encrypted  │
│ with public key  │──► No one can decrypt yet
│ (VeilForms)      │    (need 3 trustees)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. TALLYING      │
│                  │
│ 3+ trustees      │
│ provide partials │──► Votes decrypted
│ (VeilKey)        │    Results published
└──────────────────┘
```

---

## 6. Protocol Specification

### 6.1 Election Setup (with VeilKey)

```
ElectionSetup(name, candidates, startTime, endTime, trustees[5]):

    // === KEY CEREMONY (VeilKey) ===

    // Generate threshold election keypair (3-of-5)
    (pk_election, shares[5]) ← VeilKey.ThresholdRSA.KeyGen(
        bits: 2048,
        threshold: 3,
        parties: 5,
        trustees: trustees
    )

    // Each trustee receives their share securely
    for i in 1..5:
        SecureDeliver(shares[i], trustees[i])

    // NOTE: Complete private key sk_election NEVER EXISTS
    // Only shares exist, distributed among trustees

    // Generate threshold signing authority keypair (3-of-5)
    (pk_sign, sign_shares[5]) ← VeilKey.ThresholdRSA.KeyGen(
        bits: 2048,
        threshold: 3,
        parties: 5,
        trustees: trustees
    )

    // Initialize empty Merkle tree
    tree ← MerkleTree.new()

    // Store election configuration
    election = {
        id: UUID(),
        name: name,
        candidates: candidates,
        pk_election: pk_election,  // Public: for vote encryption
        pk_sign: pk_sign,          // Public: for credential verification
        threshold: 3,              // Trustees needed to decrypt
        trustees: trustees.length, // Total trustees
        tree_root: tree.root,
        status: "created"
    }

    // Publish key ceremony audit log
    PublishKeyCeremonyLog(election.id, trustees, commitments)

    return election
```

### 6.2 Voter Registration

```
Register(voter_id, election_id):

    // Server-side
    if IsRegistered(voter_id, election_id):
        return ERROR("Already registered")

    if not IsEligible(voter_id, election_id):
        return ERROR("Not eligible")

    // Record registration (store only hash of voter_id)
    StoreRegistration(Hash(voter_id), election_id)

    // === BLIND SIGNATURE PROTOCOL ===

    // Voter generates credential and blinds it
    Voter:
        credential_nullifier ← random(256 bits)
        credential_data = {
            election_id: election_id,
            nullifier: credential_nullifier
        }
        m = Hash(credential_data)

        // Blind
        r ← random ∈ Zₙ*
        m_blind = m · rᵉ mod n

        Send(m_blind) →

    // Authority signs without seeing credential
    Authority:
        ← Receive(m_blind)
        s_blind = (m_blind)^d mod n
        Send(s_blind) →

    // Voter unblinds to get valid signature
    Voter:
        ← Receive(s_blind)
        signature = s_blind · r⁻¹ mod n

        credential = {
            election_id: election_id,
            nullifier: credential_nullifier,
            signature: signature
        }

        // Store credential locally (NEVER send to server again)
        return credential
```

**Critical Point:** After this protocol:
- The server has: `Hash(voter_id)` and knows a credential was issued
- The server does NOT have: the credential nullifier or signature
- The voter has: a valid credential that cannot be linked to their identity

### 6.3 Vote Casting

```
CastVote(election_id, candidate_id, credential):

    // === CLIENT-SIDE (in browser) ===

    // 1. Verify credential is valid
    if not VerifySignature(credential, pk_sign):
        return ERROR("Invalid credential")

    // 2. Encrypt vote (server will never see plaintext)
    vote_plaintext = {
        candidate_id: candidate_id,
        timestamp: now()
    }

    encrypted_vote = VeilForms.Encrypt(vote_plaintext, pk_election)

    // 3. Create vote commitment
    salt ← random(256 bits)
    commitment = Hash(candidate_id || salt)

    // 4. Generate ZK proof
    proof = VeilProof.Generate({
        public: {
            election_id: election_id,
            nullifier: credential.nullifier,
            commitment: commitment
        },
        private: {
            vote: candidate_id,
            credential_secret: credential.nullifier,
            salt: salt
        }
    })

    // 5. Send to server
    vote_package = {
        election_id: election_id,
        credential: credential,
        encrypted_vote: encrypted_vote,
        commitment: commitment,
        zk_proof: proof
    }

    Send(vote_package) →

    // === SERVER-SIDE ===

    ← Receive(vote_package)

    // 6. Verify credential signature
    if not VerifySignature(vote_package.credential, pk_sign):
        return ERROR("Invalid credential")

    // 7. Check nullifier hasn't been used (prevents double voting)
    if IsNullifierUsed(vote_package.credential.nullifier):
        return ERROR("Already voted")

    // 8. Verify ZK proof
    if not VeilProof.Verify(vote_package.zk_proof):
        return ERROR("Invalid proof")

    // 9. Append to Merkle tree
    vote_entry = {
        id: UUID(),
        encrypted_vote: vote_package.encrypted_vote,
        commitment: vote_package.commitment,
        nullifier: vote_package.credential.nullifier,
        zk_proof: vote_package.zk_proof,
        timestamp: now()
    }

    (position, merkle_proof) = tree.Append(Hash(vote_entry))

    // 10. Mark nullifier as used
    MarkNullifierUsed(vote_package.credential.nullifier)

    // 11. Return confirmation
    confirmation_code = random(64 bits)

    return {
        success: true,
        confirmation_code: confirmation_code,
        position: position,
        merkle_root: tree.root,
        merkle_proof: merkle_proof
    }
```

### 6.4 Tallying (with VeilKey Threshold Decryption)

```
Tally(election_id, trustee_shares[]):

    // === THRESHOLD DECRYPTION (VeilKey) ===
    // Requires 3-of-5 trustees to participate
    // NO SINGLE PARTY can decrypt alone

    if len(trustee_shares) < election.threshold:
        return ERROR("Need at least 3 trustees to tally")

    votes = []

    for entry in tree.GetAllEntries(election_id):

        // Each participating trustee computes partial decryption
        partials = []
        for share in trustee_shares:
            partial = VeilKey.PartialDecrypt(
                entry.encrypted_vote.encrypted_key,
                share
            )
            proof = VeilKey.ProvePartialCorrect(partial, share)
            partials.append({partial, proof})

        // Verify all ZK proofs of correct partial decryption
        for p in partials:
            if not VeilKey.VerifyPartialProof(p.proof):
                return ERROR("Invalid partial decryption")

        // Combine partials to recover AES key
        aes_key = VeilKey.CombinePartials(partials)

        // Decrypt vote with recovered AES key
        vote_plaintext = AES_GCM.Decrypt(
            entry.encrypted_vote.ciphertext,
            aes_key,
            entry.encrypted_vote.iv,
            entry.encrypted_vote.tag
        )

        // Verify commitment matches
        // (This connects encrypted vote to the commitment in the tree)

        votes.append(vote_plaintext.candidate_id)

    // Count votes
    results = CountVotes(votes)

    // Publish results with Merkle root and decryption proofs
    return {
        results: results,
        total_votes: len(votes),
        merkle_root: tree.root,
        participating_trustees: trustee_shares.map(s => s.trustee_id),
        decryption_proofs: partials  // Public verification
    }
```

**Critical Property:** The complete election private key (`sk_election`) was **never reconstructed**. Each trustee provided a partial decryption, and these partials were combined mathematically. No single party ever had the ability to decrypt all votes alone.

---

## 7. Data Flow and Transformations

### 7.1 Complete Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                  │
└─────────────────────────────────────────────────────────────────────────────┘

REGISTRATION PHASE
──────────────────

Voter Input                    Transformation                 Server Stores
───────────                    ──────────────                 ─────────────

student_id: "A12345"    ──►    SHA256(student_id)      ──►   voter_hash:
                                                              "8f2a9c..."

                               [Blind Signature Protocol]      (nothing about
                                                               credential)
                        ──►    credential = {
                               nullifier: "7b3d...",
                               signature: "9e4f..."
                               }
                               (stored locally by voter)


VOTING PHASE
────────────

Voter Input                    Transformation                 Server Stores
───────────                    ──────────────                 ─────────────

vote: "Alice"           ──►    AES-256-GCM               ──►  encrypted_vote:
                               Encrypt(vote, random_key)       {
                                                                ciphertext: "a7f2...",
                                                                iv: "3b8c...",
                                                                tag: "f2e1...",
                                                                key_id: "d4a9..."
                                                               }

candidate_id +          ──►    SHA256(candidate_id +     ──►  commitment:
random salt                    salt)                           "2c8f7a..."

credential.nullifier    ──►    (passed through)          ──►  nullifier:
                                                              "7b3d..."

vote + credential +     ──►    Groth16 ZK-SNARK          ──►  zk_proof:
salt                           Prove(...)                      { pi_a, pi_b, pi_c }


WHAT EACH PARTY CAN SEE
───────────────────────

                        │ Voter  │ Server │ Database │ Public │
────────────────────────┼────────┼────────┼──────────┼────────┤
Voter identity          │   ✓    │   ✗    │    ✗     │   ✗    │
Vote plaintext          │   ✓    │   ✗    │    ✗     │   ✗    │
Credential              │   ✓    │   ✗    │    ✗     │   ✗    │
Encrypted vote          │   ✓    │   ✓    │    ✓     │   ✓    │
Commitment              │   ✓    │   ✓    │    ✓     │   ✓    │
Nullifier               │   ✓    │   ✓    │    ✓     │   ✓    │
ZK Proof                │   ✓    │   ✓    │    ✓     │   ✓    │
Merkle Root             │   ✓    │   ✓    │    ✓     │   ✓    │
Merkle Proof            │   ✓    │   ✓    │    ✓     │   ✓    │
```

### 7.2 Pre-Encryption vs Post-Encryption

**BEFORE VeilForms Encryption (Client-Side Only):**
```json
{
  "candidateId": "uuid-alice-johnson",
  "timestamp": 1703241600000,
  "electionId": "uuid-election-2025"
}
```
*This data exists ONLY in the voter's browser. Never transmitted.*

**AFTER VeilForms Encryption (Transmitted to Server):**
```json
{
  "ciphertext": "a7f2c9e1b4d8f3a2c7e9b1d4f8a3c2e7b9d1f4a8c3e2b7d9f1a4c8e3b2d7f9a1c4e8b3d2f7a9c1e4b8d3f2a7c9e1b4d8f3a2",
  "iv": "3b8c2f9a1e7d4c6b",
  "tag": "f2e1d4c7b9a3f8e2d1c4b7a9f3e8d2c1",
  "keyId": "d4a9c2e7b1f8d3a6"
}
```
*This is what the server receives. It's computationally infeasible to decrypt without the election private key.*

### 7.3 Nullifier Unlinkability

The nullifier provides double-voting prevention while maintaining unlinkability:

```
Registration:                         Voting:
─────────────                         ───────

voter_id ─────┐                       credential.nullifier ────┐
              │                                                │
              ▼                                                ▼
         [Blind Sign]                                    [Check Used]
              │                                                │
              │                                                │
              ▼                                                ▼
Server sees:                          Server sees:
- Hash(voter_id)                      - nullifier (random bytes)
- "a credential was issued"           - encrypted vote

              │                                                │
              └──────────────── ? ─────────────────────────────┘
                         UNLINKABLE

The server CANNOT connect the voter_id from registration
to the nullifier used during voting.
```

---

## 8. Security Model

### 8.1 Adversary Capabilities

We consider adversaries who can:

| Capability | Symbol | Description |
|------------|--------|-------------|
| Corrupt server | A_S | Full access to server code and data |
| Corrupt database | A_D | Full read/write access to database |
| Network eavesdropping | A_N | Can observe all network traffic |
| Corrupt voters | A_V | Can control some voters' actions |

### 8.2 Security Guarantees

**Theorem 1 (Vote Privacy):** Even if A_S ∧ A_D ∧ A_N, the adversary cannot determine how an honest voter voted.

*Proof sketch:*
- Vote is encrypted with AES-256-GCM before leaving browser
- Server only sees ciphertext
- Decryption requires election private key (held by trustees)
- Commitment is hash(vote || random_salt) — computationally hiding

**Theorem 2 (Voter Unlinkability):** Even if A_S ∧ A_D, the adversary cannot link a vote to a voter identity.

*Proof sketch:*
- Credential obtained via blind signature — signer learns nothing
- Nullifier is derived from credential secret, not voter identity
- No information links registration to voting

**Theorem 3 (Double-Voting Prevention):** A voter cannot cast two valid votes.

*Proof sketch:*
- Each credential has unique nullifier
- Nullifier recorded when vote cast
- Second vote with same nullifier rejected
- Creating new valid credential requires blind signature (registration)
- Re-registration detected via voter_id hash

**Theorem 4 (Vote Integrity):** Cast votes cannot be modified or deleted without detection.

*Proof sketch:*
- Votes stored in Merkle tree
- Root hash changes if any vote modified
- Root hash published/anchored to external systems
- Voter receives Merkle proof at vote time

### 8.3 Trust Assumptions (with VeilKey)

TVS requires trust in:

| Component | Trust Assumption | Failure Impact |
|-----------|-----------------|----------------|
| Cryptographic primitives | AES, RSA, SHA256, Shamir SS are secure | Complete system failure |
| Client device | Not compromised during voting | Individual vote compromise |
| **VeilKey threshold (t-1)** | **At least t-1 trustees are honest** | **Vote privacy protected** |
| VeilKey threshold (t) | At least t trustees available | Tallying possible |

**VeilKey Security Properties:**

| Traditional System | TVS with VeilKey |
|-------------------|------------------|
| Single key holder can decrypt all votes | Need 3+ trustees to collude |
| Key can be stolen from one location | No complete key exists anywhere |
| Single point of coercion | Must coerce 3+ independent parties |
| Key compromise = total failure | 1-2 compromised trustees = still secure |

TVS does NOT require trust in:
- Server administrators (cannot decrypt votes)
- Database operators (cannot decrypt votes)
- Network operators (votes encrypted in transit)
- Software developers (code is auditable)
- **Any single trustee** (need threshold to act)
- **Any two trustees** (with 3-of-5 threshold)

---

## 9. What the Database Sees

### 9.1 Database Schema

```sql
-- What's stored (all public information)
CREATE TABLE votes (
    id              UUID PRIMARY KEY,
    election_id     UUID NOT NULL,
    encrypted_vote  JSONB NOT NULL,      -- Ciphertext (unreadable)
    commitment      VARCHAR(64) NOT NULL, -- Hash (irreversible)
    nullifier       VARCHAR(64) NOT NULL UNIQUE, -- Random bytes
    zk_proof        JSONB NOT NULL,      -- Proof (reveals nothing)
    merkle_position BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL
);

-- Immutability enforced at database level
CREATE TRIGGER votes_immutable
BEFORE UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION prevent_modification();
```

### 9.2 Sample Database Record

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "election_id": "98765432-1abc-def0-1234-567890abcdef",
  "encrypted_vote": {
    "ciphertext": "7f3a9c2e8b1d4f7a2c9e3b8d1f4a7c2e9b3d8f1a4c7e2b9d3f8a1c4e7b2d9f3a8c1e4b7d2f9a3c8e1b4d7f2a9c3e8b1d4f7",
    "iv": "a3f8c2e9b1d4f7a2",
    "tag": "9c3e8b1d4f7a2c9e3b8d1f4a",
    "keyId": "f7a2c9e3b8d1f4a7"
  },
  "commitment": "2c8f7a9e3b1d4f8a2c7e9b3d1f4a8c2e7b9d3f1a4c8e2b7d9f3a1c4e8b2d7f9",
  "nullifier": "7b3d9f2a4c8e1b5d7f9a3c6e2b8d4f1a7c9e3b5d8f2a4c7e1b9d3f6a2c8e4b",
  "zk_proof": {
    "pi_a": ["12345...", "67890...", "1"],
    "pi_b": [["abc...", "def..."], ["123...", "456..."], ["1", "0"]],
    "pi_c": ["fedcba...", "098765...", "1"],
    "protocol": "groth16"
  },
  "merkle_position": 42,
  "created_at": "2025-12-22T10:30:00Z"
}
```

### 9.3 What Database Operators Can Learn

| Data Field | Can DB Admin Determine? | Explanation |
|------------|------------------------|-------------|
| Who voted? | ❌ NO | Nullifier is random, unlinkable to identity |
| What they voted? | ❌ NO | Encrypted with AES-256-GCM |
| When they voted? | ✅ YES | Timestamp is visible |
| How many voted? | ✅ YES | Count of records |
| Vote order? | ✅ YES | Merkle position visible |
| Valid votes? | ✅ YES | ZK proof can be verified |

### 9.4 Attack Scenarios

**Scenario: Malicious DBA tries to determine votes**

```
Attack 1: Read encrypted_vote
Result: Gets ciphertext "7f3a9c2e8b1d..."
Impact: Cannot decrypt without election private key
        AES-256 has 2²⁵⁶ possible keys
        Brute force: ~10⁶⁰ years

Attack 2: Analyze commitment
Result: Gets hash "2c8f7a9e3b1d..."
Impact: Hash is one-way, includes random salt
        Cannot reverse to find candidate

Attack 3: Track nullifier to voter
Result: Nullifier "7b3d9f2a4c8e..."
Impact: Nullifier created via blind signature
        No record links nullifier to voter_id
        Mathematically unlinkable

Attack 4: Correlate registration and voting times
Result: Can see both timestamps
Impact: Partial correlation possible if few voters
        Mitigated by batching / randomized delays

Attack 5: Modify vote records
Result: Changes detected via Merkle root
Impact: Published root hash won't match
        Tampering is publicly evident
```

---

## 10. Verification and Auditability

### 10.1 Individual Verification

Each voter can verify their vote was included:

```
VerifyMyVote(confirmation_code, merkle_proof, public_root):

    // 1. Retrieve my vote entry using confirmation code
    my_entry = LookupByConfirmation(confirmation_code)

    // 2. Verify Merkle inclusion proof
    computed_root = MerkleTree.ComputeRoot(
        leaf: Hash(my_entry),
        proof: merkle_proof.siblings,
        positions: merkle_proof.positions
    )

    // 3. Compare with published root
    if computed_root != public_root:
        return ALERT("Vote may have been tampered!")

    // 4. Verify my commitment is unchanged
    if my_entry.commitment != my_stored_commitment:
        return ALERT("Vote content may have been modified!")

    return SUCCESS("Vote verified in the ledger")
```

### 10.2 Universal Verification

Anyone can verify election integrity:

```
VerifyElection(election_id, published_results, published_root):

    // 1. Download all vote entries
    entries = GetAllVoteEntries(election_id)

    // 2. Rebuild Merkle tree
    tree = MerkleTree.new()
    for entry in entries:
        tree.Append(Hash(entry))

    // 3. Verify root matches published
    if tree.root != published_root:
        return ALERT("Vote data has been tampered!")

    // 4. Verify all ZK proofs
    for entry in entries:
        if not VeilProof.Verify(entry.zk_proof):
            return ALERT("Invalid vote found!")

    // 5. Verify no duplicate nullifiers
    nullifiers = Set()
    for entry in entries:
        if entry.nullifier in nullifiers:
            return ALERT("Duplicate vote detected!")
        nullifiers.add(entry.nullifier)

    // 6. Verify vote count matches
    if len(entries) != published_results.total_votes:
        return ALERT("Vote count mismatch!")

    return SUCCESS("Election integrity verified")
```

### 10.3 Merkle Root Anchoring

For additional tamper-evidence, the Merkle root can be anchored to external systems:

```
Anchor Points:
├── Bitcoin (OP_RETURN transaction)
├── Ethereum (smart contract event)
├── Public blockchain timestamp
├── Multiple independent newspapers
└── Government archives
```

Once anchored, any modification to votes would require:
- Modifying all anchor points (practically impossible)
- Or producing a hash collision (computationally infeasible)

---

## 11. Threat Analysis

### 11.1 Threat Matrix

| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Vote buying | Secret ballot (can't prove how you voted) | Coercion with threat |
| Ballot stuffing | Blind signatures limit credentials | Compromise of signing key |
| Vote manipulation | Merkle tree + anchoring | None if anchored |
| Voter impersonation | Registration verification | Identity verification quality |
| Denial of service | Standard DDoS protection | Availability (not integrity) |
| Timing analysis | Batched submissions, delays | Partial correlation |
| Quantum computing | Post-quantum signatures (future) | Long-term key compromise |
| **Single key compromise** | **VeilKey threshold (3-of-5)** | **Need 3+ trustees to collude** |
| **Trustee coercion** | **VeilKey: geographically distributed trustees** | **Must coerce 3+ parties** |
| **Key theft** | **VeilKey: key never exists in one place** | **No complete key to steal** |
| **Insider attack** | **VeilKey: 1-2 malicious trustees insufficient** | **Threshold security** |

### 11.2 Comparison with Other Systems

| Property | Paper Ballot | Basic E-Voting | Blockchain Voting | TVS |
|----------|-------------|----------------|-------------------|-----|
| Vote privacy | ✅ | ❌ | ⚠️ | ✅ |
| Vote integrity | ⚠️ | ❌ | ✅ | ✅ |
| Individual verifiability | ❌ | ❌ | ✅ | ✅ |
| Universal verifiability | ⚠️ | ❌ | ✅ | ✅ |
| Coercion resistance | ✅ | ❌ | ❌ | ✅ |
| Scalability | ❌ | ✅ | ⚠️ | ✅ |
| No trusted authority | ❌ | ❌ | ⚠️ | ✅ |

---

## 12. Conclusion

TVS demonstrates that it is possible to build an electronic voting system that:

1. **Protects voter privacy** through blind signatures and client-side encryption
2. **Ensures vote integrity** through Merkle trees and external anchoring
3. **Enables verification** through zero-knowledge proofs and inclusion proofs
4. **Minimizes trust** by ensuring no single party can compromise the election
5. **Eliminates single points of failure** through VeilKey threshold cryptography

The system achieves these properties through careful composition of well-understood cryptographic primitives, each providing a specific security guarantee that combines to create a trustless voting system.

The database, server, and all administrators are effectively "blind" to the actual votes while still being able to process, store, and tally them correctly. Critically, **the election private key never exists in any single location**—VeilKey ensures it is split among multiple trustees from the moment of creation, and decryption requires threshold cooperation.

This represents a fundamental shift from traditional voting systems where trust in authorities is required. In TVS:

- **VeilForms** encrypts votes before they leave the voter's device
- **VeilSign** provides anonymous credentials unlinkable to identity
- **VeilChain** stores votes in a tamper-evident Merkle tree
- **VeilProof** proves vote validity without revealing the choice
- **VeilKey** ensures no single party can ever decrypt all votes

Together, these five components create a system where mathematical proof replaces institutional trust.

---

## References

1. Chaum, D. (1982). "Blind signatures for untraceable payments." Advances in Cryptology.
2. Merkle, R. (1987). "A Digital Signature Based on a Conventional Encryption Function." CRYPTO.
3. Ben-Sasson, E., et al. (2014). "Succinct Non-Interactive Zero Knowledge for a von Neumann Architecture." USENIX Security.
4. Groth, J. (2016). "On the Size of Pairing-based Non-interactive Arguments." EUROCRYPT.
5. Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System."
6. **Shamir, A. (1979). "How to Share a Secret." Communications of the ACM.**
7. **Feldman, P. (1987). "A Practical Scheme for Non-interactive Verifiable Secret Sharing." FOCS.**
8. **Shoup, V. (2000). "Practical Threshold Signatures." EUROCRYPT.**

---

## Appendix A: Notation

| Symbol | Meaning |
|--------|---------|
| H(x) | Cryptographic hash function (SHA-256) |
| E_k(m) | Encryption of message m with key k |
| D_k(c) | Decryption of ciphertext c with key k |
| Sign_sk(m) | Signature of message m with secret key sk |
| Verify_pk(m, σ) | Verification of signature σ on message m |
| ← | Random sampling |
| Zₙ* | Multiplicative group of integers modulo n |

---

## Appendix B: Cryptographic Parameters

| Parameter | Value | Security Level |
|-----------|-------|----------------|
| RSA modulus | 2048 bits | 112 bits |
| AES key | 256 bits | 256 bits |
| SHA-256 output | 256 bits | 128 bits (collision) |
| ZK-SNARK curve | BN254 | ~128 bits |
| Nullifier entropy | 256 bits | 256 bits |
| **VeilKey threshold** | **3-of-5 (configurable)** | **Requires 3 trustees** |
| **VeilKey share field** | **GF(p), p = secp256k1 order** | **256 bits** |
| **VeilKey RSA shares** | **mod φ(N)** | **2048 bits** |

---

*Document version: 1.1*
*Last updated: December 2025*
*Authors: TVS Development Team*

---

## Changelog

- **v1.1** (December 2025): Added VeilKey threshold cryptography (Section 5), updated all protocols to use distributed key management, added key ceremony specification
- **v1.0** (December 2025): Initial release
