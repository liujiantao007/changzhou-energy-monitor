#!/bin/bash

# Energy Monitor Docker Image Import and Deploy Script
# For Ubuntu 22.04 - Import and deploy from image file
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="energy-monitor"
IMAGE_TAG="0.1.5"
IMAGE_FILE="energy-monitor-0.1.5.tar.gz"
CONTAINER_NAME="energy-monitor"

echo "=========================================="
echo "  Energy Monitor Deployment Script"
echo "  Version: 0.1.5"
echo "  Platform: Ubuntu 22.04"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Check Docker
echo ""
echo "[1/6] Checking Docker environment..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
    docker --version
fi

# Check Docker service
echo ""
echo "[2/6] Checking Docker service..."
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    systemctl start docker
fi
echo "Docker service is running."

# Check image file
echo ""
echo "[3/6] Checking image file..."
if [ ! -f "$SCRIPT_DIR/$IMAGE_FILE" ]; then
    echo "ERROR: Image file not found: $SCRIPT_DIR/$IMAGE_FILE"
    echo "Please copy the image file to this directory."
    exit 1
fi

# Verify checksum
echo ""
echo "Verifying file integrity..."
FILE_SIZE=$(stat -c%s "$SCRIPT_DIR/$IMAGE_FILE")
echo "File size: $FILE_SIZE bytes"

if [ "$FILE_SIZE" -lt 1000000 ]; then
    echo "WARNING: File size seems too small. The file may be corrupted."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Import Docker image
echo ""
echo "[4/6] Importing Docker image..."
echo "This may take a few minutes..."

docker load < "$SCRIPT_DIR/$IMAGE_FILE"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to import Docker image!"
    exit 1
fi

echo "Image imported successfully."

# Verify image
echo ""
echo "Verifying imported image..."
docker images $IMAGE_NAME:$IMAGE_TAG

# Stop existing container
echo ""
echo "[5/6] Stopping existing container..."
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "Existing container removed."
fi

# Check .env file
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Warning: .env file not found, creating from .env.example..."
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        echo "Created .env file. Please edit it with your configuration."
        echo ""
        echo "Edit the file: nano $SCRIPT_DIR/.env"
        echo "Then run: ./deploy-ubuntu.sh"
        exit 0
    fi
fi

# Run container
echo ""
echo "[6/6] Starting container..."

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs)
fi

docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p 80:80 \
    -e DB_HOST="${DB_HOST:-10.38.78.217}" \
    -e DB_PORT="${DB_PORT:-3220}" \
    -e DB_USER="${DB_USER:-liujiantao}" \
    -e DB_PASSWORD="${DB_PASSWORD:-Liujt!@#}" \
    -e DB_NAME="${DB_NAME:-energy_management_2026}" \
    -e TZ="${TZ:-Asia/Shanghai}" \
    --memory="1g" \
    --cpus="2.0" \
    --health-cmd="curl -f http://localhost/api/health || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    $IMAGE_NAME:$IMAGE_TAG

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start container!"
    exit 1
fi

# Wait for container to start
echo ""
echo "Waiting for container to start..."
sleep 10

# Check container status
echo ""
echo "Container status:"
docker ps -f name=$CONTAINER_NAME

# Test health endpoint
echo ""
echo "Testing health endpoint..."
sleep 5
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "Health check: PASSED (HTTP $HEALTH_STATUS)"
else
    echo "Health check: PENDING (HTTP $HEALTH_STATUS)"
    echo "The service may still be starting. Check logs with: docker logs $CONTAINER_NAME"
fi

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Service URL: http://localhost"
echo "API Endpoint: http://localhost/api/data"
echo "Health Check: http://localhost/api/health"
echo ""
echo "Useful commands:"
echo "  - View logs: docker logs -f $CONTAINER_NAME"
echo "  - Stop service: docker stop $CONTAINER_NAME"
echo "  - Start service: docker start $CONTAINER_NAME"
echo "  - Restart service: docker restart $CONTAINER_NAME"
echo "  - Remove container: docker rm -f $CONTAINER_NAME"
echo ""
