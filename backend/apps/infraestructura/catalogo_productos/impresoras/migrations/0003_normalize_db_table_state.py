"""
Normaliza nombre físico de tabla Y el `state` de Django tras rename app_label
impresoras → infra_impresoras (Fase 2 H-S8-ct-disperso).

Mismo patrón que `infra_catalogo_productos.0026_normalize_db_table_state`:
en VPS las tablas ya tienen el nombre histórico (no-op); en DB fresca el
RENAME alinea el nombre físico con `Meta.db_table` antes de que migraciones
posteriores asuman los nombres históricos.

Schema-aware (usa `current_schema()` para multi-tenant django-tenants).
REVERSE: noop intencional (ver razonamiento en 0026 sister-migration).
"""

from django.db import migrations


TABLES = [
    ("infra_impresoras_impresoratermica", "impresoras_impresoratermica"),
]


def _build_rename_sql(pairs):
    statements = []
    for old_name, new_name in pairs:
        statements.append(
            f"""
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = current_schema() AND table_name = '{old_name}')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                       WHERE table_schema = current_schema() AND table_name = '{new_name}') THEN
        EXECUTE 'ALTER TABLE ' || quote_ident('{old_name}') || ' RENAME TO ' || quote_ident('{new_name}');
    END IF;"""
        )
    return "DO $$\nBEGIN" + "".join(statements) + "\nEND $$;"


FORWARD_SQL = _build_rename_sql(TABLES)


class Migration(migrations.Migration):

    dependencies = [
        ("infra_impresoras", "0002_rename_app_label_to_infra"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(FORWARD_SQL, reverse_sql=migrations.RunSQL.noop),
            ],
            state_operations=[
                migrations.AlterModelTable(
                    name="impresoratermica",
                    table="impresoras_impresoratermica",
                ),
            ],
        ),
    ]
