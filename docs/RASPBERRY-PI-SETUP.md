# TVS Raspberry Pi Edge Node Setup Guide

Deploy a TVS (Trustless Voting System) edge node on a Raspberry Pi for local polling station voting with cloud sync.

## Overview

A TVS edge node allows voters to cast ballots locally at a polling station. Votes are:
1. Stored locally on the Pi (works offline)
2. Synced to the central cloud every 30 seconds
3. Aggregated for final tally

```
┌─────────────────┐          ┌─────────────────┐
│  Raspberry Pi   │  ──────► │   Central Cloud │
│  (Edge Node)    │   sync   │   (AWS/GCP)     │
│  10K voters     │          │   Aggregation   │
└─────────────────┘          └─────────────────┘
```

## Requirements

### Hardware
- **Raspberry Pi 4** (4GB RAM recommended, 2GB minimum)
- **16GB+ microSD card** (Class 10 or better, 32GB recommended)
- **Power supply** (official 15W USB-C recommended)
- **Ethernet cable** or WiFi connection

### Software
- **Raspberry Pi OS Lite (64-bit)** - Bookworm or newer
- Internet connection for initial setup

## Quick Install (5 minutes)

### Step 1: Flash Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Select **Raspberry Pi OS Lite (64-bit)**
3. Click the gear icon ⚙️ and configure:
   - Enable SSH
   - Set username: `pi`
   - Set password
   - Configure WiFi (optional)
4. Flash to SD card

### Step 2: Boot and Connect

1. Insert SD card into Pi
2. Connect Ethernet (or use configured WiFi)
3. Power on
4. Find Pi's IP address (check router or use `ping raspberrypi.local`)
5. SSH into Pi:
   ```bash
   ssh pi@<pi-ip-address>
   ```

### Step 3: Run Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/jasonsutter87/Trustless-Voting-System-tvs-/main/pi-image/install.sh | bash
```

This will:
- Install Node.js 20, PostgreSQL, Nginx
- Clone and build TVS
- Configure the edge node
- Generate authentication keys
- Start the voting API

Installation takes approximately **10-15 minutes** on Pi 4.

### Step 4: Verify Installation

After installation completes, you'll see:
```
╔════════════════════════════════════════════════════════════╗
║               ✅ Installation Complete!                     ║
╚════════════════════════════════════════════════════════════╝

Node ID:        abc12345-...
Node Name:      raspberrypi
IP Address:     192.168.1.100

🌐 Voter Portal:  http://192.168.1.100/
🔧 Admin Panel:   http://192.168.1.100:8080/
```

Test the API:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","deploymentMode":"edge","nodeName":"raspberrypi",...}
```

## Manual Installation

If the quick install doesn't work, follow these steps:

### 1. Update System
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PostgreSQL and Nginx
```bash
sudo apt-get install -y postgresql postgresql-contrib nginx git openssl
```

### 4. Clone Repository
```bash
cd ~
git clone https://github.com/jasonsutter87/Trustless-Voting-System-tvs-.git tvs
cd tvs
```

### 5. Install Dependencies and Build
```bash
sudo npm install -g pnpm
pnpm install
pnpm run build
```

### 6. Configure Node
```bash
# Create directories
sudo mkdir -p /opt/tvs/api /var/lib/tvs/veilcloud /etc/tvs

# Copy files
sudo cp -r packages/tvs-api/dist /opt/tvs/api/
sudo cp packages/tvs-api/package.json /opt/tvs/api/

# Generate node ID and keys
NODE_ID=$(cat /proc/sys/kernel/random/uuid)
echo "$NODE_ID" | sudo tee /etc/tvs/node-id
sudo openssl genrsa -out /etc/tvs/node-private.pem 2048
sudo openssl rsa -in /etc/tvs/node-private.pem -pubout -out /etc/tvs/node-public.pem

# Create environment file
cat << EOF | sudo tee /etc/tvs/environment
EDGE_NODE_ID=$NODE_ID
EDGE_NODE_NAME=$(hostname)
DATABASE_URL=postgres://tvs:password@localhost:5432/tvs_local
EDGE_NODE_PRIVATE_KEY_PATH=/etc/tvs/node-private.pem
CLOUD_SYNC_URL=https://api.tvs.gov
EOF
```

### 7. Setup Database
```bash
sudo -u postgres createuser tvs
sudo -u postgres createdb -O tvs tvs_local
sudo -u postgres psql -d tvs_local -f scripts/db/schema.sql
sudo -u postgres psql -d tvs_local -f scripts/db/edge-sync-schema.sql
```

### 8. Install Services
```bash
sudo cp pi-image/services/tvs-api.service /etc/systemd/system/
sudo cp pi-image/services/tvs-sync.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tvs-api tvs-sync
sudo systemctl start tvs-api
```

