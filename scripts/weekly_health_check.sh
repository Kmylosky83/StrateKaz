#!/bin/bash
# =============================================================================
# STRATEKAZ - Health Check Semanal Integral
# =============================================================================
#
# Revisa toda la infraestructura y genera un reporte semanal:
#   1.  Recursos del sistema (CPU, RAM, disco)
#   2.  PostgreSQL (conexion, schemas, tablas)
#   3.  Redis (conexion, memoria)
#   4.  Servicios systemd (gunicorn, celery, celerybeat)
#   5.  Certificado SSL (expiracion)
#   6.  Backups (ultimo backup, tamano, antigueidad)
#   7.  Backup offsite (rclone, Google Drive)
#   8.  Logs (tamano, errores recientes)
#   9.  Django (migraciones pendientes)
#   10. Celery (colas, workers)
#
# Uso:
#   ./weekly_health_check.sh                  # Reporte completo
#   ./weekly_health_check.sh --no-email       # Sin enviar email
#   ./weekly_health_check.sh --json           # Output en JSON
#
# Cron (lunes 9:00 AM):
#   0 9 * * 1 /opt/stratekaz/scripts/weekly_health_check.sh >> /var/log/stratekaz_weekly.log 2>&1
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

STRATEKAZ_HOME="${STRATEKAZ_HOME:-/opt/stratekaz}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"
VENV_DIR="${STRATEKAZ_HOME}/backend/venv"
SETTINGS="config.settings.production"

# PostgreSQL
DB_USER="${DB_USER:-stratekaz}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-stratekaz}"

# Servicios
GUNICORN_SERVICE="stratekaz-gunicorn"
CELERY_SERVICE="stratekaz-celery"
BEAT_SERVICE="stratekaz-celerybeat"

# SSL
SSL_DOMAIN="${SSL_DOMAIN:-app.stratekaz.com}"

# Alertas
ALERT_EMAIL="${ALERT_EMAIL:-admin@stratekaz.com}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Umbrales de alerta
DISK_WARN_PERCENT=80
DISK_CRIT_PERCENT=90
RAM_WARN_PERCENT=80
BACKUP_MAX_AGE_HOURS=48
SSL_WARN_DAYS=30
SSL_CRIT_DAYS=14

# Report
REPORT_FILE="/var/log/stratekaz_weekly_report_$(date +%Y%m%d).log"
SEND_EMAIL=true
JSON_OUTPUT=false

# Estado global
TOTAL_CHECKS=0
TOTAL_PASS=0
TOTAL_WARN=0
TOTAL_FAIL=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[FAIL]${NC}  $(date '+%H:%M:%S') $1"; }

check_pass() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    TOTAL_PASS=$((TOTAL_PASS + 1))
    echo -e "  ${GREEN}[OK]${NC}   $1"
}

check_warn() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    TOTAL_WARN=$((TOTAL_WARN + 1))
    echo -e "  ${YELLOW}[WARN]${NC} $1"
}

check_fail() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
    echo -e "  ${RED}[FAIL]${NC} $1"
}

section_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

send_alert() {
    local subject="$1"
    local body="$2"

    if [ "$SEND_EMAIL" = true ] && command -v mail &>/dev/null; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    if [ -n "$WEBHOOK_URL" ] && command -v curl &>/dev/null; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$subject\n$body\"}" \
            >/dev/null 2>&1 || true
    fi
}

# Verificar que un comando existe
cmd_exists() {
    command -v "$1" &>/dev/null
}

# -----------------------------------------------------------------------------
# PARSEO DE ARGUMENTOS
# -----------------------------------------------------------------------------

for arg in "$@"; do
    case $arg in
        --no-email) SEND_EMAIL=false ;;
        --json)     JSON_OUTPUT=true ;;
        --help|-h)
            echo "Uso: $0 [opciones]"
            echo "  --no-email   No enviar reporte por email"
            echo "  --json       Output en formato JSON (para integraciones)"
            echo "  --help       Mostrar esta ayuda"
            exit 0
            ;;
    esac
done

