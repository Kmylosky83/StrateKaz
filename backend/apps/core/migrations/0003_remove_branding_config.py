# Generated manually - Eliminación de BrandingConfig

"""
Esta migración elimina la tabla core_branding_config.

El branding ahora se gestiona en el modelo Tenant (apps.tenant.models.Tenant).
Los datos fueron migrados previamente mediante tenant.migrations.0002_add_schema_status_fields
que añade los campos de branding al modelo Tenant.

IMPORTANTE: Esta migración debe ejecutarse después de que los datos hayan sido
migrados al modelo Tenant.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_initial"),
        # Asegurar que la migración de Tenant que añade campos de branding se ejecutó primero
        ("tenant", "0002_add_schema_status_fields"),
    ]

    operations = [
        # Eliminar la tabla de BrandingConfig
        migrations.DeleteModel(
            name="BrandingConfig",
        ),
    ]
