#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script simple para verificar sintaxis de Python en los archivos modificados
"""
import sys
import py_compile

files_to_check = [
    'apps/recolecciones/models.py',
    'apps/recolecciones/tests/__init__.py',
    'apps/recolecciones/tests/test_race_condition.py',
]

print("Verificando sintaxis de archivos Python...")
print("=" * 60)

errors = []

for file_path in files_to_check:
    try:
        py_compile.compile(file_path, doraise=True)
        print(f"✓ {file_path}")
    except py_compile.PyCompileError as e:
        print(f"✗ {file_path}")
        errors.append((file_path, str(e)))

print("=" * 60)

if errors:
    print(f"\n❌ Se encontraron {len(errors)} errores de sintaxis:\n")
    for file_path, error in errors:
        print(f"{file_path}:")
        print(f"  {error}\n")
    sys.exit(1)
else:
    print(f"\n✅ Todos los archivos ({len(files_to_check)}) tienen sintaxis correcta\n")
    sys.exit(0)
