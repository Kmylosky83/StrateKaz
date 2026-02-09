#!/bin/sh
# =============================================================================
# STRATEKAZ - Backend Entrypoint (Production)
# =============================================================================
# Runs before gunicorn starts:
# 1. Wait for database
# 2. Run migrations
# 3. Collect static files
# 4. Start gunicorn
# =============================================================================

set -e

echo "=== StrateKaz Backend Entrypoint ==="

# ── Wait for database ────────────────────────────────────────────
echo "Waiting for database..."
while ! python -c "
import os, psycopg2
conn = psycopg2.connect(
    dbname=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD'],
    host=os.environ['DB_HOST'],
    port=os.environ.get('DB_PORT', '5432')
)
conn.close()
" 2>/dev/null; do
    echo "  Database not ready, retrying in 2s..."
    sleep 2
done
echo "Database is ready!"

# ── Run migrations ───────────────────────────────────────────────
echo "Running migrations..."
python manage.py migrate_schemas --shared --noinput 2>&1 || {
    echo "WARNING: Shared migration failed, trying standard migrate..."
    python manage.py migrate --noinput 2>&1
}
echo "Migrations complete."

# ── Collect static files ─────────────────────────────────────────
echo "Collecting static files..."
python manage.py collectstatic --noinput 2>&1
echo "Static files collected."

# ── Create log directory ─────────────────────────────────────────
mkdir -p /var/log/stratekaz

echo "=== Starting Gunicorn ==="

# ── Start gunicorn ───────────────────────────────────────────────
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --worker-class gthread \
    --threads "${GUNICORN_THREADS:-2}" \
    --timeout 120 \
    --graceful-timeout 30 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
