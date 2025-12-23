# TVS Production Architecture: 350 Million Votes

## Target Specifications

| Metric | Target |
|--------|--------|
| Total Voters | 350,000,000 |
| Peak Throughput | 100,000 votes/sec |
| Voting Window | 12-24 hours |
| Availability | 99.99% |
| Data Durability | 99.999999999% (11 nines) |

---

## High-Level Architecture

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                      CDN (CloudFlare)                       │
                                    │              Static assets, DDoS protection                 │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                   Load Balancer (HAProxy)                   │
                                    │            Geographic routing, health checks                │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                        ┌─────────────────────────────────────┼─────────────────────────────────────┐
                        │                                     │                                     │
                        ▼                                     ▼                                     ▼
           ┌────────────────────────┐          ┌────────────────────────┐          ┌────────────────────────┐
           │      API Cluster       │          │      API Cluster       │          │      API Cluster       │
           │    Region: US-East     │          │    Region: US-West     │          │    Region: EU-West     │
           │     (20 instances)     │          │     (20 instances)     │          │     (10 instances)     │
           └────────────────────────┘          └────────────────────────┘          └────────────────────────┘
                        │                                     │                                     │
                        └─────────────────────────────────────┼─────────────────────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                  Message Queue (Kafka)                      │
                                    │         Vote ingestion, event sourcing, replay             │
                                    │                   (12 partitions)                           │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                        ┌─────────────────────────────────────┼─────────────────────────────────────┐
                        │                                     │                                     │
                        ▼                                     ▼                                     ▼
           ┌────────────────────────┐          ┌────────────────────────┐          ┌────────────────────────┐
           │    Vote Processors     │          │    Merkle Workers      │          │   Credential Issuers   │
           │    (24 instances)      │          │    (8 instances)       │          │    (12 instances)      │
           │  - Decrypt & validate  │          │  - Batch tree updates  │          │  - Threshold signing   │
           │  - ZK proof verify     │          │  - Root computation    │          │  - Rate limiting       │
           └────────────────────────┘          └────────────────────────┘          └────────────────────────┘
                        │                                     │                                     │
                        └─────────────────────────────────────┼─────────────────────────────────────┘
                                                              │
                                                              ▼
           ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
           │                                        Data Layer                                                │
           │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
           │  │  PostgreSQL Citus   │  │   Redis Cluster     │  │   S3 / MinIO        │  │  TimescaleDB    │ │
           │  │  (Sharded - 16     │  │   (Cache layer)     │  │   (Vote blobs)      │  │  (Metrics)      │ │
           │  │   shards)          │  │   (6 nodes)         │  │   (Immutable)       │  │                 │ │
           │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
           └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. API Gateway Layer

**Technology**: Node.js (Fastify) in Kubernetes pods

```typescript
// Horizontal scaling config
const API_CONFIG = {
  instancesPerRegion: 20,
  cpuPerInstance: 4,
  memoryPerInstance: '8Gi',
  maxConnectionsPerInstance: 10000,

  // Rate limiting per voter
  rateLimits: {
    registration: '1 per election',
    voting: '1 per election',
    statusCheck: '10 per minute',
  }
};
```

**Responsibilities**:
- Request validation (Zod schemas)
- Authentication/authorization
- Rate limiting (Redis-backed)
- Request routing to Kafka

### 2. Message Queue (Kafka)

**Why Kafka**:
- Handles 100K+ messages/sec per partition
- Durable - votes never lost
- Replay capability for audits
- Natural event sourcing

```yaml
# Kafka topic configuration
topics:
  votes.pending:
    partitions: 12
    replication: 3
    retention: 7 days

  votes.validated:
    partitions: 12
    replication: 3
    retention: 30 days

  merkle.updates:
    partitions: 4
    replication: 3
```

**Partition Strategy**: Hash by `electionId` to keep election votes together

### 3. Vote Processor Workers

**Technology**: Node.js workers consuming from Kafka

