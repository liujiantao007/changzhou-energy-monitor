#!/bin/bash

# Energy Monitor Docker Restart Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  Restarting Energy Monitor Services"
echo "=========================================="

# Restart containers
echo "Restarting containers..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" restart

echo ""
echo "Services restarted successfully."
echo ""

# Show status
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps
