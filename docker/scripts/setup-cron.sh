#!/bin/bash

# ===================================================================
# Script para configurar backups automáticos con cron
# Grasas y Huesos del Norte S.A.S
# ===================================================================
#
# Este script ayuda a configurar cron jobs para backups automáticos
# de la base de datos MySQL.
#
# Uso:
#   ./setup-cron.sh
#
# ===================================================================

set -euo pipefail

# Colores
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Configuración
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly BACKUP_SCRIPT="$PROJECT_ROOT/docker/scripts/backup.sh"

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   CONFIGURACIÓN DE BACKUPS AUTOMÁTICOS (CRON)           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar que el script de backup existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo -e "${RED}Error: Script de backup no encontrado: $BACKUP_SCRIPT${NC}"
    exit 1
fi

# Verificar que el script tiene permisos de ejecución
if [ ! -x "$BACKUP_SCRIPT" ]; then
    echo -e "${YELLOW}Agregando permisos de ejecución al script de backup...${NC}"
    chmod +x "$BACKUP_SCRIPT"
fi

# Menú de opciones
echo -e "${BLUE}Seleccione la frecuencia de backups:${NC}"
echo ""
echo "1) Diario a las 2:00 AM"
echo "2) Cada 12 horas (02:00 AM y 02:00 PM)"
echo "3) Cada 6 horas (00:00, 06:00, 12:00, 18:00)"
echo "4) Cada 4 horas"
echo "5) Cada hora"
echo "6) Semanal (Domingos a las 3:00 AM)"
echo "7) Personalizado"
echo "8) Ver cron jobs actuales"
echo "9) Salir"
echo ""
read -p "Opción: " option

case $option in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Diario a las 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 2,14 * * *"
        DESCRIPTION="Cada 12 horas (02:00 y 14:00)"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="Cada 6 horas"
        ;;
    4)
        CRON_SCHEDULE="0 */4 * * *"
        DESCRIPTION="Cada 4 horas"
        ;;
    5)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="Cada hora"
        ;;
    6)
        CRON_SCHEDULE="0 3 * * 0"
        DESCRIPTION="Semanal (Domingos a las 3:00 AM)"
        ;;
    7)
        echo ""
        echo "Formato cron: MIN HORA DIA MES DIA_SEMANA"
        echo "Ejemplos:"
        echo "  0 2 * * *     = Todos los días a las 2:00 AM"
        echo "  */30 * * * *  = Cada 30 minutos"
        echo "  0 */2 * * *   = Cada 2 horas"
        echo ""
        read -p "Ingrese expresión cron: " CRON_SCHEDULE
        DESCRIPTION="Personalizado: $CRON_SCHEDULE"
        ;;
    8)
        echo ""
        echo -e "${BLUE}Cron jobs actuales:${NC}"
        crontab -l 2>/dev/null || echo "(No hay cron jobs configurados)"
        echo ""
        exit 0
        ;;
    9)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

# Preguntar modo de ejecución
echo ""
echo -e "${BLUE}Seleccione el modo de ejecución:${NC}"
echo "1) Desarrollo (dev)"
echo "2) Producción (prod)"
read -p "Opción: " mode_option

case $mode_option in
    1)
        MODE="dev"
        ;;
    2)
        MODE="prod"
        ;;
    *)
        echo -e "${RED}Opción inválida, usando 'dev' por defecto${NC}"
        MODE="dev"
        ;;
esac

# Directorio de logs
LOG_DIR="$PROJECT_ROOT/docker/backups/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cron-backup.log"

# Crear cron job
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_ROOT && $BACKUP_SCRIPT $MODE >> $LOG_FILE 2>&1"

# Mostrar resumen
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Resumen de Configuración${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "Frecuencia: $DESCRIPTION"
echo "Modo: $MODE"
echo "Script: $BACKUP_SCRIPT"
echo "Log: $LOG_FILE"
echo ""
echo "Cron job:"
echo "  $CRON_JOB"
echo ""

# Confirmar
read -p "¿Desea agregar este cron job? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Operación cancelada"
    exit 0
fi

# Agregar cron job
echo ""
echo -e "${BLUE}Agregando cron job...${NC}"

# Obtener crontab actual
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || true)

# Verificar si ya existe un cron job similar
if echo "$CURRENT_CRONTAB" | grep -q "$BACKUP_SCRIPT"; then
    echo -e "${YELLOW}Advertencia: Ya existe un cron job para el script de backup${NC}"
    read -p "¿Desea reemplazarlo? (yes/no): " replace
    if [ "$replace" = "yes" ]; then
        # Eliminar cron jobs antiguos del script de backup
        NEW_CRONTAB=$(echo "$CURRENT_CRONTAB" | grep -v "$BACKUP_SCRIPT" || true)
        # Agregar nuevo cron job
        (echo "$NEW_CRONTAB"; echo "$CRON_JOB") | crontab -
        echo -e "${GREEN}Cron job reemplazado exitosamente${NC}"
    else
        echo "Operación cancelada"
        exit 0
    fi
else
    # Agregar nuevo cron job
    (echo "$CURRENT_CRONTAB"; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}Cron job agregado exitosamente${NC}"
fi

# Mostrar crontab actualizado
echo ""
echo -e "${BLUE}Cron jobs actuales:${NC}"
crontab -l

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Configuración completada${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Próximas ejecuciones:"
echo "  Primera ejecución según schedule: $CRON_SCHEDULE"
echo ""
echo "Para monitorear:"
echo "  tail -f $LOG_FILE"
echo ""
echo "Para editar manualmente:"
echo "  crontab -e"
echo ""
echo "Para eliminar:"
echo "  crontab -r"
echo ""
