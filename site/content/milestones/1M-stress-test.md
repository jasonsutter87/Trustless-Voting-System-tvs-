---
title: "1 Million Voter Stress Test"
description: "One million voter stress test with 8GB heap - state-scale election simulation"
date: 2025-12-27
testType: "Stress Test"
voters: "1,000,000"
peakSpeed: "4,682"
duration: "3m 33s"

metrics:
  - label: "Voters"
    value: "1M"
  - label: "Encrypted Answers"
    value: "5M"
  - label: "Throughput"
    value: "4,682/sec"
  - label: "Success Rate"
    value: "100%"

config:
  Machine: "Apple M1 MacBook Pro"
  Node Heap: "8 GB"
  Storage: "VeilCloud (local)"
  Concurrency: "50 parallel"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "ElGamal + ZK Proofs"

chartData:
  labels: ["100K", "200K", "300K", "400K", "500K", "600K", "700K", "800K", "900K", "1M"]
  values: [5952, 5882, 5263, 4926, 4739, 4545, 4464, 4386, 4310, 2469]
---

## The Million Voter Milestone

**One million simulated voters. Five million encrypted answers. 100% success rate.**

This test proves TVS can handle state-scale elections on a single laptop with proper memory configuration.

### The 8GB Heap Fix

Initial 1M test with default heap (~2GB) achieved only 69.66% success rate due to catastrophic GC pauses at ~817K and ~849K voters. These "stop the world" pauses lasted 15-21 minutes each, causing HTTP timeouts.

**Solution:** `NODE_OPTIONS="--max-old-space-size=8192"`

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Total Voters** | **1,000,000** |
| **Total Encrypted Answers** | **5,000,000** |
| **Total Time** | **3m 33s** |
| Voting Phase | 213.6s |
| Key Ceremony | 56ms |
| **Avg Throughput** | **4,682 voters/sec** |
| Peak Throughput | 7,407 voters/sec |
| Final Throughput | 2,469 voters/sec |
| **Success Rate** | **100.00%** |
| Failed Submissions | 0 |

## Memory at Scale

At 1 million entries, these structures consume significant memory:

| Structure | Approx Size |
|-----------|-------------|
| nullifierSet (1M strings) | ~150 MB |
| nullifierToPosition Map | ~100 MB |
| FastMerkleTree nodes | ~200 MB |
| Request/Response buffers | Variable |

The 8GB heap provides comfortable headroom for these structures plus V8's generational GC overhead.

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

1. **State-scale elections are feasible** - 1M voters in under 4 minutes
2. **Memory is the bottleneck** - Not CPU or cryptography
3. **Proper heap sizing is critical** - Default heap causes cascading failures
4. **O(1) operations scale** - Nullifier checks remain constant time

## Scaling Recommendations

For production deployments at 1M+ scale:

```bash
# Set Node.js heap for large elections
export NODE_OPTIONS="--max-old-space-size=8192"

# Or in package.json
"start": "node --max-old-space-size=8192 dist/index.js"
```

## Next Steps

- Implement vote batching for higher throughput
- Test sharded storage across multiple nodes
- Benchmark 10M voter scenario with distributed architecture
