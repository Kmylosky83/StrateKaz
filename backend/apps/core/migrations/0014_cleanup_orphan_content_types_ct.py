"""
Limpia filas huérfanas de `django_content_type` que quedaron tras el rename
de `app_label` en Fase 4 del refactor H-S8-ct-disperso.

CONTEXTO:
La migración 0012 + el SQL manual previo hicieron UPDATE de
`django_content_type.app_label` para los 7 paquetes movidos. Sin embargo,
django-tenants regenera ContentTypes para apps recién detectadas en cada
schema durante migrate (signal post_migrate llama a `update_contenttypes`).
Si una migración de rename ejecuta DESPUÉS de un signal que ya creó la fila
con el nuevo label, queda DUPLICADA con el viejo.

Ejemplo detectado en auditoría: en `tenant_demo.django_content_type`
existían a la vez:
- (app_label='gestion_documental',       model='documento')  ← huérfana, 0 permisos
- (app_label='infra_gestion_documental', model='documento')  ← activa

La huérfana no causa runtime errors (las FK al ContentType apuntan al ID
activo) pero ensucia el catálogo. Esta migración la borra de forma idempotente.

Reverso: no aplica (regenerar la huérfana sería romper la coherencia post-refactor).
"""

from django.db import migrations


FORWARD_SQL = """
DELETE FROM django_content_type
WHERE app_label IN (
    'gestion_documental',
    'catalogo_productos',
    'proveedores',
    'impresoras',
    'disenador_flujos',
    'ejecucion',
    'monitoreo',
    'firma_digital'
);
"""


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_rename_enabled_modules_ct"),
    ]

    operations = [
        # noop reverse: regenerar las huérfanas violaría la coherencia post-refactor
        migrations.RunSQL(FORWARD_SQL, reverse_sql=migrations.RunSQL.noop),
    ]