```typescript
// Worker responsibilities
interface VoteProcessor {
  // 1. Decrypt vote envelope (AES-256-GCM)
  decryptVote(encryptedPayload: EncryptedVote): DecryptedVote;

  // 2. Verify ZK proof (credential validity)
  verifyZKProof(proof: ZKProof, publicSignals: string[]): boolean;

  // 3. Check nullifier (prevent double voting)
  checkNullifier(nullifier: string): Promise<boolean>;

  // 4. Record vote
  recordVote(vote: ValidatedVote): Promise<void>;
}

// Scaling
const PROCESSOR_CONFIG = {
  instances: 24,
  consumerGroup: 'vote-processors',
  batchSize: 100,  // Process 100 votes per batch
  commitInterval: 1000,  // Commit offsets every 1s
};
```

### 4. Database Architecture

#### PostgreSQL with Citus (Sharding)

```sql
-- Shard by election_id for vote locality
SELECT create_distributed_table('votes', 'election_id');
SELECT create_distributed_table('nullifiers', 'election_id');
SELECT create_distributed_table('credentials', 'election_id');

-- Reference tables (replicated to all shards)
SELECT create_reference_table('elections');
SELECT create_reference_table('candidates');
SELECT create_reference_table('trustees');
```

**Schema**:

```sql
-- Votes table (sharded)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL,
    encrypted_vote BYTEA NOT NULL,
    commitment CHAR(64) NOT NULL,
    nullifier_hash CHAR(64) NOT NULL,
    merkle_index BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_nullifier UNIQUE (election_id, nullifier_hash)
);

-- Indexes for performance
CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_votes_merkle ON votes(election_id, merkle_index);

-- Nullifiers (fast double-vote check)
CREATE TABLE nullifiers (
    election_id UUID NOT NULL,
    nullifier_hash CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (election_id, nullifier_hash)
);
```

**Shard Distribution**:
- 16 shards across 4 database nodes
- Each shard handles ~22M votes
- Read replicas for status queries

#### Redis Cluster

```typescript
// Redis usage
const REDIS_KEYS = {
  // Nullifier bloom filter (fast pre-check)
  nullifierBloom: (electionId: string) => `bloom:nullifier:${electionId}`,

  // Vote count cache
  voteCount: (electionId: string) => `count:votes:${electionId}`,

  // Rate limiting
  rateLimit: (voterId: string) => `rate:${voterId}`,

  // Merkle root cache
  merkleRoot: (electionId: string) => `merkle:root:${electionId}`,
};
```

### 5. Merkle Tree Architecture

**Challenge**: Updating a Merkle tree with 350M leaves

**Solution**: Batched incremental updates

```typescript
interface MerkleWorker {
  // Batch votes into groups of 1000
  batchSize: 1000;

  // Append-only Merkle Mountain Range for fast updates
  treeType: 'MMR';

  // Periodic root computation
  rootUpdateInterval: '5 seconds';
}

// Storage: Merkle nodes in PostgreSQL + S3 for blob storage
// Only store: root, recent batch hashes, audit proofs on demand
```

**Merkle Mountain Range (MMR)**:
- O(log n) updates instead of rebuilding
- Natural batching of votes
- Efficient proof generation

### 6. Threshold Key Management

```typescript
// Trustee distribution for 350M election
const CEREMONY_CONFIG = {
  threshold: 5,        // 5 of 9 required
  totalTrustees: 9,    // Geographic distribution

  trustees: [
    { region: 'US-East', organization: 'University A' },
    { region: 'US-West', organization: 'University B' },
    { region: 'EU-West', organization: 'Government Agency' },
    { region: 'EU-East', organization: 'NGO' },
    { region: 'APAC', organization: 'University C' },
    // ... 4 more
  ],

  // HSM-backed key storage for trustees
  keyStorage: 'HSM',  // Hardware Security Module
};
```

---

## Performance Targets by Component

