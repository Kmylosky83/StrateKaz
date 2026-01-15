#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SCRIPT DE CREACIÓN DE NUEVA INSTANCIA - cPanel Multi-Instancia
# Sistema de Gestión Integral - StrateKaz v3.3.0
# ═══════════════════════════════════════════════════════════════════════════════
#
# Este script crea una nueva instancia completa para una empresa.
#
# USO:
#   ./create-instance.sh <nombre_empresa> [opciones]
#
# EJEMPLO:
#   ./create-instance.sh acme
#   ./create-instance.sh acme --admin-email=admin@acme.com
#   ./create-instance.sh acme --dry-run
#
# PREREQUISITOS:
#   - Acceso SSH al servidor cPanel
#   - Usuario cPanel con permisos para crear subdominios y bases de datos
#   - Código base de StrateKaz disponible
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Detener en caso de error

# ═══════════════════════════════════════════════════
# CONFIGURACIÓN BASE - EDITAR SEGÚN TU SERVIDOR
# ═══════════════════════════════════════════════════
CPANEL_USER="strat"
DOMINIO_BASE="stratekaz.com"
PYTHON_VERSION="3.11"
REPO_URL="https://github.com/tu-org/stratekaz.git"
SHARED_CODE_PATH="/home/${CPANEL_USER}/stratekaz-base"

# ═══════════════════════════════════════════════════
# PARSEO DE ARGUMENTOS
# ═══════════════════════════════════════════════════
EMPRESA=""
ADMIN_EMAIL=""
DRY_RUN=false
SKIP_FRONTEND=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --admin-email=*)
            ADMIN_EMAIL="${1#*=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --help|-h)
            echo "Uso: $0 <nombre_empresa> [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --admin-email=EMAIL   Email del administrador"
            echo "  --dry-run             Simular sin ejecutar cambios"
            echo "  --skip-frontend       No copiar frontend"
            echo "  --help                Mostrar esta ayuda"
            exit 0
            ;;
        *)
            if [ -z "$EMPRESA" ]; then
                EMPRESA="$1"
            fi
            shift
            ;;
    esac
done

# Validar nombre de empresa
if [ -z "$EMPRESA" ]; then
    echo "Error: Debe especificar el nombre de la empresa"
    echo "Uso: $0 <nombre_empresa> [opciones]"
    exit 1
fi

# Normalizar nombre (minúsculas, sin espacios)
EMPRESA=$(echo "$EMPRESA" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -cd 'a-z0-9_')

# Variables derivadas
SUBDOMINIO="${EMPRESA}"
DOMINIO="${SUBDOMINIO}.${DOMINIO_BASE}"
APP_ROOT="/home/${CPANEL_USER}/${DOMINIO}"
VENV_PATH="/home/${CPANEL_USER}/virtualenv/${DOMINIO}/${PYTHON_VERSION}"
DB_NAME="strat_${EMPRESA}_db"
DB_USER="strat_${EMPRESA}"
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
ADMIN_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)

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

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY-RUN] $1"
    else
        eval "$1"
    fi
}

# ═══════════════════════════════════════════════════
# INICIO DEL SCRIPT
# ═══════════════════════════════════════════════════

print_header "CREACIÓN DE NUEVA INSTANCIA: ${EMPRESA}"

echo ""
echo "Configuración:"
echo "  Empresa:     ${EMPRESA}"
echo "  Dominio:     ${DOMINIO}"
echo "  Directorio:  ${APP_ROOT}"
echo "  Base datos:  ${DB_NAME}"
echo "  Usuario BD:  ${DB_USER}"
echo ""

if [ "$DRY_RUN" = true ]; then
    print_info "MODO DRY-RUN: No se ejecutarán cambios reales"
    echo ""
fi

# Confirmar
if [ "$DRY_RUN" = false ]; then
    read -p "¿Continuar con la creación? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

# ═══════════════════════════════════════════════════
# PASO 1: Verificar que no existe
# ═══════════════════════════════════════════════════
print_header "Paso 1: Verificaciones"

if [ -d "$APP_ROOT" ] && [ "$DRY_RUN" = false ]; then
    print_error "El directorio ${APP_ROOT} ya existe"
    exit 1
fi
print_success "Directorio disponible"

# ═══════════════════════════════════════════════════
# PASO 2: Crear subdominio (manual en cPanel)
# ═══════════════════════════════════════════════════
print_header "Paso 2: Crear Subdominio"

