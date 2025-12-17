#!/usr/bin/env python
"""
Script de verificación para la migración 0021_add_tipos_documento_section

Verifica que:
1. La migración existe y tiene la estructura correcta
2. La dependencia es correcta (0020)
3. Usa get_or_create para idempotencia
4. Incluye función de reversión
"""

import os
import sys

# Ruta de la migración
MIGRATION_PATH = "apps/core/migrations/0021_add_tipos_documento_section.py"

def verify_migration():
    """Verifica la estructura de la migración"""

    if not os.path.exists(MIGRATION_PATH):
        print("ERROR: La migración no existe en", MIGRATION_PATH)
        return False

    print("✓ Migración encontrada:", MIGRATION_PATH)

    with open(MIGRATION_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Verificaciones
    checks = {
        "Usa get_or_create": "get_or_create" in content,
        "Dependencia correcta (0020)": "'core', '0020_add_user_roles_adicionales_field'" in content,
        "Función forward existe": "def add_tipos_documento_section" in content,
        "Función reverse existe": "def reverse_tipos_documento" in content,
        "Code correcto": "code='tipos-documento'" in content,
        "Name correcto": "name='Tipos de Documento'" in content,
        "Icon correcto": "icon='FileText'" in content,
        "Order correcto": "order=6" in content,
        "Tab organizacion": "code='organizacion'" in content,
        "RunPython usado": "migrations.RunPython" in content,
    }

    all_passed = True
    for check_name, passed in checks.items():
        status = "✓" if passed else "✗"
        print(f"{status} {check_name}")
        if not passed:
            all_passed = False

    return all_passed

def print_summary():
    """Imprime resumen de la migración"""
    print("\n" + "="*60)
    print("RESUMEN DE LA MIGRACIÓN 0021")
    print("="*60)
    print("""
Archivo: backend/apps/core/migrations/0021_add_tipos_documento_section.py

Propósito:
  Persistir la sección 'tipos-documento' que fue creada manualmente en BD

Acción:
  Agrega TabSection con:
  - code: 'tipos-documento'
  - name: 'Tipos de Documento'
  - description: 'Gestión de categorías y tipos de documento para consecutivos'
  - icon: 'FileText'
  - order: 6
  - is_enabled: True

Tab destino: organizacion

Características:
  - Usa get_or_create para idempotencia
  - Incluye función de reversión
  - Maneja ausencia del tab gracefully
  - Sigue patrón de migraciones 0009 y 0017

Próximos pasos:
  1. Ejecutar: python manage.py migrate core 0021 --fake
     (usar --fake porque la sección ya existe manualmente)

  2. Verificar en BD:
     SELECT * FROM core_tabsection WHERE code = 'tipos-documento';

  3. En producción/nuevas BD:
     python manage.py migrate core
     (creará la sección automáticamente)
""")
    print("="*60)

if __name__ == "__main__":
    print("Verificando migración 0021_add_tipos_documento_section...\n")

    if verify_migration():
        print("\n✓ Todas las verificaciones pasaron correctamente")
        print_summary()
        sys.exit(0)
    else:
        print("\n✗ Algunas verificaciones fallaron")
        sys.exit(1)
