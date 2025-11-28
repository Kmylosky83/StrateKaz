# Generated manually to fix subtipo_materia data

from django.db import migrations
import json


def fix_subtipo_materia_data(apps, schema_editor):
    """
    Convierte los valores de subtipo_materia de CharField a JSONField (lista)
    Usa SQL directo para evitar problemas con el modelo
    """
    with schema_editor.connection.cursor() as cursor:
        # Obtener todos los proveedores con su subtipo_materia actual
        cursor.execute(
            "SELECT id, subtipo_materia FROM proveedores_proveedor WHERE subtipo_materia IS NOT NULL AND subtipo_materia != ''"
        )
        rows = cursor.fetchall()

        for row in rows:
            proveedor_id, subtipo = row
            # Si subtipo no es JSON válido (es un string simple), convertir a lista JSON
            try:
                # Intentar parsear como JSON
                json.loads(subtipo)
            except (json.JSONDecodeError, TypeError):
                # No es JSON válido, convertir el string a lista JSON
                lista_json = json.dumps([subtipo])
                cursor.execute(
                    "UPDATE proveedores_proveedor SET subtipo_materia = %s WHERE id = %s",
                    [lista_json, proveedor_id]
                )

        # Establecer lista vacía para los que son NULL o vacíos
        cursor.execute(
            "UPDATE proveedores_proveedor SET subtipo_materia = '[]' WHERE subtipo_materia IS NULL OR subtipo_materia = ''"
        )


def reverse_fix_subtipo_materia_data(apps, schema_editor):
    """
    Reversión: convierte la lista al primer elemento
    """
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, subtipo_materia FROM proveedores_proveedor WHERE subtipo_materia IS NOT NULL"
        )
        rows = cursor.fetchall()

        for row in rows:
            proveedor_id, subtipo = row
            try:
                lista = json.loads(subtipo)
                if isinstance(lista, list) and len(lista) > 0:
                    cursor.execute(
                        "UPDATE proveedores_proveedor SET subtipo_materia = %s WHERE id = %s",
                        [lista[0], proveedor_id]
                    )
            except (json.JSONDecodeError, TypeError):
                pass  # Ya es un string, no hacer nada


class Migration(migrations.Migration):
    dependencies = [
        ("proveedores", "0002_alter_proveedor_departamento_and_more"),
    ]

    operations = [
        migrations.RunPython(
            fix_subtipo_materia_data,
            reverse_fix_subtipo_materia_data
        ),
    ]
