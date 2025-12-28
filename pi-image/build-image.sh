#!/bin/bash
# TVS Raspberry Pi Image Builder
# Creates a pre-configured Raspberry Pi OS image with TVS pre-installed
#
# Usage: ./build-image.sh [--version VERSION]
#
# Requirements:
# - Linux host (for losetup/mount)
# - qemu-user-static (for ARM emulation)
# - wget, xz-utils
# - Root privileges

set -euo pipefail

# Configuration
VERSION="${1:-1.0.0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TVS_ROOT="$(dirname "$SCRIPT_DIR")"
WORK_DIR="${SCRIPT_DIR}/work"
OUTPUT_DIR="${SCRIPT_DIR}/output"

# Raspberry Pi OS image (64-bit Lite)
BASE_IMAGE_URL="https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2024-03-15/2024-03-15-raspios-bookworm-arm64-lite.img.xz"
BASE_IMAGE_NAME="raspios-bookworm-arm64-lite.img"
OUTPUT_IMAGE="tvs-edge-node-${VERSION}.img"

echo "=== TVS Raspberry Pi Image Builder v${VERSION} ==="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (for losetup/mount)"
   echo "Usage: sudo ./build-image.sh"
   exit 1
fi

# Create work directories
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"
cd "$WORK_DIR"

# Download base image if not present
if [[ ! -f "$BASE_IMAGE_NAME" ]]; then
    echo "Downloading Raspberry Pi OS Lite (64-bit)..."
    wget -q --show-progress "$BASE_IMAGE_URL" -O "${BASE_IMAGE_NAME}.xz"
    echo "Extracting image..."
    xz -dk "${BASE_IMAGE_NAME}.xz"
fi

# Create working copy
echo "Creating working copy of image..."
cp "$BASE_IMAGE_NAME" "$OUTPUT_IMAGE"

# Expand image to 8GB to have room for TVS
echo "Expanding image to 8GB..."
truncate -s 8G "$OUTPUT_IMAGE"

# Set up loop device
echo "Setting up loop device..."
LOOP=$(losetup --find --show --partscan "$OUTPUT_IMAGE")
echo "Using loop device: $LOOP"

# Resize the root partition to fill the image
echo "Resizing root partition..."
parted -s "$LOOP" resizepart 2 100%
e2fsck -f -y "${LOOP}p2" || true
resize2fs "${LOOP}p2"

# Create mount points
MOUNT_ROOT="/mnt/pi-root"
MOUNT_BOOT="/mnt/pi-boot"
mkdir -p "$MOUNT_ROOT" "$MOUNT_BOOT"

# Mount partitions
echo "Mounting partitions..."
mount "${LOOP}p2" "$MOUNT_ROOT"
mount "${LOOP}p1" "$MOUNT_BOOT"

# Set up QEMU for ARM emulation
echo "Setting up QEMU for ARM64 emulation..."
cp /usr/bin/qemu-aarch64-static "$MOUNT_ROOT/usr/bin/" 2>/dev/null || true

# Function to run commands in chroot
run_chroot() {
    chroot "$MOUNT_ROOT" /bin/bash -c "$1"
}

echo "Installing system dependencies..."
run_chroot "apt-get update && apt-get install -y \
    curl \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    openssl \
    jq \
    avahi-daemon"

# Install Node.js 20
echo "Installing Node.js 20..."
run_chroot "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs"

# Create TVS user
echo "Creating TVS user..."
run_chroot "useradd -r -s /bin/false -d /opt/tvs tvs || true"

# Create directories
echo "Creating directories..."
mkdir -p "$MOUNT_ROOT/opt/tvs/api"
mkdir -p "$MOUNT_ROOT/opt/tvs/voter-app"
mkdir -p "$MOUNT_ROOT/var/lib/tvs/veilcloud"
mkdir -p "$MOUNT_ROOT/etc/tvs"

# Build TVS API
echo "Building TVS API..."
cd "$TVS_ROOT"
npm install -g pnpm
pnpm install
pnpm run build

# Copy TVS API
echo "Copying TVS API..."
cp -r "$TVS_ROOT/packages/tvs-api/dist" "$MOUNT_ROOT/opt/tvs/api/"
cp "$TVS_ROOT/packages/tvs-api/package.json" "$MOUNT_ROOT/opt/tvs/api/"

