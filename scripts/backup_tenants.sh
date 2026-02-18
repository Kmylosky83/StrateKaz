#!/bin/bash
# =============================================================================
# STRATEKAZ - Script de Backups Automaticos Multi-Tenant (PostgreSQL)
# =============================================================================
#
# Ejecuta backups de:
# 1. BD completa (todos los schemas de tenant via pg_dump)
#
# Uso:
#   ./backup_tenants.sh
#
# Cron (diario a las 2:00 AM):
#   0 2 * * * /path/to/scripts/backup_tenants.sh >> /var/log/stratekaz_backup.log 2>&1
#
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

# Directorio de backups
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"

# Credenciales PostgreSQL (usar variables de entorno o archivo .pgpass)
PG_USER="${DB_USER:-stratekaz}"
PG_HOST="${DB_HOST:-localhost}"
PG_PORT="${DB_PORT:-5432}"
PG_DB="${DB_NAME:-stratekaz}"

# Retencion por defecto (dias)
DEFAULT_RETENTION_DAYS=30

# Fecha actual
DATE=$(date +%Y-%m-%d)
DATETIME=$(date +%Y-%m-%d_%H%M%S)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Funcion para ejecutar pg_dump (full database con todos los schemas)
do_backup() {
    local backup_path=$1

    pg_dump \
        --username="$PG_USER" \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --format=custom \
        --compress=6 \
        --verbose \
        "$PG_DB" > "$backup_path" 2>/dev/null

    return $?
}

# Funcion para backup de un schema especifico
do_schema_backup() {
    local schema_name=$1
    local backup_path=$2

    pg_dump \
        --username="$PG_USER" \
        --host="$PG_HOST" \
        --port="$PG_PORT" \
        --schema="$schema_name" \
        --format=custom \
        --compress=6 \
        "$PG_DB" > "$backup_path" 2>/dev/null

    return $?
}

# Funcion para limpiar backups antiguos
cleanup_old_backups() {
    local backup_dir=$1
    local retention_days=$2

    find "$backup_dir" -name "*.dump" -type f -mtime +$retention_days -delete
    log_info "Limpieza completada: eliminados backups > $retention_days dias en $backup_dir"
}

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "INICIO BACKUP MULTI-TENANT STRATEKAZ"
log_info "=========================================="

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR/full"
mkdir -p "$BACKUP_DIR/schemas"

# -----------------------------------------------------------------------------
# 1. BACKUP COMPLETO (todos los schemas)
# -----------------------------------------------------------------------------

log_info "Iniciando backup completo de la BD..."

FULL_BACKUP_PATH="$BACKUP_DIR/full/${DATE}_${PG_DB}.dump"

if do_backup "$FULL_BACKUP_PATH"; then
    FULL_SIZE=$(du -h "$FULL_BACKUP_PATH" | cut -f1)
    log_info "BD completa: $FULL_BACKUP_PATH ($FULL_SIZE)"
else
    log_error "Error en backup completo de la BD"
fi

# Limpiar backups antiguos
cleanup_old_backups "$BACKUP_DIR/full" $DEFAULT_RETENTION_DAYS

# -----------------------------------------------------------------------------
# 2. BACKUP SCHEMAS DE TENANTS (individual)
# -----------------------------------------------------------------------------

log_info "Obteniendo lista de schemas de tenants activos..."

# Obtener lista de schemas de tenants activos desde la BD
SCHEMAS=$(psql \
    --username="$PG_USER" \
    --host="$PG_HOST" \
    --port="$PG_PORT" \
    --dbname="$PG_DB" \
    --tuples-only \
    --no-align \
    --command="SELECT schema_name FROM public.tenant_tenant WHERE is_active = true AND schema_name != 'public'" 2>/dev/null)

if [ -z "$SCHEMAS" ]; then
    log_warn "No se encontraron tenants activos"
else
    SCHEMA_COUNT=$(echo "$SCHEMAS" | wc -l)
    log_info "Encontrados $SCHEMA_COUNT schemas de tenants para backup"

    # Procesar cada schema
    while IFS= read -r SCHEMA_NAME; do
        [ -z "$SCHEMA_NAME" ] && continue

        log_info "Procesando schema: $SCHEMA_NAME"

        # Crear directorio del schema
        SCHEMA_BACKUP_DIR="$BACKUP_DIR/schemas/$SCHEMA_NAME"
        mkdir -p "$SCHEMA_BACKUP_DIR"

        # Realizar backup
        SCHEMA_BACKUP_PATH="$SCHEMA_BACKUP_DIR/${DATE}_${SCHEMA_NAME}.dump"

        if do_schema_backup "$SCHEMA_NAME" "$SCHEMA_BACKUP_PATH"; then
            SCHEMA_SIZE=$(du -h "$SCHEMA_BACKUP_PATH" | cut -f1)
            log_info "  Completado: $SCHEMA_BACKUP_PATH ($SCHEMA_SIZE)"
        else
            log_error "  Error en backup de schema $SCHEMA_NAME"
        fi

        # Limpiar backups antiguos del schema
        cleanup_old_backups "$SCHEMA_BACKUP_DIR" "$DEFAULT_RETENTION_DAYS"

    done <<< "$SCHEMAS"
fi

# -----------------------------------------------------------------------------
# 3. RESUMEN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "BACKUP COMPLETADO"
log_info "=========================================="

# Mostrar uso de disco
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "Espacio total usado: $TOTAL_SIZE"

# Listar backups de hoy
log_info "Backups generados hoy:"
find "$BACKUP_DIR" -name "${DATE}*" -type f -exec ls -lh {} \; 2>/dev/null

log_info "=========================================="
log_info "FIN"
log_info "=========================================="
