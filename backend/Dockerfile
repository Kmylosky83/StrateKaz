# =============================================================================
# STRATEKAZ - Backend Dockerfile
# =============================================================================
#
# Multi-stage build para optimizar tamaño y seguridad
#
# Stages:
#   1. builder - Instala dependencias
#   2. production - Imagen final optimizada
#
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM python:3.11-slim as builder

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema para compilar paquetes Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements primero (para cache de Docker)
COPY requirements/ requirements/

# Instalar dependencias Python en un virtualenv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalar dependencias base y desarrollo
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements/development.txt


# -----------------------------------------------------------------------------
# STAGE 2: Production
# -----------------------------------------------------------------------------
FROM python:3.11-slim as production

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias de runtime incluyendo WeasyPrint (PDFs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi8 \
    shared-mime-info \
    libcairo2 \
    libglib2.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Crear usuario no-root para seguridad
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Copiar virtualenv desde builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Directorio de trabajo
WORKDIR /app

# Crear directorios necesarios
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R appuser:appgroup /app

# Copiar código de la aplicación
COPY --chown=appuser:appgroup . .

# Cambiar a usuario no-root
USER appuser

# Puerto de la aplicación
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Comando por defecto (será sobrescrito en docker-compose)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
