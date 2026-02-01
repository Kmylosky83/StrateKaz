#!/bin/bash

# Script para ejecutar tests del módulo de Configuración
# Sistema de Gestión StrateKaz

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Tests Módulo de Configuración${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Verificar si estamos en Docker o entorno local
if [ -f "/.dockerenv" ]; then
    PYTEST_CMD="pytest"
else
    # Verificar si existe docker-compose
    if command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Ejecutando en Docker...${NC}"
        PYTEST_CMD="docker-compose exec -T backend pytest"
    else
        PYTEST_CMD="pytest"
    fi
fi

# Función para ejecutar tests
run_test() {
    local test_name=$1
    local test_path=$2

    echo -e "${GREEN}Running: ${test_name}${NC}"
    $PYTEST_CMD $test_path -v
    echo ""
}

# Menú de opciones
echo "Seleccione una opción:"
echo "1) Todos los tests de EmpresaConfig"
echo "2) Solo tests de Validación de NIT"
echo "3) Solo tests de Singleton"
echo "4) Solo tests de Formateo de NIT"
echo "5) Solo tests de Propiedades Computadas"
echo "6) Tests con cobertura (coverage)"
echo "7) Tests en modo watch (útil para desarrollo)"
echo ""
read -p "Opción (1-7): " option

BASE_PATH="apps/gestion_estrategica/configuracion/tests/test_empresa_config.py"

case $option in
    1)
        run_test "Todos los tests de EmpresaConfig" "$BASE_PATH"
        ;;
    2)
        run_test "Tests de Validación de NIT" "${BASE_PATH}::TestValidacionNIT"
        ;;
    3)
        run_test "Tests de Patrón Singleton" "${BASE_PATH}::TestSingletonPattern"
        ;;
    4)
        run_test "Tests de Formateo de NIT" "${BASE_PATH}::TestFormateoNIT"
        ;;
    5)
        run_test "Tests de Propiedades Computadas" "${BASE_PATH}::TestPropiedadesComputadas"
        ;;
    6)
        echo -e "${GREEN}Ejecutando tests con cobertura...${NC}"
        $PYTEST_CMD $BASE_PATH \
            --cov=apps.gestion_estrategica.configuracion.models \
            --cov-report=term-missing \
            --cov-report=html
        echo -e "${YELLOW}Reporte HTML generado en: htmlcov/index.html${NC}"
        ;;
    7)
        echo -e "${GREEN}Modo watch activado (Ctrl+C para salir)${NC}"
        $PYTEST_CMD $BASE_PATH -f
        ;;
    *)
        echo -e "${YELLOW}Opción inválida. Ejecutando todos los tests...${NC}"
        run_test "Todos los tests de EmpresaConfig" "$BASE_PATH"
        ;;
esac

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Tests completados${NC}"
echo -e "${GREEN}=====================================${NC}"
