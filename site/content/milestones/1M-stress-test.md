---
title: "1 Million Voter Stress Test"
description: "One million voter stress test with VeilCloud persistence - production-ready state-scale election"
date: 2025-12-27
testType: "Stress Test"
voters: "1,000,000"
peakSpeed: "3,954"
duration: "4m 13s"

metrics:
  - label: "Voters"
    value: "1M"
  - label: "Encrypted Answers"
    value: "5M"
  - label: "Throughput"
    value: "3,954/sec"
  - label: "Success Rate"
    value: "100%"

config:
  Machine: "Apple M1 MacBook Pro"
  Node Heap: "8 GB"
  Storage: "VeilCloud (buffered I/O)"
  Concurrency: "50 parallel"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "ElGamal + ZK Proofs"

chartData:
  labels: ["100K", "200K", "300K", "400K", "500K", "600K", "700K", "800K", "900K", "1M"]
  values: [5500, 5200, 4800, 4500, 4200, 3900, 3700, 3500, 3300, 3100]
---

## The Million Voter Milestone

**One million simulated voters. Five million encrypted answers. 3.3 GB persisted to disk. 100% success rate.**

This test proves TVS can handle state-scale elections with full data persistence on a single laptop.

### Production-Ready with VeilCloud Persistence

This test includes **full VeilCloud persistence** - every vote and nullifier is written to disk in real-time using our buffered I/O system. This is a production-ready configuration, not just an in-memory demo.

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Total Voters** | **1,000,000** |
| **Total Encrypted Answers** | **5,000,000** |
| **Total Time** | **4m 13s (253s)** |
| **Avg Throughput** | **3,954 voters/sec** |
| **Success Rate** | **100.00%** |
| Failed Submissions | 0 |

## VeilCloud Persistence

| Metric | Value |
|--------|-------|
| **Total Data Written** | **3.3 GB** |
| **Votes Persisted** | 5,000,000 |
| **Nullifiers Persisted** | 5,000,000 |
| **Vote Files** | 5 × ~512 MB |
| **Nullifier File** | 769 MB |
| **Buffer Size** | 1,000 votes |
| **I/O Strategy** | Buffered async writes |

### BufferedVeilCloudWriter

The secret to fast persistence is our `BufferedVeilCloudWriter`:

- Buffers 1,000 votes before flushing to disk
- Non-blocking async writes
- Parallel I/O for votes, nullifiers, and snapshots
- Only ~40 seconds overhead vs in-memory only

```typescript
// Buffered writes - non-blocking
bufferedWriter.bufferVotes(votes);
bufferedWriter.bufferNullifiers(electionId, nullifiers);

// Final flush at election close
await bufferedWriter.drain();
```

## Memory Configuration

At 1 million entries with persistence, proper heap sizing is critical:

| Structure | Approx Size |
|-----------|-------------|
| nullifierSet (1M strings) | ~150 MB |
| nullifierToPosition Map | ~100 MB |
| FastMerkleTree nodes | ~200 MB |
| I/O buffers | ~50 MB |

**Solution:** `NODE_OPTIONS="--max-old-space-size=8192"`

## Jurisdiction Structure

```
United States (Federal, Level 0)
    └── California (State, Level 1)
            └── Placer County (County, Level 2)
```

**5 Questions Per Voter:**
- President of the United States (Federal)
- California Governor (State)
- Proposition 99: State Parks Funding (State)
- Placer County Sheriff (County)
- Measure A: Road Improvements (County)

## What This Proves

1. **Production-ready at state scale** - 1M voters with full persistence
2. **Buffered I/O works** - 3.3 GB written with minimal overhead
3. **Memory is the bottleneck** - Not I/O with proper buffering
4. **O(1) operations scale** - Nullifier checks remain constant time

## Comparison: With vs Without Persistence

| Configuration | Time | Throughput | Overhead |
|--------------|------|------------|----------|
| In-memory only | 3m 33s | 4,682/sec | - |
| **VeilCloud buffered** | **4m 13s** | **3,954/sec** | **+40s** |
| VeilCloud sync (est.) | ~12 hours | ~23/sec | Not viable |

Buffered I/O adds only 40 seconds to persist 3.3 GB of election data.

## Scaling Recommendations

For production deployments at 1M+ scale:

```bash
# Required: Set Node.js heap for large elections
export NODE_OPTIONS="--max-old-space-size=8192"

# Required: Enable VeilCloud with buffering
export VEILCLOUD_ENABLED=true
export VEILCLOUD_BUFFER_SIZE=1000

# For stress tests only: Disable rate limiting
export DISABLE_RATE_LIMIT=true
```

## Next Steps

- Test sharded storage across multiple nodes
- Benchmark 10M voter scenario with distributed architecture
- Implement incremental Merkle tree persistence
