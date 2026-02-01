@echo off
REM Script para ejecutar tests de Medicina Laboral en Windows
REM Uso: run_tests.bat [opciones]

echo ==================================================
echo    Tests de Medicina Laboral - HSEQ Management
echo ==================================================
echo.

set TEST_PATH=apps\hseq_management\medicina_laboral\tests

if "%1"=="" (
    echo Seleccione una opcion:
    echo 1. Ejecutar todos los tests
    echo 2. Ejecutar solo tests de modelos
    echo 3. Ejecutar con cobertura
    echo 4. Ejecutar en paralelo
    echo 5. Ejecutar tests especificos por modelo
    echo 6. Ejecutar con verbose y mostrar prints
    echo.
    set /p option="Opcion (1-6): "

    if "!option!"=="1" (
        echo.
        echo Ejecutando todos los tests...
        echo.
        pytest %TEST_PATH% -v
    ) else if "!option!"=="2" (
        echo.
        echo Ejecutando tests de modelos...
        echo.
        pytest %TEST_PATH%\test_models.py -v
    ) else if "!option!"=="3" (
        echo.
        echo Ejecutando con cobertura...
        echo.
        pytest %TEST_PATH% --cov=apps.hseq_management.medicina_laboral --cov-report=html --cov-report=term-missing -v
        echo.
        echo Reporte HTML generado en: htmlcov\index.html
    ) else if "!option!"=="4" (
        echo.
        echo Ejecutando en paralelo...
        echo.
        pytest %TEST_PATH% -n auto -v
    ) else if "!option!"=="5" (
        echo.
        echo Modelos disponibles:
        echo 1. TipoExamen
        echo 2. ExamenMedico
        echo 3. RestriccionMedica
        echo 4. ProgramaVigilancia
        echo 5. CasoVigilancia
        echo 6. DiagnosticoOcupacional
        echo 7. EstadisticaMedica
        echo.
        set /p model="Seleccione modelo (1-7): "

        if "!model!"=="1" set MODEL=TestTipoExamen
        if "!model!"=="2" set MODEL=TestExamenMedico
        if "!model!"=="3" set MODEL=TestRestriccionMedica
        if "!model!"=="4" set MODEL=TestProgramaVigilancia
        if "!model!"=="5" set MODEL=TestCasoVigilancia
        if "!model!"=="6" set MODEL=TestDiagnosticoOcupacional
        if "!model!"=="7" set MODEL=TestEstadisticaMedica

        echo.
        echo Ejecutando tests de !MODEL!...
        echo.
        pytest %TEST_PATH%\test_models.py::!MODEL! -v
    ) else if "!option!"=="6" (
        echo.
        echo Ejecutando con verbose y prints...
        echo.
        pytest %TEST_PATH% -v -s
    ) else (
        echo Opcion invalida
        exit /b 1
    )
) else (
    REM Si hay argumentos, ejecutar con ellos
    pytest %TEST_PATH% %*
)

echo.
echo ==================================================
echo Ejecucion completada
echo ==================================================
echo.
