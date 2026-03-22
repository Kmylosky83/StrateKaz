#!/bin/bash
# =============================================================================
# STRATEKAZ - Verificacion de Restore de Backups PostgreSQL
# =============================================================================
#
# Restaura un backup en una base de datos TEMPORAL para verificar su integridad.
# NUNCA toca la base de datos de produccion.
#
# Requisitos:
#   - PostgreSQL client tools (createdb, pg_restore, psql, dropdb)
#   - .pgpass configurado para autenticacion sin contrasena
#   - Permisos para crear/eliminar bases de datos
#
# Uso:
#   ./restore_verify.sh /var/backups/stratekaz/full/2026-03-22_stratekaz.dump
#   ./restore_verify.sh /var/backups/stratekaz/full/2026-03-22_stratekaz.dump --keep
#
# Opciones:
#   --keep    No eliminar la BD temporal despues de la verificacion
#   --verbose Mostrar output detallado de pg_restore
#
# Exit codes:
#   0 - Restore verificado exitosamente
#   1 - Error en argumentos o dependencias
#   2 - Error creando BD temporal
#   3 - Error en restore
#   4 - Error en verificacion de integridad
#   5 - Error en limpieza
#
# Cron (semanal, domingos 3:00 AM — despues del backup offsite):
#   0 3 * * 0 /opt/stratekaz/scripts/restore_verify.sh $(ls -t /var/backups/stratekaz/full/*.dump | head -1) >> /var/log/stratekaz_restore_verify.log 2>&1
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

DB_USER="${DB_USER:-stratekaz}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@stratekaz.com}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Flags
KEEP_DB=false
VERBOSE=false

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Estado de limpieza
TEMP_DB=""
CLEANUP_NEEDED=false

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_step()  { echo -e "\n${BLUE}--- $1 ---${NC}"; }

# Enviar alerta por email o webhook
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

# Limpieza en caso de error o interrupcion
cleanup() {
    if [ "$CLEANUP_NEEDED" = true ] && [ "$KEEP_DB" = false ] && [ -n "$TEMP_DB" ]; then
        log_info "Limpiando base de datos temporal: $TEMP_DB"
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$TEMP_DB" 2>/dev/null || {
            log_warn "No se pudo eliminar la BD temporal $TEMP_DB. Eliminar manualmente:"
            log_warn "  dropdb -h $DB_HOST -U $DB_USER $TEMP_DB"
        }
    fi
}

# Registrar trap para limpieza en caso de interrupcion
trap cleanup EXIT INT TERM

# Verificar que un comando existe
require_cmd() {
    if ! command -v "$1" &>/dev/null; then
        log_error "Comando requerido no encontrado: $1"
        log_error "Instalar: sudo apt-get install postgresql-client"
        exit 1
    fi
}

# Ejecutar query en la BD temporal
run_query() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" \
        --tuples-only --no-align -c "$1" 2>/dev/null
}

# -----------------------------------------------------------------------------
# PARSEO DE ARGUMENTOS
# -----------------------------------------------------------------------------

BACKUP_FILE=""

for arg in "$@"; do
    case $arg in
        --keep)    KEEP_DB=true ;;
        --verbose) VERBOSE=true ;;
        --help|-h)
            echo "Uso: $0 <archivo_backup> [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --keep      No eliminar la BD temporal despues de verificar"
            echo "  --verbose   Mostrar output detallado de pg_restore"
            echo "  --help      Mostrar esta ayuda"
            echo ""
            echo "Ejemplo:"
            echo "  $0 /var/backups/stratekaz/full/2026-03-22_stratekaz.dump"
            exit 0
            ;;
        -*)
            log_error "Opcion desconocida: $arg"
            exit 1
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$arg"
            else
                log_error "Solo se acepta un archivo de backup"
                exit 1
            fi
            ;;
    esac
done

if [ -z "$BACKUP_FILE" ]; then
    log_error "Uso: $0 <archivo_backup> [--keep] [--verbose]"
    exit 1
fi

# =============================================================================
# INICIO
# =============================================================================

