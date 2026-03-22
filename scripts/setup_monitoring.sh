#!/bin/bash
# =============================================================================
# STRATEKAZ - Setup de Monitoreo y Tareas Programadas
# =============================================================================
#
# Script interactivo de configuracion inicial que:
#   1. Crea directorios de logs necesarios
#   2. Configura cron jobs (backup, offsite, verify, weekly)
#   3. Verifica que rclone este instalado y configurado
#   4. Prueba el envio de emails
#   5. Verifica permisos de PostgreSQL
#   6. Imprime resumen de la configuracion
#
# Uso:
#   sudo ./setup_monitoring.sh              # Setup interactivo
#   sudo ./setup_monitoring.sh --auto       # Sin confirmaciones
#   sudo ./setup_monitoring.sh --check      # Solo verificar, no cambiar nada
#
# Requisitos:
#   - Ejecutar como root o con sudo
#   - PostgreSQL client tools
#   - .pgpass configurado
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# CONFIGURACION
# -----------------------------------------------------------------------------

STRATEKAZ_HOME="${STRATEKAZ_HOME:-/opt/stratekaz}"
SCRIPTS_DIR="$STRATEKAZ_HOME/scripts"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/stratekaz}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@stratekaz.com}"

# PostgreSQL
DB_USER="${DB_USER:-stratekaz}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-stratekaz}"

# Modo
AUTO_MODE=false
CHECK_ONLY=false

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Contadores
STEPS_DONE=0
STEPS_SKIPPED=0
STEPS_FAILED=0

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info()  { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[FAIL]${NC}  $1"; }
log_skip()  { echo -e "${BLUE}[SKIP]${NC}  $1"; }
log_step()  {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  PASO $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

cmd_exists() {
    command -v "$1" &>/dev/null
}

# Pedir confirmacion (retorna 0 si acepta, 1 si no)
confirm() {
    if [ "$AUTO_MODE" = true ]; then
        return 0
    fi

    local prompt="${1:-Continuar?}"
    echo -en "  ${BOLD}$prompt [s/N]: ${NC}"
    read -r response
    case "$response" in
        [sS]|[sS][iI]|[yY]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
}

# Verificar que se ejecuta como root
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "Este script debe ejecutarse como root o con sudo"
        echo "  Uso: sudo $0"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# PARSEO DE ARGUMENTOS
# -----------------------------------------------------------------------------

for arg in "$@"; do
    case $arg in
        --auto)  AUTO_MODE=true ;;
        --check) CHECK_ONLY=true ;;
        --help|-h)
            echo "Uso: sudo $0 [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --auto    Sin confirmaciones interactivas"
            echo "  --check   Solo verificar estado actual, no cambiar nada"
            echo "  --help    Mostrar esta ayuda"
            echo ""
            echo "Variables de entorno:"
            echo "  STRATEKAZ_HOME   Directorio del proyecto (default: /opt/stratekaz)"
            echo "  BACKUP_DIR       Directorio de backups (default: /var/backups/stratekaz)"
            echo "  ALERT_EMAIL      Email para alertas (default: admin@stratekaz.com)"
            echo "  DB_USER          Usuario PostgreSQL (default: stratekaz)"
            echo "  DB_NAME          Base de datos (default: stratekaz)"
            exit 0
            ;;
    esac
done

# =============================================================================
# INICIO
# =============================================================================

echo ""
echo "========================================================"
echo "  STRATEKAZ - Setup de Monitoreo"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================"
echo ""
echo "  Proyecto:   $STRATEKAZ_HOME"
echo "  Scripts:    $SCRIPTS_DIR"
echo "  Backups:    $BACKUP_DIR"
echo "  Email:      $ALERT_EMAIL"
echo "  PostgreSQL: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

