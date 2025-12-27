---
title: "Bitcoin Anchoring Setup"
description: "How to set up and verify Bitcoin-backed timestamps for elections"
weight: 3
---

TVS uses **OpenTimestamps** for Bitcoin anchoring - it's **free**, **non-spammy**, and provides cryptographically secure Bitcoin-backed proofs.

---

## How It Works

OpenTimestamps aggregates thousands of timestamps into a single Bitcoin transaction:

1. **Submit hash** - Send your election hash to OTS calendar servers
2. **Batching** - OTS collects thousands of hashes and builds a Merkle tree
3. **Bitcoin anchor** - OTS anchors the tree root in a single Bitcoin OP_RETURN
4. **Get proof** - Your .ots proof file links your hash to the Bitcoin block

**Result**: Bitcoin-backed timestamp for ~$0 and zero blockchain spam!

---

## What Gets Anchored

Two anchors per election:

### 1. Election Start Anchor
When voting opens, we anchor:
- Election ID
- Public key hash
- Trustee configuration hash
- Start timestamp

**Proves**: Election parameters were fixed before voting began.

### 2. Election Close Anchor
When voting ends, we anchor:
- Election ID
- Final Merkle root (hash of all votes)
- Total vote count
- End timestamp

**Proves**: All votes are unchanged since election close.

---

## Setup

### 1. Enable in .env

```bash
USE_DATABASE=true
USE_BITCOIN_ANCHORING=true
BITCOIN_NETWORK=mainnet
```

That's it! No Bitcoin node required.

### 2. Verify It's Working

```bash
# Start the API
pnpm dev

# Check OTS calendar connectivity
curl http://localhost:3000/api/anchors/status
```

Expected response:
```json
{
  "enabled": true,
  "method": "OpenTimestamps",
  "connected": true,
  "calendars": [
    "https://a.pool.opentimestamps.org",
    "https://b.pool.opentimestamps.org",
    "https://a.pool.eternitywall.com"
  ],
  "network": "mainnet"
}
```

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Submit to OTS | Instant | `submitted` |
| Bitcoin attestation | 1-24 hours | `upgraded` |
| Full verification | Instant | `verified` |

**Why the wait?** OTS batches timestamps to minimize Bitcoin transactions. This keeps it free and non-spammy.

---

## Verification

### Check Anchor Status

```bash
# Get anchors for an election
curl http://localhost:3000/api/anchors/{electionId}
```

Response:
```json
{
  "electionId": "...",
  "fullyAnchored": true,
  "anchors": {
    "start": {
      "type": "start",
      "status": "verified",
      "hasOtsProof": true,
      "bitcoin": {
        "txid": "abc123...",
        "blockHeight": 812345,
        "explorerUrl": "https://mempool.space/tx/abc123..."
      }
    },
    "close": {
      "type": "close",
      "status": "verified",
      "hasOtsProof": true,
      "bitcoin": {
        "txid": "def456...",
        "blockHeight": 812400,
        "explorerUrl": "https://mempool.space/tx/def456..."
      }
    }
  }
}
```

### Upgrade Pending Proofs

```bash
# Check for Bitcoin attestation and upgrade proofs
curl -X POST http://localhost:3000/api/anchors/{electionId}/refresh
```

### Download .ots Proof

```bash
# Download the proof file for independent verification
curl http://localhost:3000/api/anchors/{electionId}/close/proof -o election-close.ots
```

### Verify Independently

```bash
# Install OTS CLI
pip install opentimestamps-client

# Verify the proof
ots verify election-close.ots
```

Or use the web interface: https://opentimestamps.org

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/anchors/status` | GET | OTS calendar connectivity |
| `/api/anchors/:electionId` | GET | Get anchor records |
| `/api/anchors/:electionId/verify` | GET | Verify proofs |
| `/api/anchors/:electionId/refresh` | POST | Upgrade pending proofs |
| `/api/anchors/:electionId/:type/proof` | GET | Download .ots file |
| `/api/anchors/:electionId/:type/data` | GET | Raw anchor data |

---

## Anchor Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Record created, not yet submitted |
| `submitted` | Sent to OTS calendars, awaiting Bitcoin attestation |
| `upgraded` | Bitcoin attestation received |
| `verified` | Proof verified against Bitcoin blockchain |
| `failed` | Submission or verification failed |

---

## Why OpenTimestamps?

| Feature | OpenTimestamps | Direct Bitcoin |
|---------|---------------|----------------|
| Cost | **Free** | ~$0.10-0.50/tx |
| Node required | **No** | Yes (500GB+) |
| Spam | **None** (aggregated) | 1 tx per election |
| Security | Bitcoin-backed | Bitcoin-backed |
| Decentralized | Multiple calendars | Depends on node |

**Trade-off**: OTS takes 1-24 hours for Bitcoin attestation vs instant with direct anchor. For elections, this is acceptable since verification happens after the election closes.

---

## Cost Comparison

For a national election with 350 million votes:

| Method | What's Anchored | Cost |
|--------|-----------------|------|
| OpenTimestamps | 2 hashes (start + close) | **$0** |
| Direct Bitcoin | 2 transactions | ~$0.50 |
| Per-vote anchoring | 350M transactions | $35M+ |

**The magic of Merkle trees**: One hash represents 350 million votes.
