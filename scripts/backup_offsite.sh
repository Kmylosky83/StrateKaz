#!/bin/bash
# =============================================================================
# STRATEKAZ - Backup Offsite via rclone + Google Drive
# =============================================================================
#
# Sincroniza backups locales a Google Drive usando rclone.
# Ejecutar DESPUES de backup_tenants.sh (30 min despues).
#
# Requisitos:
#   - rclone instalado y configurado con remote 'gdrive'
#   - Ejecutar setup_rclone.sh primero para configurar
#
# Uso:
#   ./backup_offsite.sh
#
# Exit codes:
#   0 - Exito
#   1 - rclone no instalado
#   2 - Remote 'gdrive' no configurado
#   3 - Error en sincronizacion
#
# Cron setup (agregar a crontab):
#   0 2 * * * /opt/stratekaz/scripts/backup_tenants.sh >> /var/log/stratekaz_backup.log 2>&1
#   30 2 * * * /opt/stratekaz/scripts/backup_offsite.sh >> /var/log/stratekaz_backup_offsite.log 2>&1
#   0 3 * * 0 /opt/stratekaz/scripts/backup_verify.sh >> /var/log/stratekaz_backup_verify.log 2>&1
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
GDRIVE_DEST="${GDRIVE_DEST:-stratekaz-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${LOG_FILE:-/var/log/stratekaz_backup_offsite.log}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@stratekaz.com}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Fecha actual
DATETIME=$(date '+%Y-%m-%d %H:%M:%S')

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Enviar alerta por email o webhook en caso de fallo
send_alert() {
    local subject="$1"
    local body="$2"

    # Intentar enviar por email
    if command -v mail &>/dev/null; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
        log_info "Alerta enviada por email a $ALERT_EMAIL"
    fi

    # Intentar enviar por webhook (Slack, Discord, etc.)
    if [ -n "$WEBHOOK_URL" ] && command -v curl &>/dev/null; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$subject\n$body\"}" \
            >/dev/null 2>&1 || true
        log_info "Alerta enviada por webhook"
    fi

    # Si no hay mail ni webhook, solo loggear
    if ! command -v mail &>/dev/null && [ -z "$WEBHOOK_URL" ]; then
        log_warn "No hay mecanismo de alerta configurado (mail o WEBHOOK_URL)"
    fi
}

# Verificar que rclone esta instalado
check_rclone_installed() {
    if ! command -v rclone &>/dev/null; then
        log_error "rclone no esta instalado"
        log_error "Instalar con: curl https://rclone.org/install.sh | sudo bash"
        send_alert \
            "[STRATEKAZ] FALLO Backup Offsite - rclone no instalado" \
            "rclone no esta instalado en el servidor. Instalar con: curl https://rclone.org/install.sh | sudo bash"
        exit 1
    fi
    log_info "rclone encontrado: $(rclone version | head -1)"
}

# Verificar que el remote esta configurado
check_remote_configured() {
    if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
        log_error "Remote '${RCLONE_REMOTE}' no configurado en rclone"
        log_error "Ejecutar: /opt/stratekaz/scripts/setup_rclone.sh"
        send_alert \
            "[STRATEKAZ] FALLO Backup Offsite - Remote no configurado" \
            "Remote '${RCLONE_REMOTE}' no esta configurado. Ejecutar setup_rclone.sh"
        exit 2
    fi
    log_info "Remote '${RCLONE_REMOTE}' configurado correctamente"
}

# Verificar que existen backups locales
check_local_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Directorio de backups local no existe: $BACKUP_DIR"
        send_alert \
            "[STRATEKAZ] FALLO Backup Offsite - Sin backups locales" \
            "Directorio $BACKUP_DIR no existe. Verificar que backup_tenants.sh se ejecuto."
        exit 3
    fi

    local file_count
    file_count=$(find "$BACKUP_DIR" -name "*.dump" -type f | wc -l)
    if [ "$file_count" -eq 0 ]; then
        log_warn "No hay archivos .dump en $BACKUP_DIR"
    else
        log_info "Encontrados $file_count archivos .dump locales"
    fi
}

# Sincronizar directorio a Google Drive
sync_directory() {
    local local_dir="$1"
    local remote_dir="$2"
    local dir_name="$3"

    if [ ! -d "$local_dir" ]; then
        log_warn "Directorio no existe, omitiendo: $local_dir"
        return 0
    fi

    log_info "Sincronizando $dir_name: $local_dir -> ${RCLONE_REMOTE}:${remote_dir}"

    if rclone sync \
        "$local_dir" \
        "${RCLONE_REMOTE}:${remote_dir}" \
        --transfers=4 \
        --checkers=8 \
        --contimeout=60s \
        --timeout=300s \
        --retries=3 \
        --low-level-retries=10 \
        --stats=0 \
        --log-level=NOTICE \
        2>&1; then
        log_info "$dir_name sincronizado exitosamente"
        return 0
    else
        log_error "Error sincronizando $dir_name"
        return 1
    fi
}

# Limpiar archivos antiguos en Google Drive
cleanup_remote() {
    log_info "Limpiando archivos > ${RETENTION_DAYS} dias en Google Drive..."

    if rclone delete \
        "${RCLONE_REMOTE}:${GDRIVE_DEST}" \
        --min-age "${RETENTION_DAYS}d" \
        --rmdirs \
        2>&1; then
        log_info "Limpieza remota completada"
    else
        log_warn "Error en limpieza remota (no critico)"
    fi
}

# Verificar que los archivos llegaron al Drive
verify_upload() {
    log_info "Verificando archivos en Google Drive..."

    local remote_count
    remote_count=$(rclone ls "${RCLONE_REMOTE}:${GDRIVE_DEST}" --include="*.dump" 2>/dev/null | wc -l)

    if [ "$remote_count" -gt 0 ]; then
        log_info "Verificacion OK: $remote_count archivos .dump en Google Drive"

        local remote_size
        remote_size=$(rclone size "${RCLONE_REMOTE}:${GDRIVE_DEST}" 2>/dev/null | grep "Total size" || echo "No disponible")
        log_info "Tamano total en Drive: $remote_size"
    else
        log_warn "No se encontraron archivos .dump en el Drive"
    fi
}

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "INICIO BACKUP OFFSITE - GOOGLE DRIVE"
log_info "=========================================="

# Verificaciones previas
check_rclone_installed
check_remote_configured
check_local_backups

# Sincronizar full backups
SYNC_ERRORS=0

if ! sync_directory "$BACKUP_DIR/full" "$GDRIVE_DEST/full" "Backups completos"; then
    SYNC_ERRORS=$((SYNC_ERRORS + 1))
fi

# Sincronizar schema backups
if ! sync_directory "$BACKUP_DIR/schemas" "$GDRIVE_DEST/schemas" "Backups por schema"; then
    SYNC_ERRORS=$((SYNC_ERRORS + 1))
fi

# Limpiar archivos antiguos en el Drive
cleanup_remote

# Verificar subida
verify_upload

# -----------------------------------------------------------------------------
# RESUMEN
# -----------------------------------------------------------------------------

log_info "=========================================="

if [ "$SYNC_ERRORS" -gt 0 ]; then
    log_error "BACKUP OFFSITE COMPLETADO CON $SYNC_ERRORS ERRORES"
    send_alert \
        "[STRATEKAZ] FALLO Backup Offsite - $SYNC_ERRORS errores" \
        "La sincronizacion a Google Drive tuvo $SYNC_ERRORS errores. Revisar log: $LOG_FILE"
    log_info "=========================================="
    exit 3
else
    log_info "BACKUP OFFSITE COMPLETADO EXITOSAMENTE"

    # Mostrar resumen
    LOCAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log_info "Tamano local: $LOCAL_SIZE"
    log_info "Destino: ${RCLONE_REMOTE}:${GDRIVE_DEST}/"
    log_info "Retencion: ${RETENTION_DAYS} dias"
fi

log_info "=========================================="
log_info "FIN"
log_info "=========================================="

exit 0
