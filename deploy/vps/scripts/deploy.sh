#!/bin/bash
# Script de deploy/update para StrateKaz
# /var/www/stratekaz/deploy.sh
#
# Uso: ./deploy.sh [--no-migrate] [--no-build]
#
# Opciones:
#   --no-migrate    Salta las migraciones de Django
#   --no-build      Salta el build del frontend

set -e

# Configuración
APP_DIR="/var/www/stratekaz"
REPO_DIR="$APP_DIR/repo"
VENV_DIR="$APP_DIR/venv"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$REPO_DIR/backend"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Flags
DO_MIGRATE=true
DO_BUILD=true

# Parse arguments
for arg in "$@"; do
    case $arg in
        --no-migrate)
            DO_MIGRATE=false
            ;;
        --no-build)
            DO_BUILD=false
            ;;
    esac
done

echo -e "${BLUE}=========================================="
echo "Deploy StrateKaz - $(date)"
echo "==========================================${NC}"

# Activar virtual environment
echo -e "${YELLOW}Activando virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

# Pull últimos cambios
echo ""
echo -e "${YELLOW}Obteniendo últimos cambios de Git...${NC}"
cd "$REPO_DIR"
git fetch origin
git pull origin main

# Instalar dependencias Python
echo ""
echo -e "${YELLOW}Instalando dependencias Python...${NC}"
cd "$BACKEND_DIR"
pip install -r requirements.txt --quiet

# Migraciones
if [ "$DO_MIGRATE" = true ]; then
    echo ""
    echo -e "${YELLOW}Ejecutando migraciones...${NC}"
    python manage.py migrate --noinput
else
    echo -e "${YELLOW}SKIP: Migraciones${NC}"
fi

# Archivos estáticos
echo ""
echo -e "${YELLOW}Recopilando archivos estáticos...${NC}"
python manage.py collectstatic --noinput --clear

# Build frontend
if [ "$DO_BUILD" = true ]; then
    echo ""
    echo -e "${YELLOW}Construyendo frontend...${NC}"
    cd "$REPO_DIR/frontend"
    npm install --silent
    npm run build

    echo -e "${YELLOW}Copiando build a directorio web...${NC}"
    rm -rf "$FRONTEND_DIR"/*
    cp -r dist/* "$FRONTEND_DIR/"
else
    echo -e "${YELLOW}SKIP: Build frontend${NC}"
fi

# Reiniciar servicios
echo ""
echo -e "${YELLOW}Reiniciando servicios...${NC}"
sudo supervisorctl restart stratekaz-gunicorn
sudo supervisorctl restart stratekaz-celery
sudo supervisorctl restart stratekaz-celerybeat

# Verificar estado
echo ""
echo -e "${YELLOW}Estado de servicios:${NC}"
sudo supervisorctl status

# Limpiar cache de Python
echo ""
echo -e "${YELLOW}Limpiando cache...${NC}"
find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$BACKEND_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true

echo ""
echo -e "${GREEN}=========================================="
echo "Deploy completado: $(date)"
echo "==========================================${NC}"
