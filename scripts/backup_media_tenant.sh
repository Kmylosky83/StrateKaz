#!/usr/bin/env bash
# =============================================================================
# backup_media_tenant.sh — Backup de archivos media por tenant a Google Drive
#
# Requisitos:
#   - rclone instalado y configurado (rclone config → remote: 'gdrive')
#   - Python/Django accesible para obtener lista de schemas activos
#   - Ejecutar desde /opt/stratekaz/ o pasar --root como argumento
#
# Uso:
#   # Backup de todos los tenants
#   bash scripts/backup_media_tenant.sh
#
#   # Backup de un tenant específico
#   bash scripts/backup_media_tenant.sh --schema tenant_stratekaz
#
#   # Dry-run (lista qué se subiría sin subir nada)
#   bash scripts/backup_media_tenant.sh --dry-run
#
#   # Backup con verificación de integridad post-subida
#   bash scripts/backup_media_tenant.sh --check
#
# Estructura en Google Drive:
#   StrateKaz-Backups/
#   ├── tenant_stratekaz/
#   │   └── media/
#   │       ├── documentos/pdf/2026/04/
#   │       └── colaboradores/fotos/
#   └── tenant_grasas_y_huesos/
#       └── media/
#           └── ...
#
# Cron recomendado (cada noche a las 2:00 AM):
#   0 2 * * * /bin/bash /opt/stratekaz/scripts/backup_media_tenant.sh >> /var/log/stratekaz/backup_media.log 2>&1
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURACIÓN
# =============================================================================
STRATEKAZ_ROOT="${STRATEKAZ_ROOT:-/opt/stratekaz}"
BACKEND_DIR="${STRATEKAZ_ROOT}/backend"
VENV_ACTIVATE="${BACKEND_DIR}/venv/bin/activate"
MEDIA_ROOT="${BACKEND_DIR}/media"
LOG_DIR="/var/log/stratekaz"
LOG_FILE="${LOG_DIR}/backup_media.log"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RCLONE_BASE_PATH="${RCLONE_BASE_PATH:-StrateKaz-Backups}"
RCLONE_TRANSFERS="${RCLONE_TRANSFERS:-4}"
RCLONE_CHECKERS="${RCLONE_CHECKERS:-8}"
RCLONE_RETRIES="${RCLONE_RETRIES:-3}"

# =============================================================================
# ARGUMENTOS
# =============================================================================
TARGET_SCHEMA=""
DRY_RUN=false
CHECK_INTEGRITY=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --schema)
            TARGET_SCHEMA="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --check)
            CHECK_INTEGRITY=true
            shift
            ;;
        --root)
            STRATEKAZ_ROOT="$2"
            BACKEND_DIR="${STRATEKAZ_ROOT}/backend"
            MEDIA_ROOT="${BACKEND_DIR}/media"
            VENV_ACTIVATE="${BACKEND_DIR}/venv/bin/activate"
            shift 2
            ;;
        *)
            echo "Opción desconocida: $1" >&2
            exit 1
            ;;
    esac
done

# =============================================================================
# HELPERS
# =============================================================================
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "${LOG_FILE}"
}

log_ok()   { log "OK   " "$@"; }
log_warn() { log "WARN " "$@"; }
log_err()  { log "ERROR" "$@"; }
log_info() { log "INFO " "$@"; }

require_cmd() {
    if ! command -v "$1" &>/dev/null; then
        log_err "Comando requerido no encontrado: $1"
        exit 1
    fi
}

bytes_to_human() {
    local bytes="$1"
    if   (( bytes >= 1073741824 )); then printf '%.1f GB' "$(echo "scale=1; $bytes/1073741824" | bc)"
    elif (( bytes >= 1048576 ));    then printf '%.1f MB' "$(echo "scale=1; $bytes/1048576" | bc)"
    elif (( bytes >= 1024 ));       then printf '%.1f KB' "$(echo "scale=1; $bytes/1024" | bc)"
    else printf '%d B' "$bytes"
    fi
}

# =============================================================================
# VALIDACIONES PREVIAS
# =============================================================================
setup() {
    require_cmd rclone

    mkdir -p "${LOG_DIR}"

    if [[ ! -d "${MEDIA_ROOT}" ]]; then
        log_err "MEDIA_ROOT no encontrado: ${MEDIA_ROOT}"
        exit 1
    fi

    # Verificar que rclone puede conectar
    if ! rclone lsd "${RCLONE_REMOTE}:" &>/dev/null; then
        log_err "No se puede conectar al remote de rclone: ${RCLONE_REMOTE}"
        log_err "Ejecuta: rclone config   para configurar el acceso a Google Drive"
        exit 1
    fi

    log_info "rclone remote '${RCLONE_REMOTE}' verificado ✓"
}

