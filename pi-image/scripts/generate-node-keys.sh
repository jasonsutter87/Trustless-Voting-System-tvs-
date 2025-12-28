#!/bin/bash
# Generate new RSA keypair for TVS edge node authentication

set -euo pipefail

CONFIG_DIR="/etc/tvs"
PRIVATE_KEY="$CONFIG_DIR/node-private.pem"
PUBLIC_KEY="$CONFIG_DIR/node-public.pem"

echo "Generating new node authentication keys..."

# Backup existing keys if present
if [[ -f "$PRIVATE_KEY" ]]; then
    BACKUP_DIR="$CONFIG_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    mv "$PRIVATE_KEY" "$BACKUP_DIR/"
    mv "$PUBLIC_KEY" "$BACKUP_DIR/" 2>/dev/null || true
    echo "Existing keys backed up to: $BACKUP_DIR"
fi

# Generate new 2048-bit RSA keypair
openssl genrsa -out "$PRIVATE_KEY" 2048
openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY"

# Set permissions
chmod 600 "$PRIVATE_KEY"
chmod 644 "$PUBLIC_KEY"

echo ""
echo "New keys generated:"
echo "  Private: $PRIVATE_KEY"
echo "  Public:  $PUBLIC_KEY"
echo ""
echo "Public key (for cloud registration):"
echo "---"
cat "$PUBLIC_KEY"
echo "---"
echo ""
echo "IMPORTANT: You must re-register this node with the cloud after regenerating keys."
