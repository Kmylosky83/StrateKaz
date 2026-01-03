# Generated migration to add 'empresa' TabSection to Configuración tab
from django.db import migrations, models


def add_empresa_section(apps, schema_editor):
    """
    Agrega la sección 'Datos de la Empresa' al tab Configuración
    con orden 0 (primera sección)
    """
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    # Buscar el tab 'configuracion' del módulo 'gestion_estrategica'
    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
    except ModuleTab.DoesNotExist:
        # El tab no existe aún, probablemente la migración 0008 no se ha corrido
        return

    # Verificar si ya existe la sección
    if TabSection.objects.filter(tab=tab_configuracion, code='empresa').exists():
        return

    # Mover las demás secciones para hacer espacio
    # Usar 'orden' ya que el campo fue renombrado de 'order' a 'orden'
    TabSection.objects.filter(tab=tab_configuracion).update(
        orden=models.F('orden') + 1
    )

    # Crear la nueva sección como primera (orden=1)
    TabSection.objects.create(
        tab=tab_configuracion,
        code='empresa',
        name='Datos de la Empresa',
        description='Configuración de datos fiscales, legales y regionales de la empresa',
        icon='Building2',
        orden=1,
        is_enabled=True,
        is_core=True
    )


def remove_empresa_section(apps, schema_editor):
    """Elimina la sección 'empresa' del tab Configuración"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
        TabSection.objects.filter(tab=tab_configuracion, code='empresa').delete()

        # Restaurar el orden de las demás secciones
        for i, section in enumerate(TabSection.objects.filter(tab=tab_configuracion).order_by('orden'), 1):
            section.orden = i
            section.save()
    except ModuleTab.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0001_initial'),
        ('core', '0008_populate_system_modules_tree'),
    ]

    operations = [
        migrations.RunPython(add_empresa_section, remove_empresa_section),
    ]
