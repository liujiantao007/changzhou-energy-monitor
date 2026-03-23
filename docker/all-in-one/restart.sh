#!/bin/bash

# Energy Monitor Docker Restart Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  Restarting Energy Monitor Service"
echo "=========================================="

# Restart container
echo "Restarting container..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" restart

sleep 5

echo ""
echo "Service restarted successfully."
echo ""

# Show status
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps
