---
title: "500K Voter Stress Test"
description: "Half-million voter stress test with O(1) nullifier lookup - breakthrough memory optimization"
date: 2025-12-27
testType: "Stress Test"
voters: "500,000"
peakSpeed: "5,903"
duration: "1m 24s"

metrics:
  - label: "Voters"
    value: "500K"
  - label: "Encrypted Answers"
    value: "2.5M"
  - label: "Throughput"
    value: "5,903/sec"
  - label: "Success Rate"
    value: "100%"

config:
  Machine: "Apple M1 MacBook Pro"
  Node Heap: "Default (~2 GB)"
  Storage: "VeilCloud (local)"
  Concurrency: "50 parallel"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "ElGamal + ZK Proofs"

chartData:
  labels: ["50K", "100K", "150K", "200K", "250K", "300K", "350K", "400K", "450K", "500K"]
  values: [6803, 6061, 5952, 5747, 6173, 5848, 6024, 5556, 5780, 5435]
---

## The Breakthrough

This test validated the **O(1) nullifier lookup** optimization that replaced the previous O(n) search. The result: **100% success rate** at half a million voters with no memory issues.

### Key Optimizations Applied

1. **O(1) Nullifier Check** - Changed from array linear scan to Set-based lookup
2. **Position Map** - Added `nullifierToPosition: Map<string, number>` for instant lookups
3. **Memory Threshold** - Stop storing full entries after 100K voters

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Total Voters** | **500,000** |
| **Total Encrypted Answers** | **2,500,000** |
| **Total Time** | **1m 24s** |
| Voting Phase | 84.7s |
| Key Ceremony | 55ms |
| **Avg Throughput** | **5,903 voters/sec** |
| Peak Throughput | 7,463 voters/sec |
| Final Throughput | 5,435 voters/sec |
| **Success Rate** | **100.00%** |
| Failed Submissions | 0 |

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

The O(1) nullifier lookup optimization works. At 500K voters:
- No O(n²) bottleneck from duplicate checking
- Stable throughput between 5,000-7,500 voters/sec
- Memory stays under control with default Node.js heap

## Code Changes

```typescript
// Before: O(n) linear scan
if (this.entries.some(e => e.nullifier === entry.nullifier)) {
  throw new Error('Duplicate nullifier');
}

// After: O(1) Set lookup
private nullifierSet: Set<string> = new Set();
if (this.nullifierSet.has(entry.nullifier)) {
  throw new Error('Duplicate nullifier');
}
```

## Next Steps

- Scale to 1M voters with increased heap (8GB)
- Implement vote batching for 2-5x throughput
- Test distributed deployment
