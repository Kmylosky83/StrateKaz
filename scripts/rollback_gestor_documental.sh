#!/bin/bash
# Script de Rollback: Gestor Documental N3 → N1
# Autor: Claude (BPM_SPECIALIST)
# Fecha: 2026-01-17

set -e

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKUP_DIR="backups"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar argumento
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debe proporcionar el timestamp del backup${NC}"
    echo "Uso: $0 <timestamp>"
    echo ""
    echo "Backups disponibles:"
    ls -1 "$BACKUP_DIR"/sistema_documental_*.json 2>/dev/null | sed 's/.*sistema_documental_/  - /' | sed 's/\.json//'
    exit 1
fi

TIMESTAMP=$1

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Rollback Gestor Documental N3 → N1${NC}"
echo -e "${YELLOW}Timestamp: $TIMESTAMP${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""

# Verificar que existen los backups
BACKUP_JSON="$BACKUP_DIR/sistema_documental_${TIMESTAMP}.json"
BACKUP_TAR="$BACKUP_DIR/sistema_documental_files_${TIMESTAMP}.tar.gz"

if [ ! -f "$BACKUP_JSON" ]; then
    echo -e "${RED}Error: No se encontró backup JSON: $BACKUP_JSON${NC}"
    exit 1
fi

echo -e "${YELLOW}[PASO 1] Revertir migración de base de datos...${NC}"
python manage.py migrate gestion_documental zero || {
    echo -e "${YELLOW}  ⚠ No hay migraciones que revertir o app no instalada${NC}"
}
echo -e "${GREEN}  ✓ Migraciones revertidas${NC}"

echo -e "${YELLOW}[PASO 2] Restaurar datos desde backup...${NC}"
if [ -f "$BACKUP_JSON" ]; then
    python manage.py loaddata "$BACKUP_JSON" || {
        echo -e "${YELLOW}  ⚠ No se pudieron cargar los datos (normal si no había datos)${NC}"
    }
    echo -e "${GREEN}  ✓ Datos restaurados${NC}"
fi

echo -e "${YELLOW}[PASO 3] Eliminar módulo nuevo...${NC}"
rm -rf "$BACKEND_DIR/apps/gestion_estrategica/gestion_documental"
echo -e "${GREEN}  ✓ Módulo nuevo eliminado${NC}"

echo -e "${YELLOW}[PASO 4] Restaurar archivos originales...${NC}"
if [ -f "$BACKUP_TAR" ]; then
    tar -xzf "$BACKUP_TAR" -C .
    echo -e "${GREEN}  ✓ Archivos originales restaurados${NC}"
fi

echo -e "${YELLOW}[PASO 5] Restaurar service de Identidad...${NC}"
IDENTIDAD_SERVICE="$BACKEND_DIR/apps/gestion_estrategica/identidad/services.py"
if [ -f "$IDENTIDAD_SERVICE.bak" ]; then
    mv "$IDENTIDAD_SERVICE.bak" "$IDENTIDAD_SERVICE"
    echo -e "${GREEN}  ✓ Service de Identidad restaurado${NC}"
fi

echo -e "${YELLOW}[PASO 6] Eliminar archivos frontend nuevos...${NC}"
rm -f "$FRONTEND_DIR/src/features/gestion-estrategica/api/gestionDocumentalApi.ts"
rm -f "$FRONTEND_DIR/src/features/gestion-estrategica/hooks/useGestionDocumental.ts"
rm -f "$FRONTEND_DIR/src/features/gestion-estrategica/types/gestion-documental.types.ts"
rm -f "$FRONTEND_DIR/src/features/gestion-estrategica/pages/GestionDocumentalPage.tsx"
echo -e "${GREEN}  ✓ Archivos frontend eliminados${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Rollback Completado${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}PASOS MANUALES RESTANTES:${NC}"
echo ""
echo "1. Revertir cambios en INSTALLED_APPS (config/settings.py)"
echo "2. Revertir cambios en URLs (apps/hseq_management/urls.py)"
echo "3. Revertir cambios en URLs (apps/gestion_estrategica/urls.py)"
echo "4. Revertir cambios en rutas frontend (src/routes/index.tsx)"
echo "5. Revertir cambios en menú de navegación"
echo ""
echo -e "${GREEN}Sistema restaurado al estado anterior a la migración${NC}"
