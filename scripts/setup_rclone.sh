#!/bin/bash
# =============================================================================
# STRATEKAZ - Configuracion de rclone para Google Drive
# =============================================================================
#
# Script interactivo para configurar rclone con Google Drive.
# Ejecutar una sola vez en el servidor VPS.
#
# Uso:
#   ./setup_rclone.sh
#
# =============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
GDRIVE_DEST="${GDRIVE_DEST:-stratekaz-backups}"

# -----------------------------------------------------------------------------
# FUNCIONES
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}${BOLD}>>> $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# -----------------------------------------------------------------------------
# PASO 1: Verificar/Instalar rclone
# -----------------------------------------------------------------------------

log_step "PASO 1: Verificar instalacion de rclone"

if command -v rclone &>/dev/null; then
    log_info "rclone ya instalado: $(rclone version | head -1)"
else
    log_warn "rclone no esta instalado"
    echo ""
    echo -e "${BOLD}Para instalar rclone, ejecutar:${NC}"
    echo ""
    echo "  curl https://rclone.org/install.sh | sudo bash"
    echo ""
    echo "O en sistemas basados en Debian/Ubuntu:"
    echo ""
    echo "  sudo apt install rclone"
    echo ""
    read -rp "Desea instalar rclone ahora? (s/N): " INSTALL_CHOICE

    if [[ "$INSTALL_CHOICE" =~ ^[sS]$ ]]; then
        log_info "Instalando rclone..."
        curl https://rclone.org/install.sh | sudo bash
        if command -v rclone &>/dev/null; then
            log_info "rclone instalado exitosamente: $(rclone version | head -1)"
        else
            log_error "Error instalando rclone"
            exit 1
        fi
    else
        log_error "rclone es necesario. Instalar manualmente y volver a ejecutar."
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# PASO 2: Configurar remote de Google Drive
# -----------------------------------------------------------------------------

log_step "PASO 2: Configurar remote '${RCLONE_REMOTE}' para Google Drive"

if rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
    log_warn "Remote '${RCLONE_REMOTE}' ya existe"
    read -rp "Desea reconfigurarlo? (s/N): " RECONFIG_CHOICE

    if [[ ! "$RECONFIG_CHOICE" =~ ^[sS]$ ]]; then
        log_info "Manteniendo configuracion existente"
    else
        log_info "Reconfigurando remote..."
        rclone config delete "$RCLONE_REMOTE"
    fi
fi

if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
    echo ""
    echo -e "${BOLD}Instrucciones para configurar Google Drive:${NC}"
    echo ""
    echo "  Como el VPS no tiene navegador, usaremos autorizacion remota."
    echo ""
    echo "  1. En su COMPUTADOR LOCAL (con navegador), ejecutar:"
    echo ""
    echo "     rclone authorize \"drive\""
    echo ""
    echo "  2. Se abrira el navegador para autenticar con Google."
    echo "     Seleccionar la cuenta de Google donde se almacenaran los backups."
    echo ""
    echo "  3. Copiar el token que aparece en la terminal local."
    echo ""
    echo "  4. Volver aqui y pegar el token cuando se solicite."
    echo ""
    echo -e "${YELLOW}NOTA: Si el VPS tiene navegador, rclone config lo abrira directamente.${NC}"
    echo ""

    read -rp "Presione Enter para iniciar la configuracion de rclone..."
    echo ""

    # Ejecutar configuracion interactiva de rclone
    # rclone config es interactivo, lo dejamos correr
    echo -e "${BOLD}Ejecutando: rclone config${NC}"
    echo ""
    echo "Siga estos pasos en el asistente interactivo:"
    echo "  n) New remote"
    echo "  name> ${RCLONE_REMOTE}"
    echo "  Storage> drive (o el numero de Google Drive)"
    echo "  client_id> (dejar vacio, Enter)"
    echo "  client_secret> (dejar vacio, Enter)"
    echo "  scope> 1 (full access)"
    echo "  service_account_file> (dejar vacio, Enter)"
    echo "  Edit advanced config> n"
    echo "  Use auto config> n (para servidor sin navegador)"
    echo "  Pegar el token obtenido del computador local"
    echo "  Configure as team drive> n"
    echo "  y) Yes this is OK"
    echo ""

    rclone config
fi

# -----------------------------------------------------------------------------
# PASO 3: Verificar conexion
# -----------------------------------------------------------------------------

log_step "PASO 3: Verificar conexion con Google Drive"

if rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
    log_info "Remote '${RCLONE_REMOTE}' configurado"

    # Probar acceso
    log_info "Probando acceso al Drive..."
    if rclone lsd "${RCLONE_REMOTE}:" >/dev/null 2>&1; then
        log_info "Conexion exitosa con Google Drive"
    else
        log_error "No se pudo conectar a Google Drive. Verificar token."
        exit 1
    fi

    # Crear directorio de backups en Drive
    log_info "Creando estructura de directorios en Google Drive..."
    rclone mkdir "${RCLONE_REMOTE}:${GDRIVE_DEST}/full" 2>/dev/null || true
    rclone mkdir "${RCLONE_REMOTE}:${GDRIVE_DEST}/schemas" 2>/dev/null || true
    log_info "Directorios creados: ${GDRIVE_DEST}/full, ${GDRIVE_DEST}/schemas"
else
    log_error "Remote '${RCLONE_REMOTE}' no se configuro correctamente"
    exit 1
fi

# -----------------------------------------------------------------------------
# PASO 4: Probar con un archivo de prueba
# -----------------------------------------------------------------------------

log_step "PASO 4: Test de escritura en Google Drive"

TEST_FILE=$(mktemp)
echo "StrateKaz backup test - $(date)" > "$TEST_FILE"

if rclone copy "$TEST_FILE" "${RCLONE_REMOTE}:${GDRIVE_DEST}/" 2>/dev/null; then
    log_info "Test de escritura exitoso"
    # Limpiar archivo de prueba
    rclone delete "${RCLONE_REMOTE}:${GDRIVE_DEST}/$(basename "$TEST_FILE")" 2>/dev/null || true
else
    log_error "Error al escribir en Google Drive"
    rm -f "$TEST_FILE"
    exit 1
fi

rm -f "$TEST_FILE"

# -----------------------------------------------------------------------------
# PASO 5: Configurar log rotation
# -----------------------------------------------------------------------------

log_step "PASO 5: Configurar log rotation"

LOGROTATE_CONF="/etc/logrotate.d/stratekaz-backup"
if [ ! -f "$LOGROTATE_CONF" ]; then
    echo ""
    echo "Se recomienda configurar logrotate. Ejecutar como root:"
    echo ""
    echo "  cat > $LOGROTATE_CONF << 'LOGROTATE'"
    echo "  /var/log/stratekaz_backup*.log {"
    echo "      weekly"
    echo "      rotate 8"
    echo "      compress"
    echo "      delaycompress"
    echo "      missingok"
    echo "      notifempty"
    echo "      create 644 root root"
    echo "  }"
    echo "  LOGROTATE"
    echo ""
else
    log_info "Logrotate ya configurado en $LOGROTATE_CONF"
fi

# -----------------------------------------------------------------------------
# RESUMEN
# -----------------------------------------------------------------------------

log_step "CONFIGURACION COMPLETADA"

echo ""
echo -e "${BOLD}Resumen:${NC}"
echo "  Remote:       ${RCLONE_REMOTE}"
echo "  Destino:      ${RCLONE_REMOTE}:${GDRIVE_DEST}/"
echo "  Config:       $(rclone config file 2>/dev/null | tail -1)"
echo ""
echo -e "${BOLD}Proximos pasos:${NC}"
echo ""
echo "  1. Agregar al crontab (ejecutar: crontab -e):"
echo ""
echo "     # Backup local diario a las 2:00 AM"
echo "     0 2 * * * /opt/stratekaz/scripts/backup_tenants.sh >> /var/log/stratekaz_backup.log 2>&1"
echo ""
echo "     # Sync a Google Drive 30 min despues"
echo "     30 2 * * * /opt/stratekaz/scripts/backup_offsite.sh >> /var/log/stratekaz_backup_offsite.log 2>&1"
echo ""
echo "     # Verificacion semanal (domingos 3:00 AM)"
echo "     0 3 * * 0 /opt/stratekaz/scripts/backup_verify.sh >> /var/log/stratekaz_backup_verify.log 2>&1"
echo ""
echo "  2. (Opcional) Configurar email para alertas:"
echo "     export ALERT_EMAIL=tu-email@dominio.com"
echo ""
echo "  3. (Opcional) Configurar webhook (Slack/Discord):"
echo "     export WEBHOOK_URL=https://hooks.slack.com/services/..."
echo ""
echo "  4. Probar ejecucion manual:"
echo "     /opt/stratekaz/scripts/backup_offsite.sh"
echo "     /opt/stratekaz/scripts/backup_verify.sh"
echo ""
log_info "Setup finalizado correctamente"
