#!/bin/bash
# ============================================================================
# Script para ejecutar tests de Contexto Organizacional (Linux/Mac)
# ============================================================================
#
# Uso:
#   ./run_tests.sh              - Ejecutar todos los tests
#   ./run_tests.sh models       - Solo tests de modelos
#   ./run_tests.sh views        - Solo tests de views
#   ./run_tests.sh coverage     - Tests con reporte de cobertura
#
# Autor: Sistema ERP StrateKaz
# Fecha: 2025-12-26
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navegar al directorio backend
cd ../../../../

echo ""
echo "==============================================="
echo "  TESTS - Contexto Organizacional"
echo "==============================================="
echo ""

# Verificar entorno virtual
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}ADVERTENCIA: No se detectó entorno virtual activado${NC}"
    echo "Se recomienda activar el entorno virtual primero:"
    echo "  source venv/bin/activate"
    echo ""
fi

# Función para ejecutar tests
run_tests() {
    local test_path=$1
    local description=$2
    local extra_args=$3

    echo -e "${GREEN}${description}${NC}"
    echo ""

    python -m pytest "$test_path" \
        -v \
        --tb=short \
        $extra_args

    local exit_code=$?

    echo ""
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Tests completados exitosamente${NC}"
    else
        echo -e "${RED}✗ Algunos tests fallaron (código: $exit_code)${NC}"
    fi

    return $exit_code
}

# Determinar qué tests ejecutar según parámetro
case "$1" in
    models)
        run_tests \
            "apps/motor_riesgos/contexto_organizacional/tests/test_models.py" \
            "Ejecutando tests de MODELOS..." \
            "--cov=apps.motor_riesgos.contexto_organizacional.models"
        ;;

    views)
        run_tests \
            "apps/motor_riesgos/contexto_organizacional/tests/test_views.py" \
            "Ejecutando tests de VIEWS/API..." \
            "--cov=apps.motor_riesgos.contexto_organizacional.views"
        ;;

    coverage)
        echo -e "${GREEN}Ejecutando TODOS los tests con reporte de cobertura...${NC}"
        echo ""

        python -m pytest \
            apps/motor_riesgos/contexto_organizacional/tests/ \
            -v \
            --tb=short \
            --cov=apps.motor_riesgos.contexto_organizacional \
            --cov-report=html \
            --cov-report=term-missing \
            --cov-report=xml

        exit_code=$?

        echo ""
        echo "==============================================="
        echo "  Reporte de Cobertura Generado"
        echo "==============================================="
        echo ""
        echo "HTML: htmlcov/index.html"
        echo "XML:  coverage.xml"
        echo ""

        # Intentar abrir reporte en navegador (solo si está disponible)
        if command -v xdg-open &> /dev/null; then
            xdg-open htmlcov/index.html 2>/dev/null &
        elif command -v open &> /dev/null; then
            open htmlcov/index.html 2>/dev/null &
        fi

        exit $exit_code
        ;;

    fast)
        echo -e "${GREEN}Ejecutando tests en modo rápido (sin cobertura)...${NC}"
        echo ""

        python -m pytest \
            apps/motor_riesgos/contexto_organizacional/tests/ \
            -v \
            --tb=short \
            -x  # Detener en primer fallo

        exit $?
        ;;

    *)
        # Por defecto, ejecutar todos los tests
        run_tests \
            "apps/motor_riesgos/contexto_organizacional/tests/" \
            "Ejecutando TODOS los tests..." \
            "--cov=apps.motor_riesgos.contexto_organizacional --cov-report=term-missing"
        ;;
esac

echo ""
echo "==============================================="
echo "  Finalizado"
echo "==============================================="
echo ""
