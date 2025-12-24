#!/bin/bash

# ===================================================================
# Script de backup de base de datos MySQL
# Grasas y Huesos del Norte S.A.S
# ===================================================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   GRASAS Y HUESOS DEL NORTE - Database Backup    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar modo de ejecución
MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"
CONTAINER_NAME="grasas_huesos_db"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    CONTAINER_NAME="grasas_huesos_db_prod"
    echo -e "${YELLOW}⚠️  MODO PRODUCCIÓN${NC}"

    # Cargar variables de producción
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
    fi
else
    echo -e "${GREEN}🔧 MODO DESARROLLO${NC}"

    # Cargar variables de desarrollo
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

# Configuración
BACKUP_DIR="./backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo ""
echo -e "${BLUE}📋 Configuración de backup:${NC}"
echo "   Contenedor: $CONTAINER_NAME"
echo "   Base de datos: ${MYSQL_DATABASE:-grasas_huesos_db}"
echo "   Archivo: $COMPRESSED_FILE"
echo ""

# Verificar que el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: El contenedor $CONTAINER_NAME no está corriendo${NC}"
    exit 1
fi

# Realizar backup
echo -e "${BLUE}💾 Realizando backup...${NC}"
docker exec "$CONTAINER_NAME" mysqldump \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD:-root_password_2024}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${MYSQL_DATABASE:-grasas_huesos_db}" > "$BACKUP_FILE"

# Comprimir backup
echo -e "${BLUE}🗜️  Comprimiendo backup...${NC}"
gzip "$BACKUP_FILE"

# Verificar tamaño del backup
BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo ""
echo -e "${GREEN}✅ Backup completado exitosamente${NC}"
echo ""
echo -e "${BLUE}📊 Información del backup:${NC}"
echo "   Archivo: $COMPRESSED_FILE"
echo "   Tamaño: $BACKUP_SIZE"
echo "   Fecha: $(date)"
echo ""

# Limpiar backups antiguos (mantener últimos 30 días)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
echo -e "${BLUE}🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✅ Limpieza completada${NC}"

echo ""
echo -e "${BLUE}📝 Backups disponibles:${NC}"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz | tail -5
echo ""
