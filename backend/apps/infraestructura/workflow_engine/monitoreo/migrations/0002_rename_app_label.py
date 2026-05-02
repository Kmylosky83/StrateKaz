"""
Rename app label: monitoreo -> infra_workflow_monitoreo.

Parte de la Fase 2.3 del refactor CT (workflow_engine -> infraestructura.workflow_engine).
Solo actualiza django_migrations y django_content_type para reflejar el nuevo
app_label. Los nombres físicos de las tablas se preservan (ya estaban con
prefijo 'workflow_*' explícito en Meta.db_table de los modelos).
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations
SET app = 'infra_workflow_monitoreo'
WHERE app = 'monitoreo';

UPDATE django_content_type
SET app_label = 'infra_workflow_monitoreo'
WHERE app_label = 'monitoreo';
"""

REVERSE_SQL = """
UPDATE django_migrations
SET app = 'monitoreo'
WHERE app = 'infra_workflow_monitoreo';

UPDATE django_content_type
SET app_label = 'monitoreo'
WHERE app_label = 'infra_workflow_monitoreo';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_workflow_monitoreo", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
