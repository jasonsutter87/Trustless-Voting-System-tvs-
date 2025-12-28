# TVS Raspberry Pi Edge Node Image

Pre-configured Raspberry Pi OS image with TVS (Trustless Voting System) for local polling station deployment.

## Features

- **Offline-First**: Votes are stored locally and synced when connected
- **Auto-Sync**: Background service syncs votes to central cloud every 30 seconds
- **10K Voter Capacity**: Optimized for handling 10,000 voters per node
- **Secure**: RSA-signed batch uploads, encrypted vote storage
- **Easy Setup**: First-boot wizard configures the node automatically

## Requirements

- Raspberry Pi 4 (4GB RAM recommended)
- 16GB+ microSD card (Class 10 or better)
- Ethernet or WiFi network connection

## Quick Start

### 1. Flash the Image

```bash
# Download the image
wget https://releases.tvs.gov/pi/tvs-edge-node-1.0.0.img.xz

# Flash to SD card (replace /dev/sdX with your SD card)
xzcat tvs-edge-node-1.0.0.img.xz | sudo dd of=/dev/sdX bs=4M status=progress
sync
```

### 2. First Boot

1. Insert the SD card into your Raspberry Pi
2. Connect Ethernet (or configure WiFi in `boot/wpa_supplicant.conf`)
3. Power on the Pi
4. Wait for the first-boot configuration to complete (~2 minutes)

### 3. Access the Node

- **Voter Portal**: `http://<pi-ip>/`
- **Admin Panel**: `http://<pi-ip>:8080/`

### 4. Register with Cloud

After first boot, register the node with the central cloud:

```bash
# Get the node's public key
cat /etc/tvs/node-public.pem

# Register with cloud API
curl -X POST https://api.tvs.gov/api/sync/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Precinct 42A",
    "jurisdictionId": "<your-jurisdiction-uuid>",
    "publicKey": "<paste-public-key>"
  }'
```

An administrator must then activate the node in the cloud admin panel.

## Configuration

Configuration is stored in `/etc/tvs/`:

- `config.json` - Main configuration
- `node-id` - Unique node identifier
- `node-private.pem` - Private key for signing
- `node-public.pem` - Public key for verification
- `environment` - Environment variables for services

## Services

| Service | Port | Description |
|---------|------|-------------|
| tvs-api | 3000 | Main voting API |
| tvs-sync | - | Background sync daemon |
| nginx | 80, 8080 | Web server (voter app, admin) |
| postgresql | 5432 | Local database |

### Managing Services

```bash
# Check status
sudo systemctl status tvs-api tvs-sync

# View logs
sudo journalctl -u tvs-api -f
sudo journalctl -u tvs-sync -f

# Restart services
sudo systemctl restart tvs-api tvs-sync
```

## Health Check

Run the built-in health check:

```bash
/opt/tvs/health-check.sh
```

## Storage

- **VeilCloud Data**: `/var/lib/tvs/veilcloud/`
- **Sync Checkpoint**: `/var/lib/tvs/sync-checkpoint.json`
- **Database**: PostgreSQL `tvs_local`

## Troubleshooting

### Node Not Syncing

1. Check cloud connectivity: `curl https://api.tvs.gov/health`
2. Verify node is activated in cloud admin panel
3. Check sync service logs: `journalctl -u tvs-sync -n 100`

### Database Issues

```bash
# Reset database
sudo -u postgres dropdb tvs_local
sudo -u postgres createdb -O tvs tvs_local
sudo -u postgres psql -d tvs_local -f /opt/tvs/schema.sql
sudo -u postgres psql -d tvs_local -f /opt/tvs/edge-sync-schema.sql
```

### Regenerate Node Keys

```bash
sudo /opt/tvs/generate-node-keys.sh
# Then re-register with cloud
```

## Building the Image

To build a new image from source:

```bash
cd pi-image
sudo ./build-image.sh --version 1.0.0
```

Requires a Linux host with:
- `qemu-user-static`
- `wget`, `xz-utils`
- `parted`, `e2fsprogs`

## Security Notes

- The private key (`node-private.pem`) should never be shared
- Change default passwords on first boot
- Keep the Pi on a secured network segment
- Regularly check for firmware updates