# =============================================================================
# INICIO DEL REPORTE
# =============================================================================

{

echo ""
echo "========================================================"
echo "  STRATEKAZ - Health Check Semanal"
echo "  Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Servidor: $(hostname)"
echo "========================================================"

# =============================================================================
# 1. RECURSOS DEL SISTEMA
# =============================================================================

section_header "1. RECURSOS DEL SISTEMA"

# CPU
if cmd_exists nproc; then
    CPU_CORES=$(nproc)
    CPU_LOAD=$(cat /proc/loadavg 2>/dev/null | awk '{print $1}' || echo "N/A")
    CPU_LOAD_5=$(cat /proc/loadavg 2>/dev/null | awk '{print $2}' || echo "N/A")
    echo "  CPU: $CPU_CORES cores | Load avg: $CPU_LOAD (1m) $CPU_LOAD_5 (5m)"

    # Comparar load con cores
    if cmd_exists bc; then
        LOAD_HIGH=$(echo "$CPU_LOAD > $CPU_CORES" | bc -l 2>/dev/null || echo "0")
        if [ "$LOAD_HIGH" = "1" ]; then
            check_warn "CPU load ($CPU_LOAD) excede los cores disponibles ($CPU_CORES)"
        else
            check_pass "CPU load normal ($CPU_LOAD / $CPU_CORES cores)"
        fi
    else
        check_pass "CPU: $CPU_CORES cores, load $CPU_LOAD"
    fi
else
    check_warn "No se pudo obtener info de CPU"
fi

# RAM
if cmd_exists free; then
    RAM_TOTAL=$(free -m | awk '/^Mem:/ {print $2}')
    RAM_USED=$(free -m | awk '/^Mem:/ {print $3}')
    RAM_AVAILABLE=$(free -m | awk '/^Mem:/ {print $7}')
    RAM_PERCENT=$((RAM_USED * 100 / RAM_TOTAL))

    echo "  RAM: ${RAM_USED}MB / ${RAM_TOTAL}MB (${RAM_PERCENT}%) | Disponible: ${RAM_AVAILABLE}MB"

    if [ "$RAM_PERCENT" -ge "$RAM_WARN_PERCENT" ]; then
        check_warn "RAM al ${RAM_PERCENT}% (umbral: ${RAM_WARN_PERCENT}%)"
    else
        check_pass "RAM al ${RAM_PERCENT}%"
    fi
else
    check_warn "Comando 'free' no disponible"
fi

# Disco
if cmd_exists df; then
    # Disco raiz
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
    DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

    echo "  Disco /: ${DISK_USAGE}% usado | Total: $DISK_TOTAL | Disponible: $DISK_AVAIL"

    if [ "$DISK_USAGE" -ge "$DISK_CRIT_PERCENT" ]; then
        check_fail "Disco al ${DISK_USAGE}% (critico >= ${DISK_CRIT_PERCENT}%)"
    elif [ "$DISK_USAGE" -ge "$DISK_WARN_PERCENT" ]; then
        check_warn "Disco al ${DISK_USAGE}% (umbral: ${DISK_WARN_PERCENT}%)"
    else
        check_pass "Disco al ${DISK_USAGE}%"
    fi

    # Disco de backups (si es particion diferente)
    if [ -d "$BACKUP_DIR" ]; then
        BACKUP_DISK_USAGE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}' | tr -d '%')
        BACKUP_DISK_AVAIL=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')
        echo "  Disco backups: ${BACKUP_DISK_USAGE}% usado | Disponible: $BACKUP_DISK_AVAIL"
    fi
else
    check_warn "Comando 'df' no disponible"
fi

