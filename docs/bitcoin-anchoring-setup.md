# Bitcoin Anchoring Setup for TVS

This guide explains how to set up Bitcoin anchoring for TVS elections. Bitcoin anchoring provides immutable timestamping of election Merkle roots using OP_RETURN transactions.

---

## Overview

TVS anchors two transactions per election:

1. **Election Start Anchor**: When voting opens
   - Commits to: Public key, trustee configuration, start timestamp
   - Proves: Election parameters were fixed before voting began

2. **Election Close Anchor**: When voting ends
   - Commits to: Final Merkle root, total vote count, end timestamp
   - Proves: All votes are unchanged since election close

**Cost**: ~$0.20-0.50 total (two transactions)

---

## Requirements

- Bitcoin Core 25.0 or later
- Disk space:
  - Mainnet: ~500GB
  - Testnet: ~50GB
  - Regtest: <1GB
- RAM: 2GB minimum
- TVS API with PostgreSQL database

---

## Quick Start (Testnet)

### 1. Install Bitcoin Core

**macOS (Homebrew):**
```bash
brew install bitcoin
```

**Ubuntu/Debian:**
```bash
sudo apt-get install bitcoind
```

**From source:**
```bash
# Download from https://bitcoincore.org/en/download/
tar xzf bitcoin-25.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 bitcoin-25.0/bin/* /usr/local/bin/
```

### 2. Configure Bitcoin Core

Create `~/.bitcoin/bitcoin.conf`:

```ini
# Network (testnet for testing, remove for mainnet)
testnet=1

# Enable RPC server
server=1
rpcuser=tvs
rpcpassword=YOUR_SECURE_PASSWORD_HERE

# Required for looking up transactions
txindex=1

# Prune disabled (required for txindex)
prune=0

# Performance
dbcache=450
```

**Security Note**: Generate a secure password:
```bash
openssl rand -hex 32
```

### 3. Start Bitcoin Core

```bash
# Start daemon
bitcoind -daemon

# Check sync progress
bitcoin-cli -testnet getblockchaininfo

# Wait for sync (testnet: ~2-4 hours, mainnet: 1-3 days)
```

### 4. Create Wallet

```bash
# Create dedicated wallet for TVS anchoring
bitcoin-cli -testnet createwallet "tvs-anchoring"

# Get a receiving address
bitcoin-cli -testnet -rpcwallet=tvs-anchoring getnewaddress

# Fund with testnet coins from:
# - https://coinfaucet.eu/en/btc-testnet/
# - https://testnet-faucet.mempool.co/
```

### 5. Configure TVS

Add to your `.env` file:

```bash
# Enable Bitcoin anchoring
USE_BITCOIN_ANCHORING=true
USE_DATABASE=true

# Bitcoin node configuration
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://127.0.0.1:18332
BITCOIN_RPC_USER=tvs
BITCOIN_RPC_PASSWORD=YOUR_SECURE_PASSWORD_HERE
BITCOIN_WALLET=tvs-anchoring
```

### 6. Verify Connection

```bash
# Start TVS API
pnpm dev

# Check Bitcoin connection
curl http://localhost:3000/api/anchors/status
```

Expected response:
```json
{
  "enabled": true,
  "network": "testnet",
  "connected": true,
  "nodeVersion": 250000,
  "walletBalance": 0.001
}
```

---

## Mainnet Configuration

For production elections, use mainnet:

**bitcoin.conf:**
```ini
# Remove testnet line for mainnet
server=1
rpcuser=tvs
rpcpassword=YOUR_SECURE_PASSWORD_HERE
txindex=1
```

**TVS .env:**
```bash
BITCOIN_NETWORK=mainnet
BITCOIN_RPC_URL=http://127.0.0.1:8332
```

**Important:**
- Mainnet sync requires ~500GB and 1-3 days
- Fund wallet with real BTC (~0.0001 BTC per election)
- Use hardware wallet or secure key management

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
      "status": "confirmed",
      "bitcoin": {
        "txid": "abc123...",
        "confirmations": 42,
        "explorerUrl": "https://mempool.space/testnet/tx/abc123..."
      }
    },
    "close": {
      "type": "close",
      "status": "confirmed",
      "bitcoin": {
        "txid": "def456...",
        "confirmations": 6,
        "explorerUrl": "https://mempool.space/testnet/tx/def456..."
      }
    }
  }
}
```

### Verify on Block Explorer

1. Open the explorer URL from the API response
2. Find the OP_RETURN output in the transaction
3. Decode the hex data - it should match:
   - `TVS|v1|{election_id}|{merkle_root}|{vote_count}|{timestamp}`

### Verify Merkle Root Matches

```bash
# Get integrity info
curl http://localhost:3000/api/verify/integrity/{electionId}

# Compare merkleRoot with anchored value
```

---

## OP_RETURN Format

**Election Start:**
```
TVS|v1|<election_id_8>|<pk_hash_16>|<trustees_hash_16>|<timestamp_hex>
```

**Election Close:**
```
TVS|v1|<election_id_8>|<merkle_root_32>|<vote_count>|<timestamp_hex>
```

Maximum size: 80 bytes (Bitcoin OP_RETURN limit)

---

## Troubleshooting

### "No UTXOs available"

Fund the wallet:
```bash
bitcoin-cli -testnet -rpcwallet=tvs-anchoring getnewaddress
# Use a faucet to send testnet coins to this address
```

### "Bitcoin RPC error: Unauthorized"

Check credentials in `bitcoin.conf` match `.env`:
```bash
# Verify RPC is working
curl --user tvs:YOUR_PASSWORD \
  --data-binary '{"jsonrpc":"1.0","method":"getblockchaininfo","params":[]}' \
  http://127.0.0.1:18332/
```

### "Connection refused"

Ensure bitcoind is running:
```bash
bitcoin-cli -testnet getblockchaininfo
```

### "txindex not enabled"

Add `txindex=1` to bitcoin.conf and reindex:
```bash
bitcoind -reindex
```

---

## Security Considerations

1. **RPC Credentials**: Use strong passwords, never commit to git
2. **Wallet Backup**: Backup wallet file regularly
3. **Firewall**: Only allow localhost RPC connections
4. **Separate Wallet**: Use dedicated wallet for TVS, not personal funds
5. **Minimum Funds**: Keep only necessary BTC (~0.001) in wallet

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/anchors/status` | GET | Bitcoin connection status |
| `/api/anchors/:electionId` | GET | Get anchors for election |
| `/api/anchors/:electionId/verify` | GET | Verify anchors against node |
| `/api/anchors/:electionId/refresh` | POST | Update confirmation counts |

---

## Cost Estimation

| Network | Fee per TX | Total per Election |
|---------|------------|-------------------|
| Testnet | Free | Free |
| Mainnet (low priority) | ~$0.10 | ~$0.20 |
| Mainnet (high priority) | ~$0.25 | ~$0.50 |

For a national election with 350 million votes:
- **Cost**: $0.50
- **Proof**: Every single vote is unchanged

---

*Last updated: December 2025*
