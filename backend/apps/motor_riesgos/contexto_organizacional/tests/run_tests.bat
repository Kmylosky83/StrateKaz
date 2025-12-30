@echo off
REM ============================================================================
REM Script para ejecutar tests de Contexto Organizacional
REM ============================================================================
REM
REM Uso:
REM   run_tests.bat              - Ejecutar todos los tests
REM   run_tests.bat models       - Solo tests de modelos
REM   run_tests.bat views        - Solo tests de views
REM   run_tests.bat -v           - Modo verbose
REM
REM Autor: Sistema ERP StrateKaz
REM Fecha: 2025-12-26
REM ============================================================================

cd ..\..\..\..\

echo.
echo ===============================================
echo  TESTS - Contexto Organizacional
echo ===============================================
echo.

REM Verificar si se especificó un archivo específico
if "%1"=="models" (
    echo Ejecutando tests de MODELOS...
    python -m pytest apps/motor_riesgos/contexto_organizacional/tests/test_models.py -v --tb=short --cov=apps.motor_riesgos.contexto_organizacional.models
    goto :end
)

if "%1"=="views" (
    echo Ejecutando tests de VIEWS/API...
    python -m pytest apps/motor_riesgos/contexto_organizacional/tests/test_views.py -v --tb=short --cov=apps.motor_riesgos.contexto_organizacional.views
    goto :end
)

REM Por defecto, ejecutar todos los tests
echo Ejecutando TODOS los tests...
python -m pytest apps/motor_riesgos/contexto_organizacional/tests/ -v --tb=short --cov=apps.motor_riesgos.contexto_organizacional --cov-report=html --cov-report=term-missing

:end
echo.
echo ===============================================
echo  Tests completados
echo ===============================================
echo.
echo Reporte de cobertura generado en: htmlcov/index.html
echo.
pause