print_info "Crear subdominio manualmente en cPanel:"
echo "  1. Ir a cPanel > Subdominios"
echo "  2. Crear: ${SUBDOMINIO}"
echo "  3. Raíz del documento: ${APP_ROOT}"
echo ""

if [ "$DRY_RUN" = false ]; then
    read -p "¿Subdominio creado? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Crear el subdominio primero."
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════
# PASO 3: Crear base de datos
# ═══════════════════════════════════════════════════
print_header "Paso 3: Crear Base de Datos"

print_info "Crear base de datos manualmente en cPanel:"
echo "  1. Ir a cPanel > Bases de datos MySQL"
echo "  2. Crear BD: ${DB_NAME}"
echo "  3. Crear usuario: ${DB_USER}"
echo "  4. Password: ${DB_PASS}"
echo "  5. Asignar usuario a BD con TODOS los privilegios"
echo ""

if [ "$DRY_RUN" = false ]; then
    read -p "¿Base de datos creada? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Crear la base de datos primero."
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════
# PASO 4: Configurar Python App
# ═══════════════════════════════════════════════════
print_header "Paso 4: Configurar Python App"

print_info "Configurar Python App manualmente en cPanel:"
echo "  1. Ir a cPanel > Setup Python App"
echo "  2. Crear nueva aplicación:"
echo "     - Python version: ${PYTHON_VERSION}"
echo "     - Application root: ${DOMINIO}"
echo "     - Application URL: ${DOMINIO}"
echo "     - Application startup file: passenger_wsgi.py"
echo "     - Application Entry point: application"
echo ""

if [ "$DRY_RUN" = false ]; then
    read -p "¿Python App configurada? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Configurar Python App primero."
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════
# PASO 5: Copiar código
# ═══════════════════════════════════════════════════
print_header "Paso 5: Copiar Código Base"

print_step "Copiando backend..."
run_cmd "cp -r ${SHARED_CODE_PATH}/backend ${APP_ROOT}/"
print_success "Backend copiado"

if [ "$SKIP_FRONTEND" = false ]; then
    print_step "Copiando frontend..."
    run_cmd "mkdir -p ${APP_ROOT}/public_html"
    run_cmd "cp -r ${SHARED_CODE_PATH}/frontend/dist/* ${APP_ROOT}/public_html/"
    print_success "Frontend copiado"
fi

print_step "Copiando passenger_wsgi.py..."
run_cmd "cp ${SHARED_CODE_PATH}/backend/passenger_wsgi.py ${APP_ROOT}/"
print_success "passenger_wsgi.py copiado"

# ═══════════════════════════════════════════════════
# PASO 6: Crear archivo .env
# ═══════════════════════════════════════════════════
print_header "Paso 6: Crear Archivo .env"

ENV_CONTENT="# StrateKaz - Instancia: ${EMPRESA}
# Generado: $(date '+%Y-%m-%d %H:%M:%S')

# Django
DEBUG=False
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=${DOMINIO},www.${DOMINIO}

# Base de Datos
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=https://${DOMINIO}

# Frontend
FRONTEND_URL=https://${DOMINIO}

# Celery (modo síncrono para cPanel)
CELERY_TASK_ALWAYS_EAGER=True

# Timezone
TZ=America/Bogota
"

if [ "$DRY_RUN" = true ]; then
    print_info "[DRY-RUN] Contenido de .env:"
    echo "$ENV_CONTENT"
else
    echo "$ENV_CONTENT" > "${APP_ROOT}/backend/.env"
    chmod 600 "${APP_ROOT}/backend/.env"
fi
print_success "Archivo .env creado"

# ═══════════════════════════════════════════════════
# PASO 7: Instalar dependencias
# ═══════════════════════════════════════════════════
print_header "Paso 7: Instalar Dependencias"

PYTHON="${VENV_PATH}/bin/python"
PIP="${VENV_PATH}/bin/pip"

print_step "Instalando dependencias Python..."
run_cmd "cd ${APP_ROOT}/backend && ${PIP} install -r requirements.txt --quiet"
print_success "Dependencias instaladas"

# ═══════════════════════════════════════════════════
# PASO 8: Ejecutar migraciones
# ═══════════════════════════════════════════════════
print_header "Paso 8: Ejecutar Migraciones"

