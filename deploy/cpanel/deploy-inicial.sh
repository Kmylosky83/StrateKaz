#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SCRIPT DE DESPLIEGUE INICIAL - cPanel
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════════
#
# Este script realiza el despliegue inicial en cPanel.
# PREREQUISITOS:
#   1. Subdominio creado en cPanel
#   2. Base de datos MySQL creada en cPanel
#   3. Python App configurada en cPanel
#   4. Acceso SSH al servidor
#
# USO:
#   1. Subir este script al servidor
#   2. Editar las variables de configuración abajo
#   3. chmod +x deploy-inicial.sh
#   4. ./deploy-inicial.sh
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Detener en caso de error

# ═══════════════════════════════════════════════════
# CONFIGURACIÓN - EDITAR ANTES DE EJECUTAR
# ═══════════════════════════════════════════════════
CPANEL_USER="strat"                              # Usuario de cPanel
SUBDOMINIO="grasas"                              # Solo el nombre (sin .stratekaz.com)
DOMINIO_BASE="stratekaz.com"                     # Dominio principal
REPO_URL="https://github.com/Kmylosky83/Grasas-Huesos-SGI.git"
PYTHON_VERSION="3.9"                             # Versión configurada en cPanel

# Rutas derivadas (no editar)
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

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_prerequisites() {
    print_header "Verificando Prerequisitos"

    # Verificar que existe el directorio de la app
    if [ ! -d "$APP_ROOT" ]; then
        print_error "Directorio $APP_ROOT no existe. ¿Creaste el subdominio en cPanel?"
        exit 1
    fi
    print_success "Directorio de aplicación existe"

    # Verificar virtualenv
    if [ ! -d "$VENV_PATH" ]; then
        print_error "Virtualenv no encontrado en $VENV_PATH. ¿Configuraste la Python App en cPanel?"
        exit 1
    fi
    print_success "Virtualenv existe"

    # Verificar git
    if ! command -v git &> /dev/null; then
        print_error "Git no está instalado"
        exit 1
    fi
    print_success "Git disponible"
}

clone_repository() {
    print_header "Clonando Repositorio"

    cd "$APP_ROOT"

    # Si ya hay archivos, hacer backup
    if [ "$(ls -A)" ]; then
        print_step "Directorio no vacío, creando backup..."
        BACKUP_DIR="${APP_ROOT}_backup_$(date +%Y%m%d_%H%M%S)"
        mv "$APP_ROOT" "$BACKUP_DIR"
        mkdir -p "$APP_ROOT"
        print_success "Backup creado en $BACKUP_DIR"
    fi

    print_step "Clonando repositorio..."
    git clone "$REPO_URL" .
    print_success "Repositorio clonado"
}

create_directories() {
    print_header "Creando Estructura de Directorios"

    cd "$APP_ROOT"

    print_step "Creando directorios necesarios..."
    mkdir -p tmp
    mkdir -p logs
    mkdir -p backend/logs
    mkdir -p backend/media
    mkdir -p backend/staticfiles

    print_success "Directorios creados"
}

setup_environment() {
    print_header "Configurando Entorno"

    cd "$APP_ROOT"

    # Copiar passenger_wsgi.py
    print_step "Copiando passenger_wsgi.py..."
    cp deploy/cpanel/passenger_wsgi.py ./
    print_success "passenger_wsgi.py copiado"

    # Copiar template de .env
    print_step "Creando archivo .env..."
    if [ ! -f "backend/.env" ]; then
        cp deploy/cpanel/.env.staging backend/.env
        print_success ".env creado desde template"
        echo -e "${YELLOW}⚠ IMPORTANTE: Edita backend/.env con tus credenciales${NC}"
    else
        print_success ".env ya existe"
    fi
}

install_dependencies() {
    print_header "Instalando Dependencias Python"

    cd "$APP_ROOT"

    print_step "Activando virtualenv..."
    source "${VENV_PATH}/bin/activate"

    print_step "Actualizando pip..."
    $PIP install --upgrade pip setuptools wheel --quiet

    print_step "Instalando dependencias de cPanel..."
    $PIP install -r deploy/cpanel/requirements-cpanel.txt --quiet

    print_success "Dependencias instaladas"
}

run_migrations() {
    print_header "Ejecutando Migraciones"

    cd "$APP_ROOT/backend"
    source "${VENV_PATH}/bin/activate"

    print_step "Verificando conexión a base de datos..."
    $PYTHON manage.py check --database default
    print_success "Conexión a DB OK"

    print_step "Ejecutando migraciones..."
    $PYTHON manage.py migrate --noinput
    print_success "Migraciones completadas"

    print_step "Creando tabla de cache..."
    $PYTHON manage.py createcachetable
    print_success "Tabla de cache creada"
}

collect_static() {
    print_header "Recolectando Archivos Estáticos"

    cd "$APP_ROOT/backend"
    source "${VENV_PATH}/bin/activate"

    print_step "Ejecutando collectstatic..."
    $PYTHON manage.py collectstatic --noinput
    print_success "Archivos estáticos recolectados"
}

setup_htaccess() {
    print_header "Configurando .htaccess"

    cd "$APP_ROOT/public_html"

    print_step "Creando .htaccess para SPA..."
    cat > .htaccess << 'EOF'
# ═══════════════════════════════════════════════════
# .htaccess para Frontend React SPA
# ═══════════════════════════════════════════════════

# Forzar HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirect HTTP to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # SPA Routing - Redirigir todo a index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

# Headers de seguridad
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache de assets estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType font/woff2 "access plus 1 month"
</IfModule>

# Compresión GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>
EOF

    print_success ".htaccess creado"
}

restart_app() {
    print_header "Reiniciando Aplicación"

    print_step "Creando restart.txt..."
    touch "$APP_ROOT/tmp/restart.txt"
    print_success "Aplicación reiniciada"
}

print_summary() {
    print_header "Despliegue Completado"

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                         DESPLIEGUE EXITOSO                                    ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    echo "📋 PASOS SIGUIENTES:"
    echo ""
    echo "1. Editar backend/.env con las credenciales reales:"
    echo "   nano $APP_ROOT/backend/.env"
    echo ""
    echo "2. Crear superusuario:"
    echo "   cd $APP_ROOT/backend"
    echo "   source ${VENV_PATH}/bin/activate"
    echo "   python manage.py createsuperuser"
    echo ""
    echo "3. Subir el build del frontend a public_html/"
    echo "   (hacer npm run build localmente y subir dist/*)"
    echo ""
    echo "4. Activar SSL en cPanel:"
    echo "   cPanel > SSL/TLS Status > Run AutoSSL"
    echo ""
    echo "5. Verificar el sitio:"
    echo "   https://${DOMINIO}"
    echo "   https://${DOMINIO}/api/health/"
    echo ""
}

# ═══════════════════════════════════════════════════
# EJECUCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════

print_header "DESPLIEGUE INICIAL - ${DOMINIO}"

echo "Configuración:"
echo "  - Usuario cPanel: ${CPANEL_USER}"
echo "  - Dominio: ${DOMINIO}"
echo "  - App Root: ${APP_ROOT}"
echo "  - Python: ${PYTHON_VERSION}"
echo ""

read -p "¿Continuar con el despliegue? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ]; then
    echo "Despliegue cancelado."
    exit 0
fi

check_prerequisites
clone_repository
create_directories
setup_environment
install_dependencies
run_migrations
collect_static
setup_htaccess
restart_app
print_summary
