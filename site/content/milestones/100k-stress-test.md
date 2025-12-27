---
title: "100K Voter Stress Test"
description: "First 100K voter stress test - proving cryptographic operations work at scale"
date: 2025-12-23
testType: "Stress Test"
voters: "100,000"
peakSpeed: "2,500"
duration: "~83 minutes"

metrics:
  - label: "Voters"
    value: "100K"
  - label: "Encrypted Answers"
    value: "300K"
  - label: "Questions"
    value: "3"
  - label: "Success Rate"
    value: "100%"

config:
  Machine: "Apple M1 MacBook Pro"
  Storage: "PostgreSQL"
  Rate Limiting: "Disabled"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "AES-256-GCM (VeilForms)"

chartData:
  labels: ["500", "1K", "5K", "10K", "25K", "50K", "75K", "100K"]
  values: [2500, 2000, 532, 270, 100, 47, 24, 20]
---

## The Challenge

Process **100,000 voters** with full cryptographic verification:
- **3 ballot questions** with multiple choice and write-in support
- **Blind signatures** via VeilSign
- **AES-256-GCM encryption** for each answer
- **Merkle tree audit trail** via VeilChain

## Key Findings

### 1. Cryptography Works at Scale

All 100,000 voters successfully processed with 100% accuracy. Zero failed submissions, zero data corruption.

### 2. Throughput Degradation Discovered

Observed severe throughput degradation as the Merkle tree grew:

| Voters | Throughput | Degradation |
|--------|-----------|-------------|
| 500 | 2,500/sec | Peak |
| 10,000 | 270/sec | 89% |
| 50,000 | 47/sec | 98% |
| 100,000 | 20/sec | 99% |

**Root cause:** O(n) Merkle tree operations causing sequential I/O bottleneck.

### 3. Registration Scales Linearly

Voter registration maintained 7,697 voters/sec throughout - proving the bottleneck is in vote casting, not registration.

## What This Proves

| Metric | Result |
|--------|--------|
| Voters processed | 100,000 |
| Encrypted answers | 300,000 |
| Crypto ops per vote | ~5 (signature, 3 encryptions, Merkle append) |
| Success rate | 100% |

## Next Steps

This test identified the Merkle tree as the primary bottleneck, leading to the FastMerkleTree optimization that would achieve O(log n) performance.