print_step "Aplicando migraciones..."
run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py migrate --noinput"
print_success "Migraciones aplicadas"

# ═══════════════════════════════════════════════════
# PASO 9: Crear superusuario
# ═══════════════════════════════════════════════════
print_header "Paso 9: Crear Superusuario"

ADMIN_USER="admin"
if [ -z "$ADMIN_EMAIL" ]; then
    ADMIN_EMAIL="admin@${EMPRESA}.com"
fi

print_step "Creando superusuario..."
if [ "$DRY_RUN" = false ]; then
    cd ${APP_ROOT}/backend
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('${ADMIN_USER}', '${ADMIN_EMAIL}', '${ADMIN_PASS}')" | ${PYTHON} manage.py shell
fi
print_success "Superusuario creado: ${ADMIN_USER}"

# ═══════════════════════════════════════════════════
# PASO 10: Seeds de datos iniciales
# ═══════════════════════════════════════════════════
print_header "Paso 10: Datos Iniciales"

print_step "Ejecutando seeds..."
run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py seed_empresa --empresa='${EMPRESA}'"
run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py seed_config_identidad"
run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py seed_permisos_rbac"
print_success "Datos iniciales sembrados"

# ═══════════════════════════════════════════════════
# PASO 11: Collectstatic
# ═══════════════════════════════════════════════════
print_header "Paso 11: Archivos Estáticos"

print_step "Ejecutando collectstatic..."
run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py collectstatic --noinput"
print_success "Archivos estáticos recopilados"

# ═══════════════════════════════════════════════════
# PASO 12: Reiniciar aplicación
# ═══════════════════════════════════════════════════
print_header "Paso 12: Reiniciar Aplicación"

print_step "Reiniciando Passenger..."
run_cmd "mkdir -p ${APP_ROOT}/tmp && touch ${APP_ROOT}/tmp/restart.txt"
print_success "Aplicación reiniciada"

# ═══════════════════════════════════════════════════
# PASO 13: Health Check
# ═══════════════════════════════════════════════════
print_header "Paso 13: Verificación Final"

if [ "$DRY_RUN" = false ]; then
    print_step "Esperando que la aplicación inicie (30s)..."
    sleep 30

    print_step "Verificando API..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMINIO}/api/health/" || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "API respondiendo correctamente (HTTP 200)"
    else
        print_error "API no responde correctamente (HTTP ${HTTP_CODE})"
        print_info "Verificar logs: tail -100 ${APP_ROOT}/backend/logs/django.log"
    fi
fi

# ═══════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════
print_header "INSTANCIA CREADA EXITOSAMENTE"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    CREDENCIALES DE ACCESO                         ║"
echo "╠═══════════════════════════════════════════════════════════════════╣"
echo "║  URL:          https://${DOMINIO}"
echo "║  Admin User:   ${ADMIN_USER}"
echo "║  Admin Pass:   ${ADMIN_PASS}"
echo "║  Admin Email:  ${ADMIN_EMAIL}"
echo "╠═══════════════════════════════════════════════════════════════════╣"
echo "║                    BASE DE DATOS                                  ║"
echo "╠═══════════════════════════════════════════════════════════════════╣"
echo "║  DB Name:      ${DB_NAME}"
echo "║  DB User:      ${DB_USER}"
echo "║  DB Pass:      ${DB_PASS}"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Guardar credenciales en archivo seguro
CREDS_FILE="/home/${CPANEL_USER}/.credentials/${EMPRESA}.txt"
if [ "$DRY_RUN" = false ]; then
    mkdir -p "/home/${CPANEL_USER}/.credentials"
    chmod 700 "/home/${CPANEL_USER}/.credentials"
    cat > "${CREDS_FILE}" << EOF
# Credenciales: ${EMPRESA}
# Creado: $(date)

URL: https://${DOMINIO}
Admin User: ${ADMIN_USER}
Admin Pass: ${ADMIN_PASS}
Admin Email: ${ADMIN_EMAIL}

DB Name: ${DB_NAME}
DB User: ${DB_USER}
DB Pass: ${DB_PASS}

SECRET_KEY: ${SECRET_KEY}
EOF
    chmod 600 "${CREDS_FILE}"
    print_info "Credenciales guardadas en: ${CREDS_FILE}"
fi

echo ""
print_success "Proceso completado. La instancia está lista para usar."
echo ""
