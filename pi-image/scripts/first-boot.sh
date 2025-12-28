#!/bin/bash
# TVS Edge Node First Boot Configuration
# Runs on first boot to configure the node

set -euo pipefail

CONFIG_DIR="/etc/tvs"
TVS_DIR="/opt/tvs"
CONFIGURED_FLAG="$CONFIG_DIR/.configured"

# Check if already configured
if [[ -f "$CONFIGURED_FLAG" ]]; then
    echo "Node already configured. Skipping first-boot setup."
    exit 0
fi

echo "=== TVS Edge Node First Boot Setup ==="
echo ""

# Create config directory
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# Generate node ID
NODE_ID=$(cat /proc/sys/kernel/random/uuid)
echo "$NODE_ID" > "$CONFIG_DIR/node-id"

# Generate node name from hostname
NODE_NAME=$(hostname)

# Get jurisdiction from user or use default
JURISDICTION_CODE="${JURISDICTION_CODE:-US-UNKNOWN}"

# Generate RSA keypair for node authentication
echo "Generating node authentication keys..."
openssl genrsa -out "$CONFIG_DIR/node-private.pem" 2048
openssl rsa -in "$CONFIG_DIR/node-private.pem" -pubout -out "$CONFIG_DIR/node-public.pem"
chmod 600 "$CONFIG_DIR/node-private.pem"
chmod 644 "$CONFIG_DIR/node-public.pem"

# Create environment file for systemd
cat > "$CONFIG_DIR/environment" << EOF
EDGE_NODE_ID=$NODE_ID
EDGE_NODE_NAME=$NODE_NAME
JURISDICTION_CODE=$JURISDICTION_CODE
EDGE_NODE_PRIVATE_KEY_PATH=$CONFIG_DIR/node-private.pem
CLOUD_SYNC_URL=https://api.tvs.gov
SYNC_CHECKPOINT_PATH=/var/lib/tvs/sync-checkpoint.json
EOF
chmod 600 "$CONFIG_DIR/environment"

# Generate config.json from template
sed -e "s/\${NODE_ID}/$NODE_ID/g" \
    -e "s/\${NODE_NAME}/$NODE_NAME/g" \
    -e "s/\${JURISDICTION_CODE}/$JURISDICTION_CODE/g" \
    "$CONFIG_DIR/tvs-config.json.template" > "$CONFIG_DIR/config.json"

# Initialize PostgreSQL database
echo "Initializing database..."
sudo -u postgres createuser tvs 2>/dev/null || true
sudo -u postgres createdb -O tvs tvs_local 2>/dev/null || true

# Set database password
DB_PASSWORD=$(openssl rand -hex 16)
sudo -u postgres psql -c "ALTER USER tvs WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
echo "DB_PASSWORD=$DB_PASSWORD" >> "$CONFIG_DIR/environment"

# Update database URL in environment
echo "DATABASE_URL=postgres://tvs:$DB_PASSWORD@localhost:5432/tvs_local" >> "$CONFIG_DIR/environment"

# Run schema migrations
echo "Running database migrations..."
sudo -u postgres psql -d tvs_local -f "$TVS_DIR/schema.sql" 2>/dev/null || true
sudo -u postgres psql -d tvs_local -f "$TVS_DIR/edge-sync-schema.sql" 2>/dev/null || true

# Set ownership
chown -R tvs:tvs /var/lib/tvs
chown -R root:tvs "$CONFIG_DIR"
chmod 750 "$CONFIG_DIR"

# Mark as configured
touch "$CONFIGURED_FLAG"

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo "=== TVS Edge Node Configuration Complete ==="
echo ""
echo "Node ID:        $NODE_ID"
echo "Node Name:      $NODE_NAME"
echo "Jurisdiction:   $JURISDICTION_CODE"
echo "IP Address:     $IP_ADDR"
echo ""
echo "Voter Portal:   http://$IP_ADDR/"
echo "Admin Panel:    http://$IP_ADDR:8080/"
echo ""
echo "Public Key for cloud registration:"
echo "---"
cat "$CONFIG_DIR/node-public.pem"
echo "---"
echo ""
echo "To register this node with the cloud, run:"
echo "  curl -X POST https://api.tvs.gov/api/sync/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"name\": \"$NODE_NAME\", \"jurisdictionId\": \"<UUID>\", \"publicKey\": \"<paste-key>\"}'"
echo ""

# Restart services to pick up new configuration
systemctl restart tvs-api
systemctl restart tvs-sync

echo "Services restarted. Node is ready."
