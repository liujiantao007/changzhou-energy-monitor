#!/bin/bash

# Energy Monitor Docker Deployment Script
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="energy-monitor"

echo "=========================================="
echo "  Energy Monitor Docker Deployment"
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

# Load environment variables
export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs)

# Build images
echo ""
echo "[1/4] Building Docker images..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" build --no-cache

# Stop existing containers
echo ""
echo "[2/4] Stopping existing containers..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down --remove-orphans

# Start containers
echo ""
echo "[3/4] Starting containers..."
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

# Wait for services to be healthy
echo ""
echo "[4/4] Waiting for services to be healthy..."
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
echo "Services:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:5000"
echo "  - Health Check: http://localhost/api/health"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f $SCRIPT_DIR/docker-compose.yml logs -f"
echo "  - Stop services: ./stop.sh"
echo "  - Health check: ./health-check.sh"
echo ""
