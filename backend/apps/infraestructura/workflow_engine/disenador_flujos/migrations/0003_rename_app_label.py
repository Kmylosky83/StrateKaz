"""
Rename app label: disenador_flujos -> infra_disenador_flujos.

Parte de la Fase 2.3 del refactor CT (workflow_engine -> infraestructura.workflow_engine).
Solo actualiza django_migrations y django_content_type para reflejar el nuevo
app_label. Los nombres físicos de las tablas se preservan (ya estaban con
prefijo 'workflow_*' explícito en Meta.db_table de los modelos).
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations
SET app = 'infra_disenador_flujos'
WHERE app = 'disenador_flujos';

UPDATE django_content_type
SET app_label = 'infra_disenador_flujos'
WHERE app_label = 'disenador_flujos';
"""

REVERSE_SQL = """
UPDATE django_migrations
SET app = 'disenador_flujos'
WHERE app = 'infra_disenador_flujos';

UPDATE django_content_type
SET app_label = 'disenador_flujos'
WHERE app_label = 'infra_disenador_flujos';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_disenador_flujos", "0002_plantillaflujo_config_auto_generacion"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
