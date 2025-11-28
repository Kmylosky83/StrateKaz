# Manual migration to convert subtipo_materia from VARCHAR to JSON

from django.db import migrations


def convert_subtipo_to_json(apps, schema_editor):
    """
    Convertir subtipo_materia de VARCHAR(10) a JSON
    """
    with schema_editor.connection.cursor() as cursor:
        # 1. Crear columna temporal JSON
        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            ADD COLUMN subtipo_materia_temp JSON NULL
        """)

        # 2. Migrar datos existentes - convertir valores simples a arrays
        cursor.execute("""
            UPDATE proveedores_proveedor
            SET subtipo_materia_temp = JSON_ARRAY(subtipo_materia)
            WHERE subtipo_materia IS NOT NULL AND subtipo_materia != ''
        """)

        # 3. Eliminar columna vieja
        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            DROP COLUMN subtipo_materia
        """)

        # 4. Renombrar columna temporal
        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            CHANGE COLUMN subtipo_materia_temp subtipo_materia JSON NULL
        """)


def reverse_conversion(apps, schema_editor):
    """
    Revertir la conversión (en caso de rollback)
    """
    with schema_editor.connection.cursor() as cursor:
        # Convertir de vuelta a VARCHAR
        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            ADD COLUMN subtipo_materia_temp VARCHAR(10) NULL
        """)

        cursor.execute("""
            UPDATE proveedores_proveedor
            SET subtipo_materia_temp = JSON_EXTRACT(subtipo_materia, '$[0]')
            WHERE subtipo_materia IS NOT NULL
        """)

        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            DROP COLUMN subtipo_materia
        """)

        cursor.execute("""
            ALTER TABLE proveedores_proveedor
            CHANGE COLUMN subtipo_materia_temp subtipo_materia VARCHAR(10) NULL
        """)


class Migration(migrations.Migration):
    dependencies = [
        ("proveedores", "0007_fix_subtipo_materia_to_json"),
    ]

    operations = [
        migrations.RunPython(convert_subtipo_to_json, reverse_conversion),
    ]
