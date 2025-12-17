# Generated migration to persist tipos-documento section
from django.db import migrations


def add_tipos_documento_section(apps, schema_editor):
    """
    Agrega la sección 'tipos-documento' al tab Organización.

    Esta sección fue creada manualmente en la BD pero faltaba la migración
    para persistirla en caso de recrear la base de datos.

    Datos de la sección:
    - code: 'tipos-documento'
    - name: 'Tipos de Documento'
    - description: 'Gestión de categorías y tipos de documento para consecutivos'
    - icon: 'FileText'
    - order: 6
    - is_enabled: True
    """
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_organizacion = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        # Si el tab no existe, no hacemos nada
        return

    # Usar get_or_create para ser idempotente
    TabSection.objects.get_or_create(
        tab=tab_organizacion,
        code='tipos-documento',
        defaults={
            'name': 'Tipos de Documento',
            'description': 'Gestión de categorías y tipos de documento para consecutivos',
            'icon': 'FileText',
            'order': 6,
            'is_enabled': True,
        }
    )


def reverse_tipos_documento(apps, schema_editor):
    """Elimina la sección tipos-documento"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_organizacion = ModuleTab.objects.get(code='organizacion')
        TabSection.objects.filter(
            tab=tab_organizacion,
            code='tipos-documento'
        ).delete()
    except ModuleTab.DoesNotExist:
        pass


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0020_add_user_roles_adicionales_field'),
    ]

    operations = [
        migrations.RunPython(add_tipos_documento_section, reverse_tipos_documento),
    ]
