#!/bin/bash
# =============================================================================
# STRATEKAZ - Verificacion de Integridad de Backups
# =============================================================================
#
# Verifica la integridad de los backups locales y offsite:
#   1. Archivos existen y tamano > 0
#   2. Integridad PostgreSQL (pg_restore --list)
#   3. Verificacion en Google Drive (si rclone esta configurado)
#
# Uso:
#   ./backup_verify.sh              # Verificar todo
#   ./backup_verify.sh --local      # Solo verificar backups locales
#   ./backup_verify.sh --remote     # Solo verificar backups en Google Drive
#
# Exit codes:
#   0 - Todas las verificaciones pasaron
#   1 - Al menos una verificacion fallo
#
# Cron (domingos a las 3:00 AM):
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
ALERT_EMAIL="${ALERT_EMAIL:-admin@stratekaz.com}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
LOG_FILE="${LOG_FILE:-/var/log/stratekaz_backup_verify.log}"

# Fecha actual
DATE=$(date +%Y-%m-%d)

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contadores
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Modo de ejecucion
CHECK_LOCAL=true
CHECK_REMOTE=true

# -----------------------------------------------------------------------------
# PARSEAR ARGUMENTOS
# -----------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            CHECK_REMOTE=false
            shift
            ;;
        --remote)
            CHECK_LOCAL=false
            shift
            ;;
        --help|-h)
            echo "Uso: $0 [--local|--remote]"
            echo "  --local   Solo verificar backups locales"
            echo "  --remote  Solo verificar backups en Google Drive"
            echo "  (sin flag) Verificar ambos"
            exit 0
            ;;
        *)
            echo "Opcion desconocida: $1"
            exit 1
            ;;
    esac
done

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

log_check() {
    echo -e "${CYAN}[CHECK]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

pass() {
    log_info "  PASS: $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

fail() {
    log_error "  FAIL: $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

warn() {
    log_warn "  WARN: $1"
    CHECKS_WARNED=$((CHECKS_WARNED + 1))
}

send_alert() {
    local subject="$1"
    local body="$2"

    if command -v mail &>/dev/null; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    if [ -n "$WEBHOOK_URL" ] && command -v curl &>/dev/null; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$subject\n$body\"}" \
            >/dev/null 2>&1 || true
    fi
}

# Verificar que un archivo .dump es valido con pg_restore --list
verify_dump_integrity() {
    local dump_file="$1"
    local label="$2"

    # Verificar que el archivo existe
    if [ ! -f "$dump_file" ]; then
        fail "$label - Archivo no existe: $dump_file"
        return 1
    fi

    # Verificar tamano > 0
    local file_size
    file_size=$(stat -c%s "$dump_file" 2>/dev/null || stat -f%z "$dump_file" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        fail "$label - Archivo vacio (0 bytes): $dump_file"
        return 1
    fi

    local file_size_human
    file_size_human=$(du -h "$dump_file" | cut -f1)

    # Verificar integridad con pg_restore --list
    if command -v pg_restore &>/dev/null; then
        if pg_restore --list "$dump_file" >/dev/null 2>&1; then
            pass "$label - Integridad OK ($file_size_human): $dump_file"
            return 0
        else
            fail "$label - pg_restore --list fallo (corrupto?): $dump_file"
            return 1
        fi
    else
        # Sin pg_restore, solo verificar que el archivo no esta vacio
        warn "$label - pg_restore no disponible, solo se verifico tamano ($file_size_human)"
        return 0
    fi
}

# Verificar backups locales
verify_local_backups() {
    log_check "============================================"
    log_check "VERIFICACION DE BACKUPS LOCALES"
    log_check "============================================"

    # Verificar directorio
    if [ ! -d "$BACKUP_DIR" ]; then
        fail "Directorio de backups no existe: $BACKUP_DIR"
        return 1
    fi
    pass "Directorio de backups existe: $BACKUP_DIR"

    # Verificar backup full de hoy
    log_check "--- Backups completos (full) ---"
    local full_dir="$BACKUP_DIR/full"

    if [ ! -d "$full_dir" ]; then
        fail "Directorio full/ no existe"
    else
        # Buscar backup de hoy
        local today_full
        today_full=$(find "$full_dir" -name "${DATE}*.dump" -type f 2>/dev/null | head -1)

        if [ -n "$today_full" ]; then
            verify_dump_integrity "$today_full" "Backup full de hoy"
        else
            warn "No hay backup full de hoy ($DATE)"
            # Verificar el mas reciente
            local latest_full
            latest_full=$(find "$full_dir" -name "*.dump" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
            if [ -n "$latest_full" ]; then
                local latest_date
                latest_date=$(stat -c%y "$latest_full" 2>/dev/null | cut -d' ' -f1)
                verify_dump_integrity "$latest_full" "Backup full mas reciente ($latest_date)"
            else
                fail "No hay ningun backup full disponible"
            fi
        fi

        # Contar backups full disponibles
        local full_count
        full_count=$(find "$full_dir" -name "*.dump" -type f 2>/dev/null | wc -l)
        log_info "  Total backups full: $full_count"
    fi

    # Verificar backups por schema
    log_check "--- Backups por schema ---"
    local schemas_dir="$BACKUP_DIR/schemas"

    if [ ! -d "$schemas_dir" ]; then
        warn "Directorio schemas/ no existe"
    else
        local schema_dirs
        schema_dirs=$(find "$schemas_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

        if [ -z "$schema_dirs" ]; then
            warn "No hay directorios de schemas"
        else
            while IFS= read -r schema_dir; do
                local schema_name
                schema_name=$(basename "$schema_dir")

                # Buscar backup de hoy para este schema
                local today_schema
                today_schema=$(find "$schema_dir" -name "${DATE}*.dump" -type f 2>/dev/null | head -1)

                if [ -n "$today_schema" ]; then
                    verify_dump_integrity "$today_schema" "Schema '$schema_name' de hoy"
                else
                    # Verificar el mas reciente
                    local latest_schema
                    latest_schema=$(find "$schema_dir" -name "*.dump" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
                    if [ -n "$latest_schema" ]; then
                        local latest_date
                        latest_date=$(stat -c%y "$latest_schema" 2>/dev/null | cut -d' ' -f1)
                        warn "Schema '$schema_name' - sin backup hoy, ultimo: $latest_date"
                        verify_dump_integrity "$latest_schema" "Schema '$schema_name' (ultimo disponible)"
                    else
                        fail "Schema '$schema_name' - sin backups disponibles"
                    fi
                fi
            done <<< "$schema_dirs"
        fi
    fi

    # Verificar espacio en disco
    log_check "--- Espacio en disco ---"
    local total_size
    total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log_info "  Tamano total backups: $total_size"

    local disk_usage
    disk_usage=$(df -h "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
    if [ -n "$disk_usage" ] && [ "$disk_usage" -gt 85 ]; then
        warn "Uso de disco alto: ${disk_usage}%"
    else
        pass "Uso de disco OK: ${disk_usage:-desconocido}%"
    fi
}

# Verificar backups en Google Drive
verify_remote_backups() {
    log_check "============================================"
    log_check "VERIFICACION DE BACKUPS EN GOOGLE DRIVE"
    log_check "============================================"

    # Verificar rclone
    if ! command -v rclone &>/dev/null; then
        warn "rclone no instalado - omitiendo verificacion remota"
        return 0
    fi

    # Verificar remote configurado
    if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
        warn "Remote '${RCLONE_REMOTE}' no configurado - omitiendo verificacion remota"
        return 0
    fi
    pass "Remote '${RCLONE_REMOTE}' configurado"

    # Verificar conectividad
    if ! rclone lsd "${RCLONE_REMOTE}:${GDRIVE_DEST}" >/dev/null 2>&1; then
        fail "No se puede acceder a ${RCLONE_REMOTE}:${GDRIVE_DEST}/"
        return 1
    fi
    pass "Conectividad con Google Drive OK"

    # Verificar directorio full en Drive
    log_check "--- Backups full en Drive ---"
    local remote_full_count
    remote_full_count=$(rclone ls "${RCLONE_REMOTE}:${GDRIVE_DEST}/full" --include="*.dump" 2>/dev/null | wc -l)

    if [ "$remote_full_count" -gt 0 ]; then
        pass "Backups full en Drive: $remote_full_count archivos"
    else
        fail "No hay backups full en Google Drive"
    fi

    # Verificar directorio schemas en Drive
    log_check "--- Backups schemas en Drive ---"
    local remote_schema_count
    remote_schema_count=$(rclone ls "${RCLONE_REMOTE}:${GDRIVE_DEST}/schemas" --include="*.dump" 2>/dev/null | wc -l)

    if [ "$remote_schema_count" -gt 0 ]; then
        pass "Backups schemas en Drive: $remote_schema_count archivos"
    else
        warn "No hay backups de schemas en Google Drive"
    fi

    # Verificar tamano total en Drive
    local remote_size
    remote_size=$(rclone size "${RCLONE_REMOTE}:${GDRIVE_DEST}" 2>/dev/null | grep "Total size" | awk -F: '{print $2}' | xargs)
    if [ -n "$remote_size" ]; then
        log_info "  Tamano total en Drive: $remote_size"
    fi

    # Comparar local vs remoto
    log_check "--- Comparacion local vs remoto ---"
    local local_full_count
    local_full_count=$(find "$BACKUP_DIR/full" -name "*.dump" -type f 2>/dev/null | wc -l)

    if [ "$local_full_count" -eq "$remote_full_count" ]; then
        pass "Full backups sincronizados: local=$local_full_count, remoto=$remote_full_count"
    else
        warn "Full backups desincronizados: local=$local_full_count, remoto=$remote_full_count"
    fi
}

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "INICIO VERIFICACION DE BACKUPS"
log_info "Fecha: $DATE"
log_info "=========================================="

# Ejecutar verificaciones segun flags
if [ "$CHECK_LOCAL" = true ]; then
    verify_local_backups
fi

if [ "$CHECK_REMOTE" = true ]; then
    verify_remote_backups
fi

# -----------------------------------------------------------------------------
# RESUMEN
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "RESUMEN DE VERIFICACION"
log_info "=========================================="
log_info "  Verificaciones exitosas: $CHECKS_PASSED"

if [ "$CHECKS_WARNED" -gt 0 ]; then
    log_warn "  Advertencias:           $CHECKS_WARNED"
fi

if [ "$CHECKS_FAILED" -gt 0 ]; then
    log_error "  Verificaciones fallidas: $CHECKS_FAILED"
fi

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNED))
log_info "  Total verificaciones:   $TOTAL"

# Determinar resultado final
if [ "$CHECKS_FAILED" -gt 0 ]; then
    log_error "=========================================="
    log_error "RESULTADO: FALLO ($CHECKS_FAILED verificaciones fallaron)"
    log_error "=========================================="

    send_alert \
        "[STRATEKAZ] FALLO Verificacion Backups - $CHECKS_FAILED errores" \
        "Verificacion de backups fallo con $CHECKS_FAILED errores y $CHECKS_WARNED advertencias. Revisar: $LOG_FILE"
    exit 1
else
    if [ "$CHECKS_WARNED" -gt 0 ]; then
        log_warn "=========================================="
        log_warn "RESULTADO: OK CON ADVERTENCIAS ($CHECKS_WARNED)"
        log_warn "=========================================="
    else
        log_info "=========================================="
        log_info "RESULTADO: TODO OK"
        log_info "=========================================="
    fi
    exit 0
fi
