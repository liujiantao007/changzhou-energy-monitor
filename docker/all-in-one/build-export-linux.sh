#!/bin/bash

# Energy Monitor Docker Image Build Script
# For Linux (with internet connection) - Build and export for offline deployment
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IMAGE_NAME="energy-monitor"
IMAGE_TAG="0.1.5"
OUTPUT_FILE="energy-monitor-0.1.5.tar.gz"

echo "=========================================="
echo "  Energy Monitor Docker Image Builder"
echo "  Version: 0.1.5"
echo "  Platform: Linux"
echo "=========================================="
echo ""
echo "Project root: $PROJECT_ROOT"
echo "Script dir: $SCRIPT_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Checking for sudo access..."
    SUDO="sudo"
else
    SUDO=""
fi

# Check Docker
echo "[1/6] Checking Docker environment..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    $SUDO apt-get update
    $SUDO apt-get install -y ca-certificates curl gnupg lsb-release
    $SUDO mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
    $SUDO apt-get update
    $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    $SUDO systemctl enable docker
    $SUDO systemctl start docker
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
    docker --version
fi

# Check Docker service
echo ""
echo "[2/6] Checking Docker service..."
if ! $SUDO systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    $SUDO systemctl start docker
fi
echo "Docker service is running."

# Check project files
echo ""
echo "[3/6] Checking project files..."
REQUIRED_FILES=(
    "$PROJECT_ROOT/app.py"
    "$PROJECT_ROOT/requirements.txt"
    "$PROJECT_ROOT/index.html"
    "$PROJECT_ROOT/css"
    "$PROJECT_ROOT/js"
    "$SCRIPT_DIR/Dockerfile"
    "$SCRIPT_DIR/nginx.conf"
    "$SCRIPT_DIR/default.conf"
    "$SCRIPT_DIR/supervisord.conf"
    "$SCRIPT_DIR/entrypoint.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "ERROR: Required file not found: $file"
        exit 1
    fi
done
echo "All required files found."

# Check .env file
echo ""
echo "[4/6] Checking configuration..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Warning: .env file not found, creating from .env.example..."
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        echo "Created .env file. Please edit it with your configuration."
    fi
fi

# Build Docker image
echo ""
echo "[5/6] Building Docker image..."
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo "Context: $PROJECT_ROOT"
echo "Dockerfile: $SCRIPT_DIR/Dockerfile"
echo ""

cd "$PROJECT_ROOT"
$SUDO docker build -t $IMAGE_NAME:$IMAGE_TAG -f "$SCRIPT_DIR/Dockerfile" .

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build Docker image!"
    exit 1
fi

echo ""
echo "Image built successfully."

# Verify image
echo ""
echo "Verifying image..."
$SUDO docker images $IMAGE_NAME:$IMAGE_TAG

# Export image
echo ""
echo "[6/6] Exporting image to file..."
echo "Output: $SCRIPT_DIR/$OUTPUT_FILE"

cd "$SCRIPT_DIR"
$SUDO docker save $IMAGE_NAME:$IMAGE_TAG | gzip > $OUTPUT_FILE

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to export image!"
    exit 1
fi

# Set permissions
chmod 644 $OUTPUT_FILE

# Calculate checksum
echo ""
echo "Calculating checksums..."
echo ""
echo "MD5:"
md5sum $OUTPUT_FILE

echo ""
echo "SHA256:"
sha256sum $OUTPUT_FILE

# Get file size
FILE_SIZE=$(stat -c%s "$OUTPUT_FILE")
FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))

echo ""
echo "=========================================="
echo "  Build and Export Complete!"
echo "=========================================="
echo ""
echo "Output file: $SCRIPT_DIR/$OUTPUT_FILE"
echo "File size: ${FILE_SIZE_MB} MB"
echo ""
echo "Files to transfer to offline Ubuntu server:"
echo "  1. $OUTPUT_FILE (Docker image)"
echo "  2. deploy-ubuntu.sh (Deployment script)"
echo "  3. .env (Environment configuration)"
echo ""
echo "Next steps:"
echo "  1. Copy files to Ubuntu server (via USB or network)"
echo "  2. On Ubuntu server: chmod +x deploy-ubuntu.sh"
echo "  3. On Ubuntu server: sudo ./deploy-ubuntu.sh"
echo ""
