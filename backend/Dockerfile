# Build context: this directory (`docker build backend`).
FROM python:3.10.19-slim-bookworm

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
EXPOSE 8000

# Configuration and credentials are injected at run time; nothing secret is baked in.
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--access-logfile", "-"]
