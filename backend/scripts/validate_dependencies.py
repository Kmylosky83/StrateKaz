#!/usr/bin/env python
"""
Script de Validación de Dependencias entre Módulos

Este script analiza las importaciones entre módulos para detectar:
1. Dependencias circulares
2. Violaciones de jerarquía (nivel N importando de nivel N+1)
3. Importaciones no permitidas entre módulos

Uso:
    python scripts/validate_dependencies.py
    python scripts/validate_dependencies.py --verbose
    python scripts/validate_dependencies.py --fix  # Sugiere correcciones

Ejecutar desde: backend/
"""

import ast
import os
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import argparse


# ==============================================================================
# CONFIGURACIÓN DE NIVELES Y MÓDULOS
# ==============================================================================

LEVEL_CONFIG = {
    0: ['core', 'tenant'],
    1: ['gestion_estrategica'],
    2: ['motor_cumplimiento', 'motor_riesgos', 'workflow_engine'],
    3: ['hseq_management'],
    4: ['supply_chain', 'production_ops', 'logistics_fleet', 'sales_crm'],
    5: ['talent_hub', 'admin_finance', 'accounting'],
    6: ['analytics', 'audit_system'],
}

# Invertir para búsqueda rápida
MODULE_TO_LEVEL = {}
for level, modules in LEVEL_CONFIG.items():
    for module in modules:
        MODULE_TO_LEVEL[module] = level

# Imports siempre permitidos (Django, third-party, utils)
ALLOWED_ALWAYS = {
    'django',
    'rest_framework',
    'celery',
    'redis',
    'utils',
    'config',
}


# ==============================================================================
# DATACLASSES
# ==============================================================================

@dataclass
class ImportInfo:
    """Información sobre una importación."""
    file_path: str
    line_number: int
    imported_module: str
    imported_from: str  # módulo origen (app principal)
    import_statement: str


@dataclass
class Violation:
    """Una violación de dependencias."""
    type: str  # 'hierarchy', 'circular', 'same_level'
    source_module: str
    source_level: int
    target_module: str
    target_level: int
    file_path: str
    line_number: int
    import_statement: str
    suggestion: str = ""


@dataclass
class AnalysisResult:
    """Resultado del análisis."""
    total_files: int = 0
    total_imports: int = 0
    violations: List[Violation] = field(default_factory=list)
    dependencies: Dict[str, Set[str]] = field(default_factory=lambda: defaultdict(set))
    circular_deps: List[Tuple[str, str]] = field(default_factory=list)


# ==============================================================================
# FUNCIONES DE ANÁLISIS
# ==============================================================================

def get_module_from_import(import_path: str) -> Optional[str]:
    """
    Extrae el módulo principal de un import.

    Ejemplos:
        'apps.core.models' -> 'core'
        'apps.gestion_estrategica.planeacion.models' -> 'gestion_estrategica'
        'django.db' -> None (external)
    """
    if not import_path.startswith('apps.'):
        return None

    parts = import_path.split('.')
    if len(parts) < 2:
        return None

    return parts[1]  # apps.{module}.*


def get_module_from_file(file_path: str) -> Optional[str]:
    """
    Extrae el módulo de un archivo basado en su ruta.

    Ejemplo:
        'apps/gestion_estrategica/planeacion/models.py' -> 'gestion_estrategica'
    """
    parts = Path(file_path).parts

    try:
        apps_index = parts.index('apps')
        if len(parts) > apps_index + 1:
            return parts[apps_index + 1]
    except ValueError:
        pass

    return None


def extract_imports_from_file(file_path: str) -> List[ImportInfo]:
    """
    Extrae todas las importaciones de un archivo Python.
    """
    imports = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        tree = ast.parse(content)

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = get_module_from_import(alias.name)
                    if module:
                        imports.append(ImportInfo(
                            file_path=file_path,
                            line_number=node.lineno,
                            imported_module=alias.name,
                            imported_from=module,
                            import_statement=f"import {alias.name}"
                        ))

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    module = get_module_from_import(node.module)
                    if module:
                        names = ', '.join(a.name for a in node.names)
                        imports.append(ImportInfo(
                            file_path=file_path,
                            line_number=node.lineno,
                            imported_module=node.module,
                            imported_from=module,
                            import_statement=f"from {node.module} import {names}"
                        ))

    except SyntaxError as e:
        print(f"  [WARN] Syntax error in {file_path}: {e}")
    except Exception as e:
        print(f"  [WARN] Error reading {file_path}: {e}")

    return imports


def check_violation(source_module: str, target_module: str, import_info: ImportInfo) -> Optional[Violation]:
    """
    Verifica si un import viola las reglas de dependencias.
    """
    if source_module == target_module:
        return None  # Mismo módulo, OK

    if target_module not in MODULE_TO_LEVEL:
        return None  # Módulo externo o no configurado

    if source_module not in MODULE_TO_LEVEL:
        return None  # Archivo fuera de módulos conocidos

    source_level = MODULE_TO_LEVEL[source_module]
    target_level = MODULE_TO_LEVEL[target_module]

    # Violación de jerarquía: nivel inferior importando de nivel superior
    if target_level > source_level:
        return Violation(
            type='hierarchy',
            source_module=source_module,
            source_level=source_level,
            target_module=target_module,
            target_level=target_level,
            file_path=import_info.file_path,
            line_number=import_info.line_number,
            import_statement=import_info.import_statement,
            suggestion=f"Mover la funcionalidad compartida a nivel {source_level} o usar signals/events"
        )

    return None


