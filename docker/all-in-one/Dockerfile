FROM python:3.11-slim

LABEL maintainer="Energy Monitor Team"
LABEL version="0.1.5"
LABEL description="All-in-one Energy Monitoring System (Frontend + Backend)"

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY app.py .
COPY index.html /var/www/html/
COPY css/ /var/www/html/css/
COPY js/ /var/www/html/js/
COPY data/ /var/www/html/data/
COPY lib/ /var/www/html/lib/

COPY docker/all-in-one/nginx.conf /etc/nginx/nginx.conf
COPY docker/all-in-one/default.conf /etc/nginx/sites-available/default
COPY docker/all-in-one/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/all-in-one/entrypoint.sh /entrypoint.sh

RUN mkdir -p /var/log/supervisor \
    && mkdir -p /var/log/gunicorn \
    && mkdir -p /var/log/nginx \
    && chown -R appuser:appgroup /app \
    && chown -R appuser:appgroup /var/www/html \
    && chown -R appuser:appgroup /var/log \
    && chown -R appuser:appgroup /var/lib/nginx \
    && chown -R appuser:appgroup /run \
    && chmod +x /entrypoint.sh

RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
