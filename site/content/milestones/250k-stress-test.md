---
title: "250K Voter Stress Test"
description: "Quarter-million voter stress test with VeilCloud persistence - county-scale election simulation"
date: 2025-12-27
testType: "Stress Test"
voters: "252,000"
peakSpeed: "27"
duration: "~3 hours"

metrics:
  - label: "Voters"
    value: "252K"
  - label: "Encrypted Answers"
    value: "1.26M"
  - label: "VeilCloud Storage"
    value: "975 MB"
  - label: "Questions/Voter"
    value: "5"

config:
  Machine: "Apple M1 MacBook Pro"
  Node Heap: "8 GB"
  Storage: "VeilCloud (local)"
  Rate Limiting: "Disabled"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "ElGamal + ZK Proofs"

chartData:
  labels: ["1K", "5K", "10K", "15K", "20K", "232K", "236K", "240K", "244K", "248K", "252K"]
  values: [27, 14, 23, 22, 20, 26, 27, 24, 23, 21, 21]
---

## The Challenge

Simulate a county-scale election with:
- **500,000 target voters** (stopped at 250K for time)
- **5 ballot questions** across Federal, State, and County jurisdictions
- **Full cryptographic pipeline**: ElGamal encryption, ZK proofs, Merkle trees
- **VeilCloud persistence**: All votes stored to disk in real-time

## Key Findings

### 1. Memory Fix Worked

The previous test crashed at 186K voters due to Node.js heap exhaustion (default 4GB). Increasing to 8GB with `NODE_OPTIONS=--max-old-space-size=8192` allowed the test to continue past the crash point.

### 2. Throughput Degradation

Observed throughput ranged from **27 voters/sec** (start) to **20-21 voters/sec** (at 250K). This ~25% degradation is expected due to:
- Growing Merkle tree (O(log n) updates)
- Increasing VeilCloud storage I/O
- Memory pressure at scale

### 3. VeilCloud Performance

Generated **975 MB** of persistent ZK-verified vote data:
- Encrypted ballots with ElGamal ciphertexts
- Zero-knowledge proofs of vote validity
- Merkle tree snapshots for audit trails
- Nullifier registry preventing double-voting

## What This Proves

A single laptop can process a **county-scale election** with full cryptographic verification:

| Metric | Result |
|--------|--------|
| Voters processed | 252,000 |
| Encrypted answers | 1,260,000 |
| Storage efficiency | ~4 KB/voter |
| Verification | 100% ZK-proven |

## Next Steps

1. **Optimize VeilCloud writes** - Batch operations for better I/O
2. **Streaming architecture** - Process votes without full memory load
3. **Distributed tallying** - Multi-node parallel decryption
4. **1M voter test** - Full large-county simulation
