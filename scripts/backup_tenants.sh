#!/bin/bash
# =============================================================================
# STRATEKAZ - Script de Backups Automáticos Multi-Tenant
# =============================================================================
#
# Ejecuta backups de:
# 1. BD Master (stratekaz_master)
# 2. Todas las BDs de tenants activos
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
# CONFIGURACIÓN
# -----------------------------------------------------------------------------

# Directorio de backups
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"

# Credenciales MySQL (usar variables de entorno o archivo .my.cnf)
MYSQL_USER="${DB_USER:-stratekaz}"
MYSQL_PASSWORD="${DB_PASSWORD:-}"
MYSQL_HOST="${DB_HOST:-localhost}"
MYSQL_PORT="${DB_PORT:-3306}"

# BD Master
MASTER_DB="${MASTER_DB:-stratekaz_master}"

# Retención por defecto (días)
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

# Función para ejecutar mysqldump
do_backup() {
    local db_name=$1
    local backup_path=$2

    mysqldump \
        --user="$MYSQL_USER" \
        --password="$MYSQL_PASSWORD" \
        --host="$MYSQL_HOST" \
        --port="$MYSQL_PORT" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --quick \
        --lock-tables=false \
        "$db_name" | gzip > "$backup_path"

    return $?
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    local backup_dir=$1
    local retention_days=$2

    find "$backup_dir" -name "*.sql.gz" -type f -mtime +$retention_days -delete
    log_info "Limpieza completada: eliminados backups > $retention_days días en $backup_dir"
}

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "INICIO BACKUP MULTI-TENANT STRATEKAZ"
log_info "=========================================="

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR/master"

# -----------------------------------------------------------------------------
# 1. BACKUP BD MASTER
# -----------------------------------------------------------------------------

log_info "Iniciando backup de BD Master..."

MASTER_BACKUP_PATH="$BACKUP_DIR/master/${DATE}_${MASTER_DB}.sql.gz"

if do_backup "$MASTER_DB" "$MASTER_BACKUP_PATH"; then
    MASTER_SIZE=$(du -h "$MASTER_BACKUP_PATH" | cut -f1)
    log_info "✓ BD Master completado: $MASTER_BACKUP_PATH ($MASTER_SIZE)"
else
    log_error "✗ Error en backup de BD Master"
fi

# Limpiar backups antiguos de master
cleanup_old_backups "$BACKUP_DIR/master" $DEFAULT_RETENTION_DAYS

# -----------------------------------------------------------------------------
# 2. BACKUP BDs DE TENANTS
# -----------------------------------------------------------------------------

log_info "Obteniendo lista de tenants activos..."

# Obtener lista de tenants activos con su configuración de backup
TENANTS=$(mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    --host="$MYSQL_HOST" \
    --port="$MYSQL_PORT" \
    --database="$MASTER_DB" \
    --skip-column-names \
    --execute="SELECT db_name, backup_retention_days FROM tenant_tenant WHERE is_active = 1 AND backup_enabled = 1")

if [ -z "$TENANTS" ]; then
    log_warn "No se encontraron tenants activos con backup habilitado"
else
    TENANT_COUNT=$(echo "$TENANTS" | wc -l)
    log_info "Encontrados $TENANT_COUNT tenants para backup"

    # Procesar cada tenant
    while IFS=$'\t' read -r DB_NAME RETENTION_DAYS; do
        # Usar retención por defecto si no está configurada
        RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}

        log_info "Procesando tenant: $DB_NAME (retención: $RETENTION_DAYS días)"

        # Crear directorio del tenant
        TENANT_BACKUP_DIR="$BACKUP_DIR/$DB_NAME"
        mkdir -p "$TENANT_BACKUP_DIR"

        # Realizar backup
        TENANT_BACKUP_PATH="$TENANT_BACKUP_DIR/${DATE}_${DB_NAME}.sql.gz"

        if do_backup "$DB_NAME" "$TENANT_BACKUP_PATH"; then
            TENANT_SIZE=$(du -h "$TENANT_BACKUP_PATH" | cut -f1)
            log_info "  ✓ Completado: $TENANT_BACKUP_PATH ($TENANT_SIZE)"
        else
            log_error "  ✗ Error en backup de $DB_NAME"
        fi

        # Limpiar backups antiguos del tenant
        cleanup_old_backups "$TENANT_BACKUP_DIR" "$RETENTION_DAYS"

    done <<< "$TENANTS"
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
find "$BACKUP_DIR" -name "${DATE}*.sql.gz" -type f -exec ls -lh {} \; 2>/dev/null

log_info "=========================================="
log_info "FIN"
log_info "=========================================="
