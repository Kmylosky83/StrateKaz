#!/bin/bash
# Script para ejecutar tests de Medicina Laboral
# Uso: ./run_tests.sh [opciones]

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Tests de Medicina Laboral - HSEQ Management   ${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Ruta base
TEST_PATH="apps/hseq_management/medicina_laboral/tests"

# Si no hay argumentos, mostrar menú
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Seleccione una opción:${NC}"
    echo "1) Ejecutar todos los tests"
    echo "2) Ejecutar solo tests de modelos"
    echo "3) Ejecutar con cobertura"
    echo "4) Ejecutar en paralelo"
    echo "5) Ejecutar tests específicos por modelo"
    echo "6) Ejecutar con verbose y mostrar prints"
    echo ""
    read -p "Opción (1-6): " option

    case $option in
        1)
            echo -e "\n${GREEN}Ejecutando todos los tests...${NC}\n"
            pytest $TEST_PATH -v
            ;;
        2)
            echo -e "\n${GREEN}Ejecutando tests de modelos...${NC}\n"
            pytest $TEST_PATH/test_models.py -v
            ;;
        3)
            echo -e "\n${GREEN}Ejecutando con cobertura...${NC}\n"
            pytest $TEST_PATH \
                --cov=apps.hseq_management.medicina_laboral \
                --cov-report=html \
                --cov-report=term-missing \
                -v
            echo -e "\n${GREEN}Reporte HTML generado en: htmlcov/index.html${NC}"
            ;;
        4)
            echo -e "\n${GREEN}Ejecutando en paralelo...${NC}\n"
            pytest $TEST_PATH -n auto -v
            ;;
        5)
            echo -e "\n${YELLOW}Modelos disponibles:${NC}"
            echo "1) TipoExamen"
            echo "2) ExamenMedico"
            echo "3) RestriccionMedica"
            echo "4) ProgramaVigilancia"
            echo "5) CasoVigilancia"
            echo "6) DiagnosticoOcupacional"
            echo "7) EstadisticaMedica"
            echo ""
            read -p "Seleccione modelo (1-7): " model

            case $model in
                1) MODEL="TestTipoExamen" ;;
                2) MODEL="TestExamenMedico" ;;
                3) MODEL="TestRestriccionMedica" ;;
                4) MODEL="TestProgramaVigilancia" ;;
                5) MODEL="TestCasoVigilancia" ;;
                6) MODEL="TestDiagnosticoOcupacional" ;;
                7) MODEL="TestEstadisticaMedica" ;;
                *) echo "Opción inválida"; exit 1 ;;
            esac

            echo -e "\n${GREEN}Ejecutando tests de $MODEL...${NC}\n"
            pytest $TEST_PATH/test_models.py::$MODEL -v
            ;;
        6)
            echo -e "\n${GREEN}Ejecutando con verbose y prints...${NC}\n"
            pytest $TEST_PATH -v -s
            ;;
        *)
            echo "Opción inválida"
            exit 1
            ;;
    esac
else
    # Si hay argumentos, ejecutar con ellos
    pytest $TEST_PATH "$@"
fi

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${GREEN}Ejecución completada${NC}"
echo -e "${BLUE}==================================================${NC}\n"
