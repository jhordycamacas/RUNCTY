# Build context: this directory (`docker build backend`).
# Pinned by tag and by digest (the multi-arch index); bump both together.
FROM python:3.10.19-slim-bookworm@sha256:23f63358922e79a794f71be8f3723c84e5ccca9638af3f74456dc73d6184499e

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings

RUN useradd --create-home --uid 10001 app
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY manage.py ./
COPY config ./config
COPY apps ./apps

USER app

# Cloud Run injects PORT (8080); locally it falls back to 8000, the port docker-compose publishes.
ENV PORT=8000
EXPOSE 8000

# Configuration and credentials are injected at run time; nothing secret is baked in.
# - WEB_CONCURRENCY (read by gunicorn) sets the worker processes; GUNICORN_THREADS the threads each.
# - /dev/shm keeps the heartbeat files in memory, so a read-only root filesystem works.
# - Probe path for orchestrators: GET /api/v1/health (public, no Google calls).
CMD ["sh", "-c", "exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers ${WEB_CONCURRENCY:-2} --threads ${GUNICORN_THREADS:-4} --timeout 60 --graceful-timeout 30 --worker-tmp-dir /dev/shm --access-logfile -"]
