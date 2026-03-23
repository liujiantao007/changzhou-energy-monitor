#!/bin/bash

# Energy Monitor Docker Stop Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  Stopping Energy Monitor Service"
echo "=========================================="

# Stop container
echo "Stopping container..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down

echo ""
echo "Service stopped successfully."
echo ""
