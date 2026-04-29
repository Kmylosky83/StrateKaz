"""
Renombrar app_label de 'gestion_documental' → 'infra_gestion_documental'.

Fase 2.1 (2026-04-28) — Refactor CT Unificación.

Esta migración actualiza las dos tablas internas de Django que referencian
el app_label antiguo, para reflejar el nuevo path apps.infraestructura.gestion_documental:

- django_migrations: cada fila tiene el app_label que aplicó la migración.
- django_content_type: cada modelo tiene su app_label asociado para
  GenericForeignKey y permisos.

NO toca ninguna tabla de datos. Los nombres físicos de las tablas
('documental_*') se preservan porque ya estaban explícitos en Meta.db_table
desde antes de este refactor.

Side effects:
- Permisos auto-creados (auth_permission) se actualizan transitivamente
  porque dependen de content_type_id. NO requiere SQL adicional.
- GenericForeignKey funciona porque ContentType ya está actualizado.
"""
from django.db import migrations


FORWARD_SQL = """
UPDATE django_migrations
SET app = 'infra_gestion_documental'
WHERE app = 'gestion_documental';

UPDATE django_content_type
SET app_label = 'infra_gestion_documental'
WHERE app_label = 'gestion_documental';
"""

REVERSE_SQL = """
UPDATE django_migrations
SET app = 'gestion_documental'
WHERE app = 'infra_gestion_documental';

UPDATE django_content_type
SET app_label = 'gestion_documental'
WHERE app_label = 'infra_gestion_documental';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("infra_gestion_documental", "0027_rename_doc_evt_doc_tipo_idx_documental__documen_0f49f2_idx_and_more"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