# =============================================================================
# OBTENER SCHEMAS ACTIVOS
# =============================================================================
get_tenant_schemas() {
    # Obtiene schemas de tenant desde la DB via Django shell
    if [[ -f "${VENV_ACTIVATE}" ]]; then
        # shellcheck source=/dev/null
        source "${VENV_ACTIVATE}"
        cd "${BACKEND_DIR}"
        python -c "
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
sys.path.insert(0, '.')
django.setup()
from django.db import connection
with connection.cursor() as c:
    c.execute(\"\"\"
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name NOT IN ('public', 'information_schema')
        AND schema_name NOT LIKE 'pg_%'
        ORDER BY schema_name
    \"\"\")
    for row in c.fetchall():
        print(row[0])
" 2>/dev/null
    else
        # Fallback: leer directorios existentes en MEDIA_ROOT
        log_warn "venv no encontrado en ${VENV_ACTIVATE}"
        log_warn "Usando directorios existentes en MEDIA_ROOT como fallback"
        find "${MEDIA_ROOT}" -maxdepth 1 -mindepth 1 -type d \
            -name 'tenant_*' -printf '%f\n' | sort
    fi
}

# =============================================================================
# BACKUP DE UN TENANT
# =============================================================================
backup_tenant() {
    local schema="$1"
    local source_path="${MEDIA_ROOT}/${schema}"
    local dest_path="${RCLONE_REMOTE}:${RCLONE_BASE_PATH}/${schema}/media"

    if [[ ! -d "${source_path}" ]]; then
        log_warn "Schema ${schema}: sin directorio de media (${source_path}) — omitiendo"
        return 0
    fi

    # Calcular tamaño antes del backup
    local size_bytes
    size_bytes=$(du -sb "${source_path}" 2>/dev/null | awk '{print $1}' || echo 0)
    local size_human
    size_human=$(bytes_to_human "${size_bytes}")
    local file_count
    file_count=$(find "${source_path}" -type f | wc -l)

    log_info "━━━ Backup: ${schema} | ${file_count} archivos | ${size_human} ━━━"

    # Flags de rclone
    local rclone_flags=(
        --transfers "${RCLONE_TRANSFERS}"
        --checkers "${RCLONE_CHECKERS}"
        --retries "${RCLONE_RETRIES}"
        --low-level-retries 10
        --contimeout 60s
        --timeout 300s
        --stats-one-line
        --stats 30s
        --log-level INFO
        --log-file "${LOG_FILE}"
    )

    if [[ "${DRY_RUN}" == "true" ]]; then
        rclone_flags+=(--dry-run)
        log_info "[DRY-RUN] rclone sync ${source_path} → ${dest_path}"
    fi

    if [[ "${CHECK_INTEGRITY}" == "true" ]]; then
        rclone_flags+=(--checksum)
        log_info "Verificación de integridad activada (--checksum)"
    fi

    local start_ts
    start_ts=$(date +%s)

    if rclone sync \
        "${source_path}" \
        "${dest_path}" \
        "${rclone_flags[@]}"; then

        local end_ts
        end_ts=$(date +%s)
        local duration=$(( end_ts - start_ts ))
        log_ok "✓ ${schema} — backup completado en ${duration}s"
    else
        log_err "✗ ${schema} — backup FALLÓ (ver log: ${LOG_FILE})"
        return 1
    fi
}

# =============================================================================
# BACKUP DE SCHEMA PUBLIC (branding compartido)
# =============================================================================
backup_public() {
    local source_path="${MEDIA_ROOT}/public"
    local dest_path="${RCLONE_REMOTE}:${RCLONE_BASE_PATH}/public/media"

    if [[ ! -d "${source_path}" ]]; then
        return 0
    fi

    log_info "━━━ Backup: public (branding compartido) ━━━"
    rclone sync "${source_path}" "${dest_path}" \
        --transfers 2 \
        --log-level INFO \
        --log-file "${LOG_FILE}" \
        $( [[ "${DRY_RUN}" == "true" ]] && echo "--dry-run" )

    log_ok "✓ public — backup completado"
}

# =============================================================================
# REPORTE FINAL
# =============================================================================
generate_report() {
    local schemas=("$@")
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "REPORTE DE ALMACENAMIENTO"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for schema in "${schemas[@]}"; do
        local path="${MEDIA_ROOT}/${schema}"
        if [[ -d "${path}" ]]; then
            local bytes
            bytes=$(du -sb "${path}" 2>/dev/null | awk '{print $1}' || echo 0)
            local human
            human=$(bytes_to_human "${bytes}")
            local count
            count=$(find "${path}" -type f | wc -l)
            printf "  %-40s %6d archivos   %10s\n" "${schema}" "${count}" "${human}"
        fi
    done
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    log_info "============================================================"
    log_info "StrateKaz — Backup Media Tenant"
    log_info "Inicio: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "[DRY_RUN=${DRY_RUN}] [CHECK=${CHECK_INTEGRITY}]"
    log_info "============================================================"

    setup

    local -a schemas

    if [[ -n "${TARGET_SCHEMA}" ]]; then
        schemas=("${TARGET_SCHEMA}")
        log_info "Modo: schema único → ${TARGET_SCHEMA}"
    else
        mapfile -t schemas < <(get_tenant_schemas)
        log_info "Schemas encontrados: ${#schemas[@]}"
    fi

    if [[ ${#schemas[@]} -eq 0 ]]; then
        log_warn "No se encontraron schemas de tenant. Verifica MEDIA_ROOT: ${MEDIA_ROOT}"
        exit 0
    fi

    local failed=0
    for schema in "${schemas[@]}"; do
        backup_tenant "${schema}" || (( failed++ ))
    done

    # También respalda el schema public (branding)
    backup_public || true

    generate_report "${schemas[@]}"

    local end_time
    end_time=$(date '+%Y-%m-%d %H:%M:%S')
    if [[ ${failed} -gt 0 ]]; then
        log_err "Fin: ${end_time} — ${failed} schema(s) con errores"
        exit 1
    else
        log_ok "Fin: ${end_time} — Todos los backups completados exitosamente"
    fi
}

main "$@"