echo ""
echo "==============================================="
echo "  STRATEKAZ - Verificacion de Restore"
echo "==============================================="
echo ""

# -----------------------------------------------------------------------------
# PASO 1: Verificaciones previas
# -----------------------------------------------------------------------------

log_step "PASO 1: Verificaciones previas"

# Verificar comandos necesarios
require_cmd createdb
require_cmd pg_restore
require_cmd psql
require_cmd dropdb

# Verificar que el archivo de backup existe y no esta vacio
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Archivo de backup no encontrado: $BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
if [ ! -s "$BACKUP_FILE" ]; then
    log_error "Archivo de backup esta vacio: $BACKUP_FILE"
    exit 1
fi

log_info "Archivo de backup: $BACKUP_FILE"
log_info "Tamano: $BACKUP_SIZE"

# Verificar conexion a PostgreSQL
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" &>/dev/null; then
    log_error "No se puede conectar a PostgreSQL ($DB_HOST:$DB_PORT como $DB_USER)"
    log_error "Verificar .pgpass y que el servidor este corriendo"
    exit 1
fi

log_info "Conexion a PostgreSQL verificada"

# Generar nombre unico para BD temporal
TEMP_DB="stratekaz_restore_verify_$(date +%s)"

# Verificar que la BD temporal NO existe (defensa extra)
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '$TEMP_DB';" 2>/dev/null | grep -q 1; then
    log_error "La BD temporal ya existe: $TEMP_DB (esto no deberia pasar)"
    exit 2
fi

log_info "BD temporal: $TEMP_DB"

# -----------------------------------------------------------------------------
# PASO 2: Crear base de datos temporal
# -----------------------------------------------------------------------------

log_step "PASO 2: Crear BD temporal"

if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>&1; then
    CLEANUP_NEEDED=true
    log_info "BD temporal creada: $TEMP_DB"
else
    log_error "No se pudo crear la BD temporal"
    send_alert \
        "[STRATEKAZ] FALLO Restore Verify - No se pudo crear BD temporal" \
        "No se pudo crear la BD temporal $TEMP_DB. Verificar permisos del usuario $DB_USER."
    exit 2
fi

# -----------------------------------------------------------------------------
# PASO 3: Restaurar backup
# -----------------------------------------------------------------------------

log_step "PASO 3: Restaurar backup en BD temporal"

RESTORE_START=$(date +%s)

RESTORE_ARGS=(-h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" --no-owner --no-privileges)
if [ "$VERBOSE" = true ]; then
    RESTORE_ARGS+=(--verbose)
fi

log_info "Ejecutando pg_restore... (esto puede tomar varios minutos)"

# pg_restore puede retornar exit code != 0 por warnings no criticos
# (ej: roles que no existen). Capturamos el output y evaluamos.
RESTORE_OUTPUT=""
RESTORE_EXIT=0

if [ "$VERBOSE" = true ]; then
    pg_restore "${RESTORE_ARGS[@]}" "$BACKUP_FILE" 2>&1 || RESTORE_EXIT=$?
else
    RESTORE_OUTPUT=$(pg_restore "${RESTORE_ARGS[@]}" "$BACKUP_FILE" 2>&1) || RESTORE_EXIT=$?
fi

RESTORE_END=$(date +%s)
RESTORE_DURATION=$((RESTORE_END - RESTORE_START))

if [ $RESTORE_EXIT -eq 0 ]; then
    log_info "Restore completado exitosamente en ${RESTORE_DURATION}s"
elif [ $RESTORE_EXIT -eq 1 ]; then
    # Exit code 1 = warnings (ej: roles faltantes). Aceptable.
    log_warn "Restore completado con warnings (exit code 1) en ${RESTORE_DURATION}s"
    if [ -n "$RESTORE_OUTPUT" ] && [ "$VERBOSE" = false ]; then
        # Contar lineas de error
        WARNING_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "WARNING\|ERROR" || true)
        log_warn "Se encontraron $WARNING_COUNT warnings/errors (usar --verbose para ver detalle)"
    fi
