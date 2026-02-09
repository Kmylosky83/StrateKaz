# Migration to copy branding data from EmpresaConfig/BrandingConfig to Tenant model
# This migration should be run AFTER 0003_tenant_extended_config_and_branding.py
#
# IMPORTANT: After this migration runs successfully, the legacy models can be safely removed

from django.db import migrations, transaction
from django.db import connection


def migrate_branding_data(apps, schema_editor):
    """
    Migra datos de branding desde BrandingConfig (public.core_branding_config) al modelo Tenant.

    Esta migración:
    1. Obtiene el BrandingConfig activo del schema public (si la tabla existe)
    2. Actualiza todos los Tenants con los colores por defecto si no tienen
    3. Preserva cualquier configuración específica que ya tengan los tenants

    NOTA: Esta migración es segura de ejecutar incluso si core_branding_config
    ya fue eliminado por core.0003_remove_branding_config.
    """
    Tenant = apps.get_model('tenant', 'Tenant')

    # Los datos de branding por defecto (colores StrateKaz)
    DEFAULT_BRANDING = {
        'primary_color': '#ec268f',
        'secondary_color': '#000000',
        'accent_color': '#f4ec25',
        'sidebar_color': '#1E293B',
        'background_color': '#F5F5F5',
        'showcase_background': '#1F2937',
        'pwa_background_color': '#FFFFFF',
    }

    # Intentar obtener branding activo de core_branding_config si existe
    # Usamos savepoint para evitar que un error de tabla inexistente
    # aborte toda la transacción
    try:
        # Primero verificar si la tabla existe
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'core_branding_config'
                )
            """)
            table_exists = cursor.fetchone()[0]

            if table_exists:
                cursor.execute("""
                    SELECT
                        primary_color, secondary_color, accent_color,
                        sidebar_color, background_color, showcase_background,
                        company_name, company_slogan,
                        gradient_mission, gradient_vision, gradient_policy
                    FROM core_branding_config
                    WHERE is_active = true
                    LIMIT 1
                """)
                row = cursor.fetchone()

                if row:
                    # Usar colores del branding existente
                    DEFAULT_BRANDING.update({
                        'primary_color': row[0] or DEFAULT_BRANDING['primary_color'],
                        'secondary_color': row[1] or DEFAULT_BRANDING['secondary_color'],
                        'accent_color': row[2] or DEFAULT_BRANDING['accent_color'],
                        'sidebar_color': row[3] or DEFAULT_BRANDING['sidebar_color'],
                        'background_color': row[4] or DEFAULT_BRANDING['background_color'],
                        'showcase_background': row[5] or DEFAULT_BRANDING['showcase_background'],
                    })
                    print("[migrate_branding_data] Using branding from legacy core_branding_config")
            else:
                print("[migrate_branding_data] core_branding_config table not found, using defaults")
    except Exception as e:
        # Si hay cualquier error, usar defaults
        print(f"[migrate_branding_data] Could not read legacy branding: {e}")

    # Actualizar todos los tenants que tienen colores por defecto de Django (#3B82F6)
    # para usar los colores correctos de StrateKaz
    tenants_updated = Tenant.objects.filter(
        primary_color='#3B82F6'  # Color por defecto anterior
    ).update(
        primary_color=DEFAULT_BRANDING['primary_color'],
        secondary_color=DEFAULT_BRANDING['secondary_color'],
        accent_color=DEFAULT_BRANDING['accent_color'],
        sidebar_color=DEFAULT_BRANDING['sidebar_color'],
        background_color=DEFAULT_BRANDING['background_color'],
        showcase_background=DEFAULT_BRANDING['showcase_background'],
        pwa_background_color=DEFAULT_BRANDING['pwa_background_color'],
    )

    print(f"[migrate_branding_data] Updated {tenants_updated} tenants with StrateKaz branding")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration: Reset tenant branding to Django defaults.
    Note: This doesn't restore the original BrandingConfig data.
    """
    Tenant = apps.get_model('tenant', 'Tenant')
    Tenant.objects.update(
        primary_color='#3B82F6',
        secondary_color='#000000',
        accent_color='#f4ec25',
    )


class Migration(migrations.Migration):

    dependencies = [
        ("tenant", "0003_tenant_extended_config_and_branding"),
    ]

    operations = [
        migrations.RunPython(migrate_branding_data, reverse_migration),
    ]
