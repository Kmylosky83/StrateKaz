# Generated manually - Renombrar TabSection 'areas' de 'Áreas' a 'Procesos'
"""
La seccion 'areas' en el tab Organizacion se renombra a 'Procesos'
para alinearse con la terminologia de sistemas de gestion (ISO, Decreto 1072).

El codigo interno ('areas') y el modelo Area se mantienen sin cambios.
Solo se actualiza el nombre visible en la UI.
"""

from django.db import migrations


def rename_areas_to_procesos(apps, schema_editor):
    """Renombrar TabSection 'areas' a 'Procesos'"""
    TabSection = apps.get_model('core', 'TabSection')
    updated = TabSection.objects.filter(code='areas').update(
        name='Procesos',
        description='Mapa de procesos organizacionales'
    )
    if updated:
        print(f'  Renombrada(s) {updated} TabSection(s) code="areas" a name="Procesos"')


def revert_to_areas(apps, schema_editor):
    """Revertir a nombre original 'Áreas'"""
    TabSection = apps.get_model('core', 'TabSection')
    TabSection.objects.filter(code='areas').update(
        name='Áreas',
        description='Estructura organizacional jerárquica'
    )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_remove_branding_tab_section"),
    ]

    operations = [
        migrations.RunPython(
            rename_areas_to_procesos,
            revert_to_areas,
        ),
    ]
