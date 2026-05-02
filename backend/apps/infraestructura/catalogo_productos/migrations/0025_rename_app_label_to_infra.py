"""
Rename app_label `catalogo_productos` → `infra_catalogo_productos`.

Forma parte de la Fase 2.2 del refactor CT (mover catalogo_productos al
paquete `apps.infraestructura/`). El movimiento del paquete y el cambio
del AppConfig.label requieren actualizar dos tablas de Django para que
los registros de migraciones aplicadas y los content_types apunten al
nuevo label.

NO toca tablas de datos: las `db_table` se preservan en `Meta.db_table`
explícito en cada modelo. Esta migración es metadata-only.
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations SET app = 'infra_catalogo_productos' WHERE app = 'catalogo_productos';
UPDATE django_content_type SET app_label = 'infra_catalogo_productos' WHERE app_label = 'catalogo_productos';
"""

REVERSE_SQL = """
UPDATE django_migrations SET app = 'catalogo_productos' WHERE app = 'infra_catalogo_productos';
UPDATE django_content_type SET app_label = 'catalogo_productos' WHERE app_label = 'infra_catalogo_productos';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_catalogo_productos", "0024_proveedor_drop_ruta_origen"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
