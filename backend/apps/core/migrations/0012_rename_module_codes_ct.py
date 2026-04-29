"""
Renombra los `code` de SystemModule de los 3 paquetes movidos a CT (Capa Transversal)
para coherencia con el refactor H-S8-ct-disperso (Opción B — limpieza total).

Antes:
- gestion_documental, catalogo_productos, workflow_engine
- También sistema_gestion (alias legacy)

Después:
- infra_gestion_documental, infra_catalogo_productos, infra_workflow_engine

Las relaciones (Tabs, Permisos, Cargo×Module, etc.) están conectadas por FK al
ID del SystemModule, NO por el campo `code`. Por eso este UPDATE es seguro:
los permisos y datos asociados se preservan intactos.

Reverse incluido — refactor 100% reversible.
"""

from django.db import migrations


FORWARD_SQL = """
UPDATE core_system_module SET code = 'infra_gestion_documental' WHERE code = 'gestion_documental';
UPDATE core_system_module SET code = 'infra_catalogo_productos' WHERE code = 'catalogo_productos';
UPDATE core_system_module SET code = 'infra_workflow_engine' WHERE code = 'workflow_engine';
-- Alias legacy 'sistema_gestion' apuntaba al mismo concepto que gestion_documental.
-- Si ambos coexisten en el tenant, esta línea es no-op (no encontrará 'sistema_gestion'
-- porque ya quedó como gestion_documental). Si queda algún tenant viejo, lo cubrimos:
UPDATE core_system_module SET code = 'infra_gestion_documental' WHERE code = 'sistema_gestion';

-- Tenant.enabled_modules (JSONField o ArrayField — depende implementación). Si tienen
-- los codes viejos en la lista, hay que reemplazarlos.
-- public.tenant_tenant.enabled_modules: usa array_replace si es ArrayField, o jsonb_set si es JSONB.
-- Verificar tipo y aplicar — por seguridad, lo dejamos a un management command separado
-- (los tenants viven en public schema, esta migración corre per-tenant).
"""

REVERSE_SQL = """
UPDATE core_system_module SET code = 'gestion_documental' WHERE code = 'infra_gestion_documental';
UPDATE core_system_module SET code = 'catalogo_productos' WHERE code = 'infra_catalogo_productos';
UPDATE core_system_module SET code = 'workflow_engine' WHERE code = 'infra_workflow_engine';
"""


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0011_add_orden_to_cargo"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