def find_circular_dependencies(dependencies: Dict[str, Set[str]]) -> List[Tuple[str, str]]:
    """
    Detecta dependencias circulares entre módulos.
    """
    circular = []

    for module_a, deps_a in dependencies.items():
        for module_b in deps_a:
            if module_b in dependencies:
                if module_a in dependencies[module_b]:
                    pair = tuple(sorted([module_a, module_b]))
                    if pair not in circular:
                        circular.append(pair)

    return circular


def analyze_directory(apps_dir: str, verbose: bool = False) -> AnalysisResult:
    """
    Analiza todos los archivos Python en el directorio de apps.
    """
    result = AnalysisResult()

    print(f"\n{'='*60}")
    print("ANÁLISIS DE DEPENDENCIAS - STRATEKAZ")
    print(f"{'='*60}\n")

    # Encontrar todos los archivos Python
    python_files = []
    for root, dirs, files in os.walk(apps_dir):
        # Excluir migraciones y tests
        dirs[:] = [d for d in dirs if d not in ['migrations', '__pycache__', 'tests']]

        for file in files:
            if file.endswith('.py') and not file.startswith('test_'):
                python_files.append(os.path.join(root, file))

    result.total_files = len(python_files)
    print(f"Archivos a analizar: {result.total_files}")

    # Analizar cada archivo
    for file_path in python_files:
        source_module = get_module_from_file(file_path)
        if not source_module:
            continue

        imports = extract_imports_from_file(file_path)
        result.total_imports += len(imports)

        for import_info in imports:
            target_module = import_info.imported_from

            # Registrar dependencia
            if target_module and target_module != source_module:
                result.dependencies[source_module].add(target_module)

            # Verificar violación
            violation = check_violation(source_module, target_module, import_info)
            if violation:
                result.violations.append(violation)

                if verbose:
                    print(f"\n[VIOLATION] {violation.type.upper()}")
                    print(f"  File: {violation.file_path}:{violation.line_number}")
                    print(f"  Import: {violation.import_statement}")
                    print(f"  {violation.source_module} (L{violation.source_level}) -> {violation.target_module} (L{violation.target_level})")

    # Detectar dependencias circulares
    result.circular_deps = find_circular_dependencies(result.dependencies)

    return result


def print_report(result: AnalysisResult):
    """
    Imprime el reporte de análisis.
    """
    print(f"\n{'='*60}")
    print("REPORTE DE ANÁLISIS")
    print(f"{'='*60}\n")

    print(f"Total archivos analizados: {result.total_files}")
    print(f"Total imports analizados: {result.total_imports}")
    print(f"Total violaciones: {len(result.violations)}")
    print(f"Dependencias circulares: {len(result.circular_deps)}")

    # Agrupar violaciones por tipo
    violations_by_type = defaultdict(list)
    for v in result.violations:
        violations_by_type[v.type].append(v)

    if violations_by_type:
        print(f"\n{'-'*60}")
        print("VIOLACIONES DETECTADAS")
        print(f"{'-'*60}")

        for vtype, violations in violations_by_type.items():
            print(f"\n## {vtype.upper()} ({len(violations)})")

            for v in violations[:10]:  # Limitar a 10 por tipo
                print(f"\n  [{v.source_module}] -> [{v.target_module}]")
                print(f"  Archivo: {v.file_path}:{v.line_number}")
                print(f"  Import: {v.import_statement}")
                if v.suggestion:
                    print(f"  Sugerencia: {v.suggestion}")

            if len(violations) > 10:
                print(f"\n  ... y {len(violations) - 10} más")

    if result.circular_deps:
        print(f"\n{'-'*60}")
        print("DEPENDENCIAS CIRCULARES")
        print(f"{'-'*60}")

        for module_a, module_b in result.circular_deps:
            level_a = MODULE_TO_LEVEL.get(module_a, '?')
            level_b = MODULE_TO_LEVEL.get(module_b, '?')
            print(f"\n  {module_a} (L{level_a}) <-> {module_b} (L{level_b})")

    # Mostrar grafo de dependencias
    print(f"\n{'-'*60}")
    print("GRAFO DE DEPENDENCIAS")
    print(f"{'-'*60}")

    for level in sorted(LEVEL_CONFIG.keys()):
        modules = LEVEL_CONFIG[level]
        print(f"\nNIVEL {level}:")

        for module in modules:
            deps = result.dependencies.get(module, set())
            deps_str = ', '.join(sorted(deps)) if deps else '(ninguna)'
            print(f"  {module} -> {deps_str}")

    # Resumen final
    print(f"\n{'='*60}")
    if len(result.violations) == 0 and len(result.circular_deps) == 0:
        print("✅ ANÁLISIS COMPLETADO: Sin violaciones detectadas")
    else:
        print(f"❌ ANÁLISIS COMPLETADO: {len(result.violations)} violaciones, {len(result.circular_deps)} circulares")
    print(f"{'='*60}\n")

    return len(result.violations) == 0 and len(result.circular_deps) == 0


def main():
    parser = argparse.ArgumentParser(
        description='Valida dependencias entre módulos de StrateKaz'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Muestra cada violación mientras analiza'
    )
    parser.add_argument(
        '--apps-dir',
        default='apps',
        help='Directorio de apps (default: apps)'
    )

    args = parser.parse_args()

    # Verificar que existe el directorio
    if not os.path.isdir(args.apps_dir):
        print(f"Error: No se encontró el directorio '{args.apps_dir}'")
        print("Ejecuta este script desde el directorio backend/")
        sys.exit(1)

    # Ejecutar análisis
    result = analyze_directory(args.apps_dir, verbose=args.verbose)

    # Imprimir reporte
    success = print_report(result)

    # Exit code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
