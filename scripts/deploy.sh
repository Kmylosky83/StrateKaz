#!/bin/bash
# =============================================================================
# STRATEKAZ - Script de Deploy Completo para VPS Hostinger
# =============================================================================
#
# Ejecuta el deploy completo:
#   1. Backup de la base de datos
#   2. Pull del codigo desde origin main
#   3. Instalar dependencias backend (si hay cambios)
#   4. Migraciones en todos los schemas (tenants + public)
#   5. Sync seeds en todas las tenants activas
#   6. Collectstatic
#   7. Build del frontend
#   8. Restart de servicios (Gunicorn, Celery, Beat)
#   9. Health check
#
# Uso:
#   ./deploy.sh              # Deploy completo
#   ./deploy.sh --no-backup  # Sin backup previo
#   ./deploy.sh --backend    # Solo backend (sin build frontend)
#   ./deploy.sh --frontend   # Solo frontend (sin migraciones)
#   ./deploy.sh --dry-run    # Mostrar pasos sin ejecutar
#
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

PROJECT_DIR="${PROJECT_DIR:-/opt/stratekaz}"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"
SETTINGS="config.settings.production"

# PostgreSQL
PG_USER="${DB_USER:-stratekaz_user}"
PG_DB="${DB_NAME:-stratekaz_db}"

# Frontend env
VITE_API_URL="${VITE_API_URL:-https://app.stratekaz.com/api}"
VITE_BASE_DOMAIN="${VITE_BASE_DOMAIN:-stratekaz.com}"

# Servicios systemd
GUNICORN_SERVICE="stratekaz-gunicorn"
CELERY_SERVICE="stratekaz-celery"
BEAT_SERVICE="stratekaz-celerybeat"

# Fecha
DATETIME=$(date +%Y%m%d_%H%M%S)

# Flags
DO_BACKUP=true
DO_BACKEND=true
DO_FRONTEND=true
DRY_RUN=false

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"; }
log_step()  { echo -e "\n${BLUE}==============================${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}==============================${NC}"; }

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY-RUN]${NC} $1"
    else
        eval "$1"
    fi
}

check_exit() {
    if [ $? -ne 0 ]; then
        log_error "$1"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# PARSEO DE ARGUMENTOS
# -----------------------------------------------------------------------------

for arg in "$@"; do
    case $arg in
        --no-backup)  DO_BACKUP=false ;;
        --backend)    DO_FRONTEND=false ;;
        --frontend)   DO_BACKEND=false; DO_BACKUP=false ;;
        --dry-run)    DRY_RUN=true ;;
        --help|-h)
            echo "Uso: ./deploy.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --no-backup   Omitir backup de base de datos"
            echo "  --backend     Solo deploy backend (sin build frontend)"
            echo "  --frontend    Solo deploy frontend (sin migraciones)"
            echo "  --dry-run     Mostrar pasos sin ejecutar"
            echo "  --help        Mostrar esta ayuda"
            exit 0
            ;;
        *)
            log_error "Opcion desconocida: $arg"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# INICIO
# -----------------------------------------------------------------------------

log_step "DEPLOY STRATEKAZ - $(date '+%Y-%m-%d %H:%M:%S')"

if [ "$DRY_RUN" = true ]; then
    log_warn "Modo DRY-RUN: no se ejecutara ningun comando"
fi

log_info "Proyecto: $PROJECT_DIR"
log_info "Backend: $DO_BACKEND | Frontend: $DO_FRONTEND | Backup: $DO_BACKUP"

# Verificar directorio del proyecto
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Directorio del proyecto no encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# =============================================================================
# PASO 1: BACKUP
# =============================================================================

