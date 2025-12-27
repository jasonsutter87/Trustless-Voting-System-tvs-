---
title: "100K FastMerkleTree Test"
description: "83 minutes → 13 minutes - 6x improvement at scale with multi-jurisdiction support"
date: 2025-12-26
testType: "Performance"
voters: "100,000"
peakSpeed: "1,274"
duration: "~13 minutes"

metrics:
  - label: "Voters"
    value: "100K"
  - label: "Encrypted Answers"
    value: "500K"
  - label: "Questions"
    value: "5"
  - label: "Improvement"
    value: "6x"

config:
  Machine: "Apple M1 MacBook Pro"
  Algorithm: "FastMerkleTree O(log n)"
  Jurisdiction: "Placer County, California"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "ElGamal + ZK Proofs"

chartData:
  labels: ["10K", "20K", "30K", "40K", "50K", "60K", "70K", "80K", "90K", "100K"]
  values: [858, 455, 292, 173, 134, 103, 78, 77, 65, 64]
---

## The Scale Test

Proving FastMerkleTree works at **100K scale** with full multi-jurisdiction support:
- **100,000 voters** casting ballots
- **500,000 encrypted answers** (5 questions each)
- **5 independent Merkle trees** (one per question)
- **3 jurisdiction levels**: Federal, State, County

## Before vs After

| Metric | Original (Dec 23) | FastMerkle (Dec 26) |
|--------|-------------------|---------------------|
| Total time | 83 minutes | 13 minutes |
| Questions | 3 | 5 |
| Encrypted answers | 300K | 500K |
| Peak throughput | 2,500/sec | 1,274/sec |
| Final throughput | 20/sec | 64/sec |

**6x faster** while processing **67% more data**.

## Throughput Degradation

The FastMerkleTree still shows degradation, but it's manageable:

| Voters | Original | FastMerkle |
|--------|----------|------------|
| 10K | 270/sec | 858/sec |
| 50K | 47/sec | 134/sec |
| 100K | 20/sec | 64/sec |

Degradation reduced from **99%** to **94%** - still room to improve, but now practical for county-scale elections.

## What This Enables

| Election Scale | Original Time | FastMerkle Time |
|---------------|---------------|-----------------|
| 100K (large city) | 83 min | 13 min |
| 250K (county) | Impossible | ~3 hours |
| 1M (metro) | Impossible | Projected feasible |

## Success Metrics

| Metric | Value |
|--------|-------|
| Voters processed | 100,000 |
| Encrypted answers | 500,000 |
| Failed submissions | 0 |
| Success rate | 100.00% |

The path to county-scale elections is now clear.
