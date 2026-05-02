"""
Actualiza `tenant_tenant.enabled_modules` (JSONB en public schema) reemplazando
los codes de los 3 módulos CT renombrados en migración 0012:

- gestion_documental → infra_gestion_documental
- catalogo_productos → infra_catalogo_productos
- workflow_engine → infra_workflow_engine

`tenant_tenant` vive en `public` schema (es modelo SHARED de django-tenants),
mientras que `core_system_module` vive en cada tenant schema. Por eso esta
migración necesita un schema_context('public') explícito en RunPython.

Sin esta migración, el sidebar no muestra los 3 módulos CT porque la lógica
de filtrado del sidebar interseca SystemModule.code (ya `infra_*`) contra
Tenant.enabled_modules (que aún tenía los codes viejos).

Reverse incluido — refactor 100% reversible.
"""

from django.db import migrations


def _replace_in_enabled_modules(connection, mappings):
    """Aplica array_replace en public.tenant_tenant.enabled_modules.

    `mappings` es lista de (viejo, nuevo). El UPDATE se aplica solo a tenants
    cuyo array contiene alguno de los codes viejos (idempotente).
    """
    old_codes = [old for old, _ in mappings]
    array_replace_chain = "ARRAY(SELECT jsonb_array_elements_text(enabled_modules))"
    for old, new in mappings:
        array_replace_chain = (
            f"array_replace({array_replace_chain}, '{old}', '{new}')"
        )

    with connection.cursor() as cursor:
        cursor.execute(
            "SET search_path TO public, pg_catalog;\n"
            f"UPDATE public.tenant_tenant SET enabled_modules = "
            f"to_jsonb({array_replace_chain}) "
            f"WHERE enabled_modules ?| array[{', '.join(repr(c) for c in old_codes)}];"
        )


def forward(apps, schema_editor):
    _replace_in_enabled_modules(
        schema_editor.connection,
        mappings=[
            ("gestion_documental", "infra_gestion_documental"),
            ("catalogo_productos", "infra_catalogo_productos"),
            ("workflow_engine", "infra_workflow_engine"),
        ],
    )


def reverse(apps, schema_editor):
    _replace_in_enabled_modules(
        schema_editor.connection,
        mappings=[
            ("infra_gestion_documental", "gestion_documental"),
            ("infra_catalogo_productos", "catalogo_productos"),
            ("infra_workflow_engine", "workflow_engine"),
        ],
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_rename_module_codes_ct"),
    ]

    operations = [
        migrations.RunPython(forward, reverse_code=reverse),
    ]