## Configuration

### Node Configuration

Edit `/etc/tvs/environment`:

```bash
EDGE_NODE_ID=your-node-uuid
EDGE_NODE_NAME=Precinct-42A
JURISDICTION_CODE=US-CA-PLACER
DATABASE_URL=postgres://tvs:password@localhost:5432/tvs_local
CLOUD_SYNC_URL=https://api.tvs.gov
```

After editing:
```bash
sudo systemctl restart tvs-api tvs-sync
```

### Cloud Sync Configuration

The sync service uploads votes to the central cloud. Configure in `/etc/tvs/environment`:

```bash
CLOUD_SYNC_URL=https://api.tvs.gov     # Central cloud API
SYNC_INTERVAL_MS=30000                  # Sync every 30 seconds
SYNC_BATCH_SIZE=1000                    # Votes per batch
```

## Registering with Cloud

After installation, register your node with the central cloud:

### 1. Get Your Public Key
```bash
cat /etc/tvs/node-public.pem
```

### 2. Register via API
```bash
curl -X POST https://api.tvs.gov/api/sync/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Precinct 42A",
    "jurisdictionId": "<your-jurisdiction-uuid>",
    "publicKey": "<paste-your-public-key>"
  }'
```

### 3. Request Activation
Contact the cloud administrator to activate your node. Once activated, sync will begin automatically.

## Managing Services

### Check Status
```bash
sudo systemctl status tvs-api
sudo systemctl status tvs-sync
```

### View Logs
```bash
# API logs
sudo journalctl -u tvs-api -f

# Sync logs
sudo journalctl -u tvs-sync -f
```

### Restart Services
```bash
sudo systemctl restart tvs-api tvs-sync
```

### Stop Services
```bash
sudo systemctl stop tvs-api tvs-sync
```

## Health Check

Run the built-in health check:
```bash
~/tvs/pi-image/scripts/health-check.sh
```

Or via API:
```bash
curl http://localhost:3000/health | jq
```

## Storage Locations

| Path | Description |
|------|-------------|
| `/opt/tvs/api/` | TVS API application |
| `/var/lib/tvs/veilcloud/` | Vote data (VeilCloud) |
| `/var/lib/tvs/sync-checkpoint.json` | Sync progress |
| `/etc/tvs/` | Configuration and keys |

## Troubleshooting

### API Won't Start

```bash
# Check logs
sudo journalctl -u tvs-api -n 50

# Common issues:
# - Port 3000 in use: sudo lsof -i :3000
# - Database not running: sudo systemctl start postgresql
# - Missing env file: check /etc/tvs/environment exists
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d tvs_local -c "SELECT 1;"

# Reset database
sudo -u postgres dropdb tvs_local
sudo -u postgres createdb -O tvs tvs_local
sudo -u postgres psql -d tvs_local -f /opt/tvs/schema.sql
```

### Sync Not Working

```bash
# Check cloud connectivity
curl https://api.tvs.gov/health

# Check node is registered and activated
curl http://localhost:3000/api/sync/status/$(cat /etc/tvs/node-id)

# View sync logs
sudo journalctl -u tvs-sync -f
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean old logs
sudo journalctl --vacuum-time=7d

# Check VeilCloud size
du -sh /var/lib/tvs/veilcloud/
```

## Updating TVS

```bash
cd ~/tvs
git pull
pnpm install
pnpm run build

# Copy new files
sudo cp -r packages/tvs-api/dist /opt/tvs/api/

# Restart
sudo systemctl restart tvs-api tvs-sync
```

## Security Notes

1. **Change default passwords** after installation
2. **Keep the private key secure** (`/etc/tvs/node-private.pem`)
3. **Use a firewall** - only expose ports 80 (voter app) and 8080 (admin)
4. **Physical security** - the Pi should be in a secure location
5. **Regular updates** - keep the OS and TVS updated

## Network Requirements

| Port | Direction | Purpose |
|------|-----------|---------|
| 80 | Inbound | Voter portal (Nginx) |
| 8080 | Inbound | Admin panel |
| 443 | Outbound | Cloud sync (HTTPS) |
| 3000 | Internal | TVS API |
| 5432 | Internal | PostgreSQL |

## Performance

On a Raspberry Pi 4 (4GB):
- **Throughput**: ~500-1000 votes/minute
- **Capacity**: 10,000+ voters per node
- **Memory**: ~300-400MB used
- **Storage**: ~50MB per 1000 votes

## Support

- GitHub Issues: https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/issues
- Documentation: https://github.com/jasonsutter87/Trustless-Voting-System-tvs-/docs
