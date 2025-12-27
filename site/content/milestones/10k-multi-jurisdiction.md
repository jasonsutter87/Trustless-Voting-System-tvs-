---
title: "10K Multi-Jurisdiction Test"
description: "First multi-jurisdiction election test - Federal, State, and County on one ballot"
date: 2025-12-24
testType: "Multi-Jurisdiction"
voters: "10,000"
peakSpeed: "1,220"
duration: "~3.4 minutes"

metrics:
  - label: "Voters"
    value: "10K"
  - label: "Encrypted Answers"
    value: "50K"
  - label: "Jurisdictions"
    value: "3"
  - label: "Merkle Trees"
    value: "5"

config:
  Machine: "Apple M1 MacBook Pro"
  Jurisdiction: "Placer County, California"
  Hierarchy: "Federal → State → County"
  Threshold: "3-of-5 Feldman VSS"
  Encryption: "AES-256-GCM (VeilForms)"

chartData:
  labels: ["100", "1K", "2K", "4K", "6K", "8K", "10K"]
  values: [1220, 200, 113, 57, 37, 29, 25]
---

## The Challenge

Simulate a real **Placer County, California** election with:
- **3 jurisdiction levels**: Federal, State, County
- **5 questions** across all levels
- **Independent Merkle trees** per question for jurisdiction-specific auditing

### Ballot Structure

| Level | Question | Type |
|-------|----------|------|
| Federal | President of the United States | Single choice |
| State | California Governor | Single choice |
| State | Proposition 99: State Parks Funding | Yes/No |
| County | Placer County Sheriff | Single choice |
| County | Measure A: Road Improvements | Yes/No |

## Key Findings

### 1. Multi-Jurisdiction Architecture Works

Each jurisdiction maintains independent verification:
- Federal questions have separate Merkle root
- State questions have separate Merkle root
- County questions have separate Merkle root

### 2. Per-Answer Throughput Consistent

| Metric | Single Question | Multi (5 Questions) |
|--------|----------------|---------------------|
| Time per Answer | 3.8ms | 4.0ms |
| Final Throughput | ~27/sec | ~25/sec |

**Key insight:** Per-answer throughput is nearly identical. Multi-jurisdiction scales linearly with questions, not exponentially.

### 3. Parallel Tallying Enabled

Each jurisdiction can independently audit and tally their questions without accessing other jurisdiction's data.

## Architectural Benefits

1. **Independent Verification** - Each jurisdiction audits only their questions
2. **Parallel Tallying** - County, State, Federal results computed simultaneously
3. **Jurisdiction-Specific Trustees** - County officials can't decrypt Federal ballots
4. **Single Ballot Experience** - Voter casts one ballot covering all eligible jurisdictions
