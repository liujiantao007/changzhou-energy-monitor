#!/bin/bash

# Energy Monitor All-in-One Docker Deployment Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="energy-monitor"

echo "=========================================="
echo "  Energy Monitor All-in-One Deployment"
echo "  Version: 0.1.5"
echo "=========================================="

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Warning: .env file not found, creating from .env.example..."
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        echo "Created .env file. Please edit it with your configuration."
    else
        echo "Error: .env.example not found!"
        exit 1
    fi
fi

# Build image
echo ""
echo "[1/4] Building Docker image..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" build --no-cache

# Stop existing container
echo ""
echo "[2/4] Stopping existing container..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down --remove-orphans

# Start container
echo ""
echo "[3/4] Starting container..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

# Wait for service to be healthy
echo ""
echo "[4/4] Waiting for service to be healthy..."
sleep 10

# Check health status
echo ""
echo "Checking service health..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Service URL: http://localhost"
echo "Health Check: http://localhost/api/health"
echo "API Endpoint: http://localhost/api/data"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f $SCRIPT_DIR/docker-compose.yml logs -f"
echo "  - Stop service: ./stop.sh"
echo "  - Restart service: ./restart.sh"
echo "  - Health check: ./health-check.sh"
echo ""
