#!/usr/bin/env python
"""
Script para ejecutar tests del modulo IPEVR
============================================

Uso:
    # Todos los tests
    python run_tests.py

    # Solo modelos
    python run_tests.py --models

    # Solo views
    python run_tests.py --views

    # Con cobertura
    python run_tests.py --coverage

    # Test especifico
    python run_tests.py --test test_models.py::TestMatrizIPEVR::test_nivel_probabilidad_calculo

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
import sys
import subprocess
from pathlib import Path


def run_command(command):
    """Ejecuta un comando y muestra la salida."""
    print(f"\n{'='*80}")
    print(f"Ejecutando: {' '.join(command)}")
    print(f"{'='*80}\n")

    result = subprocess.run(command, cwd=Path(__file__).parent.parent.parent.parent.parent)
    return result.returncode


def main():
    args = sys.argv[1:]

    # Comando base
    cmd = ["python", "-m", "pytest", "apps/motor_riesgos/ipevr/tests/"]

    # Opciones segun argumentos
    if "--models" in args:
        cmd[-1] += "test_models.py"
    elif "--views" in args:
        cmd[-1] += "test_views.py"
    elif "--test" in args:
        idx = args.index("--test")
        if idx + 1 < len(args):
            test_path = args[idx + 1]
            cmd[-1] += test_path
        else:
            print("Error: --test requiere el path del test")
            return 1

    # Agregar verbose por defecto
    cmd.append("-v")

    # Opciones adicionales
    if "--coverage" in args or "--cov" in args:
        cmd.extend([
            "--cov=apps.motor_riesgos.ipevr",
            "--cov-report=html",
            "--cov-report=term-missing"
        ])
    else:
        # Sin cobertura es mas rapido
        cmd.append("--no-cov")

    if "--verbose" in args or "-vv" in args:
        cmd.append("-vv")

    if "--tb=long" in args:
        cmd.append("--tb=long")

    # Ejecutar
    return run_command(cmd)


if __name__ == "__main__":
    sys.exit(main())
