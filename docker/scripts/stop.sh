#!/bin/bash

# ===================================================================
# Script de detención de Docker Compose
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
echo "║   GRASAS Y HUESOS DEL NORTE - Docker Shutdown    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar modo de ejecución
MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${YELLOW}⚠️  MODO PRODUCCIÓN${NC}"
else
    echo -e "${GREEN}🔧 MODO DESARROLLO${NC}"
fi

echo ""
echo -e "${BLUE}📋 Configuración:${NC}"
echo "   Archivo: $COMPOSE_FILE"
echo "   Modo: $MODE"
echo ""

# Verificar si se quiere eliminar volúmenes
REMOVE_VOLUMES="${2:-no}"
if [ "$REMOVE_VOLUMES" = "volumes" ] || [ "$REMOVE_VOLUMES" = "-v" ]; then
    echo -e "${RED}⚠️  Los volúmenes serán eliminados (datos de BD se perderán)${NC}"
    read -p "¿Está seguro? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Operación cancelada"
        exit 0
    fi
    docker-compose -f "$COMPOSE_FILE" down -v
else
    docker-compose -f "$COMPOSE_FILE" down
fi

echo ""
echo -e "${GREEN}✅ Servicios detenidos exitosamente${NC}"
echo ""
