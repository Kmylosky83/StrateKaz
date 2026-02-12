"""
Data migration: Elimina las secciones 'cargos' y 'colaboradores' del tab 'organizacion'.

Estas secciones fueron migradas a Talento Humano en Sprint 13.
- 'cargos' -> TH > Estructura de Cargos
- 'colaboradores' -> TH > Colaboradores

Reversible: re-crea las secciones con sus datos originales.
"""
from django.db import migrations


def remove_legacy_sections(apps, schema_editor):
    """Eliminar secciones migradas a Talento Humano."""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        org_tab = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        return

    deleted_count, _ = TabSection.objects.filter(
        tab=org_tab,
        code__in=['cargos', 'colaboradores'],
    ).delete()

    if deleted_count:
        # Reordenar secciones restantes
        remaining = TabSection.objects.filter(tab=org_tab).order_by('orden')
        for i, section in enumerate(remaining, start=1):
            if section.orden != i:
                section.orden = i
                section.save(update_fields=['orden'])


def restore_legacy_sections(apps, schema_editor):
    """Re-crear secciones eliminadas (rollback)."""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        org_tab = ModuleTab.objects.get(code='organizacion')
    except ModuleTab.DoesNotExist:
        return

    # Mover secciones existentes para hacer espacio
    existing = TabSection.objects.filter(tab=org_tab).order_by('orden')
    for section in existing:
        if section.code == 'organigrama':
            section.orden = 3
        elif section.code == 'consecutivos':
            section.orden = 5
        elif section.code == 'unidades_medida':
            section.orden = 6
        section.save(update_fields=['orden'])

    # Re-crear cargos y colaboradores
    TabSection.objects.get_or_create(
        tab=org_tab,
        code='cargos',
        defaults={
            'name': 'Cargos',
            'icon': 'Briefcase',
            'orden': 2,
            'description': 'Puestos y niveles jerarquicos',
        },
    )
    TabSection.objects.get_or_create(
        tab=org_tab,
        code='colaboradores',
        defaults={
            'name': 'Colaboradores',
            'icon': 'Users',
            'orden': 4,
            'description': 'Gestion del equipo de trabajo',
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_migrate_funciones_competencias_structured'),
    ]

    operations = [
        migrations.RunPython(
            remove_legacy_sections,
            restore_legacy_sections,
        ),
    ]
