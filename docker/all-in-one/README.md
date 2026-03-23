# Energy Monitor - All-in-One Docker Deployment

## Overview

This directory contains Docker configuration files for deploying the Energy Monitor application as a single container with both frontend (Nginx) and backend (Flask API) services.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    Nginx (Port 80)                    │  │
│  │  - Serves static files (HTML/CSS/JS)                 │  │
│  │  - Reverse proxy to Flask API                       │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Flask API (Port 5000)                  │  │
│  │  - Connects to MySQL database                       │  │
│  │  - Provides /api/data endpoint                      │  │
│  │  - Provides /api/health endpoint                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Supervisor                          │  │
│  │  - Manages Nginx and Gunicorn processes             │  │
│  │  - Auto-restart on failure                           │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Single Container**: Frontend and backend in one container
- **Supervisor**: Process management for Nginx and Gunicorn
- **Health Checks**: Built-in container health monitoring
- **Resource Limits**: CPU and memory constraints
- **Security**: Non-root user, minimal privileges
- **Logging**: Centralized log collection

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Build and Run

```bash
# Using Docker Compose
docker-compose up -d

# Or using Docker directly
docker build -t energy-monitor:0.1.5 -f Dockerfile ../..
docker run -d -p 80:80 --env-file .env --name energy-monitor energy-monitor:0.1.5
```

### 3. Verify Deployment

```bash
# Check container status
docker ps

# Check health
curl http://localhost/api/health

# View logs
docker logs energy-monitor
```

## File Structure

```
docker/all-in-one/
├── Dockerfile           # Multi-stage build definition
├── docker-compose.yml   # Docker Compose configuration
├── nginx.conf           # Nginx main configuration
├── default.conf         # Nginx site configuration
├── supervisord.conf     # Supervisor process manager
├── entrypoint.sh        # Container startup script
├── .env.example         # Environment variables template
├── start.sh             # Deployment script (Linux)
├── stop.sh              # Stop script (Linux)
├── restart.sh           # Restart script (Linux)
└── health-check.sh      # Health check script (Linux)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | MySQL host | 10.38.78.217 |
| DB_PORT | MySQL port | 3220 |
| DB_USER | MySQL username | liujiantao |
| DB_PASSWORD | MySQL password | Liujt!@# |
| DB_NAME | Database name | energy_management_2026 |
| TZ | Timezone | Asia/Shanghai |

## Resource Limits

| Resource | Limit | Reservation |
|----------|-------|------------|
| CPU | 2.0 | 0.5 |
| Memory | 1GB | 256MB |

## Health Check

The container includes a health check that:
- Runs every 30 seconds
- Times out after 10 seconds
- Retries 3 times before marking unhealthy
- Checks `/api/health` endpoint

## Logging

Logs are stored in the following locations inside the container:
- `/var/log/nginx/` - Nginx access and error logs
- `/var/log/gunicorn/` - Gunicorn access and error logs
- `/var/log/supervisor/` - Supervisor logs

To view logs:
```bash
# View all logs
docker logs energy-monitor

# View specific service logs
docker exec energy-monitor tail -f /var/log/nginx/app-access.log
docker exec energy-monitor tail -f /var/log/gunicorn/error.log
```

## Security Features

1. **Non-root User**: Application runs as `www-data` user
2. **No New Privileges**: Container cannot gain additional capabilities
3. **Read-only Data**: Data files mounted as read-only
4. **Minimal Base Image**: Uses `python:3.11-slim`

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs energy-monitor

# Check if port is in use
netstat -tulpn | grep :80
```

### Database connection issues
```bash
# Test database connectivity from container
docker exec energy-monitor python -c "
import pymysql
conn = pymysql.connect(host='10.38.78.217', port=3220, user='liujiantao', password='Liujt!@#', database='energy_management_2026')
print('Connected!')
"
```

### Service not responding
```bash
# Check if services are running
docker exec energy-monitor supervisorctl status

# Restart services
docker exec energy-monitor supervisorctl restart all
```

## Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Backup Logs
```bash
# Copy logs from container
docker cp energy-monitor:/var/log ./logs-backup
```

### Clean Up
```bash
# Stop and remove container
docker-compose down

# Remove images
docker rmi energy-monitor:0.1.5
```

## Version

- **Version**: 0.1.5
- **Last Updated**: 2026-03-23
