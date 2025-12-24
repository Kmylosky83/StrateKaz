#!/bin/bash

# ===================================================================
# Script de restauración de base de datos MySQL
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
echo -e "${RED}"
echo "╔════════════════════════════════════════════════════╗"
echo "║  GRASAS Y HUESOS DEL NORTE - Database Restore    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que se proporcionó un archivo de backup
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Debe especificar un archivo de backup${NC}"
    echo ""
    echo "Uso: $0 <archivo_backup> [modo]"
    echo ""
    echo "Ejemplo:"
    echo "  $0 ./backups/mysql/backup_20240101_120000.sql.gz"
    echo "  $0 ./backups/mysql/backup_20240101_120000.sql.gz prod"
    echo ""
    echo -e "${BLUE}Backups disponibles:${NC}"
    ls -lh ./backups/mysql/backup_*.sql.gz 2>/dev/null || echo "   No hay backups disponibles"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

# Verificar modo de ejecución
MODE="${2:-dev}"
COMPOSE_FILE="docker-compose.yml"
CONTAINER_NAME="grasas_huesos_db"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    CONTAINER_NAME="grasas_huesos_db_prod"
    echo -e "${RED}⚠️  MODO PRODUCCIÓN - PRECAUCIÓN${NC}"

    # Cargar variables de producción
    if [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
    fi
else
    echo -e "${YELLOW}🔧 MODO DESARROLLO${NC}"

    # Cargar variables de desarrollo
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

echo ""
echo -e "${RED}⚠️  ADVERTENCIA: Esta operación sobrescribirá la base de datos actual${NC}"
echo ""
echo -e "${BLUE}📋 Configuración de restauración:${NC}"
echo "   Contenedor: $CONTAINER_NAME"
echo "   Base de datos: ${MYSQL_DATABASE:-grasas_huesos_db}"
echo "   Archivo: $BACKUP_FILE"
echo ""

# Confirmar restauración
read -p "¿Está seguro de que desea continuar? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Operación cancelada"
    exit 0
fi

# Verificar que el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Error: El contenedor $CONTAINER_NAME no está corriendo${NC}"
    exit 1
fi

# Descomprimir si es necesario
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${BLUE}🗜️  Descomprimiendo backup...${NC}"
    TEMP_FILE="/tmp/restore_temp_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    SQL_FILE="$TEMP_FILE"
else
    SQL_FILE="$BACKUP_FILE"
fi

# Realizar restauración
echo -e "${BLUE}📥 Restaurando base de datos...${NC}"
docker exec -i "$CONTAINER_NAME" mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD:-root_password_2024}" \
    "${MYSQL_DATABASE:-grasas_huesos_db}" < "$SQL_FILE"

# Limpiar archivo temporal
if [ ! -z "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

echo ""
echo -e "${GREEN}✅ Restauración completada exitosamente${NC}"
echo ""
echo -e "${YELLOW}⚠️  Recuerde reiniciar los servicios si es necesario:${NC}"
echo "   docker-compose -f $COMPOSE_FILE restart backend"
echo ""