if [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${YELLOW}Modo: SOLO VERIFICACION (no se realizaran cambios)${NC}"
    echo ""
fi

check_root

# =============================================================================
# PASO 1: Verificar prerequisitos
# =============================================================================

log_step "1: Verificar prerequisitos"

# Verificar directorio del proyecto
if [ -d "$STRATEKAZ_HOME" ]; then
    log_info "Directorio del proyecto existe: $STRATEKAZ_HOME"
else
    log_error "Directorio del proyecto NO encontrado: $STRATEKAZ_HOME"
    STEPS_FAILED=$((STEPS_FAILED + 1))
fi

# Verificar scripts
REQUIRED_SCRIPTS=(
    "backup_tenants.sh"
    "backup_offsite.sh"
    "restore_verify.sh"
    "weekly_health_check.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if [ -x "$SCRIPTS_DIR/$script" ]; then
            log_info "$script existe y es ejecutable"
        else
            log_warn "$script existe pero NO es ejecutable"
            if [ "$CHECK_ONLY" = false ]; then
                chmod +x "$SCRIPTS_DIR/$script"
                log_info "  Permisos corregidos: +x"
            fi
        fi
    else
        log_error "$script NO encontrado en $SCRIPTS_DIR"
        STEPS_FAILED=$((STEPS_FAILED + 1))
    fi
done

# Verificar PostgreSQL tools
for cmd in psql pg_dump pg_restore createdb dropdb; do
    if cmd_exists "$cmd"; then
        log_info "$cmd disponible"
    else
        log_error "$cmd NO instalado. Ejecutar: sudo apt-get install postgresql-client"
        STEPS_FAILED=$((STEPS_FAILED + 1))
    fi
done

# Verificar Redis
if cmd_exists redis-cli; then
    log_info "redis-cli disponible"
else
    log_warn "redis-cli no instalado"
fi

STEPS_DONE=$((STEPS_DONE + 1))

# =============================================================================
# PASO 2: Crear directorios
# =============================================================================

log_step "2: Crear directorios necesarios"

DIRECTORIES=(
    "$BACKUP_DIR"
    "$BACKUP_DIR/full"
    "$BACKUP_DIR/schemas"
    "/var/log"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        log_info "Directorio existe: $dir"
    else
        if [ "$CHECK_ONLY" = true ]; then
            log_warn "Directorio faltante: $dir (--check, no se creara)"
        elif confirm "Crear directorio $dir?"; then
            mkdir -p "$dir"
            log_info "Creado: $dir"
            STEPS_DONE=$((STEPS_DONE + 1))
        else
            log_skip "Omitido: $dir"
            STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
        fi
    fi
done

# Permisos del directorio de backups
if [ -d "$BACKUP_DIR" ]; then
    chown -R "$DB_USER":"$DB_USER" "$BACKUP_DIR" 2>/dev/null || true
    log_info "Permisos de $BACKUP_DIR asignados a $DB_USER"
fi

# =============================================================================
# PASO 3: Verificar .pgpass
# =============================================================================

log_step "3: Verificar autenticacion PostgreSQL (.pgpass)"

# Buscar .pgpass del usuario que ejecuta los cron jobs
PGPASS_PATHS=(
    "/root/.pgpass"
    "/home/$DB_USER/.pgpass"
    "$HOME/.pgpass"
)

PGPASS_FOUND=false
for pgpass in "${PGPASS_PATHS[@]}"; do
    if [ -f "$pgpass" ]; then
        PGPASS_PERMS=$(stat -c '%a' "$pgpass" 2>/dev/null || stat -f '%Lp' "$pgpass" 2>/dev/null)
        if [ "$PGPASS_PERMS" = "600" ]; then
            log_info ".pgpass encontrado: $pgpass (permisos: $PGPASS_PERMS)"
            PGPASS_FOUND=true
        else
            log_warn ".pgpass encontrado: $pgpass pero permisos incorrectos ($PGPASS_PERMS, debe ser 600)"
            if [ "$CHECK_ONLY" = false ]; then
                chmod 600 "$pgpass"
                log_info "  Permisos corregidos a 600"
            fi
            PGPASS_FOUND=true
        fi
        break
    fi
done

if [ "$PGPASS_FOUND" = false ]; then
    log_error "No se encontro .pgpass. Los cron jobs necesitan autenticacion sin contrasena."
    echo "  Crear /root/.pgpass con formato:"
    echo "  $DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:TU_CONTRASENA"
    echo "  $DB_HOST:$DB_PORT:*:$DB_USER:TU_CONTRASENA"
    echo "  Luego: chmod 600 /root/.pgpass"
    STEPS_FAILED=$((STEPS_FAILED + 1))
fi

# Verificar conexion
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
    log_info "Conexion a PostgreSQL verificada ($DB_USER@$DB_HOST:$DB_PORT/$DB_NAME)"
else
    log_error "No se puede conectar a PostgreSQL. Verificar .pgpass y que el servidor este corriendo."
    STEPS_FAILED=$((STEPS_FAILED + 1))
fi

# Verificar permisos para crear BD (necesario para restore_verify.sh)
TEMP_CHECK_DB="stratekaz_permission_check_$$"
if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_CHECK_DB" 2>/dev/null; then
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_CHECK_DB" 2>/dev/null || true
    log_info "Usuario $DB_USER puede crear bases de datos (necesario para restore_verify.sh)"
else
    log_warn "Usuario $DB_USER no puede crear bases de datos. restore_verify.sh no funcionara."
    echo "  Para otorgar permiso: ALTER USER $DB_USER CREATEDB;"
fi

STEPS_DONE=$((STEPS_DONE + 1))

# =============================================================================
# PASO 4: Verificar rclone
# =============================================================================

log_step "4: Verificar rclone (backup offsite)"

if cmd_exists rclone; then
    RCLONE_VERSION=$(rclone version 2>/dev/null | head -1)
    log_info "rclone instalado: $RCLONE_VERSION"

    RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
    if rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE}:$"; then
        log_info "Remote '$RCLONE_REMOTE' configurado"

        # Verificar acceso
        if rclone lsd "${RCLONE_REMOTE}:" &>/dev/null; then
            log_info "Acceso a '$RCLONE_REMOTE' verificado"
        else
            log_warn "No se pudo acceder al remote '$RCLONE_REMOTE'. Verificar credenciales."
        fi
    else
        log_warn "Remote '$RCLONE_REMOTE' no configurado"
        echo "  Configurar con: rclone config"
        echo "  O ejecutar: $SCRIPTS_DIR/setup_rclone.sh (si existe)"
    fi
else
    log_warn "rclone no instalado. Backup offsite no disponible."
    echo "  Instalar con: curl https://rclone.org/install.sh | sudo bash"

    if [ "$CHECK_ONLY" = false ]; then
        if confirm "Instalar rclone ahora?"; then
            curl -s https://rclone.org/install.sh | bash
            if cmd_exists rclone; then
                log_info "rclone instalado exitosamente"
                echo "  Configurar con: rclone config"
            else
                log_error "Error instalando rclone"
            fi
            STEPS_DONE=$((STEPS_DONE + 1))
        else
            log_skip "Instalacion de rclone omitida"
            STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
        fi
    fi
fi

# =============================================================================
# PASO 5: Configurar cron jobs
# =============================================================================

log_step "5: Configurar cron jobs"

# Definir los cron jobs
CRON_JOBS=(
    "0 2 * * * $SCRIPTS_DIR/backup_tenants.sh >> /var/log/stratekaz_backup.log 2>&1"
    "30 2 * * * $SCRIPTS_DIR/backup_offsite.sh >> /var/log/stratekaz_backup_offsite.log 2>&1"
    "0 3 * * 0 $SCRIPTS_DIR/restore_verify.sh \$(ls -t $BACKUP_DIR/full/*.dump 2>/dev/null | head -1) >> /var/log/stratekaz_restore_verify.log 2>&1"
    "0 9 * * 1 $SCRIPTS_DIR/weekly_health_check.sh >> /var/log/stratekaz_weekly.log 2>&1"
)

CRON_DESCRIPTIONS=(
    "Backup diario a las 2:00 AM"
    "Backup offsite a las 2:30 AM"
    "Verificacion de restore: domingos 3:00 AM"
    "Health check semanal: lunes 9:00 AM"
)

# Verificar cron jobs existentes
EXISTING_CRONTAB=$(crontab -l 2>/dev/null || echo "")

echo "  Cron jobs a configurar:"
echo ""

for i in "${!CRON_JOBS[@]}"; do
    CRON_LINE="${CRON_JOBS[$i]}"
    DESCRIPTION="${CRON_DESCRIPTIONS[$i]}"
    # Extraer el script name para verificar si ya existe
    SCRIPT_NAME=$(echo "$CRON_LINE" | grep -oP '\S+\.sh' | head -1)

    echo -e "  ${BOLD}$((i+1)). $DESCRIPTION${NC}"
    echo "     $CRON_LINE"

    if echo "$EXISTING_CRONTAB" | grep -q "$SCRIPT_NAME" 2>/dev/null; then
        log_info "  Ya configurado en crontab"
    else
        if [ "$CHECK_ONLY" = true ]; then
            log_warn "  NO configurado (--check, no se agregara)"
        else
            echo -e "     ${YELLOW}No configurado${NC}"
        fi
    fi
    echo ""
done

if [ "$CHECK_ONLY" = false ]; then
    if confirm "Agregar los cron jobs faltantes al crontab de root?"; then
        # Obtener crontab actual
        CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")
        NEW_CRONTAB="$CURRENT_CRONTAB"

        ADDED=0
        for i in "${!CRON_JOBS[@]}"; do
            CRON_LINE="${CRON_JOBS[$i]}"
            DESCRIPTION="${CRON_DESCRIPTIONS[$i]}"
            SCRIPT_NAME=$(echo "$CRON_LINE" | grep -oP '\S+\.sh' | head -1)

            if ! echo "$NEW_CRONTAB" | grep -q "$SCRIPT_NAME" 2>/dev/null; then
                NEW_CRONTAB="$NEW_CRONTAB
# StrateKaz: $DESCRIPTION
$CRON_LINE"
                ADDED=$((ADDED + 1))
            fi
        done

        if [ "$ADDED" -gt 0 ]; then
            echo "$NEW_CRONTAB" | crontab -
            log_info "$ADDED cron jobs agregados"
            STEPS_DONE=$((STEPS_DONE + 1))
        else
            log_info "Todos los cron jobs ya estaban configurados"
        fi
    else
        log_skip "Configuracion de cron jobs omitida"
        STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
    fi
fi

# =============================================================================
# PASO 6: Configurar logrotate
# =============================================================================

log_step "6: Configurar logrotate"

LOGROTATE_CONF="/etc/logrotate.d/stratekaz"

if [ -f "$LOGROTATE_CONF" ]; then
    log_info "Configuracion de logrotate existe: $LOGROTATE_CONF"
elif [ -f "$SCRIPTS_DIR/logrotate-stratekaz.conf" ]; then
    if [ "$CHECK_ONLY" = true ]; then
        log_warn "logrotate no configurado (--check, no se instalara)"
    elif confirm "Instalar configuracion de logrotate?"; then
        cp "$SCRIPTS_DIR/logrotate-stratekaz.conf" "$LOGROTATE_CONF"
        log_info "logrotate configurado: $LOGROTATE_CONF"
        STEPS_DONE=$((STEPS_DONE + 1))
    else
        log_skip "logrotate omitido"
        STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
    fi
else
    log_warn "No se encontro logrotate-stratekaz.conf en $SCRIPTS_DIR"

    if [ "$CHECK_ONLY" = false ]; then
        if confirm "Crear configuracion basica de logrotate?"; then
            cat > "$LOGROTATE_CONF" << 'LOGROTATE_EOF'
/var/log/stratekaz_*.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
LOGROTATE_EOF
            log_info "logrotate configurado: $LOGROTATE_CONF"
            STEPS_DONE=$((STEPS_DONE + 1))
        else
            log_skip "logrotate omitido"
            STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
        fi
    fi
fi

# =============================================================================
# PASO 7: Probar envio de email
# =============================================================================

log_step "7: Probar envio de email"

if cmd_exists mail; then
    log_info "Comando 'mail' disponible"

    if [ "$CHECK_ONLY" = false ]; then
        if confirm "Enviar email de prueba a $ALERT_EMAIL?"; then
            if echo "Este es un email de prueba del sistema de monitoreo de StrateKaz. Si recibes este mensaje, las alertas por email funcionan correctamente. Fecha: $(date)" | \
                mail -s "[STRATEKAZ] Test de monitoreo - $(date '+%Y-%m-%d')" "$ALERT_EMAIL" 2>/dev/null; then
                log_info "Email de prueba enviado a $ALERT_EMAIL"
                echo "  Verificar que el email llego a la bandeja de entrada."
                STEPS_DONE=$((STEPS_DONE + 1))
            else
                log_error "Error enviando email. Verificar configuracion de mail/postfix/sendmail."
                STEPS_FAILED=$((STEPS_FAILED + 1))
            fi
        else
            log_skip "Prueba de email omitida"
            STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
        fi
    fi
else
    log_warn "Comando 'mail' no disponible. Las alertas por email no funcionaran."
    echo "  Instalar con: sudo apt-get install mailutils"
    echo "  O configurar WEBHOOK_URL para alertas por Slack/Discord."

    if [ "$CHECK_ONLY" = false ]; then
        if confirm "Instalar mailutils ahora?"; then
            apt-get install -y mailutils 2>/dev/null
            if cmd_exists mail; then
                log_info "mailutils instalado"
                STEPS_DONE=$((STEPS_DONE + 1))
            else
                log_error "Error instalando mailutils"
                STEPS_FAILED=$((STEPS_FAILED + 1))
            fi
        else
            log_skip "Instalacion de mailutils omitida"
            STEPS_SKIPPED=$((STEPS_SKIPPED + 1))
        fi
    fi
fi

# =============================================================================
# PASO 8: Hacer scripts ejecutables
# =============================================================================

log_step "8: Permisos de scripts"

ALL_SCRIPTS=(
    "backup_tenants.sh"
    "backup_offsite.sh"
    "restore_verify.sh"
    "weekly_health_check.sh"
    "deploy.sh"
    "setup_monitoring.sh"
)

for script in "${ALL_SCRIPTS[@]}"; do
    SCRIPT_PATH="$SCRIPTS_DIR/$script"
    if [ -f "$SCRIPT_PATH" ]; then
        if [ ! -x "$SCRIPT_PATH" ]; then
            if [ "$CHECK_ONLY" = false ]; then
                chmod +x "$SCRIPT_PATH"
                log_info "Permisos +x: $script"
            else
                log_warn "Sin permisos de ejecucion: $script"
            fi
        else
            log_info "Ejecutable: $script"
        fi
    fi
done

STEPS_DONE=$((STEPS_DONE + 1))

# =============================================================================
# RESUMEN
# =============================================================================

echo ""
echo "========================================================"
echo "  RESUMEN DE CONFIGURACION"
echo "========================================================"
echo ""
echo "  Pasos completados: $STEPS_DONE"
echo "  Pasos omitidos:    $STEPS_SKIPPED"
echo "  Pasos fallidos:    $STEPS_FAILED"
echo ""

# Estado de cada componente
echo "  Componentes:"
echo ""

# Backups
if [ -d "$BACKUP_DIR" ]; then
    echo -e "  ${GREEN}[OK]${NC} Directorio de backups: $BACKUP_DIR"
else
    echo -e "  ${RED}[--]${NC} Directorio de backups: NO EXISTE"
fi

# .pgpass
if [ "$PGPASS_FOUND" = true ]; then
    echo -e "  ${GREEN}[OK]${NC} .pgpass configurado"
else
    echo -e "  ${RED}[--]${NC} .pgpass: NO ENCONTRADO"
fi

# rclone
if cmd_exists rclone; then
    echo -e "  ${GREEN}[OK]${NC} rclone instalado"
else
    echo -e "  ${YELLOW}[--]${NC} rclone: NO INSTALADO"
fi

# mail
if cmd_exists mail; then
    echo -e "  ${GREEN}[OK]${NC} mail disponible"
else
    echo -e "  ${YELLOW}[--]${NC} mail: NO DISPONIBLE"
fi

# Cron
CRON_COUNT=$(crontab -l 2>/dev/null | grep -c "stratekaz" || echo "0")
echo -e "  ${GREEN}[OK]${NC} Cron jobs de StrateKaz: $CRON_COUNT"

echo ""
echo "  Programacion de tareas:"
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │ 02:00  Diario    backup_tenants.sh               │"
echo "  │ 02:30  Diario    backup_offsite.sh               │"
echo "  │ 03:00  Domingo   restore_verify.sh               │"
echo "  │ 09:00  Lunes     weekly_health_check.sh           │"
echo "  └──────────────────────────────────────────────────┘"
echo ""

if [ "$STEPS_FAILED" -gt 0 ]; then
    echo -e "  ${RED}Hay $STEPS_FAILED pasos que requieren atencion.${NC}"
    echo "  Revisar los mensajes de error arriba."
elif [ "$CHECK_ONLY" = true ]; then
    echo -e "  ${BLUE}Modo verificacion completado. Ejecutar sin --check para aplicar cambios.${NC}"
else
    echo -e "  ${GREEN}Setup completado exitosamente.${NC}"
    echo ""
    echo "  Siguiente paso recomendado:"
    echo "    1. Ejecutar un backup de prueba:  $SCRIPTS_DIR/backup_tenants.sh"
    echo "    2. Verificar el restore:          $SCRIPTS_DIR/restore_verify.sh $BACKUP_DIR/full/<backup>.dump"
    echo "    3. Ejecutar health check:         $SCRIPTS_DIR/weekly_health_check.sh --no-email"
fi

echo ""
echo "========================================================"
echo ""

exit "$STEPS_FAILED"