else
    log_error "Restore FALLO con exit code $RESTORE_EXIT"
    if [ -n "$RESTORE_OUTPUT" ]; then
        log_error "Ultimas lineas del error:"
        echo "$RESTORE_OUTPUT" | tail -20
    fi
    send_alert \
        "[STRATEKAZ] FALLO Restore Verify - pg_restore fallo" \
        "pg_restore fallo con exit code $RESTORE_EXIT para backup: $BACKUP_FILE"
    exit 3
fi

# -----------------------------------------------------------------------------
# PASO 4: Verificacion de integridad
# -----------------------------------------------------------------------------

log_step "PASO 4: Verificacion de integridad"

VERIFY_ERRORS=0

# 4a. Contar schemas (django-tenants crea un schema por tenant)
SCHEMA_COUNT=$(run_query "SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast');")
SCHEMA_COUNT=$(echo "$SCHEMA_COUNT" | tr -d '[:space:]')
log_info "Schemas encontrados: $SCHEMA_COUNT"

if [ "$SCHEMA_COUNT" -lt 2 ]; then
    log_error "Se esperan al menos 2 schemas (public + tenant). Encontrados: $SCHEMA_COUNT"
    VERIFY_ERRORS=$((VERIFY_ERRORS + 1))
fi

# 4b. Listar schemas de tenants
TENANT_SCHEMAS=$(run_query "SELECT nspname FROM pg_catalog.pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1') ORDER BY nspname;")
log_info "Schemas:"
while IFS= read -r schema; do
    [ -z "$schema" ] && continue
    TABLE_COUNT=$(run_query "SELECT count(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE';")
    TABLE_COUNT=$(echo "$TABLE_COUNT" | tr -d '[:space:]')
    log_info "  $schema: $TABLE_COUNT tablas"
done <<< "$TENANT_SCHEMAS"

# 4c. Verificar tablas criticas en public schema
log_info "Verificando tablas criticas en schema public..."

CRITICAL_TABLES=(
    "tenant_tenant"
    "tenant_domain"
    "users_customuser"
)

for table in "${CRITICAL_TABLES[@]}"; do
    EXISTS=$(run_query "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';")
    EXISTS=$(echo "$EXISTS" | tr -d '[:space:]')

    if [ "$EXISTS" = "1" ]; then
        ROW_COUNT=$(run_query "SELECT count(*) FROM public.\"$table\";")
        ROW_COUNT=$(echo "$ROW_COUNT" | tr -d '[:space:]')
        log_info "  public.$table: $ROW_COUNT registros"
    else
        log_error "  Tabla critica NO encontrada: public.$table"
        VERIFY_ERRORS=$((VERIFY_ERRORS + 1))
    fi
done

# 4d. Verificar que hay tenants activos
ACTIVE_TENANTS=$(run_query "SELECT count(*) FROM public.tenant_tenant WHERE is_active = true;" 2>/dev/null || echo "0")
ACTIVE_TENANTS=$(echo "$ACTIVE_TENANTS" | tr -d '[:space:]')
log_info "Tenants activos: $ACTIVE_TENANTS"

if [ "$ACTIVE_TENANTS" -lt 1 ]; then
    log_warn "No se encontraron tenants activos (puede ser normal en algunos backups)"
fi

# 4e. Verificar integridad de cada schema de tenant
log_info "Verificando integridad de schemas de tenants..."

TENANT_SCHEMA_LIST=$(run_query "SELECT schema_name FROM public.tenant_tenant WHERE is_active = true AND schema_name != 'public';" 2>/dev/null || echo "")

