#!/bin/bash

# ===================================================================
# Script de verificación de salud de servicios
# Grasas y Huesos del Norte S.A.S
# ===================================================================

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   GRASAS Y HUESOS DEL NORTE - Health Check       ║"
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

echo ""
echo -e "${BLUE}🏥 Verificando estado de servicios...${NC}"
echo ""

# Función para verificar salud de un contenedor
check_health() {
    local container=$1
    local name=$2

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")

        case "$health" in
            "healthy")
                echo -e "   ${name}: ${GREEN}✅ HEALTHY${NC}"
                return 0
                ;;
            "unhealthy")
                echo -e "   ${name}: ${RED}❌ UNHEALTHY${NC}"
                return 1
                ;;
            "starting")
                echo -e "   ${name}: ${YELLOW}⏳ STARTING${NC}"
                return 2
                ;;
            "no-healthcheck")
                echo -e "   ${name}: ${BLUE}ℹ️  NO HEALTHCHECK (running)${NC}"
                return 0
                ;;
            *)
                echo -e "   ${name}: ${YELLOW}⚠️  UNKNOWN${NC}"
                return 3
                ;;
        esac
    else
        echo -e "   ${name}: ${RED}❌ NOT RUNNING${NC}"
        return 4
    fi
}

# Verificar cada servicio
if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    check_health "grasas_huesos_db_prod" "MySQL Database"
    db_status=$?

    check_health "grasas_huesos_backend_prod" "Django Backend"
    backend_status=$?

    check_health "grasas_huesos_frontend_prod" "React Frontend"
    frontend_status=$?
else
    check_health "grasas_huesos_db" "MySQL Database"
    db_status=$?

    check_health "grasas_huesos_backend" "Django Backend"
    backend_status=$?

    check_health "grasas_huesos_frontend" "React Frontend"
    frontend_status=$?
fi

echo ""
echo -e "${BLUE}📊 Estado general de los contenedores:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${BLUE}💾 Uso de recursos:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f "$COMPOSE_FILE" ps -q)

echo ""

# Código de salida basado en el peor estado
if [ $db_status -eq 1 ] || [ $backend_status -eq 1 ] || [ $frontend_status -eq 1 ]; then
    echo -e "${RED}❌ Algunos servicios no están saludables${NC}"
    exit 1
elif [ $db_status -eq 4 ] || [ $backend_status -eq 4 ] || [ $frontend_status -eq 4 ]; then
    echo -e "${RED}❌ Algunos servicios no están corriendo${NC}"
    exit 2
elif [ $db_status -eq 2 ] || [ $backend_status -eq 2 ] || [ $frontend_status -eq 2 ]; then
    echo -e "${YELLOW}⏳ Algunos servicios aún están iniciando${NC}"
    exit 3
else
    echo -e "${GREEN}✅ Todos los servicios están saludables${NC}"
    exit 0
fi
