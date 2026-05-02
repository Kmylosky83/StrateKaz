"""
Rename app label: firma_digital -> infra_firma_digital.

Parte de la Fase 2.3 del refactor CT (workflow_engine -> infraestructura.workflow_engine).
Solo actualiza django_migrations y django_content_type para reflejar el nuevo
app_label. Los nombres físicos de las tablas se preservan (ya estaban con
prefijo 'workflow_*' explícito en Meta.db_table de los modelos).
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations
SET app = 'infra_firma_digital'
WHERE app = 'firma_digital';

UPDATE django_content_type
SET app_label = 'infra_firma_digital'
WHERE app_label = 'firma_digital';
"""

REVERSE_SQL = """
UPDATE django_migrations
SET app = 'firma_digital'
WHERE app = 'infra_firma_digital';

UPDATE django_content_type
SET app_label = 'firma_digital'
WHERE app_label = 'infra_firma_digital';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_firma_digital", "0008_reduce_rol_firma_choices"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
