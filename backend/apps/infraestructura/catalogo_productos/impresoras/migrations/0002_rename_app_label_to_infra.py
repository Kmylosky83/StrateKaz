"""
Rename app_label `impresoras` → `infra_impresoras`.

Forma parte de la Fase 2.2 del refactor CT (mover catalogo_productos al
paquete `apps.infraestructura/`). El movimiento del paquete y el cambio
del AppConfig.label requieren actualizar dos tablas de Django para que
los registros de migraciones aplicadas y los content_types apunten al
nuevo label.

NO toca tablas de datos: la `db_table` se preserva en `Meta.db_table`
explícito en el modelo. Esta migración es metadata-only.
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations SET app = 'infra_impresoras' WHERE app = 'impresoras';
UPDATE django_content_type SET app_label = 'infra_impresoras' WHERE app_label = 'impresoras';
"""

REVERSE_SQL = """
UPDATE django_migrations SET app = 'impresoras' WHERE app = 'infra_impresoras';
UPDATE django_content_type SET app_label = 'impresoras' WHERE app_label = 'infra_impresoras';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_impresoras", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
