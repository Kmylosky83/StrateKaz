#!/usr/bin/env python
"""
Script para verificar datos en app legacy proveedores
Uso: docker-compose exec backend python scripts/verify_proveedores_data.py
"""

import django
import os
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.apps import apps

def check_legacy_tables():
    """Verificar si existen tablas de la app legacy"""
    print("=" * 80)
    print("VERIFICACIÓN DE TABLAS LEGACY - apps.proveedores")
    print("=" * 80)

    expected_tables = [
        'proveedores_proveedor',
        'proveedores_unidadnegocio',
        'proveedores_condicioncomercialproveedor',
        'proveedores_preciomateriaprima',
        'proveedores_historialprecioproveedor',
        'proveedores_pruebaacidez',
    ]

    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'proveedores_%'")
        existing_tables = [row[0] for row in cursor.fetchall()]

    print(f"\n✓ Tablas encontradas: {len(existing_tables)}")
    for table in existing_tables:
        print(f"  - {table}")

    print(f"\n✓ Tablas esperadas: {len(expected_tables)}")
    missing = set(expected_tables) - set(existing_tables)
    if missing:
        print(f"  ⚠ Faltantes: {', '.join(missing)}")
    else:
        print("  ✓ Todas las tablas esperadas existen")

    return existing_tables


def count_records():
    """Contar registros en cada tabla"""
    print("\n" + "=" * 80)
    print("CONTEO DE REGISTROS")
    print("=" * 80)

    tables_to_check = [
        'proveedores_proveedor',
        'proveedores_unidadnegocio',
        'proveedores_condicioncomercialproveedor',
        'proveedores_preciomateriaprima',
        'proveedores_historialprecioproveedor',
        'proveedores_pruebaacidez',
    ]

    total_records = 0

    with connection.cursor() as cursor:
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                total_records += count
                status = "✓" if count > 0 else "○"
                print(f"{status} {table}: {count:,} registros")
            except Exception as e:
                print(f"✗ {table}: ERROR - {e}")

    print(f"\n{'=' * 80}")
    print(f"TOTAL DE REGISTROS: {total_records:,}")
    print(f"{'=' * 80}")

    return total_records


def check_foreign_keys():
    """Verificar relaciones FK"""
    print("\n" + "=" * 80)
    print("VERIFICACIÓN DE FOREIGN KEYS")
    print("=" * 80)

    query = """
    SELECT
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
    FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
        TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME LIKE 'proveedores_%'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY
        TABLE_NAME, COLUMN_NAME
    """

    with connection.cursor() as cursor:
        cursor.execute(query)
        fks = cursor.fetchall()

    print(f"\n✓ Foreign Keys encontradas: {len(fks)}")

    current_table = None
    for fk in fks:
        table, column, ref_table, ref_column = fk
        if table != current_table:
            print(f"\n{table}:")
            current_table = table
        print(f"  - {column} → {ref_table}.{ref_column}")


def check_migrations():
    """Verificar migraciones aplicadas"""
    print("\n" + "=" * 80)
    print("MIGRACIONES APLICADAS")
    print("=" * 80)

    query = """
    SELECT app, name, applied
    FROM django_migrations
    WHERE app IN ('proveedores', 'gestion_proveedores')
    ORDER BY app, id
    """

    with connection.cursor() as cursor:
        cursor.execute(query)
        migrations = cursor.fetchall()

    if not migrations:
        print("\n⚠ No se encontraron migraciones para proveedores o gestion_proveedores")
        return

    current_app = None
    count = 0

    for app, name, applied in migrations:
        if app != current_app:
            if count > 0:
                print(f"  Total: {count}")
            print(f"\n{app}:")
            current_app = app
            count = 0

        count += 1
        print(f"  {count}. {name}")

    if count > 0:
        print(f"  Total: {count}")


def generate_export_commands():
    """Generar comandos para exportar datos"""
    print("\n" + "=" * 80)
    print("COMANDOS PARA EXPORTAR DATOS")
    print("=" * 80)

    print("\n# Exportar todos los datos de proveedores:")
    print("docker-compose exec backend python manage.py dumpdata proveedores \\")
    print("  --indent 2 --output=/tmp/proveedores_backup.json")

    print("\n# Exportar solo Proveedores (sin relaciones):")
    print("docker-compose exec backend python manage.py dumpdata \\")
    print("  proveedores.Proveedor --indent 2 --output=/tmp/proveedores_only.json")

    print("\n# Backup de base de datos completa:")
    print("docker-compose exec db mysqldump -u root -p grasas_huesos_db \\")
    print("  > backup_$(date +%Y%m%d_%H%M%S).sql")


def main():
    """Función principal"""
    try:
        print("\n" + "=" * 80)
        print("VERIFICADOR DE DATOS - App Legacy Proveedores")
        print("=" * 80)

        # Ejecutar verificaciones
        check_legacy_tables()
        total_records = count_records()
        check_foreign_keys()
        check_migrations()
        generate_export_commands()

        # Resumen final
        print("\n" + "=" * 80)
        print("RESUMEN")
        print("=" * 80)

        if total_records > 0:
            print(f"\n⚠ ADVERTENCIA: Hay {total_records:,} registros en la app legacy.")
            print("  Se requiere migración de datos antes de eliminar la app.")
            print("\n  Opciones:")
            print("  1. Migrar datos a gestion_proveedores (RECOMENDADO)")
            print("  2. Mantener app legacy y eliminar nueva app")
            print("  3. Agregar related_name únicos (temporal)")
        else:
            print("\n✓ No hay datos en la app legacy.")
            print("  Se puede eliminar de INSTALLED_APPS sin pérdida de datos.")

        print("\n" + "=" * 80)

    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
