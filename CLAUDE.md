# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

### Local development

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend Flask API on port 5000
python app.py

# Start static frontend server on port 65080
python serve_frontend.py
```

Local URLs:

- Frontend: `http://localhost:65080/`
- Backend health check: `http://localhost:5000/api/health`

`serve_frontend.py` maps only the root path `/` to `version2-theme.html`; direct access to `index.html`, `modern-index.html`, `version2-index.html`, and `version2-theme.html` should remain available.

### JavaScript utility checks

There is no configured npm test script. Existing ad-hoc checks are plain Node scripts and assume the frontend server is already running:

```bash
npm install
node test-browser.js
node test-measure-page.js
```

`test-browser.js` checks `http://localhost:65080`. `test-measure-page.js` checks `http://localhost:65081/measure-button-width.html` and is only useful when that page/server is available.

### Docker build and run

Root-level Docker deployment is the main documented path:

```bash
# Build image
docker build -t changzhou-energy-monitor:latest .

# Run with Compose
docker compose up -d

# Inspect
docker ps
docker compose logs -f
curl http://localhost:5000/api/health
curl -I http://localhost:65080/

# Stop
docker compose down
```

Some legacy scripts (`start.sh`, `deploy.sh`) use the older `docker-compose` command. Prefer `docker compose` unless you are intentionally using those scripts on a host that has Compose v1 installed.

### Offline Docker deployment

For building on an internet-connected Ubuntu 22 server and deploying to an offline Ubuntu 22 host, follow `OFFLINE_DOCKER_DEPLOY.md`. The expected flow is:

```bash
docker build -t changzhou-energy-monitor:latest .
docker save changzhou-energy-monitor:latest | gzip > changzhou-energy-monitor_latest.tar.gz
sha256sum changzhou-energy-monitor_latest.tar.gz > changzhou-energy-monitor_latest.tar.gz.sha256
# transfer tar.gz, .sha256, docker-compose.yml, nginx.conf to offline host
gunzip -c changzhou-energy-monitor_latest.tar.gz | docker load
docker compose up -d
```

## Architecture overview

This is a static dashboard frontend plus a Flask API backend for the 常州能耗云运营驾驶舱 system. It is designed for intranet/no-public-internet deployment, so frontend vendor libraries are stored locally under `js/libs/`.

### Backend

- `app.py` defines the Flask app and API routes.
- Database connection defaults are read from environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) with hardcoded fallbacks.
- Main API groups:
  - Energy data and summaries: `/api/data`, `/api/summary_data`, `/api/summary`, `/api/latest_valid_date`
  - Health check: `/api/health`
  - Alarm/event lists: `/api/alarms/latest_day`, `/api/events/latest_day`
  - DFAI query endpoints: `/api/dfai/query`, `/api/dfai/queryDetail`
  - Knowledge base file operations: `/api/knowledge/files`, `/api/knowledge/upload`, `/api/knowledge/delete/<filename>`, `/api/knowledge/download/<filename>`
- `sync_meter_alarm.py` is started by `entrypoint.sh` in scheduled mode inside the Docker container.

### Frontend versions

The project contains multiple dashboard entry pages that share similar layout concepts but use different JS/CSS bundles:

- `index.html` + `js/app.js`: old/original version.
- `modern-index.html` + `js/modern-app.js`: newer intermediate version.
- `version2-index.html` + `js/version2-*.js`: version 2 dashboard.
- `version2-theme.html` + `js/version2-theme.js`: theme-enabled version; this is the default page served at `/` by `serve_frontend.py`.

Version switching logic lives mainly in the corresponding `*-app.js` files and uses `localStorage.version` values such as `old`, `new`, `version2`, and `theme`.

### Version 2/theme frontend modules

The current dashboard work is concentrated in these files:

- `css/version2-style.css`: shared styling and CSS theme variables for version 2/theme pages.
- `js/version2-data.js`: loads API data, transforms backend fields into frontend chart data, and caches the latest chart data for theme re-rendering.
- `js/version2-charts.js`: initializes and updates ECharts pie/line charts.
- `js/version2-map.js`: initializes the Changzhou map, region/grid selectors, map click filtering, map opacity control, and visualMap behavior.
- `js/version2-theme.js`: creates the theme dropdown, applies `data-theme`, persists theme selection in `localStorage`, and updates existing ECharts instances.
- `data/常州区县网格地图.json`: GeoJSON used by the map module.

When changing theme behavior, remember that CSS variables do not affect text drawn inside ECharts canvas. Chart label, legend, axis, visualMap, and map series colors must be updated through ECharts options in JS.

### Docker/runtime layout

Root-level container deployment uses:

- `Dockerfile`: Ubuntu 22 image with nginx, Python 3, pip dependencies, and the full app copied to `/app`.
- `entrypoint.sh`: starts Flask on `5000`, starts alarm sync, then starts nginx.
- `nginx.conf`: listens on `65080`, serves static files from `/app`, and proxies `/api/` to `127.0.0.1:5000`.
- `docker-compose.yml`: runs image `changzhou-energy-monitor:latest` as `energy-monitor-prod` with `network_mode: host`, DB environment variables, and an nginx config bind mount.

There are alternative Docker setups under `docker/` and `docker/all-in-one/`, but the root `Dockerfile` + root `docker-compose.yml` path is the one used by the offline deployment guide.

## Notes for future changes

- Keep `js/libs/echarts.min.js` and `js/libs/xlsx.full.min.js` available for intranet/offline deployments; do not switch the deployed pages back to CDN-only dependencies.
- Because `docker-compose.yml` uses host networking and `nginx.conf` listens on `65080`, the frontend container URL is `http://<host>:65080/`, not port `80`.
- If changing the default homepage behavior, preserve direct access to `/index.html`; remapping `/index.html` to the theme page causes old-version navigation loops.
