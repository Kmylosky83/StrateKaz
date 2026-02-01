#!/bin/bash
# Script de Migración: Gestor Documental N3 → N1
# Autor: Claude (BPM_SPECIALIST)
# Fecha: 2026-01-17

set -e  # Exit on error

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKUP_DIR="backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Migración Gestor Documental N3 → N1${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde el directorio raíz del proyecto${NC}"
    exit 1
fi

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# =====================================================
# FASE 1: BACKUP
# =====================================================
echo -e "${YELLOW}[FASE 1] Creando backups...${NC}"

# Backup de base de datos
echo "  → Backup de datos de sistema_documental..."
python manage.py dumpdata hseq_management.sistema_documental \
    --indent 2 \
    --output "$BACKUP_DIR/sistema_documental_${TIMESTAMP}.json" || {
    echo -e "${YELLOW}  ⚠ No hay datos existentes o el módulo no está instalado${NC}"
}

# Backup de archivos
echo "  → Backup de archivos del módulo..."
if [ -d "$BACKEND_DIR/apps/hseq_management/sistema_documental" ]; then
    tar -czf "$BACKUP_DIR/sistema_documental_files_${TIMESTAMP}.tar.gz" \
        "$BACKEND_DIR/apps/hseq_management/sistema_documental"
    echo -e "${GREEN}  ✓ Backup creado: $BACKUP_DIR/sistema_documental_files_${TIMESTAMP}.tar.gz${NC}"
else
    echo -e "${YELLOW}  ⚠ El módulo origen no existe${NC}"
fi

# =====================================================
# FASE 2: CREAR ESTRUCTURA
# =====================================================
echo -e "${YELLOW}[FASE 2] Creando estructura de directorios...${NC}"

# Backend
mkdir -p "$BACKEND_DIR/apps/gestion_estrategica/gestion_documental/migrations"
mkdir -p "$BACKEND_DIR/apps/gestion_estrategica/gestion_documental/tests"
echo -e "${GREEN}  ✓ Directorios backend creados${NC}"

# Frontend
mkdir -p "$FRONTEND_DIR/src/features/gestion-estrategica/api"
mkdir -p "$FRONTEND_DIR/src/features/gestion-estrategica/hooks"
mkdir -p "$FRONTEND_DIR/src/features/gestion-estrategica/types"
mkdir -p "$FRONTEND_DIR/src/features/gestion-estrategica/pages"
mkdir -p "$FRONTEND_DIR/src/features/gestion-estrategica/components/gestion-documental"
echo -e "${GREEN}  ✓ Directorios frontend creados${NC}"

# =====================================================
# FASE 3: COPIAR ARCHIVOS BACKEND
# =====================================================
echo -e "${YELLOW}[FASE 3] Copiando archivos backend...${NC}"

SOURCE_DIR="$BACKEND_DIR/apps/hseq_management/sistema_documental"
DEST_DIR="$BACKEND_DIR/apps/gestion_estrategica/gestion_documental"

