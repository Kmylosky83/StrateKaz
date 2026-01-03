#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Script de Actualización - cPanel
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════════
#
# USO:
#   ./update-produccion.sh [backend|frontend|all|quick]
#
# OPCIONES:
#   backend  - Solo actualiza el backend (git pull, pip, migrate, collectstatic)
#   frontend - Solo mensaje para subir frontend manualmente
#   all      - Backend + Frontend + Reinicio
#   quick    - Solo git pull y reinicio (sin pip ni migrate)
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Detener en caso de error

# ═══════════════════════════════════════════════════
# CONFIGURACIÓN - EDITAR SEGÚN TU CPANEL
# ═══════════════════════════════════════════════════
CPANEL_USER="strat"
SUBDOMINIO="grasas"
DOMINIO_BASE="stratekaz.com"
PYTHON_VERSION="3.9"
GIT_BRANCH="main"

# Rutas derivadas
DOMINIO="${SUBDOMINIO}.${DOMINIO_BASE}"
APP_ROOT="/home/${CPANEL_USER}/${DOMINIO}"
VENV_PATH="/home/${CPANEL_USER}/virtualenv/${DOMINIO}/${PYTHON_VERSION}"
PYTHON="${VENV_PATH}/bin/python"
PIP="${VENV_PATH}/bin/pip"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ═══════════════════════════════════════════════════
# FUNCIONES
# ═══════════════════════════════════════════════════

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo " $1"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

backup_env() {
    echo -e "${YELLOW}▶ Guardando .env...${NC}"
    if [ -f "$APP_ROOT/backend/.env" ]; then
        cp "$APP_ROOT/backend/.env" "$APP_ROOT/backend/.env.backup"
        echo -e "${GREEN}✓ .env respaldado${NC}"
    fi
}

restore_env() {
    if [ -f "$APP_ROOT/backend/.env.backup" ]; then
        mv "$APP_ROOT/backend/.env.backup" "$APP_ROOT/backend/.env"
        echo -e "${GREEN}✓ .env restaurado${NC}"
    fi
}

update_backend() {
    print_header "Actualizando Backend"

    cd "$APP_ROOT"

    # Backup .env antes de git pull
    backup_env

    # Pull cambios de Git
    echo -e "${YELLOW}▶ Descargando cambios de Git...${NC}"
    git fetch origin $GIT_BRANCH
    git reset --hard origin/$GIT_BRANCH
    echo -e "${GREEN}✓ Código actualizado${NC}"

    # Restaurar .env
    restore_env

    # Activar entorno virtual
    echo -e "${YELLOW}▶ Activando virtualenv...${NC}"
    source "${VENV_PATH}/bin/activate"

    # Instalar dependencias
    echo -e "${YELLOW}▶ Actualizando dependencias...${NC}"
    cd backend
    $PIP install -r ../deploy/cpanel/requirements-cpanel.txt --quiet
    echo -e "${GREEN}✓ Dependencias actualizadas${NC}"

    # Ejecutar migraciones
    echo -e "${YELLOW}▶ Ejecutando migraciones...${NC}"
    $PYTHON manage.py migrate --noinput
    echo -e "${GREEN}✓ Migraciones completadas${NC}"

    # Recolectar archivos estáticos
    echo -e "${YELLOW}▶ Recolectando archivos estáticos...${NC}"
    $PYTHON manage.py collectstatic --noinput
    echo -e "${GREEN}✓ Archivos estáticos actualizados${NC}"
}

quick_update() {
    print_header "Actualización Rápida (solo código)"

    cd "$APP_ROOT"

    backup_env

    echo -e "${YELLOW}▶ Descargando cambios de Git...${NC}"
    git fetch origin $GIT_BRANCH
    git reset --hard origin/$GIT_BRANCH
    echo -e "${GREEN}✓ Código actualizado${NC}"

    restore_env
}

update_frontend() {
    print_header "Frontend"

    echo -e "${YELLOW}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║  Para actualizar el frontend:                                                 ║"
    echo "║                                                                               ║"
    echo "║  1. En tu máquina local:                                                      ║"
    echo "║     cd frontend                                                               ║"
    echo "║     echo 'VITE_API_URL=https://${DOMINIO}/api' > .env.production              ║"
    echo "║     npm run build                                                             ║"
    echo "║                                                                               ║"
    echo "║  2. Subir archivos:                                                           ║"
    echo "║     rsync -avz dist/ ${CPANEL_USER}@${DOMINIO_BASE}:~/${DOMINIO}/public_html/ ║"
    echo "║                                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

restart_app() {
    echo -e "${YELLOW}▶ Reiniciando aplicación...${NC}"
    mkdir -p "$APP_ROOT/tmp"
    touch "$APP_ROOT/tmp/restart.txt"
    echo -e "${GREEN}✓ Aplicación reiniciada${NC}"
}

health_check() {
    echo -e "${YELLOW}▶ Verificando estado...${NC}"
    sleep 2

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMINIO}/api/health/" --max-time 10 || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ API respondiendo correctamente (HTTP 200)${NC}"
    else
        echo -e "${RED}⚠ API responde HTTP $HTTP_CODE - verificar logs${NC}"
        echo "  tail -50 $APP_ROOT/backend/logs/django.log"
    fi
}

show_usage() {
    echo "Uso: $0 [backend|frontend|all|quick]"
    echo ""
    echo "Opciones:"
    echo "  backend  - Actualiza backend completo (git, pip, migrate, static)"
    echo "  frontend - Muestra instrucciones para actualizar frontend"
    echo "  all      - Actualiza todo y reinicia"
    echo "  quick    - Solo git pull y reinicio (rápido)"
    echo ""
}

# ═══════════════════════════════════════════════════
# EJECUCIÓN
# ═══════════════════════════════════════════════════

UPDATE_TYPE=${1:-all}

print_header "Actualización - ${DOMINIO}"
echo "Tipo: $UPDATE_TYPE"
echo "Fecha: $(date)"
echo ""

case $UPDATE_TYPE in
    backend)
        update_backend
        restart_app
        health_check
        ;;
    frontend)
        update_frontend
        ;;
    all)
        update_backend
        update_frontend
        restart_app
        health_check
        ;;
    quick)
        quick_update
        restart_app
        health_check
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════"
echo " ✅ Actualización completada"
echo "═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Verifica: https://${DOMINIO}"
echo ""
