#!/bin/bash
# TVS Raspberry Pi Quick Install Script
# Run on a fresh Raspberry Pi OS Lite (64-bit)
#
# Usage: curl -fsSL https://raw.githubusercontent.com/jasonsutter87/Trustless-Voting-System-tvs-/main/pi-image/install.sh | bash

set -euo pipefail

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           TVS Edge Node Installer v1.0.0                   ║"
echo "║     Trustless Voting System - Raspberry Pi Edition         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running on ARM64
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" ]]; then
    echo "⚠️  Warning: This script is designed for Raspberry Pi (ARM64)"
    echo "   Detected architecture: $ARCH"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo "❌ Don't run this script as root. Run as the 'pi' user."
    exit 1
fi

echo "📦 Step 1/7: Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

echo ""
echo "📦 Step 2/7: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ""
echo "📦 Step 3/7: Installing PostgreSQL and Nginx..."
sudo apt-get install -y postgresql postgresql-contrib nginx git openssl jq

echo ""
echo "📦 Step 4/7: Cloning TVS repository..."
cd ~
if [[ -d "tvs" ]]; then
    echo "   TVS directory exists, pulling latest..."
    cd tvs && git pull
else
    git clone https://github.com/jasonsutter87/Trustless-Voting-System-tvs-.git tvs
    cd tvs
fi

echo ""
echo "📦 Step 5/7: Installing pnpm and dependencies..."
sudo npm install -g pnpm
pnpm install

echo ""
echo "📦 Step 6/7: Building TVS..."
pnpm run build

echo ""
echo "📦 Step 7/7: Configuring TVS Edge Node..."

# Create TVS user if not exists
sudo useradd -r -s /bin/false -d /opt/tvs tvs 2>/dev/null || true

# Create directories
sudo mkdir -p /opt/tvs/api
sudo mkdir -p /var/lib/tvs/veilcloud
sudo mkdir -p /etc/tvs

# Copy built files
sudo cp -r ~/tvs/packages/tvs-api/dist /opt/tvs/api/
sudo cp ~/tvs/packages/tvs-api/package.json /opt/tvs/api/

# Copy core packages
for pkg in core veilsign veilchain veilproof; do
    sudo mkdir -p /opt/tvs/api/node_modules/@tvs/$pkg
    sudo cp -r ~/tvs/packages/$pkg/dist /opt/tvs/api/node_modules/@tvs/$pkg/
    sudo cp ~/tvs/packages/$pkg/package.json /opt/tvs/api/node_modules/@tvs/$pkg/
done

# Install production dependencies
cd /opt/tvs/api
sudo npm install --production --omit=dev

# Copy database schema
sudo cp ~/tvs/scripts/db/schema.sql /opt/tvs/
sudo cp ~/tvs/scripts/db/edge-sync-schema.sql /opt/tvs/

# Copy systemd services
sudo cp ~/tvs/pi-image/services/tvs-api.service /etc/systemd/system/
sudo cp ~/tvs/pi-image/services/tvs-sync.service /etc/systemd/system/

# Copy nginx config
sudo cp ~/tvs/pi-image/config/nginx-local.conf /etc/nginx/sites-available/tvs
sudo ln -sf /etc/nginx/sites-available/tvs /etc/nginx/sites-enabled/tvs
sudo rm -f /etc/nginx/sites-enabled/default

# Generate node ID
NODE_ID=$(cat /proc/sys/kernel/random/uuid)
echo "$NODE_ID" | sudo tee /etc/tvs/node-id > /dev/null

# Generate RSA keypair
sudo openssl genrsa -out /etc/tvs/node-private.pem 2048
sudo openssl rsa -in /etc/tvs/node-private.pem -pubout -out /etc/tvs/node-public.pem
sudo chmod 600 /etc/tvs/node-private.pem

# Get node name from hostname
NODE_NAME=$(hostname)

# Create environment file
DB_PASSWORD=$(openssl rand -hex 16)
cat << EOF | sudo tee /etc/tvs/environment > /dev/null
EDGE_NODE_ID=$NODE_ID
EDGE_NODE_NAME=$NODE_NAME
JURISDICTION_CODE=US-UNKNOWN
DATABASE_URL=postgres://tvs:$DB_PASSWORD@localhost:5432/tvs_local
EDGE_NODE_PRIVATE_KEY_PATH=/etc/tvs/node-private.pem
CLOUD_SYNC_URL=https://api.tvs.gov
SYNC_CHECKPOINT_PATH=/var/lib/tvs/sync-checkpoint.json
EOF
sudo chmod 600 /etc/tvs/environment

# Initialize PostgreSQL
echo "   Setting up database..."
sudo -u postgres createuser tvs 2>/dev/null || true
sudo -u postgres createdb -O tvs tvs_local 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER tvs WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -d tvs_local -f /opt/tvs/schema.sql 2>/dev/null || true
sudo -u postgres psql -d tvs_local -f /opt/tvs/edge-sync-schema.sql 2>/dev/null || true

# Set permissions
sudo chown -R tvs:tvs /opt/tvs /var/lib/tvs
sudo chown -R root:tvs /etc/tvs
sudo chmod 750 /etc/tvs

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable postgresql nginx tvs-api tvs-sync
sudo systemctl restart postgresql nginx
sudo systemctl start tvs-api

# Wait for API to start
echo ""
echo "⏳ Waiting for API to start..."
sleep 5

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║               ✅ Installation Complete!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Node ID:        $NODE_ID"
echo "Node Name:      $NODE_NAME"
echo "IP Address:     $IP_ADDR"
echo ""
echo "🌐 Voter Portal:  http://$IP_ADDR/"
echo "🔧 Admin Panel:   http://$IP_ADDR:8080/"
echo "❤️  Health Check: http://$IP_ADDR:3000/health"
echo ""
echo "📋 To check status:"
echo "   sudo systemctl status tvs-api"
echo "   sudo journalctl -u tvs-api -f"
echo ""
echo "🔑 Your node's public key (for cloud registration):"
echo "────────────────────────────────────────────────────"
cat /etc/tvs/node-public.pem
echo "────────────────────────────────────────────────────"
echo ""
echo "📝 Next steps:"
echo "   1. Register this node with the cloud admin"
echo "   2. Start the sync service: sudo systemctl start tvs-sync"
echo "   3. Test voting at http://$IP_ADDR/"
echo ""
