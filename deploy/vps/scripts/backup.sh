#!/bin/bash
# Script de backup para StrateKaz
# /var/www/stratekaz/backup.sh
#
# Uso: ./backup.sh [nombre_db]
# Si no se especifica nombre_db, hace backup de todas las DBs stratekaz_*
#
# Configurar en crontab:
# 0 3 * * * /var/www/stratekaz/backup.sh >> /var/www/stratekaz/logs/backup.log 2>&1

set -e

# Configuración
BACKUP_DIR="/var/www/stratekaz/backups"
MEDIA_DIR="/var/www/stratekaz/media"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="stratekaz_user"
MYSQL_PASSWORD="TU_PASSWORD_AQUI"  # Cambiar esto

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Backup StrateKaz - $DATE"
echo "=========================================="

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Función para backup de una base de datos
backup_database() {
    local DB_NAME=$1
    local BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

    echo -e "${YELLOW}Respaldando base de datos: $DB_NAME${NC}"

    mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --add-drop-table \
        "$DB_NAME" | gzip > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}OK: $BACKUP_FILE ($SIZE)${NC}"
    else
        echo -e "${RED}ERROR: Falló backup de $DB_NAME${NC}"
        return 1
    fi
}

# Backup de base de datos específica o todas
if [ -n "$1" ]; then
    # Backup de BD específica
    backup_database "$1"
else
    # Backup de todas las BDs stratekaz_*
    echo "Obteniendo lista de bases de datos..."
    DATABASES=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SHOW DATABASES LIKE 'stratekaz_%';" -s --skip-column-names)

    for DB in $DATABASES; do
        backup_database "$DB"
    done
fi

# Backup de archivos media
echo ""
echo -e "${YELLOW}Respaldando archivos media...${NC}"
MEDIA_BACKUP="$BACKUP_DIR/media_${DATE}.tar.gz"

if [ -d "$MEDIA_DIR" ] && [ "$(ls -A $MEDIA_DIR 2>/dev/null)" ]; then
    tar -czf "$MEDIA_BACKUP" -C "$(dirname $MEDIA_DIR)" "$(basename $MEDIA_DIR)"
    SIZE=$(du -h "$MEDIA_BACKUP" | cut -f1)
    echo -e "${GREEN}OK: $MEDIA_BACKUP ($SIZE)${NC}"
else
    echo -e "${YELLOW}SKIP: Directorio media vacío o no existe${NC}"
fi

# Limpiar backups antiguos
echo ""
echo -e "${YELLOW}Limpiando backups antiguos (>$RETENTION_DAYS días)...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_MEDIA=$(find "$BACKUP_DIR" -name "media_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "Eliminados: $DELETED backups de BD, $DELETED_MEDIA backups de media"

# Mostrar espacio usado
echo ""
echo "Espacio usado en backups:"
du -sh "$BACKUP_DIR"

echo ""
echo -e "${GREEN}=========================================="
echo "Backup completado: $(date)"
echo "==========================================${NC}"
