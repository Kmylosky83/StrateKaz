# Generated migration for adding missing TabSections to Dirección Estratégica
from django.db import migrations


def add_missing_sections(apps, schema_editor):
    """
    Agrega las TabSections faltantes para Dirección Estratégica

    Secciones a agregar:
    - Organización: organigrama, areas, cargos_roles
    - Identidad: politicas
    - Planeación: mapa_estrategico, objetivos_bsc
    """
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    # Obtener tabs existentes
    tab_organizacion = ModuleTab.objects.get(code='organizacion')
    tab_identidad = ModuleTab.objects.get(code='identidad')
    tab_planeacion = ModuleTab.objects.get(code='planeacion')

    # =========================================================================
    # SECCIONES DE ORGANIZACIÓN (3 nuevas)
    # =========================================================================
    TabSection.objects.bulk_create([
        TabSection(
            tab=tab_organizacion,
            code='organigrama',
            name='Organigrama',
            description='Estructura organizacional jerárquica de la empresa',
            icon='Sitemap',
            order=1,
            is_enabled=True
        ),
        TabSection(
            tab=tab_organizacion,
            code='areas',
            name='Áreas y Departamentos',
            description='Gestión de áreas, departamentos y centros de costo',
            icon='Building2',
            order=2,
            is_enabled=True
        ),
        TabSection(
            tab=tab_organizacion,
            code='cargos_roles',
            name='Cargos y Roles',
            description='Definición de cargos, roles y permisos del sistema RBAC',
            icon='UserCog',
            order=3,
            is_enabled=True
        ),
    ])

    # =========================================================================
    # SECCIÓN ADICIONAL DE IDENTIDAD (1 nueva)
    # =========================================================================
    TabSection.objects.create(
        tab=tab_identidad,
        code='politicas',
        name='Políticas Específicas',
        description='Políticas por sistema de gestión y procesos organizacionales',
        icon='FileText',
        order=4,
        is_enabled=True
    )

    # =========================================================================
    # SECCIONES DE PLANEACIÓN ESTRATÉGICA (2 nuevas)
    # =========================================================================
    TabSection.objects.bulk_create([
        TabSection(
            tab=tab_planeacion,
            code='mapa_estrategico',
            name='Mapa Estratégico',
            description='Mapa estratégico con perspectivas del Balanced Scorecard',
            icon='Map',
            order=1,
            is_enabled=True
        ),
        TabSection(
            tab=tab_planeacion,
            code='objetivos_bsc',
            name='Objetivos BSC',
            description='Objetivos estratégicos por perspectiva del Balanced Scorecard con vinculación ISO',
            icon='Target',
            order=2,
            is_enabled=True
        ),
    ])


def reverse_add_sections(apps, schema_editor):
    """Elimina las secciones agregadas por esta migración"""
    TabSection = apps.get_model('core', 'TabSection')

    codes_to_remove = [
        # Organización
        'organigrama',
        'areas',
        'cargos_roles',
        # Identidad
        'politicas',
        # Planeación
        'mapa_estrategico',
        'objetivos_bsc'
    ]

    TabSection.objects.filter(code__in=codes_to_remove).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0008_populate_system_modules_tree'),
    ]

    operations = [
        migrations.RunPython(add_missing_sections, reverse_add_sections),
    ]
