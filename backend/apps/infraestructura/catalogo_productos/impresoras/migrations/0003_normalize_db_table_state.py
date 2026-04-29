"""
Normaliza el `state` de Django para reflejar `Meta.db_table` explícito tras
rename app_label impresoras → infra_impresoras (Fase 2 H-S8-ct-disperso).

NO modifica la DB — la tabla `impresoras_impresoratermica` ya tiene el
nombre correcto. Solo actualiza el ProjectState.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("infra_impresoras", "0002_rename_app_label_to_infra"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterModelTable(
                    name="impresoratermica",
                    table="impresoras_impresoratermica",
                ),
            ],
        ),
    ]