# Uptime
UPTIME=$(uptime -p 2>/dev/null || uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')
echo "  Uptime: $UPTIME"

# =============================================================================
# 2. POSTGRESQL
# =============================================================================

section_header "2. POSTGRESQL"

if cmd_exists psql; then
    # Conexion
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        check_pass "Conexion a PostgreSQL ($DB_HOST:$DB_PORT/$DB_NAME)"

        # Version
        PG_VERSION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT version();" 2>/dev/null | head -1)
        echo "  Version: $PG_VERSION"

        # Tamano de BD
        DB_SIZE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null)
        echo "  Tamano BD: $DB_SIZE"

        # Schemas
        SCHEMA_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast');" 2>/dev/null)
        echo "  Schemas: $SCHEMA_COUNT"

        # Tenants activos
        TENANT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT count(*) FROM public.tenant_tenant WHERE is_active = true;" 2>/dev/null || echo "0")
        echo "  Tenants activos: $TENANT_COUNT"
        check_pass "PostgreSQL: $TENANT_COUNT tenants, $DB_SIZE"

        # Conexiones activas
        ACTIVE_CONN=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';" 2>/dev/null || echo "N/A")
        MAX_CONN=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SHOW max_connections;" 2>/dev/null || echo "N/A")
        echo "  Conexiones activas: $ACTIVE_CONN / $MAX_CONN"

        # Tablas mas grandes (top 5 en public)
        echo "  Top 5 tablas por tamano (public):"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT '    ' || tablename || ': ' || pg_size_pretty(pg_total_relation_size('public.' || quote_ident(tablename)))
             FROM pg_tables WHERE schemaname = 'public'
             ORDER BY pg_total_relation_size('public.' || quote_ident(tablename)) DESC
             LIMIT 5;" 2>/dev/null || echo "    (no disponible)"
    else
        check_fail "No se puede conectar a PostgreSQL"
    fi
else
    check_fail "psql no esta instalado"
fi

# =============================================================================
# 3. REDIS
# =============================================================================

section_header "3. REDIS"

if cmd_exists redis-cli; then
    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "FAIL")
    if [ "$REDIS_PING" = "PONG" ]; then
        check_pass "Redis respondiendo"

        REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        REDIS_KEYS=$(redis-cli dbsize 2>/dev/null | awk '{print $2}' | tr -d '\r')
        REDIS_UPTIME=$(redis-cli info server 2>/dev/null | grep "uptime_in_days" | cut -d: -f2 | tr -d '\r')

        echo "  Memoria: $REDIS_MEM"
        echo "  Keys: $REDIS_KEYS"
        echo "  Uptime: ${REDIS_UPTIME} dias"
        check_pass "Redis: $REDIS_MEM memoria, $REDIS_KEYS keys"
    else
        check_fail "Redis no responde"
    fi
else
    check_warn "redis-cli no esta instalado"
fi

# =============================================================================
# 4. SERVICIOS SYSTEMD
# =============================================================================

section_header "4. SERVICIOS SYSTEMD"

for SERVICE in $GUNICORN_SERVICE $CELERY_SERVICE $BEAT_SERVICE; do
    if systemctl is-active --quiet "$SERVICE" 2>/dev/null; then
        SINCE=$(systemctl show "$SERVICE" --property=ActiveEnterTimestamp 2>/dev/null | cut -d= -f2)
        check_pass "$SERVICE: activo (desde $SINCE)"
    else
        STATUS=$(systemctl is-active "$SERVICE" 2>/dev/null || echo "no encontrado")
        check_fail "$SERVICE: $STATUS"
    fi
done

# Verificar Nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    check_pass "nginx: activo"
else
    check_fail "nginx: no activo"
fi

# =============================================================================
# 5. CERTIFICADO SSL
# =============================================================================

section_header "5. CERTIFICADO SSL"

