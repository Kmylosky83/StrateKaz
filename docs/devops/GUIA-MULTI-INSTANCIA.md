# Guía de Despliegue Multi-Instancia para cPanel

**Sistema de Gestión Integral - StrateKaz**
**Versión:** 3.3.0
**Fecha:** 2026-01-15
**Modelo:** Multi-Tenant con Instancias Separadas

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura Multi-Instancia](#arquitectura-multi-instancia)
3. [Estructura de Directorios](#estructura-de-directorios)
4. [Script de Creación de Instancias](#script-de-creación-de-instancias)
5. [Proceso Manual de Creación](#proceso-manual-de-creación)
6. [Checklist de Go-Live](#checklist-de-go-live)
7. [Operaciones Multi-Instancia](#operaciones-multi-instancia)
8. [Monitoreo Centralizado](#monitoreo-centralizado)
9. [Troubleshooting Multi-Instancia](#troubleshooting-multi-instancia)
10. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

### Modelo Multi-Instancia

StrateKaz utiliza un modelo **multi-tenant con instancias separadas**, donde cada empresa cliente obtiene:

- Su propia instalación completa de Django
- Su propia base de datos MySQL aislada
- Su propio subdominio (ej: `empresa1.stratekaz.com`)
- Su propio entorno virtual de Python
- Sus propios archivos estáticos y media

### Ventajas de este Modelo

**Aislamiento Total:**
- Cada empresa tiene datos completamente separados
- Un error en una instancia no afecta a las demás
- Mayor seguridad y privacidad de datos

**Personalización:**
- Cada empresa puede tener su propia configuración
- Versiones diferentes del software si es necesario
- Módulos activados/desactivados por empresa

**Escalabilidad:**
- Fácil migrar instancias individuales a servidores dedicados
- Recursos asignados por instancia
- Backups y restauración independientes

**Cumplimiento:**
- Mejor cumplimiento de GDPR y regulaciones de datos
- Auditorías independientes por cliente
- Reportes de seguridad específicos

---

## Arquitectura Multi-Instancia

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR cPanel                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  EMPRESA 1: empresa1.stratekaz.com                                   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  /home/strat/empresa1.stratekaz.com/                                 │   │
│  │  ├── backend/           (Django App)                                 │   │
│  │  ├── public_html/       (React Frontend)                             │   │
│  │  ├── tmp/               (restart.txt)                                │   │
│  │  ├── logs/              (app.log, errors.log)                        │   │
│  │  └── passenger_wsgi.py                                               │   │
│  │                                                                       │   │
│  │  MySQL: strat_empresa1_db                                            │   │
│  │  VirtualEnv: /home/strat/virtualenv/empresa1.stratekaz.com/3.9/     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  EMPRESA 2: empresa2.stratekaz.com                                   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  /home/strat/empresa2.stratekaz.com/                                 │   │
│  │  ├── backend/           (Django App)                                 │   │
│  │  ├── public_html/       (React Frontend)                             │   │
│  │  ├── tmp/               (restart.txt)                                │   │
│  │  ├── logs/              (app.log, errors.log)                        │   │
│  │  └── passenger_wsgi.py                                               │   │
│  │                                                                       │   │
│  │  MySQL: strat_empresa2_db                                            │   │
│  │  VirtualEnv: /home/strat/virtualenv/empresa2.stratekaz.com/3.9/     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  EMPRESA N: empresaN.stratekaz.com                                   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  /home/strat/empresaN.stratekaz.com/                                 │   │
│  │  ├── backend/           (Django App)                                 │   │
│  │  ├── public_html/       (React Frontend)                             │   │
│  │  ├── tmp/               (restart.txt)                                │   │
│  │  ├── logs/              (app.log, errors.log)                        │   │
│  │  └── passenger_wsgi.py                                               │   │
│  │                                                                       │   │
│  │  MySQL: strat_empresaN_db                                            │   │
│  │  VirtualEnv: /home/strat/virtualenv/empresaN.stratekaz.com/3.9/     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  RECURSOS COMPARTIDOS                                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  /home/strat/scripts/                                                │   │
│  │  ├── create-instance.sh        (Crear nueva instancia)               │   │
│  │  ├── update-all-instances.sh   (Actualizar todas)                   │   │
│  │  ├── backup-all-instances.sh   (Backup completo)                    │   │
│  │  ├── health-check-all.sh       (Monitoreo)                          │   │
│  │  └── deploy-template/          (Plantilla base)                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Patrón de Nomenclatura

**Subdominios:**
```
{empresa}.stratekaz.com
```
Ejemplos: `grasas.stratekaz.com`, `econorte.stratekaz.com`, `acme.stratekaz.com`

**Bases de Datos:**
```
strat_{empresa}_db
```
Ejemplos: `strat_grasas_db`, `strat_econorte_db`, `strat_acme_db`

**Usuarios de Base de Datos:**
```
strat_{empresa}_user
```
Ejemplos: `strat_grasas_user`, `strat_econorte_user`

**Directorios:**
```
/home/strat/{empresa}.stratekaz.com/
```

**VirtualEnv:**
```
/home/strat/virtualenv/{empresa}.stratekaz.com/3.9/
```

---

## Estructura de Directorios

### Estructura Completa del Servidor

```
/home/strat/
├── scripts/                              # Scripts de gestión multi-instancia
│   ├── create-instance.sh                # Crear nueva instancia
│   ├── update-all-instances.sh           # Actualizar todas las instancias
│   ├── backup-all-instances.sh           # Backup de todas las instancias
│   ├── health-check-all.sh               # Health check centralizado
│   ├── list-instances.sh                 # Listar instancias activas
│   └── deploy-template/                  # Plantilla base para nuevas instancias
│       ├── backend/
│       ├── frontend/
│       └── config/
│
├── backups/                              # Backups centralizados
│   ├── empresa1/
│   │   ├── db/                           # Dumps de MySQL
│   │   └── files/                        # Archivos media
│   ├── empresa2/
│   └── ...
│
├── logs/                                 # Logs centralizados (opcional)
│   ├── multi-instance.log                # Log de operaciones multi-instancia
│   ├── deployments.log                   # Historial de deployments
│   └── health-checks.log                 # Resultados de health checks
│
├── empresa1.stratekaz.com/               # INSTANCIA 1
│   ├── backend/
│   │   ├── apps/                         # Aplicaciones Django
│   │   ├── config/                       # Settings Django
│   │   ├── staticfiles/                  # Archivos estáticos recolectados
│   │   ├── media/                        # Uploads de usuarios
│   │   ├── logs/                         # Logs de la instancia
│   │   │   ├── django.log
│   │   │   ├── passenger.log
│   │   │   └── migrations.log
│   │   ├── manage.py
│   │   ├── .env                          # Variables de entorno (NUNCA en Git)
│   │   └── requirements.txt
│   ├── public_html/                      # Frontend React
│   │   ├── index.html
│   │   ├── assets/
│   │   └── .htaccess
│   ├── tmp/
│   │   └── restart.txt                   # Touch para reiniciar Passenger
│   ├── logs/
│   │   ├── app.log
│   │   └── access.log
│   ├── passenger_wsgi.py                 # Entry point de Passenger
│   └── .instance-info                    # Metadata de la instancia
│
├── empresa2.stratekaz.com/               # INSTANCIA 2
│   └── (misma estructura que empresa1)
│
├── virtualenv/                           # Entornos virtuales
│   ├── empresa1.stratekaz.com/
│   │   └── 3.9/
│   │       ├── bin/
│   │       ├── lib/
│   │       └── ...
│   ├── empresa2.stratekaz.com/
│   │   └── 3.9/
│   └── ...
│
└── .ssh/
    └── config                            # Configuración SSH para deployments
```

### Archivo .instance-info

Cada instancia debe tener un archivo `.instance-info` con metadata:

```bash
# .instance-info
INSTANCE_NAME=empresa1
COMPANY_NAME=Grasas y Huesos del Norte
SUBDOMAIN=empresa1.stratekaz.com
DB_NAME=strat_empresa1_db
DB_USER=strat_empresa1_user
CREATED_DATE=2026-01-15
VERSION=3.3.0
MODULES_ENABLED=core,gestion_estrategica,supply_chain
STATUS=active
ENVIRONMENT=production
```

---

## Script de Creación de Instancias

### create-instance.sh

Script completo para crear nuevas instancias de forma automatizada.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CREATE INSTANCE - Script de Creación de Instancias Multi-Tenant
# Sistema de Gestión Integral - StrateKaz
# ═══════════════════════════════════════════════════════════════════════════════
#
# DESCRIPCIÓN:
#   Este script crea una nueva instancia completa de StrateKaz para un cliente.
#   Incluye: subdominio, base de datos, código base, configuración y deployment.
#
# USO:
#   ./create-instance.sh <nombre_empresa> [opciones]
#
# EJEMPLOS:
#   ./create-instance.sh grasas
#   ./create-instance.sh econorte --skip-frontend
#   ./create-instance.sh acme --db-password "MiPassword123"
#
# PREREQUISITOS:
#   1. Acceso SSH al servidor cPanel
#   2. Permisos para crear subdominios y bases de datos
#   3. Plantilla base en ~/scripts/deploy-template/
#   4. UAPI CLI configurado en cPanel
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Detener en caso de error
set -u  # Error si variable no definida

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN GLOBAL
# ═══════════════════════════════════════════════════════════════════════════
CPANEL_USER="strat"
DOMAIN_BASE="stratekaz.com"
PYTHON_VERSION="3.9"
REPO_URL="https://github.com/Kmylosky83/Grasas-Huesos-SGI.git"
REPO_BRANCH="main"

# Rutas base
HOME_DIR="/home/${CPANEL_USER}"
SCRIPTS_DIR="${HOME_DIR}/scripts"
TEMPLATE_DIR="${SCRIPTS_DIR}/deploy-template"
BACKUPS_DIR="${HOME_DIR}/backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

# ═══════════════════════════════════════════════════════════════════════════
# FUNCIONES DE UTILIDAD
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

show_usage() {
    cat << EOF
Uso: $0 <nombre_empresa> [opciones]

Argumentos:
  nombre_empresa        Nombre identificador de la empresa (ej: grasas, econorte)
                        Se usará para subdominio, BD, etc.

Opciones:
  --company-name TEXT   Nombre completo de la empresa (ej: "ACME Corporation")
  --db-password PASS    Password para usuario de MySQL (auto-generado si se omite)
  --admin-email EMAIL   Email del administrador
  --admin-user USER     Username del superusuario (default: admin)
  --admin-pass PASS     Password del superusuario (auto-generado si se omite)
  --skip-frontend       No desplegar frontend (solo backend)
  --skip-seed           No ejecutar seed de datos iniciales
  --modules LIST        Módulos a activar (separados por coma)
  --dry-run             Simular sin ejecutar comandos reales
  --help                Mostrar esta ayuda

Ejemplos:
  $0 grasas
  $0 econorte --company-name "Econorte SAS" --admin-email admin@econorte.com
  $0 acme --modules "core,gestion_estrategica,supply_chain"

EOF
}

generate_password() {
    # Genera password seguro de 20 caracteres
    openssl rand -base64 20 | tr -d "=+/" | cut -c1-20
}

generate_secret_key() {
    # Genera Django SECRET_KEY
    python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
}

validate_name() {
    local name=$1
    # Solo permite letras minúsculas, números y guiones
    if [[ ! "$name" =~ ^[a-z0-9-]+$ ]]; then
        print_error "Nombre inválido: solo letras minúsculas, números y guiones"
        exit 1
    fi
}

check_instance_exists() {
    local name=$1
    local instance_dir="${HOME_DIR}/${name}.${DOMAIN_BASE}"

    if [ -d "$instance_dir" ]; then
        print_error "La instancia '$name' ya existe en: $instance_dir"
        echo ""
        echo "Opciones:"
        echo "  1. Usar otro nombre de empresa"
        echo "  2. Eliminar la instancia existente manualmente"
        echo "  3. Usar el script update-instance.sh para actualizar"
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# PARSEO DE ARGUMENTOS
# ═══════════════════════════════════════════════════════════════════════════

if [ $# -eq 0 ] || [ "$1" == "--help" ]; then
    show_usage
    exit 0
fi

INSTANCE_NAME="$1"
shift

# Valores por defecto
COMPANY_NAME=""
DB_PASSWORD=""
ADMIN_EMAIL="admin@${INSTANCE_NAME}.${DOMAIN_BASE}"
ADMIN_USER="admin"
ADMIN_PASS=""
SKIP_FRONTEND=false
SKIP_SEED=false
MODULES="core,gestion_estrategica"
DRY_RUN=false

# Parsear opciones
while [[ $# -gt 0 ]]; do
    case $1 in
        --company-name)
            COMPANY_NAME="$2"
            shift 2
            ;;
        --db-password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --admin-email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --admin-user)
            ADMIN_USER="$2"
            shift 2
            ;;
        --admin-pass)
            ADMIN_PASS="$2"
            shift 2
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --modules)
            MODULES="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validaciones
validate_name "$INSTANCE_NAME"
check_instance_exists "$INSTANCE_NAME"

# Valores derivados
SUBDOMAIN="${INSTANCE_NAME}.${DOMAIN_BASE}"
INSTANCE_DIR="${HOME_DIR}/${SUBDOMAIN}"
DB_NAME="strat_${INSTANCE_NAME}_db"
DB_USER="strat_${INSTANCE_NAME}_user"
VENV_PATH="${HOME_DIR}/virtualenv/${SUBDOMAIN}/${PYTHON_VERSION}"
PYTHON_BIN="${VENV_PATH}/bin/python"
PIP_BIN="${VENV_PATH}/bin/pip"

# Auto-generar passwords si no se especificaron
[ -z "$DB_PASSWORD" ] && DB_PASSWORD=$(generate_password)
[ -z "$ADMIN_PASS" ] && ADMIN_PASS=$(generate_password)
[ -z "$COMPANY_NAME" ] && COMPANY_NAME="${INSTANCE_NAME}"

# ═══════════════════════════════════════════════════════════════════════════
# MOSTRAR RESUMEN DE CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════════════════

print_header "CREACIÓN DE NUEVA INSTANCIA - ${SUBDOMAIN}"

cat << EOF

Configuración de la Instancia:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Empresa:              ${COMPANY_NAME}
Identificador:        ${INSTANCE_NAME}
Subdominio:           ${SUBDOMAIN}

Base de Datos:
  Nombre:             ${DB_NAME}
  Usuario:            ${DB_USER}
  Password:           ${DB_PASSWORD}

Superusuario:
  Username:           ${ADMIN_USER}
  Email:              ${ADMIN_EMAIL}
  Password:           ${ADMIN_PASS}

Directorios:
  Root:               ${INSTANCE_DIR}
  VirtualEnv:         ${VENV_PATH}

Opciones:
  Módulos:            ${MODULES}
  Deploy Frontend:    $([ "$SKIP_FRONTEND" == "true" ] && echo "No" || echo "Sí")
  Seed Inicial:       $([ "$SKIP_SEED" == "true" ] && echo "No" || echo "Sí")
  Dry Run:            $([ "$DRY_RUN" == "true" ] && echo "Sí" || echo "No")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

if [ "$DRY_RUN" == "false" ]; then
    read -p "¿Continuar con la creación de la instancia? (s/n): " CONFIRM
    if [ "$CONFIRM" != "s" ]; then
        echo "Creación cancelada."
        exit 0
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: CREAR SUBDOMINIO EN cPanel
# ═══════════════════════════════════════════════════════════════════════════

step_create_subdomain() {
    print_header "PASO 1: Creando Subdominio"

    print_step "Creando subdominio ${SUBDOMAIN}..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se crearía subdominio: ${SUBDOMAIN}"
    else
        # Usar UAPI para crear subdominio
        uapi --user="${CPANEL_USER}" SubDomain add_subdomain \
            domain="${INSTANCE_NAME}" \
            rootdomain="${DOMAIN_BASE}" \
            dir="${SUBDOMAIN}" \
            disallowdot=1

        print_success "Subdominio creado: ${SUBDOMAIN}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: CREAR BASE DE DATOS MySQL
# ═══════════════════════════════════════════════════════════════════════════

step_create_database() {
    print_header "PASO 2: Creando Base de Datos MySQL"

    print_step "Creando base de datos ${DB_NAME}..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se crearía BD: ${DB_NAME}"
        print_warning "[DRY RUN] Se crearía usuario: ${DB_USER}"
    else
        # Crear base de datos
        uapi --user="${CPANEL_USER}" Mysql create_database \
            name="${DB_NAME}"
        print_success "Base de datos creada: ${DB_NAME}"

        # Crear usuario
        uapi --user="${CPANEL_USER}" Mysql create_user \
            name="${DB_USER}" \
            password="${DB_PASSWORD}"
        print_success "Usuario creado: ${DB_USER}"

        # Asignar privilegios
        uapi --user="${CPANEL_USER}" Mysql set_privileges_on_database \
            user="${DB_USER}" \
            database="${DB_NAME}" \
            privileges="ALL PRIVILEGES"
        print_success "Privilegios asignados"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: CLONAR CÓDIGO BASE
# ═══════════════════════════════════════════════════════════════════════════

step_clone_repository() {
    print_header "PASO 3: Clonando Repositorio"

    print_step "Clonando código desde ${REPO_URL}..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se clonaría repositorio en: ${INSTANCE_DIR}"
    else
        # Clonar repositorio
        git clone --branch "${REPO_BRANCH}" "${REPO_URL}" "${INSTANCE_DIR}"
        print_success "Repositorio clonado"

        # Crear directorios necesarios
        mkdir -p "${INSTANCE_DIR}/tmp"
        mkdir -p "${INSTANCE_DIR}/logs"
        mkdir -p "${INSTANCE_DIR}/backend/logs"
        mkdir -p "${INSTANCE_DIR}/backend/media"
        mkdir -p "${INSTANCE_DIR}/backend/staticfiles"
        mkdir -p "${BACKUPS_DIR}/${INSTANCE_NAME}/db"
        mkdir -p "${BACKUPS_DIR}/${INSTANCE_NAME}/files"
        print_success "Directorios creados"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: CONFIGURAR PYTHON APP EN cPanel
# ═══════════════════════════════════════════════════════════════════════════

step_setup_python_app() {
    print_header "PASO 4: Configurando Python App"

    print_step "Creando aplicación Python en cPanel..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se configuraría Python App"
    else
        # Crear aplicación Python usando UAPI
        uapi --user="${CPANEL_USER}" LangPHP php_set_vhost_versions \
            version="ea-php81"

        # Nota: La configuración completa de Python App debe hacerse via interfaz web
        # o usando WHM API si se tiene acceso

        print_warning "Python App debe configurarse manualmente en cPanel:"
        echo "  1. Ve a 'Setup Python App'"
        echo "  2. CREATE APPLICATION"
        echo "  3. Python version: ${PYTHON_VERSION}"
        echo "  4. Application root: ${SUBDOMAIN}"
        echo "  5. Application URL: (dejar vacío)"
        echo "  6. Application startup file: passenger_wsgi.py"
        echo "  7. Application Entry point: application"
        echo ""
        read -p "Presiona ENTER cuando hayas creado la Python App..."

        print_success "Python App configurada"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: GENERAR ARCHIVO .env
# ═══════════════════════════════════════════════════════════════════════════

step_generate_env() {
    print_header "PASO 5: Generando Configuración (.env)"

    print_step "Generando archivo .env..."

    # Generar SECRET_KEY
    SECRET_KEY=$(generate_secret_key)

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se generaría archivo .env"
    else
        # Crear archivo .env
        cat > "${INSTANCE_DIR}/backend/.env" << EOF
# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE INSTANCIA - ${COMPANY_NAME}
# Generado automáticamente: $(date)
# ═══════════════════════════════════════════════════════════════════════════

# DJANGO CORE
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${SUBDOMAIN},www.${SUBDOMAIN}

# BASE DE DATOS
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=localhost
DB_PORT=3306

# MODO cPanel
USE_CPANEL=True

# SEGURIDAD - CSRF & CORS
CSRF_TRUSTED_ORIGINS=https://${SUBDOMAIN},https://www.${SUBDOMAIN}
CORS_ALLOWED_ORIGINS=https://${SUBDOMAIN},https://www.${SUBDOMAIN}

# JWT - AUTENTICACIÓN
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# EMAIL - SMTP
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@${SUBDOMAIN}
EMAIL_HOST_PASSWORD=CAMBIAR_ESTO
DEFAULT_FROM_EMAIL=noreply@${SUBDOMAIN}

# SENTRY (opcional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=production

# LOGGING
DJANGO_LOG_LEVEL=INFO
DB_LOG_LEVEL=WARNING

# CONFIGURACIÓN
TZ=America/Bogota
LANGUAGE_CODE=es-co
EOF

        # Crear archivo .instance-info
        cat > "${INSTANCE_DIR}/.instance-info" << EOF
INSTANCE_NAME=${INSTANCE_NAME}
COMPANY_NAME=${COMPANY_NAME}
SUBDOMAIN=${SUBDOMAIN}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
CREATED_DATE=$(date +%Y-%m-%d)
VERSION=3.3.0
MODULES_ENABLED=${MODULES}
STATUS=active
ENVIRONMENT=production
ADMIN_EMAIL=${ADMIN_EMAIL}
EOF

        chmod 600 "${INSTANCE_DIR}/backend/.env"
        chmod 600 "${INSTANCE_DIR}/.instance-info"

        print_success "Archivos de configuración generados"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: INSTALAR DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════════════════

step_install_dependencies() {
    print_header "PASO 6: Instalando Dependencias Python"

    print_step "Activando virtualenv y instalando paquetes..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se instalarían dependencias"
    else
        cd "${INSTANCE_DIR}/backend"

        # Activar virtualenv
        source "${VENV_PATH}/bin/activate"

        # Actualizar pip
        ${PIP_BIN} install --upgrade pip setuptools wheel --quiet
        print_success "pip actualizado"

        # Instalar dependencias
        ${PIP_BIN} install -r requirements.txt --quiet
        print_success "Dependencias instaladas"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: EJECUTAR MIGRACIONES
# ═══════════════════════════════════════════════════════════════════════════

step_run_migrations() {
    print_header "PASO 7: Ejecutando Migraciones de Base de Datos"

    print_step "Aplicando migraciones..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se ejecutarían migraciones"
    else
        cd "${INSTANCE_DIR}/backend"
        source "${VENV_PATH}/bin/activate"

        # Verificar conexión a BD
        ${PYTHON_BIN} manage.py check --database default
        print_success "Conexión a BD verificada"

        # Ejecutar migraciones
        ${PYTHON_BIN} manage.py migrate --noinput
        print_success "Migraciones completadas"

        # Crear tabla de cache
        ${PYTHON_BIN} manage.py createcachetable
        print_success "Tabla de cache creada"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: CREAR SUPERUSUARIO
# ═══════════════════════════════════════════════════════════════════════════

step_create_superuser() {
    print_header "PASO 8: Creando Superusuario"

    print_step "Creando usuario administrador..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se crearía superusuario: ${ADMIN_USER}"
    else
        cd "${INSTANCE_DIR}/backend"
        source "${VENV_PATH}/bin/activate"

        # Crear superusuario usando script Python
        ${PYTHON_BIN} manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='${ADMIN_USER}').exists():
    User.objects.create_superuser(
        username='${ADMIN_USER}',
        email='${ADMIN_EMAIL}',
        password='${ADMIN_PASS}'
    )
    print('Superusuario creado exitosamente')
else:
    print('El usuario ya existe')
EOF

        print_success "Superusuario creado: ${ADMIN_USER}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 9: EJECUTAR SEED DE DATOS INICIALES
# ═══════════════════════════════════════════════════════════════════════════

step_seed_data() {
    if [ "$SKIP_SEED" == "true" ]; then
        print_warning "Seed de datos omitido (--skip-seed)"
        return
    fi

    print_header "PASO 9: Ejecutando Seed de Datos Iniciales"

    print_step "Sembrando datos base del sistema..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se ejecutaría seed de datos"
    else
        cd "${INSTANCE_DIR}/backend"
        source "${VENV_PATH}/bin/activate"

        # Seed de permisos RBAC
        ${PYTHON_BIN} manage.py seed_permisos_rbac
        print_success "Permisos RBAC sembrados"

        # Seed de configuración de identidad
        ${PYTHON_BIN} manage.py seed_config_identidad
        print_success "Configuración de identidad sembrada"

        # Seed de datos de identidad (ejemplo)
        ${PYTHON_BIN} manage.py seed_identidad
        print_success "Datos de identidad sembrados"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 10: RECOLECTAR ARCHIVOS ESTÁTICOS
# ═══════════════════════════════════════════════════════════════════════════

step_collect_static() {
    print_header "PASO 10: Recolectando Archivos Estáticos"

    print_step "Ejecutando collectstatic..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se ejecutaría collectstatic"
    else
        cd "${INSTANCE_DIR}/backend"
        source "${VENV_PATH}/bin/activate"

        ${PYTHON_BIN} manage.py collectstatic --noinput
        print_success "Archivos estáticos recolectados"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 11: CONFIGURAR .htaccess Y PASSENGER
# ═══════════════════════════════════════════════════════════════════════════

step_setup_htaccess() {
    print_header "PASO 11: Configurando .htaccess"

    print_step "Creando .htaccess para SPA..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se crearía .htaccess"
    else
        # Copiar passenger_wsgi.py
        cp "${INSTANCE_DIR}/deploy/cpanel/passenger_wsgi.py" "${INSTANCE_DIR}/"
        print_success "passenger_wsgi.py copiado"

        # Crear .htaccess para public_html
        cat > "${INSTANCE_DIR}/public_html/.htaccess" << 'HTACCESS_EOF'
# .htaccess para Frontend React SPA
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Forzar HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # SPA Routing
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

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
HTACCESS_EOF

        print_success ".htaccess creado"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 12: CONFIGURAR SSL
# ═══════════════════════════════════════════════════════════════════════════

step_setup_ssl() {
    print_header "PASO 12: Configurando SSL"

    print_step "Solicitando certificado AutoSSL..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se solicitaría certificado SSL"
    else
        # Intentar AutoSSL via UAPI
        uapi --user="${CPANEL_USER}" SSL install_ssl \
            domain="${SUBDOMAIN}"

        print_success "SSL configurado (puede tardar unos minutos en propagarse)"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 13: REINICIAR APLICACIÓN
# ═══════════════════════════════════════════════════════════════════════════

step_restart_app() {
    print_header "PASO 13: Reiniciando Aplicación"

    print_step "Creando restart.txt..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se reiniciaría la aplicación"
    else
        touch "${INSTANCE_DIR}/tmp/restart.txt"
        print_success "Aplicación reiniciada"

        # Esperar a que la aplicación inicie
        sleep 3
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 14: HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════

step_health_check() {
    print_header "PASO 14: Verificando Estado de la Instancia"

    print_step "Ejecutando health check..."

    if [ "$DRY_RUN" == "true" ]; then
        print_warning "[DRY RUN] Se ejecutaría health check"
    else
        sleep 2

        # Test de conexión HTTP
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://${SUBDOMAIN}/api/health/" \
            --max-time 10 || echo "000")

        if [ "$HTTP_CODE" == "200" ]; then
            print_success "API respondiendo correctamente (HTTP 200)"
        else
            print_warning "API responde HTTP ${HTTP_CODE}"
            echo "  Verifica logs en: ${INSTANCE_DIR}/backend/logs/"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# MOSTRAR RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════

show_summary() {
    print_header "INSTANCIA CREADA EXITOSAMENTE"

    cat << EOF

╔═══════════════════════════════════════════════════════════════════════════════╗
║                    RESUMEN DE INSTANCIA CREADA                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Empresa:              ${COMPANY_NAME}
Subdominio:           https://${SUBDOMAIN}

CREDENCIALES DE ACCESO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Panel Admin:          https://${SUBDOMAIN}/admin/
  Usuario:            ${ADMIN_USER}
  Password:           ${ADMIN_PASS}

Base de Datos:
  Nombre:             ${DB_NAME}
  Usuario:            ${DB_USER}
  Password:           ${DB_PASSWORD}

ARCHIVOS IMPORTANTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuración:        ${INSTANCE_DIR}/backend/.env
Metadata:             ${INSTANCE_DIR}/.instance-info
Logs:                 ${INSTANCE_DIR}/backend/logs/
Backups:              ${BACKUPS_DIR}/${INSTANCE_NAME}/

PRÓXIMOS PASOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Desplegar frontend:
   cd frontend
   echo "VITE_API_URL=https://${SUBDOMAIN}/api" > .env.production
   npm run build
   rsync -avz dist/ ${CPANEL_USER}@${DOMAIN_BASE}:${INSTANCE_DIR}/public_html/

2. Configurar email SMTP en:
   ${INSTANCE_DIR}/backend/.env

3. Verificar la aplicación:
   https://${SUBDOMAIN}
   https://${SUBDOMAIN}/api/health/
   https://${SUBDOMAIN}/admin/

4. Revisar checklist de Go-Live (ver docs/GUIA-MULTI-INSTANCIA.md)

COMANDOS ÚTILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reiniciar:            touch ${INSTANCE_DIR}/tmp/restart.txt
Ver logs:             tail -f ${INSTANCE_DIR}/backend/logs/django.log
Backup:               ${SCRIPTS_DIR}/backup-instance.sh ${INSTANCE_NAME}

╔═══════════════════════════════════════════════════════════════════════════════╗
║  IMPORTANTE: Guarda las credenciales en un lugar seguro                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

EOF

    # Guardar credenciales en archivo seguro
    if [ "$DRY_RUN" == "false" ]; then
        CREDS_FILE="${BACKUPS_DIR}/${INSTANCE_NAME}/credenciales.txt"
        cat > "$CREDS_FILE" << EOF
CREDENCIALES DE INSTANCIA - ${COMPANY_NAME}
Generado: $(date)

Subdominio: https://${SUBDOMAIN}

Admin Panel:
  Usuario: ${ADMIN_USER}
  Password: ${ADMIN_PASS}
  Email: ${ADMIN_EMAIL}

Base de Datos:
  Nombre: ${DB_NAME}
  Usuario: ${DB_USER}
  Password: ${DB_PASSWORD}
  Host: localhost

Django:
  SECRET_KEY: ${SECRET_KEY}
EOF
        chmod 600 "$CREDS_FILE"
        print_success "Credenciales guardadas en: $CREDS_FILE"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# EJECUCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════

main() {
    step_create_subdomain
    step_create_database
    step_clone_repository
    step_setup_python_app
    step_generate_env
    step_install_dependencies
    step_run_migrations
    step_create_superuser
    step_seed_data
    step_collect_static
    step_setup_htaccess
    step_setup_ssl
    step_restart_app
    step_health_check
    show_summary
}

# Ejecutar
main

exit 0
```

### Uso del Script

```bash
# Instalación del script
cd /home/strat/scripts
chmod +x create-instance.sh

# Crear instancia básica
./create-instance.sh grasas

# Crear con nombre completo de empresa
./create-instance.sh econorte --company-name "Econorte SAS"

# Crear con email personalizado
./create-instance.sh acme \
    --company-name "ACME Corporation" \
    --admin-email admin@acme.com \
    --admin-user acme_admin

# Crear solo backend (sin frontend)
./create-instance.sh test --skip-frontend

# Simular sin ejecutar
./create-instance.sh demo --dry-run
```

---

## Proceso Manual de Creación

Si no puedes usar el script automatizado, sigue estos pasos manualmente.

### 1. Crear Subdominio

**Via cPanel UI:**
1. Accede a cPanel
2. Ve a `Domains` → `Subdomains`
3. Crea subdominio:
   - Subdominio: `empresa1`
   - Dominio: `stratekaz.com`
   - Document Root: `empresa1.stratekaz.com`
4. Click `Create`

**Via SSH:**
```bash
uapi --user=strat SubDomain add_subdomain \
    domain=empresa1 \
    rootdomain=stratekaz.com \
    dir=empresa1.stratekaz.com
```

### 2. Crear Base de Datos

**Via cPanel UI:**
1. Ve a `Databases` → `MySQL Databases`
2. Crear base de datos:
   - Nombre: `empresa1_db` (cPanel añadirá prefijo)
3. Crear usuario:
   - Usuario: `empresa1_user`
   - Password: (genera uno seguro)
4. Asignar usuario a BD con `ALL PRIVILEGES`

**Via SSH:**
```bash
# Crear BD
uapi --user=strat Mysql create_database name=strat_empresa1_db

# Crear usuario
uapi --user=strat Mysql create_user \
    name=strat_empresa1_user \
    password="TuPasswordSeguro123"

# Asignar privilegios
uapi --user=strat Mysql set_privileges_on_database \
    user=strat_empresa1_user \
    database=strat_empresa1_db \
    privileges="ALL PRIVILEGES"
```

### 3. Clonar Código

```bash
cd /home/strat
git clone https://github.com/Kmylosky83/Grasas-Huesos-SGI.git empresa1.stratekaz.com
cd empresa1.stratekaz.com

# Crear directorios
mkdir -p tmp logs backend/logs backend/media backend/staticfiles
```

### 4. Configurar Python App

1. En cPanel, ve a `Setup Python App`
2. Click `CREATE APPLICATION`
3. Configurar:
   - Python version: 3.9
   - Application root: `empresa1.stratekaz.com`
   - Application URL: (vacío)
   - Application startup file: `passenger_wsgi.py`
   - Application Entry point: `application`
4. Click `CREATE`

### 5. Crear .env

```bash
cd backend
cat > .env << 'EOF'
SECRET_KEY=genera_con_comando_django
DEBUG=False
ALLOWED_HOSTS=empresa1.stratekaz.com

DB_NAME=strat_empresa1_db
DB_USER=strat_empresa1_user
DB_PASSWORD=TuPasswordMySQL
DB_HOST=localhost
DB_PORT=3306

USE_CPANEL=True
CSRF_TRUSTED_ORIGINS=https://empresa1.stratekaz.com
CORS_ALLOWED_ORIGINS=https://empresa1.stratekaz.com
EOF

chmod 600 .env
```

Generar SECRET_KEY:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 6. Instalar Dependencias

```bash
cd /home/strat/empresa1.stratekaz.com/backend
source /home/strat/virtualenv/empresa1.stratekaz.com/3.9/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 7. Ejecutar Migraciones

```bash
python manage.py check --database default
python manage.py migrate --noinput
python manage.py createcachetable
```

### 8. Crear Superusuario

```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@empresa1.stratekaz.com
# Password: (ingresa password seguro)
```

### 9. Seed de Datos Iniciales

```bash
python manage.py seed_permisos_rbac
python manage.py seed_config_identidad
python manage.py seed_identidad
```

### 10. Collectstatic

```bash
python manage.py collectstatic --noinput
```

### 11. Copiar passenger_wsgi.py

```bash
cd /home/strat/empresa1.stratekaz.com
cp deploy/cpanel/passenger_wsgi.py ./
```

### 12. Configurar .htaccess

```bash
cd public_html
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
EOF
```

### 13. Configurar SSL

1. En cPanel, ve a `SSL/TLS Status`
2. Busca `empresa1.stratekaz.com`
3. Click `Run AutoSSL`
4. Espera a que se genere el certificado

### 14. Reiniciar Aplicación

```bash
touch /home/strat/empresa1.stratekaz.com/tmp/restart.txt
```

### 15. Verificar

```bash
# Test de API
curl https://empresa1.stratekaz.com/api/health/

# Acceder al admin
# https://empresa1.stratekaz.com/admin/
```

---

## Checklist de Go-Live

### P0 - Seguridad (CRÍTICO - Bloqueante)

Estos items DEBEN completarse antes de dar acceso a producción.

- [ ] **DEBUG=False** en .env
- [ ] **SECRET_KEY** generada aleatoriamente (50+ caracteres)
- [ ] **ALLOWED_HOSTS** configurado solo con dominios reales
- [ ] **SSL/HTTPS** activo y funcionando (certificado válido)
- [ ] **CSRF_TRUSTED_ORIGINS** configurado correctamente
- [ ] **CORS_ALLOWED_ORIGINS** limitado a dominios confiables
- [ ] **Password de BD** seguro (16+ caracteres, aleatorio)
- [ ] **Password de superusuario** seguro
- [ ] **Archivo .env** con permisos 600 (chmod 600)
- [ ] **Credenciales respaldadas** en lugar seguro (fuera del servidor)
- [ ] **Django security check** pasando: `python manage.py check --deploy`

### P1 - Funcionalidad Core (CRÍTICO - Bloqueante)

- [ ] **Base de datos** conectando correctamente
- [ ] **Migraciones** ejecutadas sin errores
- [ ] **Superusuario** creado y puede iniciar sesión
- [ ] **Admin panel** accesible: `https://empresa.stratekaz.com/admin/`
- [ ] **API health check** respondiendo 200: `/api/health/`
- [ ] **Archivos estáticos** cargando (CSS/JS en admin)
- [ ] **Logs** escribiendo correctamente en `backend/logs/`
- [ ] **Tabla de cache** creada: `python manage.py createcachetable`

### P2 - Deployment (IMPORTANTE)

- [ ] **Scripts de deployment** funcionando:
  - [ ] Script de actualización probado
  - [ ] Script de backup probado
  - [ ] Script de reinicio funcionando
- [ ] **passenger_wsgi.py** configurado correctamente
- [ ] **Python App** en estado "Running" en cPanel
- [ ] **VirtualEnv** activado y con todas las dependencias
- [ ] **.htaccess** configurado para SPA routing
- [ ] **Frontend** desplegado y cargando
- [ ] **API calls** desde frontend funcionando

### P3 - Datos Iniciales (IMPORTANTE)

- [ ] **Seed de permisos RBAC** ejecutado
- [ ] **Seed de configuración** ejecutado
- [ ] **Datos de ejemplo** cargados (si aplica)
- [ ] **Empresa configurada** en sistema:
  - [ ] Nombre de empresa
  - [ ] Logo subido
  - [ ] Información de contacto
- [ ] **Usuarios iniciales** creados:
  - [ ] Superusuario (admin)
  - [ ] Usuario de prueba (para testing)

### P4 - Backup y Recuperación (IMPORTANTE)

- [ ] **Backup automático** de BD configurado (cPanel o cron)
- [ ] **Backup manual** de BD realizado y verificado
- [ ] **Backup de archivos media** realizado
- [ ] **Credenciales de BD** respaldadas
- [ ] **Plan de recuperación** documentado
- [ ] **Tiempo de recuperación** estimado y probado
- [ ] **Backup offsite** configurado (opcional pero recomendado)

### P5 - Monitoreo y Logging (RECOMENDADO)

- [ ] **Health check endpoint** funcionando: `/api/health/`
- [ ] **Uptime monitoring** configurado (UptimeRobot, Pingdom, etc.)
- [ ] **Logs de errores** siendo escritos en `backend/logs/django.log`
- [ ] **Logs de Passenger** accesibles en `backend/logs/passenger.log`
- [ ] **Sentry** configurado (opcional, para error tracking)
- [ ] **Email de notificaciones** configurado
- [ ] **Alertas de errores** activas

### P6 - Performance (RECOMENDADO)

- [ ] **collectstatic** ejecutado (archivos en `staticfiles/`)
- [ ] **Cache de BD** configurado (`createcachetable`)
- [ ] **Compresión gzip** activa (.htaccess)
- [ ] **Browser caching** configurado (.htaccess)
- [ ] **Tiempo de carga** < 3 segundos en primera carga
- [ ] **API response time** < 500ms en endpoints principales
- [ ] **Assets minificados** (frontend build production)

### P7 - Testing Funcional (RECOMENDADO)

- [ ] **Login/Logout** funcionando
- [ ] **CRUD básico** funcionando en al menos un módulo
- [ ] **Permisos RBAC** aplicando correctamente
- [ ] **Upload de archivos** funcionando (media/)
- [ ] **Export de reportes** funcionando (PDF, Excel)
- [ ] **Navegación frontend** sin errores
- [ ] **Reload en rutas** funcionando (SPA routing)
- [ ] **Responsive design** verificado (mobile, tablet, desktop)

### P8 - Email (OPCIONAL pero recomendado)

- [ ] **SMTP configurado** en .env
- [ ] **Email de prueba** enviado correctamente
- [ ] **Recuperación de contraseña** funcionando
- [ ] **Email de notificaciones** funcionando

### P9 - Documentación (RECOMENDADO)

- [ ] **.instance-info** creado con metadata de la instancia
- [ ] **Credenciales** documentadas y guardadas en lugar seguro
- [ ] **Usuarios y roles** documentados
- [ ] **Contacto de soporte** asignado
- [ ] **Runbook de operaciones** disponible
- [ ] **URL de acceso** compartida con cliente

### Comandos de Verificación

```bash
# Verificar todas las configuraciones críticas de seguridad
python manage.py check --deploy

# Verificar conexión a BD
python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('✓ BD OK')"

# Verificar que DEBUG esté en False
python manage.py shell -c "from django.conf import settings; print('DEBUG =', settings.DEBUG); assert not settings.DEBUG"

# Health check de API
curl -f https://empresa1.stratekaz.com/api/health/ || echo "FALLO"

# Verificar SSL
curl -I https://empresa1.stratekaz.com | grep "HTTP/2 200" || echo "FALLO SSL"

# Ver logs recientes
tail -50 backend/logs/django.log

# Verificar que passenger esté corriendo
ps aux | grep passenger | grep empresa1
```

---

## Operaciones Multi-Instancia

### Script: update-all-instances.sh

Actualiza todas las instancias a la vez.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# UPDATE ALL INSTANCES - Actualización Multi-Instancia
# ═══════════════════════════════════════════════════════════════════════════════

CPANEL_USER="strat"
DOMAIN_BASE="stratekaz.com"
HOME_DIR="/home/${CPANEL_USER}"
PYTHON_VERSION="3.9"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Encontrar todas las instancias
INSTANCES=$(find "$HOME_DIR" -maxdepth 1 -type d -name "*${DOMAIN_BASE}" | sort)

if [ -z "$INSTANCES" ]; then
    echo -e "${RED}No se encontraron instancias${NC}"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════════════════════"
echo " ACTUALIZACIÓN MULTI-INSTANCIA"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Instancias encontradas:"
echo "$INSTANCES" | while read instance; do
    basename "$instance"
done
echo ""

read -p "¿Continuar con la actualización de TODAS las instancias? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ]; then
    echo "Actualización cancelada"
    exit 0
fi

# Actualizar cada instancia
echo "$INSTANCES" | while read INSTANCE_DIR; do
    INSTANCE_NAME=$(basename "$INSTANCE_DIR")
    echo ""
    echo -e "${YELLOW}▶ Actualizando: ${INSTANCE_NAME}${NC}"

    # Verificar que exista backend
    if [ ! -d "$INSTANCE_DIR/backend" ]; then
        echo -e "${RED}  ✗ No se encontró directorio backend, omitiendo...${NC}"
        continue
    fi

    cd "$INSTANCE_DIR"

    # Backup de .env
    if [ -f "backend/.env" ]; then
        cp backend/.env backend/.env.backup
    fi

    # Git pull
    git fetch origin main
    git reset --hard origin/main
    echo -e "${GREEN}  ✓ Código actualizado${NC}"

    # Restaurar .env
    if [ -f "backend/.env.backup" ]; then
        mv backend/.env.backup backend/.env
    fi

    # Activar virtualenv
    VENV_PATH="${HOME_DIR}/virtualenv/${INSTANCE_NAME}/${PYTHON_VERSION}"
    source "${VENV_PATH}/bin/activate"

    # Actualizar dependencias
    cd backend
    pip install -r requirements.txt --quiet
    echo -e "${GREEN}  ✓ Dependencias actualizadas${NC}"

    # Migraciones
    python manage.py migrate --noinput
    echo -e "${GREEN}  ✓ Migraciones ejecutadas${NC}"

    # Collectstatic
    python manage.py collectstatic --noinput
    echo -e "${GREEN}  ✓ Archivos estáticos recolectados${NC}"

    # Reiniciar
    touch "$INSTANCE_DIR/tmp/restart.txt"
    echo -e "${GREEN}  ✓ Aplicación reiniciada${NC}"

    echo -e "${GREEN}  ✅ ${INSTANCE_NAME} actualizado exitosamente${NC}"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN} ✅ ACTUALIZACIÓN COMPLETADA${NC}"
echo "═══════════════════════════════════════════════════════════════════════════════"
```

### Script: backup-all-instances.sh

Backup de todas las instancias.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# BACKUP ALL INSTANCES - Backup Multi-Instancia
# ═══════════════════════════════════════════════════════════════════════════════

CPANEL_USER="strat"
DOMAIN_BASE="stratekaz.com"
HOME_DIR="/home/${CPANEL_USER}"
BACKUPS_DIR="${HOME_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUPS_DIR"

# Encontrar todas las instancias
INSTANCES=$(find "$HOME_DIR" -maxdepth 1 -type d -name "*${DOMAIN_BASE}" | sort)

echo "═══════════════════════════════════════════════════════════════════════════════"
echo " BACKUP MULTI-INSTANCIA - $(date)"
echo "═══════════════════════════════════════════════════════════════════════════════"

echo "$INSTANCES" | while read INSTANCE_DIR; do
    INSTANCE_NAME=$(basename "$INSTANCE_DIR")

    # Leer metadata de la instancia
    if [ -f "$INSTANCE_DIR/.instance-info" ]; then
        source "$INSTANCE_DIR/.instance-info"
    else
        echo "⚠ No se encontró .instance-info para $INSTANCE_NAME, omitiendo..."
        continue
    fi

    echo ""
    echo "▶ Backup de: ${INSTANCE_NAME}"

    BACKUP_INSTANCE_DIR="${BACKUPS_DIR}/${INSTANCE_NAME}"
    mkdir -p "${BACKUP_INSTANCE_DIR}/db"
    mkdir -p "${BACKUP_INSTANCE_DIR}/files"

    # Backup de base de datos
    DB_BACKUP_FILE="${BACKUP_INSTANCE_DIR}/db/${DB_NAME}_${TIMESTAMP}.sql"
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$DB_BACKUP_FILE"
    gzip "$DB_BACKUP_FILE"
    echo "  ✓ BD respaldada: ${DB_BACKUP_FILE}.gz"

    # Backup de archivos media
    if [ -d "$INSTANCE_DIR/backend/media" ]; then
        MEDIA_BACKUP="${BACKUP_INSTANCE_DIR}/files/media_${TIMESTAMP}.tar.gz"
        tar -czf "$MEDIA_BACKUP" -C "$INSTANCE_DIR/backend" media/
        echo "  ✓ Media respaldado: ${MEDIA_BACKUP}"
    fi

    # Backup de .env
    if [ -f "$INSTANCE_DIR/backend/.env" ]; then
        cp "$INSTANCE_DIR/backend/.env" "${BACKUP_INSTANCE_DIR}/.env_${TIMESTAMP}"
        echo "  ✓ .env respaldado"
    fi

    # Limpiar backups antiguos (mantener últimos 30 días)
    find "${BACKUP_INSTANCE_DIR}/db" -name "*.sql.gz" -mtime +30 -delete
    find "${BACKUP_INSTANCE_DIR}/files" -name "*.tar.gz" -mtime +30 -delete

    echo "  ✅ ${INSTANCE_NAME} respaldado exitosamente"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo " ✅ BACKUP COMPLETADO - Backups en: ${BACKUPS_DIR}"
echo "═══════════════════════════════════════════════════════════════════════════════"
```

### Script: health-check-all.sh

Monitoreo de todas las instancias.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK ALL INSTANCES - Monitoreo Multi-Instancia
# ═══════════════════════════════════════════════════════════════════════════════

CPANEL_USER="strat"
DOMAIN_BASE="stratekaz.com"
HOME_DIR="/home/${CPANEL_USER}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Encontrar todas las instancias
INSTANCES=$(find "$HOME_DIR" -maxdepth 1 -type d -name "*${DOMAIN_BASE}" | sort)

echo "═══════════════════════════════════════════════════════════════════════════════"
echo " HEALTH CHECK MULTI-INSTANCIA - $(date)"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

printf "%-30s %-10s %-15s %-10s\n" "INSTANCIA" "API" "DB" "DISK"
echo "───────────────────────────────────────────────────────────────────────────────"

echo "$INSTANCES" | while read INSTANCE_DIR; do
    INSTANCE_NAME=$(basename "$INSTANCE_DIR")
    SUBDOMAIN="https://${INSTANCE_NAME}"

    # Check API
    API_STATUS="FAIL"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SUBDOMAIN}/api/health/" --max-time 5 || echo "000")
    if [ "$HTTP_CODE" == "200" ]; then
        API_STATUS="OK"
    fi

    # Check DB
    DB_STATUS="FAIL"
    if [ -f "$INSTANCE_DIR/.instance-info" ]; then
        source "$INSTANCE_DIR/.instance-info"
        DB_TEST=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_NAME" 2>/dev/null && echo "OK" || echo "FAIL")
        DB_STATUS="$DB_TEST"
    fi

    # Check Disk Usage
    DISK_USAGE=$(du -sh "$INSTANCE_DIR" | cut -f1)

    # Color output
    if [ "$API_STATUS" == "OK" ]; then
        API_COLOR="${GREEN}"
    else
        API_COLOR="${RED}"
    fi

    if [ "$DB_STATUS" == "OK" ]; then
        DB_COLOR="${GREEN}"
    else
        DB_COLOR="${RED}"
    fi

    printf "%-30s ${API_COLOR}%-10s${NC} ${DB_COLOR}%-15s${NC} %-10s\n" \
        "$INSTANCE_NAME" "$API_STATUS" "$DB_STATUS" "$DISK_USAGE"
done

echo ""
```

### Script: list-instances.sh

Listar todas las instancias con información.

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LIST INSTANCES - Listar Instancias Multi-Tenant
# ═══════════════════════════════════════════════════════════════════════════════

CPANEL_USER="strat"
DOMAIN_BASE="stratekaz.com"
HOME_DIR="/home/${CPANEL_USER}"

INSTANCES=$(find "$HOME_DIR" -maxdepth 1 -type d -name "*${DOMAIN_BASE}" | sort)

echo "═══════════════════════════════════════════════════════════════════════════════"
echo " INSTANCIAS ACTIVAS - StrateKaz Multi-Tenant"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

COUNT=0
echo "$INSTANCES" | while read INSTANCE_DIR; do
    if [ -f "$INSTANCE_DIR/.instance-info" ]; then
        source "$INSTANCE_DIR/.instance-info"

        COUNT=$((COUNT + 1))

        echo "[$COUNT] ${COMPANY_NAME}"
        echo "    Subdominio:    https://${SUBDOMAIN}"
        echo "    Base de Datos: ${DB_NAME}"
        echo "    Creada:        ${CREATED_DATE}"
        echo "    Versión:       ${VERSION}"
        echo "    Módulos:       ${MODULES_ENABLED}"
        echo "    Estado:        ${STATUS}"
        echo ""
    fi
done

TOTAL=$(echo "$INSTANCES" | wc -l)
echo "───────────────────────────────────────────────────────────────────────────────"
echo "Total de instancias: $TOTAL"
```

---

## Monitoreo Centralizado

### Dashboard de Monitoreo

Crear un dashboard centralizado con información de todas las instancias.

**Archivo:** `~/scripts/dashboard.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StrateKaz - Dashboard Multi-Instancia</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        header { background: #2c3e50; color: white; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
        h1 { font-size: 24px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 36px; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 15px; text-align: left; }
        th { background: #34495e; color: white; }
        tr:nth-child(even) { background: #f8f9fa; }
        .status-ok { color: #27ae60; font-weight: bold; }
        .status-fail { color: #e74c3c; font-weight: bold; }
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>StrateKaz - Dashboard Multi-Instancia</h1>
            <p>Última actualización: <span id="timestamp"></span></p>
        </header>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="total-instances">0</div>
                <div class="stat-label">Instancias Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="active-instances">0</div>
                <div class="stat-label">Instancias Activas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-disk">0 GB</div>
                <div class="stat-label">Uso Total de Disco</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-databases">0</div>
                <div class="stat-label">Bases de Datos</div>
            </div>
        </div>

        <table id="instances-table">
            <thead>
                <tr>
                    <th>Empresa</th>
                    <th>Subdominio</th>
                    <th>API Status</th>
                    <th>DB Status</th>
                    <th>Versión</th>
                    <th>Creada</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="instances-body">
                <!-- Instancias se cargan aquí via JavaScript -->
            </tbody>
        </table>
    </div>

    <script>
        // Actualizar timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString('es-CO');

        // Cargar datos de instancias
        // En un entorno real, esto vendría de una API o script PHP
        // Para demo, usamos datos de ejemplo
        const instances = [
            { name: 'Grasas y Huesos', subdomain: 'grasas.stratekaz.com', apiStatus: 'OK', dbStatus: 'OK', version: '3.3.0', created: '2026-01-10' },
            { name: 'Econorte', subdomain: 'econorte.stratekaz.com', apiStatus: 'OK', dbStatus: 'OK', version: '3.3.0', created: '2026-01-12' },
            { name: 'ACME Corp', subdomain: 'acme.stratekaz.com', apiStatus: 'FAIL', dbStatus: 'OK', version: '3.2.0', created: '2026-01-05' },
        ];

        // Actualizar estadísticas
        document.getElementById('total-instances').textContent = instances.length;
        document.getElementById('active-instances').textContent = instances.filter(i => i.apiStatus === 'OK').length;
        document.getElementById('total-databases').textContent = instances.length;

        // Renderizar tabla
        const tbody = document.getElementById('instances-body');
        instances.forEach(instance => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${instance.name}</td>
                <td><a href="https://${instance.subdomain}" target="_blank">${instance.subdomain}</a></td>
                <td class="${instance.apiStatus === 'OK' ? 'status-ok' : 'status-fail'}">${instance.apiStatus}</td>
                <td class="${instance.dbStatus === 'OK' ? 'status-ok' : 'status-fail'}">${instance.dbStatus}</td>
                <td>${instance.version}</td>
                <td>${instance.created}</td>
                <td>
                    <a href="https://${instance.subdomain}/admin/" target="_blank" class="btn">Admin</a>
                </td>
            `;
        });
    </script>
</body>
</html>
```

### Cron Jobs para Monitoreo

Agregar a crontab:

```bash
# Health check diario (7 AM)
0 7 * * * /home/strat/scripts/health-check-all.sh > /home/strat/logs/health-checks.log 2>&1

# Backup diario (2 AM)
0 2 * * * /home/strat/scripts/backup-all-instances.sh > /home/strat/logs/backups.log 2>&1

# Reporte semanal (Lunes 8 AM)
0 8 * * 1 /home/strat/scripts/weekly-report.sh | mail -s "Reporte Semanal StrateKaz" admin@stratekaz.com
```

---

## Troubleshooting Multi-Instancia

### Problema: Una instancia no responde

**Diagnóstico:**
```bash
# Verificar si Passenger está corriendo
ps aux | grep passenger | grep empresa1

# Ver logs
tail -50 /home/strat/empresa1.stratekaz.com/backend/logs/passenger.log

# Verificar conexión a BD
mysql -u strat_empresa1_user -p strat_empresa1_db -e "SELECT 1;"
```

**Solución:**
```bash
# Reiniciar la instancia
touch /home/strat/empresa1.stratekaz.com/tmp/restart.txt

# Si no funciona, verificar Python App en cPanel
# Setup Python App → Restart
```

### Problema: Error de base de datos en varias instancias

**Diagnóstico:**
```bash
# Verificar servidor MySQL
systemctl status mysql

# Ver procesos MySQL
mysqladmin -u root -p processlist

# Ver conexiones por usuario
mysql -e "SELECT user, COUNT(*) FROM information_schema.processlist GROUP BY user;"
```

**Solución:**
```bash
# Reiniciar MySQL (solo si tienes acceso root)
systemctl restart mysql

# O contactar al proveedor de hosting
```

### Problema: Disco lleno

**Diagnóstico:**
```bash
# Ver uso por instancia
du -sh /home/strat/*.stratekaz.com

# Ver archivos grandes
find /home/strat -type f -size +100M -exec ls -lh {} \;

# Ver logs grandes
find /home/strat -name "*.log" -size +50M
```

**Solución:**
```bash
# Limpiar logs antiguos
find /home/strat/*/backend/logs -name "*.log" -mtime +30 -delete

# Limpiar backups antiguos
find /home/strat/backups -name "*.sql.gz" -mtime +60 -delete

# Limpiar archivos media innecesarios (con cuidado)
# Revisar manualmente antes de eliminar
```

### Problema: Actualización falló en una instancia

**Diagnóstico:**
```bash
# Ver logs de Git
cd /home/strat/empresa1.stratekaz.com
git status
git log -5

# Ver logs de migraciones
tail -100 backend/logs/django.log | grep migration
```

**Solución:**
```bash
# Rollback de Git si es necesario
git reset --hard HEAD~1

# Restaurar .env si se sobrescribió
cp backend/.env.backup backend/.env

# Re-ejecutar migraciones
source /home/strat/virtualenv/empresa1.stratekaz.com/3.9/bin/activate
cd backend
python manage.py migrate --noinput

# Reiniciar
touch ../tmp/restart.txt
```

---

## Mejores Prácticas

### Gestión de Instancias

1. **Nomenclatura Consistente:**
   - Usa nombres cortos y descriptivos (max 15 caracteres)
   - Solo minúsculas, números y guiones
   - Evita caracteres especiales

2. **Metadata Completa:**
   - Siempre crea archivo `.instance-info`
   - Documenta versión, módulos activos, fecha de creación
   - Actualiza metadata al hacer cambios importantes

3. **Backups Regulares:**
   - BD: Diario
   - Archivos media: Semanal
   - Configuración (.env): Cada cambio
   - Mantener backups offsite (Dropbox, S3, etc.)

4. **Monitoreo Proactivo:**
   - Health checks automáticos cada hora
   - Alertas de downtime
   - Reportes semanales de estado

### Seguridad

1. **Aislamiento:**
   - Cada instancia debe tener su propia BD y usuario
   - No compartir credenciales entre instancias
   - Usar passwords diferentes y seguros

2. **Actualizaciones:**
   - Probar actualizaciones en instancia de staging primero
   - Hacer backup antes de actualizar
   - Actualizar fuera de horas pico

3. **Logs y Auditoría:**
   - Mantener logs de todas las operaciones
   - Revisar logs regularmente
   - Alertas de eventos sospechosos

### Performance

1. **Recursos:**
   - Monitorear uso de CPU, RAM, disco por instancia
   - Establecer límites de recursos en cPanel si es posible
   - Considerar migrar instancias grandes a VPS dedicado

2. **Cache:**
   - Usar cache de BD para todas las instancias
   - Implementar cache de templates
   - CDN para assets estáticos si es posible

3. **Optimización:**
   - Limpiar logs y archivos temporales regularmente
   - Optimizar queries de BD
   - Comprimir assets y habilitar gzip

### Documentación

1. **Runbook:**
   - Documentar procedimientos de deployment
   - Procedimientos de rollback
   - Contactos de emergencia

2. **Changelog:**
   - Mantener log de cambios por instancia
   - Documentar versiones desplegadas
   - Registrar incidentes y resoluciones

3. **Transferencia de Conocimiento:**
   - Scripts comentados y autoexplicativos
   - Guías actualizadas
   - Training para nuevos administradores

---

## Resumen

Esta guía cubre la gestión completa de múltiples instancias de StrateKaz en cPanel:

- Arquitectura multi-tenant con aislamiento total
- Scripts automatizados para creación, actualización y backup
- Checklist completo de Go-Live con P0 a P9
- Operaciones centralizadas para todas las instancias
- Monitoreo y troubleshooting

### Comandos Rápidos

```bash
# Crear nueva instancia
/home/strat/scripts/create-instance.sh empresa1

# Actualizar todas las instancias
/home/strat/scripts/update-all-instances.sh

# Backup de todas las instancias
/home/strat/scripts/backup-all-instances.sh

# Health check de todas las instancias
/home/strat/scripts/health-check-all.sh

# Listar instancias
/home/strat/scripts/list-instances.sh

# Reiniciar instancia específica
touch /home/strat/empresa1.stratekaz.com/tmp/restart.txt
```

---

**Última actualización:** 2026-01-15
**Versión de la guía:** 1.0
**Mantenido por:** Equipo DevOps - StrateKaz
