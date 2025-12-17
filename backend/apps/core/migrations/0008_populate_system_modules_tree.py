# Generated migration for populating system modules structure
from django.db import migrations


def populate_modules(apps, schema_editor):
    """
    Puebla SystemModule, ModuleTab y TabSection con la estructura del sistema
    basada en frontend/src/layouts/Sidebar.tsx
    """
    SystemModule = apps.get_model('core', 'SystemModule')
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    # =========================================================================
    # NIVEL ESTRATEGICO
    # =========================================================================

    # Dirección Estratégica
    gestion_estrategica = SystemModule.objects.create(
        code='gestion_estrategica',
        name='Dirección Estratégica',
        description='Administra la identidad corporativa, planeación estratégica y configuración del sistema',
        category='ESTRATEGICO',
        icon='Target',
        color='purple',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=1
    )

    # Tabs de Dirección Estratégica
    tab_configuracion = ModuleTab.objects.create(
        module=gestion_estrategica,
        code='configuracion',
        name='Configuración',
        description='Parámetros base del tenant: branding, módulos, consecutivos',
        icon='Settings',
        is_core=True,
        is_enabled=True,
        order=1
    )

    # Secciones de Configuración
    TabSection.objects.bulk_create([
        TabSection(
            tab=tab_configuracion,
            code='branding',
            name='Branding',
            description='Configuración de marca: logo, colores, nombre',
            order=1,
            is_enabled=True
        ),
        TabSection(
            tab=tab_configuracion,
            code='modulos',
            name='Módulos y Features',
            description='Activación/desactivación de módulos del sistema',
            order=2,
            is_enabled=True
        ),
        TabSection(
            tab=tab_configuracion,
            code='consecutivos',
            name='Consecutivos',
            description='Configuración de numeración automática de documentos',
            order=3,
            is_enabled=True
        ),
    ])

    tab_organizacion = ModuleTab.objects.create(
        module=gestion_estrategica,
        code='organizacion',
        name='Organización',
        description='Estructura organizacional, cargos, roles y permisos (RBAC)',
        icon='Building2',
        is_core=True,
        is_enabled=True,
        order=2
    )

    tab_identidad = ModuleTab.objects.create(
        module=gestion_estrategica,
        code='identidad',
        name='Identidad Corporativa',
        description='Misión, visión, valores y política integral (ISO 4-5)',
        icon='Compass',
        is_core=True,
        is_enabled=True,
        order=3
    )

    # Secciones de Identidad
    TabSection.objects.bulk_create([
        TabSection(
            tab=tab_identidad,
            code='mision_vision',
            name='Misión y Visión',
            description='Declaraciones de misión y visión de la organización',
            order=1,
            is_enabled=True
        ),
        TabSection(
            tab=tab_identidad,
            code='valores',
            name='Valores Corporativos',
            description='Valores que guían el comportamiento de la organización',
            order=2,
            is_enabled=True
        ),
        TabSection(
            tab=tab_identidad,
            code='politica',
            name='Política Integral',
            description='Política integral del sistema de gestión',
            order=3,
            is_enabled=True
        ),
    ])

    tab_planeacion = ModuleTab.objects.create(
        module=gestion_estrategica,
        code='planeacion',
        name='Planeación Estratégica',
        description='Plan estratégico, objetivos BSC y mapa estratégico (ISO 6)',
        icon='Target',
        is_core=True,
        is_enabled=True,
        order=4
    )

    # Usuarios
    usuarios = SystemModule.objects.create(
        code='usuarios',
        name='Usuarios',
        description='Gestión de usuarios del sistema',
        category='ESTRATEGICO',
        icon='UserCog',
        color='purple',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=2
    )

    # =========================================================================
    # GESTION MISIONAL
    # =========================================================================

    # Proveedores
    proveedores = SystemModule.objects.create(
        code='proveedores',
        name='Proveedores',
        description='Gestión de proveedores de materia prima y productos/servicios',
        category='MISIONAL',
        icon='Users',
        color='blue',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=3
    )

    # Tabs de Proveedores
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=proveedores,
            code='materia_prima',
            name='Materia Prima',
            description='Proveedores de materia prima (aceites vegetales usados)',
            icon='Factory',
            is_core=True,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=proveedores,
            code='productos_servicios',
            name='Productos y Servicios',
            description='Proveedores de productos y servicios para la operación',
            icon='Wrench',
            is_core=True,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=proveedores,
            code='pruebas_acidez',
            name='Pruebas de Acidez',
            description='Registro y seguimiento de pruebas de acidez de materia prima',
            icon='FlaskConical',
            is_core=True,
            is_enabled=True,
            order=3
        ),
    ])

    # EcoNorte (submódulo que puede desactivarse)
    econorte = SystemModule.objects.create(
        code='econorte',
        name='EcoNorte',
        description='Gestión de recolección de aceite vegetal usado con ecoaliados',
        category='MISIONAL',
        icon='Leaf',
        color='green',
        is_core=False,
        is_enabled=True,
        requires_license=False,
        order=4
    )

    # Tabs de EcoNorte
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=econorte,
            code='ecoaliados',
            name='Ecoaliados',
            description='Gestión de ecoaliados (proveedores internos de AVU)',
            icon='Users',
            is_core=False,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=econorte,
            code='programaciones',
            name='Programaciones',
            description='Programación de recolecciones con ecoaliados',
            icon='Calendar',
            is_core=False,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=econorte,
            code='recolecciones',
            name='Recolecciones',
            description='Registro y seguimiento de recolecciones realizadas',
            icon='Truck',
            is_core=False,
            is_enabled=True,
            order=3
        ),
    ])

    # Planta
    planta = SystemModule.objects.create(
        code='planta',
        name='Planta',
        description='Operaciones de procesamiento en planta',
        category='MISIONAL',
        icon='Factory',
        color='blue',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=5
    )

    # Tabs de Planta
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=planta,
            code='recepciones',
            name='Recepción MP',
            description='Recepción y registro de materia prima en planta',
            icon='Truck',
            is_core=True,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=planta,
            code='lotes',
            name='Lotes',
            description='Gestión de lotes de producción',
            icon='Package',
            is_core=True,
            is_enabled=True,
            order=2
        ),
    ])

    # Reportes
    reportes = SystemModule.objects.create(
        code='reportes',
        name='Reportes',
        description='Generación de reportes del sistema',
        category='MISIONAL',
        icon='BarChart3',
        color='blue',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=6
    )

    # =========================================================================
    # MOTOR DE OPERACIONES
    # =========================================================================

    motor_operaciones = SystemModule.objects.create(
        code='motor_operaciones',
        name='Motor de Operaciones',
        description='Gestiona la operación core del negocio',
        category='MOTOR',
        icon='Cog',
        color='blue',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=7
    )

    # Tabs de Motor de Operaciones
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=motor_operaciones,
            code='abastecimiento',
            name='Cadena de Abastecimiento',
            description='Gestión de proveedores, recolecciones y materia prima',
            icon='Truck',
            is_core=True,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=motor_operaciones,
            code='planta_motor',
            name='Planta',
            description='Recepciones, procesamiento de lotes y control de calidad',
            icon='Factory',
            is_core=True,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=motor_operaciones,
            code='comercializacion',
            name='Comercialización',
            description='Gestión de clientes, ventas y facturación',
            icon='ShoppingCart',
            is_core=True,
            is_enabled=True,
            order=3
        ),
    ])

    # =========================================================================
    # GESTION INTEGRAL (SST, ISO, PESV)
    # =========================================================================

    gestion_integral = SystemModule.objects.create(
        code='gestion_integral',
        name='Gestión Integral',
        description='Sistemas de gestión: SST, Calidad, Ambiental, PESV',
        category='INTEGRAL',
        icon='ShieldCheck',
        color='orange',
        is_core=False,
        is_enabled=True,
        requires_license=False,
        order=8
    )

    # Tabs de Gestión Integral
    tab_sst = ModuleTab.objects.create(
        module=gestion_integral,
        code='sst',
        name='SST',
        description='Sistema de Gestión de Seguridad y Salud en el Trabajo',
        icon='ShieldCheck',
        is_core=False,
        is_enabled=True,
        order=1
    )

    # Secciones de SST (ciclo PHVA)
    TabSection.objects.bulk_create([
        TabSection(
            tab=tab_sst,
            code='recursos',
            name='Recursos',
            description='Administración de recursos humanos, técnicos y financieros',
            icon='Users',
            order=1,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='gestion_integral_sst',
            name='Gestión Integral',
            description='Política, objetivos, plan de trabajo anual',
            icon='FileCheck',
            order=2,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='gestion_salud',
            name='Gestión de la Salud',
            description='Condiciones de salud, perfiles sociodemográficos',
            icon='Heart',
            order=3,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='peligros_riesgos',
            name='Peligros y Riesgos',
            description='Matriz de peligros, evaluación de riesgos (GTC-45)',
            icon='AlertTriangle',
            order=4,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='amenazas',
            name='Amenazas',
            description='Identificación de amenazas y planes de respuesta',
            icon='Shield',
            order=5,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='verificacion',
            name='Verificación',
            description='Indicadores, auditorías internas',
            icon='CheckSquare',
            order=6,
            is_enabled=True
        ),
        TabSection(
            tab=tab_sst,
            code='mejoramiento',
            name='Mejoramiento',
            description='Acciones correctivas, preventivas y de mejora',
            icon='TrendingUp',
            order=7,
            is_enabled=True
        ),
    ])

    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=gestion_integral,
            code='pesv',
            name='PESV',
            description='Plan Estratégico de Seguridad Vial',
            icon='Car',
            is_core=False,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=gestion_integral,
            code='calidad',
            name='Calidad',
            description='Sistema de Gestión de Calidad (ISO 9001)',
            icon='Award',
            is_core=False,
            is_enabled=True,
            order=3
        ),
        ModuleTab(
            module=gestion_integral,
            code='ambiental',
            name='Ambiental',
            description='Sistema de Gestión Ambiental (ISO 14001)',
            icon='Leaf',
            is_core=False,
            is_enabled=True,
            order=4
        ),
    ])

    # =========================================================================
    # CADENA DE VALOR
    # =========================================================================

    cadena_valor = SystemModule.objects.create(
        code='cadena_valor',
        name='Cadena de Valor',
        description='Trazabilidad, calidad, certificaciones y logística',
        category='MISIONAL',
        icon='GitBranch',
        color='blue',
        is_core=False,
        is_enabled=True,
        requires_license=False,
        order=9
    )

    # Tabs de Cadena de Valor
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=cadena_valor,
            code='trazabilidad',
            name='Trazabilidad',
            description='Seguimiento de materia prima desde origen hasta producto final',
            icon='Link',
            is_core=False,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=cadena_valor,
            code='calidad_cv',
            name='Calidad',
            description='Control de calidad en toda la cadena de valor',
            icon='Award',
            is_core=False,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=cadena_valor,
            code='certificaciones',
            name='Certificaciones',
            description='Gestión de certificaciones y estándares de calidad',
            icon='BadgeCheck',
            is_core=False,
            is_enabled=True,
            order=3
        ),
        ModuleTab(
            module=cadena_valor,
            code='logistica',
            name='Logística',
            description='Gestión logística y distribución',
            icon='Truck',
            is_core=False,
            is_enabled=True,
            order=4
        ),
    ])

    # =========================================================================
    # PROCESOS DE APOYO
    # =========================================================================

    procesos_apoyo = SystemModule.objects.create(
        code='procesos_apoyo',
        name='Procesos de Apoyo',
        description='Talento humano, financiero, tecnología y jurídico',
        category='APOYO',
        icon='DollarSign',
        color='green',
        is_core=True,
        is_enabled=True,
        requires_license=False,
        order=10
    )

    # Tabs de Procesos de Apoyo
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=procesos_apoyo,
            code='talento_humano',
            name='Talento Humano',
            description='Gestión de recursos humanos, nómina y desarrollo',
            icon='Users',
            is_core=True,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=procesos_apoyo,
            code='financiero',
            name='Financiero',
            description='Contabilidad, finanzas y presupuesto',
            icon='DollarSign',
            is_core=True,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=procesos_apoyo,
            code='tecnologia',
            name='Tecnología',
            description='Infraestructura tecnológica y soporte',
            icon='Monitor',
            is_core=True,
            is_enabled=True,
            order=3
        ),
        ModuleTab(
            module=procesos_apoyo,
            code='juridico',
            name='Jurídico',
            description='Gestión legal y cumplimiento normativo',
            icon='Scale',
            is_core=True,
            is_enabled=True,
            order=4
        ),
    ])

    # =========================================================================
    # INTELIGENCIA DE NEGOCIOS
    # =========================================================================

    inteligencia = SystemModule.objects.create(
        code='inteligencia',
        name='Inteligencia de Negocios',
        description='Dashboards, reportes, analytics y data warehouse',
        category='INTELIGENCIA',
        icon='PieChart',
        color='purple',
        is_core=False,
        is_enabled=True,
        requires_license=False,
        order=11
    )

    # Tabs de Inteligencia de Negocios
    ModuleTab.objects.bulk_create([
        ModuleTab(
            module=inteligencia,
            code='dashboards',
            name='Dashboards',
            description='Tableros de control con indicadores clave',
            icon='LayoutDashboard',
            is_core=False,
            is_enabled=True,
            order=1
        ),
        ModuleTab(
            module=inteligencia,
            code='reportes_bi',
            name='Reportes',
            description='Generación de reportes avanzados',
            icon='FileText',
            is_core=False,
            is_enabled=True,
            order=2
        ),
        ModuleTab(
            module=inteligencia,
            code='analytics',
            name='Analytics',
            description='Análisis avanzado de datos y tendencias',
            icon='TrendingUp',
            is_core=False,
            is_enabled=True,
            order=3
        ),
        ModuleTab(
            module=inteligencia,
            code='data_warehouse',
            name='Data Warehouse',
            description='Almacén de datos para análisis histórico',
            icon='Database',
            is_core=False,
            is_enabled=True,
            order=4
        ),
    ])


def reverse_populate(apps, schema_editor):
    """Elimina todos los datos creados"""
    SystemModule = apps.get_model('core', 'SystemModule')
    SystemModule.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0007_add_module_tab_section_models'),
    ]

    operations = [
        migrations.RunPython(populate_modules, reverse_populate),
    ]
