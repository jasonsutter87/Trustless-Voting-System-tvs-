---
title: "VeilCloud"
description: "Zero-knowledge cloud infrastructure - horizontal scaling without trust"
weight: 6
---

## The Problem

TVS faces a fundamental scaling challenge: processing 100,000 voters takes ~83 minutes due to single-node Merkle tree bottlenecks. Scaling to handle 350+ million votes (U.S. national election scale) requires distributed infrastructure—but traditional cloud providers see all your data.

- **Single-node limits** - Merkle tree updates degrade O(n log n)
- **Cloud trust problem** - AWS/GCP sees your plaintext
- **Infrastructure complexity** - Building distributed systems from scratch

## The Solution

VeilCloud is a zero-knowledge cloud infrastructure layer designed specifically for the VeilSuite ecosystem. The core principle: **"Store secrets. Not trust."**

### Key Features

| Feature | Description |
|---------|-------------|
| **Zero-Trust Storage** | Server never sees plaintext data (client-side encryption enforced) |
| **VeilSuite Native** | Built-in integration with VeilKey, VeilChain, VeilSign |
| **Horizontal Scaling** | Stateless API design enables Kubernetes deployment |
| **Audit Integration** | All operations logged to VeilChain with Merkle proofs |
| **SDK Available** | `@veilcloud/sdk` for TypeScript/JavaScript integration |

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     VEILCLOUD ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    REST API (Fastify)                       │ │
│  │  /v1/storage   /v1/projects   /v1/teams   /v1/audit        │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Storage   │  │   AuditService  │  │   AccessService │     │
│  │  (S3/MinIO) │  │   (VeilChain)   │  │   (VeilSign)    │     │
│  └─────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scaling Benefits

| Metric | Current (Direct) | With VeilCloud |
|--------|------------------|----------------|
| 100K voters | ~83 minutes | Target: <5 minutes |
| Architecture | Single-node | Horizontal (K8s) |
| Vote ingestion | Synchronous | Async (Kafka queue) |
| Storage | PostgreSQL | S3 + Citus sharding |
| Availability | 99.9% | 99.99% |

### Security Properties

- **Client-side encryption** - VeilCloud never sees plaintext
- **Audit trail** - All operations logged with Merkle proofs
- **Zero-knowledge** - Infrastructure layer maintains privacy guarantees
- **VeilSuite integration** - Works seamlessly with VeilKey threshold decryption

## Links

- [GitHub Repository](https://github.com/jasonsutter87/VeilCloud)