# Copy core packages
for pkg in core veilsign veilchain veilproof; do
    mkdir -p "$MOUNT_ROOT/opt/tvs/api/node_modules/@tvs/$pkg"
    cp -r "$TVS_ROOT/packages/$pkg/dist" "$MOUNT_ROOT/opt/tvs/api/node_modules/@tvs/$pkg/"
    cp "$TVS_ROOT/packages/$pkg/package.json" "$MOUNT_ROOT/opt/tvs/api/node_modules/@tvs/$pkg/"
done

# Build and copy voter app (static export)
echo "Building voter app..."
cd "$TVS_ROOT/apps/voter"
NEXT_PUBLIC_DEPLOYMENT_MODE=local npm run build
cp -r out "$MOUNT_ROOT/opt/tvs/voter-app/"

# Copy configuration files
echo "Copying configuration files..."
cp "$SCRIPT_DIR/config/tvs-config.json.template" "$MOUNT_ROOT/etc/tvs/"
cp "$SCRIPT_DIR/config/nginx-local.conf" "$MOUNT_ROOT/etc/nginx/sites-available/tvs"
run_chroot "ln -sf /etc/nginx/sites-available/tvs /etc/nginx/sites-enabled/tvs"
run_chroot "rm -f /etc/nginx/sites-enabled/default"

# Copy systemd services
echo "Installing systemd services..."
cp "$SCRIPT_DIR/services/tvs-api.service" "$MOUNT_ROOT/etc/systemd/system/"
cp "$SCRIPT_DIR/services/tvs-sync.service" "$MOUNT_ROOT/etc/systemd/system/"

# Copy scripts
echo "Installing scripts..."
cp "$SCRIPT_DIR/scripts/first-boot.sh" "$MOUNT_ROOT/opt/tvs/"
cp "$SCRIPT_DIR/scripts/generate-node-keys.sh" "$MOUNT_ROOT/opt/tvs/"
cp "$SCRIPT_DIR/scripts/health-check.sh" "$MOUNT_ROOT/opt/tvs/"
chmod +x "$MOUNT_ROOT/opt/tvs/"*.sh

# Copy database schema
echo "Installing database schema..."
cp "$TVS_ROOT/scripts/db/schema.sql" "$MOUNT_ROOT/opt/tvs/"
cp "$TVS_ROOT/scripts/db/edge-sync-schema.sql" "$MOUNT_ROOT/opt/tvs/"

# Install npm dependencies in chroot
echo "Installing npm dependencies..."
run_chroot "cd /opt/tvs/api && npm install --production --omit=dev"

# Set permissions
echo "Setting permissions..."
run_chroot "chown -R tvs:tvs /opt/tvs /var/lib/tvs"
run_chroot "chmod 700 /etc/tvs"

# Enable services
echo "Enabling systemd services..."
run_chroot "systemctl enable postgresql"
run_chroot "systemctl enable nginx"
run_chroot "systemctl enable tvs-api"
run_chroot "systemctl enable tvs-sync"

# Set up first-boot service
echo "Setting up first-boot service..."
cat > "$MOUNT_ROOT/etc/systemd/system/tvs-first-boot.service" << 'EOF'
[Unit]
Description=TVS First Boot Configuration
After=network-online.target
Wants=network-online.target
ConditionPathExists=!/etc/tvs/.configured

[Service]
Type=oneshot
ExecStart=/opt/tvs/first-boot.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
run_chroot "systemctl enable tvs-first-boot"

# Configure PostgreSQL for local access
echo "Configuring PostgreSQL..."
cat >> "$MOUNT_ROOT/etc/postgresql/15/main/pg_hba.conf" << 'EOF'
# TVS local access
local   tvs_local       tvs                                     md5
EOF

# Clean up
echo "Cleaning up..."
rm -f "$MOUNT_ROOT/usr/bin/qemu-aarch64-static"
run_chroot "apt-get clean && rm -rf /var/lib/apt/lists/*"

# Unmount
echo "Unmounting..."
sync
umount "$MOUNT_BOOT"
umount "$MOUNT_ROOT"

# Detach loop device
losetup -d "$LOOP"

# Compress output
echo "Compressing image..."
mv "$OUTPUT_IMAGE" "$OUTPUT_DIR/"
cd "$OUTPUT_DIR"
xz -9 -T0 "$OUTPUT_IMAGE"

echo ""
echo "=== Build Complete ==="
echo "Output: $OUTPUT_DIR/${OUTPUT_IMAGE}.xz"
echo ""
echo "To flash to SD card:"
echo "  xzcat ${OUTPUT_IMAGE}.xz | sudo dd of=/dev/sdX bs=4M status=progress"
echo ""
echo "After first boot, access the admin panel at:"
echo "  http://<pi-ip>:8080/admin"