if cmd_exists openssl; then
    SSL_EXPIRY=$(echo | openssl s_client -servername "$SSL_DOMAIN" -connect "$SSL_DOMAIN":443 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$SSL_EXPIRY" ]; then
        SSL_EXPIRY_EPOCH=$(date -d "$SSL_EXPIRY" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (SSL_EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

        echo "  Dominio: $SSL_DOMAIN"
        echo "  Expira: $SSL_EXPIRY"
        echo "  Dias restantes: $DAYS_LEFT"

        if [ "$DAYS_LEFT" -le "$SSL_CRIT_DAYS" ]; then
            check_fail "SSL expira en $DAYS_LEFT dias (critico <= ${SSL_CRIT_DAYS}d)"
        elif [ "$DAYS_LEFT" -le "$SSL_WARN_DAYS" ]; then
            check_warn "SSL expira en $DAYS_LEFT dias (umbral <= ${SSL_WARN_DAYS}d)"
        else
            check_pass "SSL valido por $DAYS_LEFT dias"
        fi
    else
        check_warn "No se pudo verificar el certificado SSL de $SSL_DOMAIN"
    fi
else
    check_warn "openssl no esta instalado"
fi

# =============================================================================
# 6. BACKUPS
# =============================================================================

section_header "6. BACKUPS LOCALES"

if [ -d "$BACKUP_DIR" ]; then
    BACKUP_TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo "  Directorio: $BACKUP_DIR"
    echo "  Tamano total: $BACKUP_TOTAL_SIZE"

    # Ultimo backup full
    LATEST_FULL=$(ls -t "$BACKUP_DIR/full/"*.dump 2>/dev/null | head -1)
    if [ -n "$LATEST_FULL" ]; then
        LATEST_SIZE=$(du -h "$LATEST_FULL" | cut -f1)
        LATEST_MOD=$(stat -c '%Y' "$LATEST_FULL" 2>/dev/null || stat -f '%m' "$LATEST_FULL" 2>/dev/null)
        NOW=$(date +%s)
        AGE_HOURS=$(( (NOW - LATEST_MOD) / 3600 ))

        echo "  Ultimo backup: $(basename "$LATEST_FULL")"
        echo "  Tamano: $LATEST_SIZE"
        echo "  Antigueidad: ${AGE_HOURS}h"

        if [ "$AGE_HOURS" -gt "$BACKUP_MAX_AGE_HOURS" ]; then
            check_fail "Ultimo backup tiene ${AGE_HOURS}h (maximo: ${BACKUP_MAX_AGE_HOURS}h)"
        else
            check_pass "Backup reciente (${AGE_HOURS}h)"
        fi

        # Contar backups
        BACKUP_COUNT=$(ls "$BACKUP_DIR/full/"*.dump 2>/dev/null | wc -l)
        echo "  Backups full disponibles: $BACKUP_COUNT"
    else
        check_fail "No se encontraron backups en $BACKUP_DIR/full/"
    fi

    # Backups por schema
    if [ -d "$BACKUP_DIR/schemas" ]; then
        SCHEMA_BACKUP_COUNT=$(find "$BACKUP_DIR/schemas" -name "*.dump" -type f | wc -l)
        echo "  Backups de schemas: $SCHEMA_BACKUP_COUNT archivos"
    fi
else
    check_fail "Directorio de backups no existe: $BACKUP_DIR"
fi

# =============================================================================
# 7. BACKUP OFFSITE
# =============================================================================

section_header "7. BACKUP OFFSITE (Google Drive)"

if cmd_exists rclone; then
    RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
    GDRIVE_DEST="${GDRIVE_DEST:-stratekaz-backups}"

    if rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE}:$"; then
        check_pass "rclone configurado con remote '$RCLONE_REMOTE'"

        # Verificar archivos en Drive
        REMOTE_COUNT=$(rclone ls "${RCLONE_REMOTE}:${GDRIVE_DEST}" --include="*.dump" 2>/dev/null | wc -l || echo "0")
        REMOTE_SIZE=$(rclone size "${RCLONE_REMOTE}:${GDRIVE_DEST}" 2>/dev/null | grep "Total size" | awk '{print $3, $4}' || echo "N/A")

        echo "  Archivos en Drive: $REMOTE_COUNT"
        echo "  Tamano en Drive: $REMOTE_SIZE"

        if [ "$REMOTE_COUNT" -gt 0 ]; then
            check_pass "Offsite: $REMOTE_COUNT backups en Google Drive"
        else
            check_warn "No se encontraron backups en Google Drive"
        fi
    else
        check_warn "Remote '$RCLONE_REMOTE' no configurado en rclone"
    fi
else
    check_warn "rclone no instalado (backup offsite no disponible)"
fi

# =============================================================================
# 8. LOGS
# =============================================================================

section_header "8. LOGS"

# Tamano de logs
LOG_DIR="/var/log"
echo "  Logs de StrateKaz:"

for logfile in stratekaz_backup.log stratekaz_backup_offsite.log stratekaz_restore_verify.log stratekaz_weekly.log; do
    if [ -f "$LOG_DIR/$logfile" ]; then
        LOGSIZE=$(du -h "$LOG_DIR/$logfile" | cut -f1)
        echo "    $logfile: $LOGSIZE"
    fi
done

# Errores recientes en logs de servicios (ultimas 24h)
echo "  Errores recientes en servicios (24h):"

for SERVICE in $GUNICORN_SERVICE $CELERY_SERVICE $BEAT_SERVICE; do
    ERROR_COUNT=$(journalctl -u "$SERVICE" --since "24 hours ago" --priority=err --no-pager 2>/dev/null | wc -l || echo "0")
    if [ "$ERROR_COUNT" -gt 5 ]; then
        check_warn "$SERVICE: $ERROR_COUNT lineas de error en 24h"
    else
        echo "    $SERVICE: $ERROR_COUNT errores"
    fi
done

# Tamano total de journalctl
JOURNAL_SIZE=$(journalctl --disk-usage 2>/dev/null | awk '{print $NF}' || echo "N/A")
echo "  Tamano journal: $JOURNAL_SIZE"

# =============================================================================
# 9. DJANGO MIGRACIONES
# =============================================================================

section_header "9. DJANGO"

if [ -d "$STRATEKAZ_HOME/backend" ] && [ -f "$VENV_DIR/bin/activate" ]; then
    cd "$STRATEKAZ_HOME/backend"

    # Migraciones pendientes
    PENDING_MIGRATIONS=$(
        DJANGO_SETTINGS_MODULE=$SETTINGS "$VENV_DIR/bin/python" manage.py showmigrations --plan 2>/dev/null | \
        grep "\[ \]" | wc -l || echo "N/A"
    )

    if [ "$PENDING_MIGRATIONS" = "0" ]; then
        check_pass "Sin migraciones pendientes"
    elif [ "$PENDING_MIGRATIONS" = "N/A" ]; then
        check_warn "No se pudo verificar migraciones"
    else
        check_warn "$PENDING_MIGRATIONS migraciones pendientes"
    fi

    # Django system check
    CHECK_OUTPUT=$(
        DJANGO_SETTINGS_MODULE=$SETTINGS "$VENV_DIR/bin/python" manage.py check --deploy 2>&1 || true
    )
    CHECK_ERRORS=$(echo "$CHECK_OUTPUT" | grep -c "ERROR\|CRITICAL" || true)
    CHECK_WARNINGS=$(echo "$CHECK_OUTPUT" | grep -c "WARNING" || true)

    echo "  Django check --deploy: $CHECK_ERRORS errores, $CHECK_WARNINGS warnings"

    if [ "$CHECK_ERRORS" -gt 0 ]; then
        check_fail "Django check tiene $CHECK_ERRORS errores"
    else
        check_pass "Django check sin errores criticos"
    fi
else
    check_warn "Backend no encontrado en $STRATEKAZ_HOME/backend"
fi

# =============================================================================
# 10. CELERY
# =============================================================================

section_header "10. CELERY"

if cmd_exists redis-cli; then
    # Verificar colas de Celery en Redis
    echo "  Colas de Celery:"

    CELERY_QUEUES=(
        "default" "tenant_ops" "emails" "reports" "files"
        "maintenance" "monitoring" "scraping" "compliance"
        "notifications" "workflow"
    )

    TOTAL_PENDING=0
    for queue in "${CELERY_QUEUES[@]}"; do
        QUEUE_LEN=$(redis-cli llen "celery:$queue" 2>/dev/null || redis-cli llen "$queue" 2>/dev/null || echo "0")
        QUEUE_LEN=$(echo "$QUEUE_LEN" | tr -d '[:space:]')
        if [ "$QUEUE_LEN" -gt 0 ]; then
            echo "    $queue: $QUEUE_LEN tareas pendientes"
            TOTAL_PENDING=$((TOTAL_PENDING + QUEUE_LEN))
        fi
    done

    if [ "$TOTAL_PENDING" -eq 0 ]; then
        check_pass "Todas las colas de Celery vacias"
    elif [ "$TOTAL_PENDING" -gt 100 ]; then
        check_warn "$TOTAL_PENDING tareas pendientes en colas de Celery"
    else
        check_pass "$TOTAL_PENDING tareas pendientes en colas"
    fi

    # Workers activos
    if [ -d "$STRATEKAZ_HOME/backend" ] && [ -f "$VENV_DIR/bin/activate" ]; then
        cd "$STRATEKAZ_HOME/backend"
        WORKER_STATUS=$(
            DJANGO_SETTINGS_MODULE=$SETTINGS "$VENV_DIR/bin/celery" -A config inspect active_queues 2>/dev/null | \
            head -5 || echo "No disponible"
        )
        echo "  Workers: $WORKER_STATUS"
    fi
else
    check_warn "No se pueden verificar colas de Celery (redis-cli no disponible)"
fi

# =============================================================================
# RESUMEN FINAL
# =============================================================================

echo ""
echo "========================================================"
echo "  RESUMEN HEALTH CHECK"
echo "========================================================"
echo ""
echo "  Total checks:   $TOTAL_CHECKS"
echo "  Exitosos:       $TOTAL_PASS"
echo "  Advertencias:   $TOTAL_WARN"
echo "  Fallidos:       $TOTAL_FAIL"
echo ""

# Calcular score
if [ "$TOTAL_CHECKS" -gt 0 ]; then
    SCORE=$(( (TOTAL_PASS * 100) / TOTAL_CHECKS ))
    echo "  Score: ${SCORE}%"
else
    SCORE=0
    echo "  Score: N/A (sin checks ejecutados)"
fi

echo ""

if [ "$TOTAL_FAIL" -gt 0 ]; then
    echo -e "  ${RED}Estado: HAY PROBLEMAS QUE REQUIEREN ATENCION${NC}"
elif [ "$TOTAL_WARN" -gt 0 ]; then
    echo -e "  ${YELLOW}Estado: FUNCIONAL CON ADVERTENCIAS${NC}"
else
    echo -e "  ${GREEN}Estado: TODO OK${NC}"
fi

echo ""
echo "  Reporte guardado en: $REPORT_FILE"
echo "========================================================"
echo ""

} 2>&1 | tee "$REPORT_FILE"

# =============================================================================
# ENVIAR REPORTE POR EMAIL
# =============================================================================

if [ "$SEND_EMAIL" = true ]; then
    SUBJECT="[STRATEKAZ] Health Check Semanal — $(date '+%Y-%m-%d')"

    if [ "$TOTAL_FAIL" -gt 0 ]; then
        SUBJECT="[STRATEKAZ] ALERTA Health Check — $TOTAL_FAIL problemas detectados"
    fi

    if cmd_exists mail; then
        # Limpiar codigos de color para el email
        sed 's/\x1b\[[0-9;]*m//g' "$REPORT_FILE" | mail -s "$SUBJECT" "$ALERT_EMAIL" 2>/dev/null || true
        log_info "Reporte enviado por email a $ALERT_EMAIL"
    fi

    if [ -n "$WEBHOOK_URL" ] && cmd_exists curl; then
        # Enviar resumen por webhook
        SUMMARY="Health Check $(date '+%Y-%m-%d'): $TOTAL_PASS OK, $TOTAL_WARN warn, $TOTAL_FAIL fail (Score: ${SCORE}%)"
        curl -s -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$SUMMARY\"}" \
            >/dev/null 2>&1 || true
    fi
fi

# Exit code basado en resultado
if [ "$TOTAL_FAIL" -gt 0 ]; then
    exit 1
else
    exit 0
fi
