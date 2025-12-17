# Generated migration to update organizacion tab sections
from django.db import migrations


def update_organization_sections(apps, schema_editor):
    """
    Actualiza las secciones del tab Organización:
    1. Cambia icono de organigrama de Sitemap a Network
    2. Actualiza las secciones para reflejar la estructura actual:
       - areas: Áreas (order=1)
       - cargos: Cargos (order=2)
       - organigrama: Organigrama (order=3)
       - roles: Roles (order=4)
       - consecutivos: Consecutivos (order=5)
    """
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_organizacion = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        return

    # Actualizar o crear secciones con el orden correcto
    sections_config = [
        {
            'code': 'areas',
            'name': 'Áreas',
            'description': 'Gestión de áreas y departamentos de la organización',
            'icon': 'Building2',
            'order': 1,
        },
        {
            'code': 'cargos',
            'name': 'Cargos',
            'description': 'Gestión de cargos con manual de funciones y requisitos SST',
            'icon': 'UserCog',
            'order': 2,
        },
        {
            'code': 'organigrama',
            'name': 'Organigrama',
            'description': 'Estructura organizacional visual interactiva',
            'icon': 'Network',  # Cambiado de Sitemap a Network
            'order': 3,
        },
        {
            'code': 'roles',
            'name': 'Roles',
            'description': 'Gestión de roles y permisos del sistema RBAC',
            'icon': 'ShieldCheck',
            'order': 4,
        },
        {
            'code': 'consecutivos',
            'name': 'Consecutivos',
            'description': 'Configuración de numeración automática de documentos',
            'icon': 'Hash',
            'order': 5,
        },
    ]

    # Eliminar sección obsoleta cargos_roles si existe
    TabSection.objects.filter(tab=tab_organizacion, code='cargos_roles').delete()

    for config in sections_config:
        TabSection.objects.update_or_create(
            tab=tab_organizacion,
            code=config['code'],
            defaults={
                'name': config['name'],
                'description': config['description'],
                'icon': config['icon'],
                'order': config['order'],
                'is_enabled': True,
            }
        )


def reverse_update(apps, schema_editor):
    """Revierte los cambios - restaura estructura anterior"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_organizacion = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        return

    # Restaurar icono anterior de organigrama
    TabSection.objects.filter(
        tab=tab_organizacion,
        code='organigrama'
    ).update(icon='Sitemap')

    # Eliminar secciones nuevas
    TabSection.objects.filter(
        tab=tab_organizacion,
        code__in=['cargos', 'roles', 'consecutivos']
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0016_add_requisitos_profesionales'),
    ]

    operations = [
        migrations.RunPython(update_organization_sections, reverse_update),
    ]
