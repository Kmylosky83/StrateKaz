#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Script de Actualización Rápida para Staging
# Sistema de Gestión - Grasas y Huesos del Norte
#
# Uso: ./update-staging.sh [backend|frontend|all]
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Configuración - AJUSTAR SEGÚN TU CPANEL
USUARIO="usuario"  # Tu usuario de cPanel
DOMINIO="grasas.stratekaz.com"
APP_ROOT="/home/$USUARIO/$DOMINIO"
VENV_PATH="/home/$USUARIO/virtualenv/$DOMINIO/3.9/bin"
PYTHON="$VENV_PATH/python"
PIP="$VENV_PATH/pip"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo " Actualización de Staging - Grasas y Huesos del Norte"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Determinar qué actualizar
UPDATE_TYPE=${1:-all}

update_backend() {
    echo -e "${YELLOW}📦 Actualizando Backend...${NC}"

    cd "$APP_ROOT"

    # Pull cambios de Git
    echo "  → Descargando cambios de Git..."
    git pull origin main

    # Activar entorno virtual e instalar dependencias
    echo "  → Verificando dependencias..."
    source "$VENV_PATH/activate"
    cd backend
    $PIP install -r requirements.txt --quiet

    # Ejecutar migraciones si hay
    echo "  → Ejecutando migraciones..."
    $PYTHON manage.py migrate --noinput

    # Recolectar archivos estáticos
    echo "  → Recolectando archivos estáticos..."
    $PYTHON manage.py collectstatic --noinput --clear

    echo -e "${GREEN}  ✓ Backend actualizado${NC}"
}

update_frontend() {
    echo -e "${YELLOW}🎨 Actualizando Frontend...${NC}"

    cd "$APP_ROOT"

    # Si ya hiciste pull en backend, no es necesario aquí
    if [ "$UPDATE_TYPE" == "frontend" ]; then
        echo "  → Descargando cambios de Git..."
        git pull origin main
    fi

    # Copiar archivos del frontend build a public_html
    # NOTA: Esto asume que haces el build localmente y subes los archivos
    # Si quieres hacer build en el servidor:

    # cd frontend
    # npm install --silent
    # npm run build
    # cp -r dist/* "$APP_ROOT/public_html/"

    echo -e "${GREEN}  ✓ Frontend actualizado${NC}"
    echo -e "${YELLOW}  ⚠ NOTA: Si hay cambios en frontend, sube los archivos del build a public_html${NC}"
}

restart_app() {
    echo -e "${YELLOW}🔄 Reiniciando aplicación...${NC}"

    # Crear archivo tmp/restart.txt para que Passenger reinicie
    mkdir -p "$APP_ROOT/tmp"
    touch "$APP_ROOT/tmp/restart.txt"

    echo -e "${GREEN}  ✓ Aplicación reiniciada${NC}"
}

# Ejecutar según el tipo de actualización
case $UPDATE_TYPE in
    backend)
        update_backend
        restart_app
        ;;
    frontend)
        update_frontend
        ;;
    all)
        update_backend
        update_frontend
        restart_app
        ;;
    *)
        echo -e "${RED}Uso: $0 [backend|frontend|all]${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════"
echo " ✅ Actualización completada"
echo "═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Verifica el sitio en: https://$DOMINIO"
echo ""
