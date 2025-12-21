#!/bin/bash
# TVS Development Script
# Starts all services for local development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== TVS Development Environment ==="

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$ROOT_DIR" && pnpm install
fi

# Start PostgreSQL if Docker available
if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL..."
    docker compose -f "$ROOT_DIR/docker/docker-compose.yml" up -d
    sleep 2
fi

# Build packages
echo "Building packages..."
cd "$ROOT_DIR" && pnpm build 2>/dev/null || true

# Start API server
echo ""
echo "Starting TVS API server..."
echo ""
cd "$ROOT_DIR/packages/tvs-api" && pnpm dev &
API_PID=$!

# Wait for API to start
sleep 3

# Start simple HTTP server for UIs
echo ""
echo "Starting UI server..."
echo ""
cd "$ROOT_DIR/apps" && python3 -m http.server 8080 &
UI_PID=$!

echo ""
echo "==================================="
echo "TVS Development Environment Ready!"
echo "==================================="
echo ""
echo "  API:    http://localhost:3000"
echo "  Admin:  http://localhost:8080/admin/"
echo "  Voter:  http://localhost:8080/voter/"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $API_PID 2>/dev/null || true
    kill $UI_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Wait
wait