while IFS= read -r tschema; do
    [ -z "$tschema" ] && continue

    # Verificar que el schema existe
    SCHEMA_EXISTS=$(run_query "SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname = '$tschema';")
    SCHEMA_EXISTS=$(echo "$SCHEMA_EXISTS" | tr -d '[:space:]')

    if [ "$SCHEMA_EXISTS" = "1" ]; then
        TTABLE_COUNT=$(run_query "SELECT count(*) FROM information_schema.tables WHERE table_schema = '$tschema' AND table_type = 'BASE TABLE';")
        TTABLE_COUNT=$(echo "$TTABLE_COUNT" | tr -d '[:space:]')
        log_info "  Tenant '$tschema': $TTABLE_COUNT tablas"

        if [ "$TTABLE_COUNT" -lt 10 ]; then
            log_warn "  Tenant '$tschema' tiene pocas tablas ($TTABLE_COUNT). Puede indicar un problema."
        fi
    else
        log_error "  Schema '$tschema' referenciado en tenant_tenant pero NO existe"
        VERIFY_ERRORS=$((VERIFY_ERRORS + 1))
    fi
done <<< "$TENANT_SCHEMA_LIST"

# 4f. Verificar que las migraciones de Django estan registradas
MIGRATION_COUNT=$(run_query "SELECT count(*) FROM public.django_migrations;" 2>/dev/null || echo "0")
MIGRATION_COUNT=$(echo "$MIGRATION_COUNT" | tr -d '[:space:]')
log_info "Migraciones registradas (public): $MIGRATION_COUNT"

if [ "$MIGRATION_COUNT" -lt 10 ]; then
    log_error "Pocas migraciones registradas ($MIGRATION_COUNT). Backup posiblemente incompleto."
    VERIFY_ERRORS=$((VERIFY_ERRORS + 1))
fi

# 4g. Verificar tamano de la BD restaurada
DB_SIZE=$(run_query "SELECT pg_size_pretty(pg_database_size('$TEMP_DB'));")
DB_SIZE=$(echo "$DB_SIZE" | tr -d '[:space:]')
log_info "Tamano de BD restaurada: $DB_SIZE"

# -----------------------------------------------------------------------------
# PASO 5: Limpieza
# -----------------------------------------------------------------------------

log_step "PASO 5: Limpieza"

if [ "$KEEP_DB" = true ]; then
    log_info "BD temporal conservada (--keep): $TEMP_DB"
    log_info "Para eliminar manualmente: dropdb -h $DB_HOST -U $DB_USER $TEMP_DB"
    CLEANUP_NEEDED=false
else
    log_info "Eliminando BD temporal: $TEMP_DB"
    if dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>&1; then
        CLEANUP_NEEDED=false
        log_info "BD temporal eliminada exitosamente"
    else
        log_error "No se pudo eliminar la BD temporal: $TEMP_DB"
        log_error "Eliminar manualmente: dropdb -h $DB_HOST -U $DB_USER $TEMP_DB"
        VERIFY_ERRORS=$((VERIFY_ERRORS + 1))
    fi
fi

# =============================================================================
# RESUMEN
# =============================================================================

echo ""
echo "==============================================="
echo "  RESUMEN DE VERIFICACION"
echo "==============================================="
echo ""
echo "  Backup:           $BACKUP_FILE"
echo "  Tamano backup:    $BACKUP_SIZE"
echo "  Tamano restaurado: $DB_SIZE"
echo "  Duracion restore: ${RESTORE_DURATION}s"
echo "  Schemas:          $SCHEMA_COUNT"
echo "  Tenants activos:  $ACTIVE_TENANTS"
echo "  Migraciones:      $MIGRATION_COUNT"
echo "  Errores:          $VERIFY_ERRORS"
echo ""

if [ "$VERIFY_ERRORS" -gt 0 ]; then
    log_error "VERIFICACION COMPLETADA CON $VERIFY_ERRORS ERRORES"
    send_alert \
        "[STRATEKAZ] FALLO Restore Verify - $VERIFY_ERRORS errores de integridad" \
        "La verificacion de restore encontro $VERIFY_ERRORS errores.\nBackup: $BACKUP_FILE\nSchemas: $SCHEMA_COUNT | Tenants: $ACTIVE_TENANTS | Migraciones: $MIGRATION_COUNT"
    echo "==============================================="
    exit 4
else
    log_info "VERIFICACION EXITOSA - El backup es valido y restaurable"
    echo "==============================================="
    exit 0
fi
