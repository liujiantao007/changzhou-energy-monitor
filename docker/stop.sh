#!/bin/bash

# Energy Monitor Docker Stop Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  Stopping Energy Monitor Services"
echo "=========================================="

# Stop containers
echo "Stopping containers..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down

echo ""
echo "Services stopped successfully."
echo ""
