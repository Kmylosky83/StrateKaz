"""
Normaliza el `state` de Django para reflejar `Meta.db_table` explícito en
los modelos (tras rename app_label catalogo_productos → infra_catalogo_productos
en Fase 2 del refactor H-S8-ct-disperso).

NO modifica la DB — las tablas físicas ya tienen los nombres correctos
(catalogo_productos_*). Solo actualiza el ProjectState para que el grafo
de migraciones quede consistente con el modelo declarado.

Sin esta migración, `makemigrations` detectaría diferencias entre el state
calculado (basado en app_label) y el `db_table` explícito del modelo, y
trataría de generar un rename de tablas que ya están bien nombradas.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("infra_catalogo_productos", "0025_rename_app_label_to_infra"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterModelTable(
                    name="categoriaproducto",
                    table="catalogo_productos_categoriaproducto",
                ),
                migrations.AlterModelTable(
                    name="producto",
                    table="catalogo_productos_producto",
                ),
                migrations.AlterModelTable(
                    name="productoespeccalidad",
                    table="catalogo_productos_productoespeccalidad",
                ),
                migrations.AlterModelTable(
                    name="productoespeccalidadparametro",
                    table="catalogo_productos_productoespeccalidadparametro",
                ),
                migrations.AlterModelTable(
                    name="unidadmedida",
                    table="catalogo_productos_unidadmedida",
                ),
            ],
        ),
    ]
