"""
Rename app label: ejecucion -> infra_workflow_ejecucion.

Parte de la Fase 2.3 del refactor CT (workflow_engine -> infraestructura.workflow_engine).
Solo actualiza django_migrations y django_content_type para reflejar el nuevo
app_label. Los nombres físicos de las tablas se preservan (ya estaban con
prefijo 'workflow_exec_*' explícito en Meta.db_table de los modelos).
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations
SET app = 'infra_workflow_ejecucion'
WHERE app = 'ejecucion';

UPDATE django_content_type
SET app_label = 'infra_workflow_ejecucion'
WHERE app_label = 'ejecucion';
"""

REVERSE_SQL = """
UPDATE django_migrations
SET app = 'ejecucion'
WHERE app = 'infra_workflow_ejecucion';

UPDATE django_content_type
SET app_label = 'ejecucion'
WHERE app_label = 'infra_workflow_ejecucion';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_workflow_ejecucion", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
