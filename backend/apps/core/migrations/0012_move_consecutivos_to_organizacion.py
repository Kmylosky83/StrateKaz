# Generated migration for moving consecutivos section to organizacion tab
from django.db import migrations


def move_consecutivos_section(apps, schema_editor):
    """
    Mueve la sección 'consecutivos' del tab 'configuracion' al tab 'organizacion'.

    Esta migración es parte de la refactorización que mueve la lógica de
    consecutivos al módulo de organización donde tiene más sentido conceptualmente
    (los consecutivos dependen de las áreas/departamentos).
    """
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    # Obtener los tabs
    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
        tab_organizacion = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        # Si no existen los tabs, no hacer nada
        return

    # Buscar la sección consecutivos en configuracion
    try:
        seccion_consecutivos = TabSection.objects.get(
            tab=tab_configuracion,
            code='consecutivos'
        )

        # Mover al tab organizacion
        seccion_consecutivos.tab = tab_organizacion
        seccion_consecutivos.order = 4  # Después de cargos_roles (order=3)
        seccion_consecutivos.description = 'Configuración de numeración automática de documentos'
        seccion_consecutivos.icon = 'Hash'
        seccion_consecutivos.save()

        print(f"  ✓ Sección 'consecutivos' movida de 'configuracion' a 'organizacion'")

    except TabSection.DoesNotExist:
        # Si no existe, crearla en organizacion
        TabSection.objects.create(
            tab=tab_organizacion,
            code='consecutivos',
            name='Consecutivos',
            description='Configuración de numeración automática de documentos',
            icon='Hash',
            order=4,
            is_enabled=True
        )
        print(f"  ✓ Sección 'consecutivos' creada en 'organizacion'")


def reverse_move_consecutivos(apps, schema_editor):
    """Revierte el movimiento de la sección consecutivos"""
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
        tab_organizacion = ModuleTab.objects.get(code='organizacion')

        seccion_consecutivos = TabSection.objects.get(
            tab=tab_organizacion,
            code='consecutivos'
        )

        # Mover de vuelta a configuracion
        seccion_consecutivos.tab = tab_configuracion
        seccion_consecutivos.order = 5  # Original order
        seccion_consecutivos.save()

    except (ModuleTab.DoesNotExist, TabSection.DoesNotExist):
        pass


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0011_populate_initial_consecutivos'),
    ]

    operations = [
        migrations.RunPython(move_consecutivos_section, reverse_move_consecutivos),
    ]
