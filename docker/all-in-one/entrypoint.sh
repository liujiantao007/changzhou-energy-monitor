#!/bin/bash
set -e

echo "=========================================="
echo "  Energy Monitor All-in-One Container"
echo "  Version: 0.1.5"
echo "=========================================="

echo ""
echo "Environment Configuration:"
echo "  DB_HOST: ${DB_HOST:-10.38.78.217}"
echo "  DB_PORT: ${DB_PORT:-3220}"
echo "  DB_NAME: ${DB_NAME:-energy_management_2026}"
echo "  DB_USER: ${DB_USER:-liujiantao}"
echo ""

mkdir -p /var/log/supervisor /var/log/gunicorn /var/log/nginx /run

chown -R www-data:www-data /var/log/nginx
chown -R www-data:www-data /var/lib/nginx
chown -R www-data:www-data /run

if [ -f /var/run/nginx.pid ]; then
    rm -f /var/run/nginx.pid
fi

echo "Starting services via Supervisor..."
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