if [ -d "$SOURCE_DIR" ]; then
    # Copiar archivos principales
    for file in __init__.py admin.py apps.py models.py serializers.py urls.py views.py; do
        if [ -f "$SOURCE_DIR/$file" ]; then
            cp "$SOURCE_DIR/$file" "$DEST_DIR/"
            echo "  → Copiado: $file"
        fi
    done

    # Copiar tests
    if [ -d "$SOURCE_DIR/tests" ]; then
        cp -r "$SOURCE_DIR/tests"/* "$DEST_DIR/tests/" 2>/dev/null || true
        echo "  → Copiados: tests"
    fi

    # Crear __init__.py vacíos
    touch "$DEST_DIR/__init__.py"
    touch "$DEST_DIR/migrations/__init__.py"
    touch "$DEST_DIR/tests/__init__.py"

    echo -e "${GREEN}  ✓ Archivos backend copiados${NC}"
else
    echo -e "${RED}  ✗ Error: Directorio origen no existe${NC}"
    exit 1
fi

# =====================================================
# FASE 4: ACTUALIZAR IMPORTS EN BACKEND
# =====================================================
echo -e "${YELLOW}[FASE 4] Actualizando imports en backend...${NC}"

# Actualizar referencias al módulo
find "$DEST_DIR" -name "*.py" -type f -exec sed -i \
    's/apps\.hseq_management\.sistema_documental/apps.gestion_estrategica.gestion_documental/g' {} +

# Actualizar apps.py
cat > "$DEST_DIR/apps.py" << 'EOF'
from django.apps import AppConfig


class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_documental'
    verbose_name = 'Gestión Documental'

    def ready(self):
        """Importar signals si los hay"""
        pass
EOF

# Actualizar app_name en urls.py
sed -i "s/app_name = 'sistema_documental'/app_name = 'gestion_documental'/g" "$DEST_DIR/urls.py"

echo -e "${GREEN}  ✓ Imports actualizados en backend${NC}"

# =====================================================
# FASE 5: ELIMINAR FIRMA DOCUMENTO DE VIEWS Y SERIALIZERS
# =====================================================
echo -e "${YELLOW}[FASE 5] Eliminando referencias a FirmaDocumento...${NC}"

# En views.py
if [ -f "$DEST_DIR/views.py" ]; then
    # Comentar import de FirmaDocumento
    sed -i 's/^    FirmaDocumento,$/    # FirmaDocumento,  # ELIMINADO - usar FirmaDigital de workflow_engine/g' "$DEST_DIR/views.py"
    sed -i 's/^    FirmaDocumentoViewSet,$/    # FirmaDocumentoViewSet,  # ELIMINADO/g' "$DEST_DIR/views.py"

    # Comentar registro en router
    sed -i "s/^router\.register(r'firmas'/# router.register(r'firmas'  # ELIMINADO/g" "$DEST_DIR/urls.py"

    echo "  → FirmaDocumento eliminado de views y urls"
fi

# En serializers.py (si existe)
if [ -f "$DEST_DIR/serializers.py" ]; then
    sed -i 's/^from \.models import.*FirmaDocumento/# FirmaDocumento eliminado - usar FirmaDigital/g' "$DEST_DIR/serializers.py"
    echo "  → FirmaDocumento eliminado de serializers"
fi

echo -e "${GREEN}  ✓ Referencias a FirmaDocumento eliminadas${NC}"

# =====================================================
# FASE 6: COPIAR ARCHIVOS FRONTEND
# =====================================================
echo -e "${YELLOW}[FASE 6] Copiando archivos frontend...${NC}"

FRONTEND_SOURCE="$FRONTEND_DIR/src/features/hseq"
FRONTEND_DEST="$FRONTEND_DIR/src/features/gestion-estrategica"

# API
if [ -f "$FRONTEND_SOURCE/api/sistemaDocumentalApi.ts" ]; then
    cp "$FRONTEND_SOURCE/api/sistemaDocumentalApi.ts" \
       "$FRONTEND_DEST/api/gestionDocumentalApi.ts"
    echo "  → Copiado: gestionDocumentalApi.ts"
fi

# Hooks
if [ -f "$FRONTEND_SOURCE/hooks/useSistemaDocumental.ts" ]; then
    cp "$FRONTEND_SOURCE/hooks/useSistemaDocumental.ts" \
       "$FRONTEND_DEST/hooks/useGestionDocumental.ts"
    echo "  → Copiado: useGestionDocumental.ts"
fi

# Types
if [ -f "$FRONTEND_SOURCE/types/sistema-documental.types.ts" ]; then
    cp "$FRONTEND_SOURCE/types/sistema-documental.types.ts" \
       "$FRONTEND_DEST/types/gestion-documental.types.ts"
    echo "  → Copiado: gestion-documental.types.ts"
fi

# Pages
if [ -f "$FRONTEND_SOURCE/pages/SistemaDocumentalPage.tsx" ]; then
    cp "$FRONTEND_SOURCE/pages/SistemaDocumentalPage.tsx" \
       "$FRONTEND_DEST/pages/GestionDocumentalPage.tsx"
    echo "  → Copiado: GestionDocumentalPage.tsx"
fi

echo -e "${GREEN}  ✓ Archivos frontend copiados${NC}"

# =====================================================
# FASE 7: ACTUALIZAR IMPORTS EN FRONTEND
# =====================================================
echo -e "${YELLOW}[FASE 7] Actualizando imports en frontend...${NC}"

# Actualizar API
if [ -f "$FRONTEND_DEST/api/gestionDocumentalApi.ts" ]; then
    sed -i "s|/hseq/sistema-documental|/gestion-estrategica/gestion-documental|g" \
        "$FRONTEND_DEST/api/gestionDocumentalApi.ts"
    sed -i "s|sistemaDocumentalApi|gestionDocumentalApi|g" \
        "$FRONTEND_DEST/api/gestionDocumentalApi.ts"
    echo "  → Actualizado: gestionDocumentalApi.ts"
fi

# Actualizar Hooks
if [ -f "$FRONTEND_DEST/hooks/useGestionDocumental.ts" ]; then
    sed -i "s|../api/sistemaDocumentalApi|../api/gestionDocumentalApi|g" \
        "$FRONTEND_DEST/hooks/useGestionDocumental.ts"
    sed -i "s|sistema-documental|gestion-documental|g" \
        "$FRONTEND_DEST/hooks/useGestionDocumental.ts"
    sed -i "s|useSistemaDocumental|useGestionDocumental|g" \
        "$FRONTEND_DEST/hooks/useGestionDocumental.ts"
    echo "  → Actualizado: useGestionDocumental.ts"
fi

# Actualizar Types (eliminar FirmaDocumento)
if [ -f "$FRONTEND_DEST/types/gestion-documental.types.ts" ]; then
    # Crear backup del archivo original
    cp "$FRONTEND_DEST/types/gestion-documental.types.ts" \
       "$FRONTEND_DEST/types/gestion-documental.types.ts.bak"

    echo "  → Types actualizados (revisar manualmente para eliminar FirmaDocumento)"
fi

echo -e "${GREEN}  ✓ Imports frontend actualizados${NC}"

# =====================================================
# FASE 8: ACTUALIZAR INTEGRACIÓN CON IDENTIDAD
# =====================================================
echo -e "${YELLOW}[FASE 8] Actualizando integración con Identidad...${NC}"

IDENTIDAD_SERVICE="$BACKEND_DIR/apps/gestion_estrategica/identidad/services.py"

if [ -f "$IDENTIDAD_SERVICE" ]; then
    # Backup
    cp "$IDENTIDAD_SERVICE" "$IDENTIDAD_SERVICE.bak"

    # Actualizar referencias
    sed -i "s/sistema_documental/gestion_documental/g" "$IDENTIDAD_SERVICE"

    echo -e "${GREEN}  ✓ Integración con Identidad actualizada${NC}"
    echo -e "${YELLOW}  ⚠ Revisar manualmente: $IDENTIDAD_SERVICE${NC}"
else
    echo -e "${YELLOW}  ⚠ No se encontró services.py en Identidad${NC}"
fi

# =====================================================
# FASE 9: CREAR MIGRACIÓN INICIAL
# =====================================================
echo -e "${YELLOW}[FASE 9] Creando migración de base de datos...${NC}"

# Crear migración inicial vacía
cat > "$DEST_DIR/migrations/0001_migrate_from_hseq.py" << 'EOF'
# Generated migration for Gestor Documental N3 → N1

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Migración de Sistema Documental desde HSEQ Management a Gestión Estratégica.

    Esta migración:
    1. NO renombra tablas (mantiene db_table='documental_*')
    2. Crea los modelos en la nueva app
    3. Mantiene compatibilidad de datos
    4. ELIMINA modelo FirmaDocumento (usar FirmaDigital de workflow_engine)

    IMPORTANTE: Las tablas de BD NO cambian de nombre, solo cambia la app Django.
    """

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Los modelos se crean en models.py con db_table='documental_*'
        # No hay operaciones SQL necesarias
    ]
EOF

echo -e "${GREEN}  ✓ Migración inicial creada${NC}"

# =====================================================
# FASE 10: RESUMEN Y PASOS MANUALES
# =====================================================
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Migración Automatizada Completada${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}PASOS MANUALES RESTANTES:${NC}"
echo ""
echo "1. BACKEND - Actualizar INSTALLED_APPS en config/settings.py:"
echo "   - Agregar: 'apps.gestion_estrategica.gestion_documental',"
echo "   - Comentar/Eliminar: 'apps.hseq_management.sistema_documental',"
echo ""
echo "2. BACKEND - Actualizar apps/hseq_management/urls.py:"
echo "   - Comentar/Eliminar línea: path('sistema-documental/', ...)"
echo ""
echo "3. BACKEND - Actualizar apps/gestion_estrategica/urls.py:"
echo "   - Agregar: path('gestion-documental/', include('apps.gestion_estrategica.gestion_documental.urls')),"
echo ""
echo "4. BACKEND - Ejecutar migraciones:"
echo "   $ python manage.py makemigrations gestion_documental"
echo "   $ python manage.py migrate gestion_documental"
echo ""
echo "5. BACKEND - Eliminar referencias a FirmaDocumento en:"
echo "   - $DEST_DIR/views.py (buscar comentarios # ELIMINADO)"
echo "   - $DEST_DIR/serializers.py"
echo "   - $DEST_DIR/models.py (eliminar clase FirmaDocumento completa)"
echo ""
echo "6. FRONTEND - Actualizar rutas en src/routes/index.tsx:"
echo "   - Mover ruta de /hseq a /gestion-estrategica"
echo ""
echo "7. FRONTEND - Actualizar menú de navegación:"
echo "   - Mover 'Gestión Documental' de sección HSEQ a Gestión Estratégica"
echo ""
echo "8. FRONTEND - Revisar y actualizar imports en archivos copiados:"
echo "   - $FRONTEND_DEST/api/gestionDocumentalApi.ts"
echo "   - $FRONTEND_DEST/hooks/useGestionDocumental.ts"
echo "   - $FRONTEND_DEST/types/gestion-documental.types.ts (eliminar FirmaDocumento)"
echo "   - $FRONTEND_DEST/pages/GestionDocumentalPage.tsx"
echo ""
echo "9. TESTING:"
echo "   $ python manage.py test apps.gestion_estrategica.gestion_documental"
echo "   $ npm run test -- gestion-documental"
echo ""
echo "10. VERIFICAR INTEGRACIÓN CON IDENTIDAD:"
echo "    - Probar envío de política a documental"
echo "    - Verificar creación de documento con código correcto"
echo ""
echo -e "${YELLOW}BACKUPS CREADOS:${NC}"
echo "  → $BACKUP_DIR/sistema_documental_${TIMESTAMP}.json"
echo "  → $BACKUP_DIR/sistema_documental_files_${TIMESTAMP}.tar.gz"
echo "  → $IDENTIDAD_SERVICE.bak (si existe)"
echo ""
echo -e "${GREEN}Para revertir la migración, ejecuta:${NC}"
echo "  $ ./scripts/rollback_gestor_documental.sh $TIMESTAMP"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}¡Migración lista para pasos manuales!${NC}"
echo -e "${GREEN}=========================================${NC}"
