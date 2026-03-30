#!/bin/bash

# Energy Charge Daily Summary Scheduler
# Version: 0.1.5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Energy Charge Daily Summary Scheduler"
echo "  Version: 0.1.5"
echo "=========================================="

# Create logs directory
mkdir -p logs

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Please install Python 3.7+"
    exit 1
fi

# Check dependencies
echo "Checking dependencies..."
pip install -q pymysql

# Initialize database (optional)
if [ "$1" = "--init" ]; then
    echo "Initializing database..."
    python3 init_db.py
    exit 0
fi

# Run mode
if [ "$1" = "--once" ]; then
    echo "Running task once..."
    python3 daily_summary.py --once
else
    echo "Starting scheduler..."
    echo "Press Ctrl+C to stop"
    python3 daily_summary.py
fi
