#!/bin/bash
# =============================================================================
# DEPLOY Sprint 13 + 14 - StrateKaz v4.5.0
# =============================================================================
# Ejecutar en VPS (terminal web Hostinger): copiar y pegar bloque por bloque
#
# Incluye:
# - Sprint 13: TH Reestructuracion, Seleccion, Bug Fixes, GE Audit
# - Sprint 14: Sistema de Gestion, Flujo Documental, Firma Digital, Notificaciones
# - 9 migraciones nuevas
# - Seeds: estructura sidebar, notificaciones firma, iconos
# =============================================================================

set -e

echo "============================================"
echo "  DEPLOY StrateKaz v4.5.0 (Sprint 13+14)"
echo "============================================"

# 1. Pull latest code
echo ""
echo "[1/6] Pulling latest code..."
cd /opt/stratekaz
git pull origin main

# 2. Backend: activate venv + install deps (if any new)
echo ""
echo "[2/6] Setting up backend..."
cd /opt/stratekaz/backend
source venv/bin/activate
pip install -r requirements.txt --quiet

# 3. Run migrations on ALL tenant schemas
echo ""
echo "[3/6] Running migrations on ALL schemas (public + tenants)..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas

# 4. Run seeds on ALL tenant schemas
echo ""
echo "[4/6] Running seeds on ALL tenant schemas..."

DJANGO_SETTINGS_MODULE=config.settings.production python -c "
import django
django.setup()

from django_tenants.utils import schema_context, get_tenant_model
from django.core.management import call_command

TenantModel = get_tenant_model()
tenants = TenantModel.objects.exclude(schema_name='public')

print(f'Found {tenants.count()} tenant(s)')

for tenant in tenants:
    schema = tenant.schema_name
    print(f'\n--- Tenant: {schema} ({tenant.name}) ---')

    with schema_context(schema):
        # 1. Sidebar structure (sistema_gestion module + tab reorg)
        print('  Running seed_estructura_final...')
        call_command('seed_estructura_final', verbosity=0)
        print('  [OK] seed_estructura_final')

        # 2. Notification types (5 new firma types)
        print('  Running seed_notification_types...')
        call_command('seed_notification_types', verbosity=0)
        print('  [OK] seed_notification_types')

        # 3. Icon registry
        print('  Running IconRegistry.cargar_iconos_sistema...')
        from apps.gestion_estrategica.configuracion.views import IconRegistry
        IconRegistry.cargar_iconos_sistema()
        print('  [OK] IconRegistry')

    print(f'  --- {schema}: DONE ---')

print('\nAll tenants seeded successfully!')
"

# 5. Build frontend
echo ""
echo "[5/6] Building frontend v4.5.0..."
cd /opt/stratekaz/frontend
VITE_API_URL=https://app.stratekaz.com/api VITE_BASE_DOMAIN=stratekaz.com npm run build

# 6. Restart services
echo ""
echo "[6/6] Restarting services..."
sudo systemctl restart stratekaz-gunicorn
sudo systemctl restart stratekaz-celery
sudo systemctl restart stratekaz-celerybeat

echo ""
echo "============================================"
echo "  DEPLOY COMPLETE - StrateKaz v4.5.0"
echo "============================================"
echo ""
echo "Verify:"
echo "  - https://app.stratekaz.com (login, check version in footer)"
echo "  - Sistema de Gestion module visible in sidebar"
echo "  - Bell icon shows notification count"
echo "  - Gestion Documental page loads with 4 sections"
echo "  - Firma digital workflow works (firmar/rechazar/delegar)"
echo ""
