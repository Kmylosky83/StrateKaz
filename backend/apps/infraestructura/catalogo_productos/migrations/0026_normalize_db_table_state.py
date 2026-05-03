"""
Normaliza nombres físicos de tablas Y el `state` de Django para reflejar
`Meta.db_table` explícito tras rename app_label catalogo_productos →
infra_catalogo_productos (Fase 2 del refactor H-S8-ct-disperso).

DOS ESCENARIOS QUE COEXISTEN:

1. **VPS / DB existente pre-CT**: las tablas físicas ya tienen el nombre
   histórico (`catalogo_productos_*`) porque fueron creadas hace meses cuando
   el `app_label` era `catalogo_productos`. La SQL manual previa al deploy
   (UPDATE django_migrations.app) ya alineó el catálogo de migraciones.
   En este escenario, los `IF EXISTS old AND NOT EXISTS new` retornan FALSE
   y los RENAME no se ejecutan. Solo aplica el state update.

2. **DB fresca (CI / dev nuevo)**: las migraciones 0001-0024 corren con el
   `app_label` ya renombrado a `infra_catalogo_productos`. Django auto-genera
   nombres físicos `infra_catalogo_productos_*` (no respeta el `Meta.db_table`
   porque las migraciones no lo declaran en `options=`). En este escenario,
   los `IF EXISTS` retornan TRUE y los RENAME alinean los nombres físicos
   con `Meta.db_table` antes de que migraciones posteriores (0027) hagan
   `AlterField` que asume los nombres históricos.

El SQL es idempotente y schema-aware (usa `current_schema()` para multi-tenant
django-tenants).

REVERSE: noop intencional. La razón: el SQL forward es condicional (solo
ejecuta rename en fresh DB). El estado "se ejecutó forward" no queda
registrado en la DB de forma observable. Un reverse simétrico
(`IF EXISTS new AND NOT EXISTS old THEN RENAME back`) renombraría
incorrectamente las tablas históricas en VPS (donde forward fue no-op).
Si alguna vez se necesita rollback de esta migración en una DB fresca,
hay que ejecutar manualmente el rename inverso después de `migrate
--fake` hacia la versión anterior.

Sin esta migración, en DB fresca el step 4 del CI revienta con
`relation "catalogo_productos_producto" does not exist` (regresión H-S8-ct-disperso).
"""

from django.db import migrations


# Tabla por modelo: (table_default_post_rename, table_historica)
# Solo modelos cuya 0001-0024 NO declaró db_table en options=. Modelos posteriores
# (Proveedor, TipoProveedor en 0007) ya tienen db_table en su CreateModel options
# y nacen con el nombre histórico tanto en VPS como en fresh DB.
TABLES = [
    ("infra_catalogo_productos_categoriaproducto", "catalogo_productos_categoriaproducto"),
    ("infra_catalogo_productos_producto", "catalogo_productos_producto"),
    ("infra_catalogo_productos_productoespeccalidad", "catalogo_productos_productoespeccalidad"),
    (
        "infra_catalogo_productos_productoespeccalidadparametro",
        "catalogo_productos_productoespeccalidadparametro",
    ),
    ("infra_catalogo_productos_unidadmedida", "catalogo_productos_unidadmedida"),
]


def _build_rename_sql(pairs):
    """Genera DO $$ block PL/pgSQL idempotente para rename condicional."""
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
        ("infra_catalogo_productos", "0025_rename_app_label_to_infra"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(FORWARD_SQL, reverse_sql=migrations.RunSQL.noop),
            ],
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