if [ "$DO_BACKUP" = true ]; then
    log_step "PASO 1: Backup de Base de Datos"

    run_cmd "mkdir -p $BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/stratekaz_pre_deploy_${DATETIME}.sql"
    log_info "Creando backup en: $BACKUP_FILE"
    run_cmd "sudo -u postgres pg_dump $PG_DB > $BACKUP_FILE"

    if [ "$DRY_RUN" = false ] && [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Backup completado: $BACKUP_SIZE"
    fi
else
    log_info "Backup omitido (--no-backup)"
fi

# =============================================================================
# PASO 2: GIT PULL
# =============================================================================

log_step "PASO 2: Pull del Codigo"

log_info "Rama actual: $(git branch --show-current)"

# Descartar cambios locales (ej: package-lock.json modificado por npm install)
log_info "Descartando cambios locales en archivos tracked..."
run_cmd "git checkout -- ."

run_cmd "git pull origin main"

if [ "$DRY_RUN" = false ]; then
    log_info "Ultimo commit: $(git log --oneline -1)"
fi

# =============================================================================
# PASO 3: BACKEND
# =============================================================================

if [ "$DO_BACKEND" = true ]; then

    # -------------------------------------------------------------------------
    # 3a: Dependencias Python
    # -------------------------------------------------------------------------
    log_step "PASO 3a: Dependencias Backend"

    run_cmd "source $VENV_DIR/bin/activate"

    # Verificar si requirements.txt cambio
    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "requirements"; then
        log_info "Cambios en requirements detectados, instalando..."
        run_cmd "pip install -r $BACKEND_DIR/requirements.txt --quiet"
    else
        log_info "Sin cambios en requirements, omitiendo instalacion"
    fi

    # -------------------------------------------------------------------------
    # 3b: Migraciones
    # -------------------------------------------------------------------------
    log_step "PASO 3b: Migraciones (todos los schemas)"

    cd "$BACKEND_DIR"

    # Mostrar migraciones pendientes
    if [ "$DRY_RUN" = false ]; then
        PENDING=$(DJANGO_SETTINGS_MODULE=$SETTINGS python manage.py showmigrations --plan 2>/dev/null | grep "\[ \]" | wc -l)
        log_info "Migraciones pendientes: $PENDING"
    fi

    run_cmd "DJANGO_SETTINGS_MODULE=$SETTINGS python manage.py migrate_schemas"
    log_info "Migraciones completadas en todos los schemas"

    # -------------------------------------------------------------------------
    # 3c: Seeds
    # -------------------------------------------------------------------------
    log_step "PASO 3c: Sync Seeds (todas las tenants)"

    run_cmd "DJANGO_SETTINGS_MODULE=$SETTINGS python manage.py sync_tenant_seeds --all"
    log_info "Seeds sincronizados en todas las tenants"

    # -------------------------------------------------------------------------
    # 3d: Collectstatic
    # -------------------------------------------------------------------------
    log_step "PASO 3d: Collectstatic"

    run_cmd "DJANGO_SETTINGS_MODULE=$SETTINGS python manage.py collectstatic --noinput --clear"
    log_info "Archivos estaticos recopilados"

    cd "$PROJECT_DIR"

else
    log_info "Backend omitido (--frontend)"
fi

# =============================================================================
# PASO 4: FRONTEND
# =============================================================================

if [ "$DO_FRONTEND" = true ]; then
    log_step "PASO 4: Build Frontend"

    cd "$FRONTEND_DIR"

    # Verificar si package.json cambio
    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "frontend/package"; then
        log_info "Cambios en package.json detectados, instalando dependencias..."
        run_cmd "npm ci --production=false"
    else
        log_info "Sin cambios en package.json, omitiendo npm install"
    fi

    log_info "Ejecutando build de produccion..."
    run_cmd "VITE_API_URL=$VITE_API_URL VITE_BASE_DOMAIN=$VITE_BASE_DOMAIN npm run build"

    if [ "$DRY_RUN" = false ] && [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist/ | cut -f1)
        log_info "Build completado: $DIST_SIZE"
    fi

    cd "$PROJECT_DIR"

else
    log_info "Frontend omitido (--backend)"
fi

# =============================================================================
# PASO 5: RESTART SERVICIOS
# =============================================================================

log_step "PASO 5: Restart Servicios"

run_cmd "sudo systemctl restart $GUNICORN_SERVICE"
log_info "Gunicorn reiniciado"

run_cmd "sudo systemctl restart $CELERY_SERVICE"
log_info "Celery reiniciado"

run_cmd "sudo systemctl restart $BEAT_SERVICE"
log_info "Celery Beat reiniciado"

# Esperar a que los servicios levanten
if [ "$DRY_RUN" = false ]; then
    sleep 3
fi

# =============================================================================
# PASO 6: VERIFICACION
# =============================================================================

log_step "PASO 6: Verificacion"

if [ "$DRY_RUN" = false ]; then
    # Estado de servicios
    for SERVICE in $GUNICORN_SERVICE $CELERY_SERVICE $BEAT_SERVICE; do
        STATUS=$(systemctl is-active $SERVICE 2>/dev/null || true)
        if [ "$STATUS" = "active" ]; then
            log_info "$SERVICE: ${GREEN}active${NC}"
        else
            log_error "$SERVICE: ${RED}$STATUS${NC}"
        fi
    done

    # Health check API
    log_info "Verificando API health..."
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://app.stratekaz.com/api/health/ 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        log_info "API Health: ${GREEN}OK (200)${NC}"
    else
        log_warn "API Health: respuesta $HTTP_CODE (puede tardar unos segundos)"
    fi
else
    log_info "[DRY-RUN] Se verificarian servicios y health check"
fi

# =============================================================================
# RESUMEN
# =============================================================================

log_step "DEPLOY COMPLETADO"

if [ "$DRY_RUN" = false ]; then
    log_info "Commit: $(git log --oneline -1)"
    log_info "Hora: $(date '+%Y-%m-%d %H:%M:%S')"
    if [ "$DO_BACKUP" = true ] && [ -f "$BACKUP_FILE" ]; then
        log_info "Backup: $BACKUP_FILE"
    fi
fi

log_info "Deploy finalizado exitosamente"
