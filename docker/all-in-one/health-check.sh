#!/bin/bash

# Energy Monitor Health Check Script
# Version: 0.1.5

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  Energy Monitor Health Check"
echo "=========================================="

# Check container status
echo ""
echo "[1] Container Status:"
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps

# Check health endpoint
echo ""
echo "[2] API Health Check:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "  Status: HEALTHY (HTTP $HTTP_STATUS)"
    curl -s http://localhost/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost/api/health
else
    echo "  Status: UNHEALTHY (HTTP $HTTP_STATUS)"
fi

# Check frontend
echo ""
echo "[3] Frontend Check:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "  Status: ACCESSIBLE (HTTP $FRONTEND_STATUS)"
else
    echo "  Status: NOT ACCESSIBLE (HTTP $FRONTEND_STATUS)"
fi

# Check logs for errors
echo ""
echo "[4] Recent Error Logs (last 10 lines):"
docker-compose -f "$SCRIPT_DIR/docker-compose.yml" logs --tail=10 2>/dev/null | grep -i "error\|fail\|exception" || echo "  No errors found."

echo ""
echo "=========================================="
echo "  Health Check Complete"
echo "=========================================="
