#!/bin/bash

# ===================================================================
# Script para ver logs de Docker Compose
# Grasas y Huesos del Norte S.A.S
# ===================================================================

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   GRASAS Y HUESOS DEL NORTE - Docker Logs        ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar modo de ejecución
MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${BLUE}📊 MODO PRODUCCIÓN${NC}"
else
    echo -e "${GREEN}📊 MODO DESARROLLO${NC}"
fi

# Servicio específico o todos
SERVICE="${2:-}"
FOLLOW="${3:--f}"

echo ""
if [ -z "$SERVICE" ]; then
    echo -e "${BLUE}📝 Mostrando logs de todos los servicios...${NC}"
    docker-compose -f "$COMPOSE_FILE" logs "$FOLLOW"
else
    echo -e "${BLUE}📝 Mostrando logs de: $SERVICE${NC}"
    docker-compose -f "$COMPOSE_FILE" logs "$FOLLOW" "$SERVICE"
fi