| Component | Throughput | Latency (p99) |
|-----------|------------|---------------|
| Load Balancer | 200K req/s | < 1ms |
| API Gateway | 100K req/s | < 10ms |
| Kafka Ingestion | 150K msg/s | < 5ms |
| Vote Processor | 100K votes/s | < 50ms |
| PostgreSQL Write | 50K writes/s | < 20ms |
| Redis Check | 500K ops/s | < 1ms |
| Merkle Update | 100K leaves/s | < 100ms (batched) |

---

## Scaling Calculation

```
Target: 350,000,000 votes in 12 hours

Required throughput: 350M / (12 * 3600) = 8,102 votes/sec (sustained)

With 10x peak factor: 81,000 votes/sec (peak)

Safety margin (2x): 162,000 votes/sec (design target)

Actual capacity: 100,000 votes/sec = 3.6B votes/day
```

**Time to complete 350M votes at 100K/sec**:
```
350,000,000 / 100,000 = 3,500 seconds = 58.3 minutes
```

---

## Cost Estimate (AWS)

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| API (50x c6i.xlarge) | 4 vCPU, 8GB | $6,500 |
| Kafka (MSK 12 brokers) | kafka.m5.2xlarge | $8,000 |
| PostgreSQL (Citus 4 nodes) | db.r6g.2xlarge | $4,800 |
| Redis (6 node cluster) | cache.r6g.xlarge | $2,400 |
| S3 Storage | 10TB votes | $230 |
| Load Balancer (ALB) | 1M requests/hour | $500 |
| **Total** | | **~$22,500/month** |

For a one-time election event (1 week):
```
$22,500 / 4 = ~$5,600
```

---

## Security Measures

### 1. DDoS Protection
- CloudFlare with rate limiting
- Geographic restrictions if needed
- CAPTCHA for registration

### 2. Vote Integrity
- End-to-end encryption (AES-256-GCM)
- ZK proofs for credential validity
- Merkle tree for immutability
- Threshold decryption (no single point of failure)

### 3. Audit Trail
- Kafka event log (immutable)
- Merkle proofs for any vote
- Public bulletin board of commitments
- Third-party auditor access

### 4. Operational Security
- HSM for trustee keys
- Multi-party computation for tallying
- Air-gapped ceremony machines
- Geographic distribution of trustees

---

## Migration Path from Current MVP

### Phase 1: Database (Week 1-2)
- [ ] Replace in-memory Maps with PostgreSQL
- [ ] Add Redis caching layer
- [ ] Implement connection pooling

### Phase 2: Queue (Week 3-4)
- [ ] Add Kafka for vote ingestion
- [ ] Implement worker pool pattern
- [ ] Add dead letter queue for failed votes

### Phase 3: Horizontal Scaling (Week 5-6)
- [ ] Containerize with Docker
- [ ] Kubernetes deployment manifests
- [ ] Horizontal Pod Autoscaler config

### Phase 4: Merkle Optimization (Week 7-8)
- [ ] Implement Merkle Mountain Range
- [ ] Batch processing for tree updates
- [ ] Proof generation service

### Phase 5: Load Testing (Week 9-10)
- [ ] k6 load tests at 10K, 50K, 100K votes/sec
- [ ] Identify bottlenecks
- [ ] Performance tuning

---

## Monitoring & Observability

```yaml
# Key metrics to track
metrics:
  - votes_per_second
  - vote_latency_p99
  - nullifier_check_latency
  - merkle_update_lag
  - kafka_consumer_lag
  - db_connection_pool_usage
  - redis_hit_rate

alerts:
  - vote_throughput < 50000/sec
  - consumer_lag > 10000
  - error_rate > 0.1%
  - p99_latency > 500ms
```

**Stack**: Prometheus + Grafana + PagerDuty

---

## Summary

| Current MVP | Production (350M) |
|-------------|-------------------|
| In-memory Maps | PostgreSQL Citus (sharded) |
| Single process | 50+ API instances |
| Synchronous | Kafka + async workers |
| ~800 votes/sec | 100,000 votes/sec |
| Minutes of data | Years of durability |
| $0 | ~$5,600/election |

The architecture is designed to handle **350 million votes in under 1 hour** with 99.99% availability and complete auditability.
