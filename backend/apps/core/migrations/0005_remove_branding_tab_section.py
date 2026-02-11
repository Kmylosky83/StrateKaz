# Generated manually - Eliminacion de TabSection 'branding' de Configuracion
"""
La seccion 'branding' en el tab Configuracion es redundante porque
toda la funcionalidad de branding ya esta disponible en la seccion 'empresa'
(dentro de EmpresaSection: logos, colores, slogan).

Esta migracion elimina la TabSection con code='branding' para que
no aparezca mas en el sidebar de Configuracion.
"""

from django.db import migrations


def remove_branding_section(apps, schema_editor):
    """Eliminar TabSection con code='branding'"""
    TabSection = apps.get_model('core', 'TabSection')
    deleted_count, _ = TabSection.objects.filter(code='branding').delete()
    if deleted_count:
        print(f'  Eliminada(s) {deleted_count} TabSection(s) con code="branding"')


def restore_branding_section(apps, schema_editor):
    """Restaurar TabSection branding (reverse)"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    # Buscar el tab 'configuracion' para re-asociar
    config_tab = ModuleTab.objects.filter(code='configuracion').first()
    if config_tab:
        TabSection.objects.get_or_create(
            code='branding',
            defaults={
                'tab': config_tab,
                'name': 'Branding',
                'icon': 'Palette',
                'orden': 4,
                'description': 'Identidad visual y colores',
                'is_enabled': True,
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_standardize_categories_english"),
    ]

    operations = [
        migrations.RunPython(
            remove_branding_section,
            restore_branding_section,
        ),
    ]
