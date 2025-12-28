#!/bin/bash
# TVS Edge Node Health Check Script
# Use with monitoring tools or cron

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
CLOUD_URL="${CLOUD_URL:-https://api.tvs.gov}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

check_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

echo "=== TVS Edge Node Health Check ==="
echo "Timestamp: $(date -Iseconds)"
echo ""

# Check local API
echo "Checking local API..."
if curl -sf "$API_URL/health" > /dev/null 2>&1; then
    HEALTH=$(curl -sf "$API_URL/health")
    check_ok "Local API is running"
    echo "  Response: $HEALTH"
else
    check_fail "Local API is not responding"
fi

echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    check_ok "PostgreSQL is running"
else
    check_fail "PostgreSQL is not running"
fi

echo ""

# Check nginx
echo "Checking Nginx..."
if systemctl is-active --quiet nginx; then
    check_ok "Nginx is running"
else
    check_fail "Nginx is not running"
fi

echo ""

# Check TVS services
echo "Checking TVS services..."
if systemctl is-active --quiet tvs-api; then
    check_ok "tvs-api is running"
else
    check_fail "tvs-api is not running"
fi

if systemctl is-active --quiet tvs-sync; then
    check_ok "tvs-sync is running"
else
    check_warn "tvs-sync is not running"
fi

echo ""

# Check cloud connectivity
echo "Checking cloud connectivity..."
if curl -sf "$CLOUD_URL/health" > /dev/null 2>&1; then
    check_ok "Cloud API is reachable"
else
    check_warn "Cloud API is not reachable (sync will queue locally)"
fi

echo ""

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [[ $DISK_USAGE -lt 80 ]]; then
    check_ok "Disk usage: ${DISK_USAGE}%"
elif [[ $DISK_USAGE -lt 90 ]]; then
    check_warn "Disk usage: ${DISK_USAGE}% (consider cleanup)"
else
    check_fail "Disk usage: ${DISK_USAGE}% (critical!)"
fi

# Check VeilCloud storage
VEILCLOUD_SIZE=$(du -sh /var/lib/tvs/veilcloud 2>/dev/null | cut -f1 || echo "0")
echo "  VeilCloud data: $VEILCLOUD_SIZE"

echo ""

# Check memory
echo "Checking memory..."
MEM_FREE=$(free -m | awk 'NR==2 {print $7}')
MEM_TOTAL=$(free -m | awk 'NR==2 {print $2}')
MEM_USED_PCT=$((100 - (MEM_FREE * 100 / MEM_TOTAL)))
if [[ $MEM_USED_PCT -lt 80 ]]; then
    check_ok "Memory usage: ${MEM_USED_PCT}% (${MEM_FREE}MB free)"
else
    check_warn "Memory usage: ${MEM_USED_PCT}% (${MEM_FREE}MB free)"
fi

echo ""

# Check sync status
echo "Checking sync status..."
if [[ -f /etc/tvs/node-id ]]; then
    NODE_ID=$(cat /etc/tvs/node-id)
    SYNC_STATUS=$(curl -sf "$API_URL/api/sync/status/$NODE_ID" 2>/dev/null || echo '{"error": "unavailable"}')
    if echo "$SYNC_STATUS" | grep -q '"error"'; then
        check_warn "Could not retrieve sync status"
    else
        PENDING=$(echo "$SYNC_STATUS" | jq -r '.pendingVotes // 0')
        LAST_SYNC=$(echo "$SYNC_STATUS" | jq -r '.lastSyncAt // "never"')
        if [[ "$PENDING" == "0" ]]; then
            check_ok "Sync: All votes synced"
        else
            check_warn "Sync: $PENDING votes pending"
        fi
        echo "  Last sync: $LAST_SYNC"
    fi
else
    check_warn "Node not configured (no node-id)"
fi

echo ""
echo "=== Health Check Complete ==="
