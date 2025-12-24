#!/bin/bash

# ===================================================================
# Script de inicio de Docker Compose
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
echo "║   GRASAS Y HUESOS DEL NORTE - Docker Startup     ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar modo de ejecución
MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${YELLOW}⚠️  MODO PRODUCCIÓN${NC}"

    # Verificar que existe .env.production
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ Error: No se encontró .env.production${NC}"
        echo "   Copie .env.production.example a .env.production y configure las variables"
        exit 1
    fi

    # Cargar variables de producción
    export $(grep -v '^#' .env.production | xargs)
else
    echo -e "${GREEN}🔧 MODO DESARROLLO${NC}"

    # Verificar que existe .env
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ Error: No se encontró .env${NC}"
        echo "   Copie .env.example a .env"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📋 Configuración:${NC}"
echo "   Archivo: $COMPOSE_FILE"
echo "   Modo: $MODE"
echo ""

# Construir imágenes si es necesario
echo -e "${BLUE}🔨 Construyendo imágenes...${NC}"
docker-compose -f "$COMPOSE_FILE" build

# Iniciar servicios
echo ""
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# Esperar a que los servicios estén listos
echo ""
echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Verificar estado de los servicios
echo ""
echo -e "${BLUE}📊 Estado de los servicios:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Mostrar logs iniciales
echo ""
echo -e "${GREEN}✅ Servicios iniciados exitosamente${NC}"
echo ""
echo -e "${BLUE}📝 Para ver los logs:${NC}"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo -e "${BLUE}🌐 URLs de acceso:${NC}"
if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    echo "   Frontend: http://localhost"
else
    echo "   Frontend: http://localhost:3010"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/api/docs/"
fi
echo ""
