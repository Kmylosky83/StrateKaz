"""
Management command MAESTRO para configurar TODOS los 14 módulos del ERP StrateKaz
según la Estructura Final 22 (validada 2025-12-22)

ORDEN DEFINITIVO:
    10. Direccion Estrategica
    20. Cumplimiento Normativo
    21. Motor de Riesgos
    22. Flujos de Trabajo
    30. Gestion Integral
    40. Cadena de Suministro
    41. Base de Operaciones
    42. Logistica y Flota
    43. Ventas y CRM
    50. Centro de Talento
    51. Administracion y Financiero
    52. Contabilidad
    60. Inteligencia de Negocios
    61. Sistema de Auditorias

Uso:
    docker exec -it backend python manage.py seed_estructura_final
"""
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab


class Command(BaseCommand):
    help = 'Configura los 14 módulos del ERP según Estructura Final 22'

    def handle(self, *args, **options):
        self.stdout.write('=' * 80)
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  SEED ESTRUCTURA FINAL - ERP STRATEKAZ'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  14 Módulos | 81 Tabs | 6 Niveles'
        ))
        self.stdout.write('=' * 80)

        # Definir TODOS los módulos según Estructura Final 22
        modules_config = self.get_modules_config()

        total_modules = 0
        total_tabs = 0

        for module_data in modules_config:
            tabs = module_data.pop('tabs', [])
            module = self.create_or_update_module(module_data)
            total_modules += 1

            for tab_data in tabs:
                self.create_or_update_tab(module, tab_data)
                total_tabs += 1

        self.print_summary(total_modules, total_tabs)

    def get_modules_config(self):
        """Retorna la configuración completa de los 14 módulos"""
        return [
            # =====================================================================
            # NIVEL 1: ESTRATÉGICO (10)
            # =====================================================================
            {
                'code': 'gestion_estrategica',
                'name': 'Direccion Estrategica',
                'description': 'Base del sistema, configuración empresarial y planificación estratégica',
                'category': 'ESTRATEGICO',
                'color': 'blue',
                'icon': 'Building2',
                'is_core': True,
                'is_enabled': True,
                'order': 10,
                'tabs': [
                    {'code': 'configuracion', 'name': 'Configuración', 'icon': 'Settings', 'order': 1},
                    {'code': 'organizacion', 'name': 'Organización', 'icon': 'Network', 'order': 2},
                    {'code': 'identidad_corporativa', 'name': 'Identidad Corporativa', 'icon': 'Award', 'order': 3},
                    {'code': 'planeacion_estrategica', 'name': 'Planeación Estratégica', 'icon': 'Target', 'order': 4},
                    {'code': 'gestion_proyectos', 'name': 'Gestión Proyectos (PMI)', 'icon': 'Gantt', 'order': 5},
                    {'code': 'revision_direccion', 'name': 'Revisión por Dirección', 'icon': 'ClipboardCheck', 'order': 6},
                ]
            },

            # =====================================================================
            # NIVEL 2: CUMPLIMIENTO (20, 21, 22)
            # =====================================================================
            {
                'code': 'motor_cumplimiento',
                'name': 'Cumplimiento Normativo',
                'description': 'Gestión de normatividad legal y requisitos aplicables',
                'category': 'CUMPLIMIENTO',
                'color': 'blue',
                'icon': 'Scale',
                'is_core': False,
                'is_enabled': True,
                'order': 20,
                'tabs': [
                    {'code': 'matriz_legal', 'name': 'Matriz Legal', 'icon': 'BookOpen', 'order': 1},
                    {'code': 'requisitos_legales', 'name': 'Requisitos Legales', 'icon': 'FileCheck', 'order': 2},
                    {'code': 'partes_interesadas', 'name': 'Partes Interesadas', 'icon': 'Users2', 'order': 3},
                    {'code': 'reglamentos_internos', 'name': 'Reglamentos Internos', 'icon': 'Gavel', 'order': 4},
                ]
            },
            {
                'code': 'motor_riesgos',
                'name': 'Motor de Riesgos',
                'description': 'Gestión integral de riesgos organizacionales ISO 31000',
                'category': 'CUMPLIMIENTO',
                'color': 'orange',
                'icon': 'AlertTriangle',
                'is_core': False,
                'is_enabled': True,
                'order': 21,
                'tabs': [
                    {'code': 'contexto_organizacional', 'name': 'Contexto Organizacional', 'icon': 'Building2', 'order': 1},
                    {'code': 'riesgos_procesos', 'name': 'Riesgos y Oportunidades', 'icon': 'GitBranch', 'order': 2},
                    {'code': 'ipevr', 'name': 'IPEVR (GTC-45)', 'icon': 'ShieldAlert', 'order': 3},
                    {'code': 'aspectos_ambientales', 'name': 'Aspectos Ambientales', 'icon': 'Leaf', 'order': 4},
                    {'code': 'riesgos_viales', 'name': 'Riesgos Viales', 'icon': 'Car', 'order': 5},
                    {'code': 'sagrilaft_ptee', 'name': 'SAGRILAFT/PTEE', 'icon': 'ShieldCheck', 'order': 6},
                    {'code': 'seguridad_informacion', 'name': 'Seguridad Información', 'icon': 'Lock', 'order': 7},
                ]
            },
            {
                'code': 'workflow_engine',
                'name': 'Flujos de Trabajo',
                'description': 'Motor BPM para automatización de procesos organizacionales',
                'category': 'CUMPLIMIENTO',
                'color': 'purple',
                'icon': 'Workflow',
                'is_core': False,
                'is_enabled': True,
                'order': 22,
                'tabs': [
                    {'code': 'disenador_flujos', 'name': 'Diseñador de Flujos', 'icon': 'PenTool', 'order': 1},
                    {'code': 'ejecucion', 'name': 'Ejecución', 'icon': 'Play', 'order': 2},
                    {'code': 'monitoreo', 'name': 'Monitoreo', 'icon': 'Activity', 'order': 3},
                ]
            },

            # =====================================================================
            # NIVEL 3: TORRE DE CONTROL (30)
            # =====================================================================
            {
                'code': 'hseq_management',
                'name': 'Gestion Integral',
                'description': 'Sistema integrado HSEQ - Calidad, SST, Ambiental, Seguridad Vial',
                'category': 'INTEGRAL',
                'color': 'teal',
                'icon': 'Shield',
                'is_core': False,
                'is_enabled': True,
                'order': 30,
                'tabs': [
                    {'code': 'sistema_documental', 'name': 'Sistema Documental', 'icon': 'FileText', 'order': 1},
                    {'code': 'planificacion_sistema', 'name': 'Planificación Sistema', 'icon': 'Calendar', 'order': 2},
                    {'code': 'calidad', 'name': 'Calidad', 'icon': 'CheckCircle', 'order': 3},
                    {'code': 'medicina_laboral', 'name': 'Medicina Laboral', 'icon': 'Heart', 'order': 4},
                    {'code': 'seguridad_industrial', 'name': 'Seguridad Industrial', 'icon': 'HardHat', 'order': 5},
                    {'code': 'higiene_industrial', 'name': 'Higiene Industrial', 'icon': 'Thermometer', 'order': 6},
                    {'code': 'gestion_comites', 'name': 'Gestión de Comités', 'icon': 'Users', 'order': 7},
                    {'code': 'accidentalidad', 'name': 'Accidentalidad (ATEL)', 'icon': 'AlertCircle', 'order': 8},
                    {'code': 'emergencias', 'name': 'Emergencias', 'icon': 'Siren', 'order': 9},
                    {'code': 'gestion_ambiental', 'name': 'Gestión Ambiental', 'icon': 'Leaf', 'order': 10},
                    {'code': 'mejora_continua', 'name': 'Mejora Continua', 'icon': 'TrendingUp', 'order': 11},
                ]
            },

            # =====================================================================
            # NIVEL 4: CADENA DE VALOR (40, 41, 42, 43)
            # =====================================================================
            {
                'code': 'supply_chain',
                'name': 'Cadena de Suministro',
                'description': 'Gestión de proveedores, compras e inventarios',
                'category': 'OPERATIVO',
                'color': 'green',
                'icon': 'Package',
                'is_core': False,
                'is_enabled': True,
                'order': 40,
                'tabs': [
                    {'code': 'gestion_proveedores', 'name': 'Gestión Proveedores', 'icon': 'Users', 'order': 1},
                    {'code': 'catalogos', 'name': 'Catálogos', 'icon': 'List', 'order': 2},
                    {'code': 'programacion_abastecimiento', 'name': 'Programación Abastecimiento', 'icon': 'Calendar', 'order': 3},
                    {'code': 'compras', 'name': 'Compras', 'icon': 'ShoppingCart', 'order': 4},
                    {'code': 'almacenamiento', 'name': 'Almacenamiento', 'icon': 'Warehouse', 'order': 5},
                ]
            },
            {
                'code': 'production_ops',
                'name': 'Base de Operaciones',
                'description': 'Gestión de procesos productivos y transformación',
                'category': 'OPERATIVO',
                'color': 'amber',
                'icon': 'Factory',
                'is_core': False,
                'is_enabled': True,
                'order': 41,
                'tabs': [
                    {'code': 'recepcion', 'name': 'Recepción', 'icon': 'Download', 'order': 1},
                    {'code': 'procesamiento', 'name': 'Procesamiento', 'icon': 'Cog', 'order': 2},
                    {'code': 'mantenimiento_industrial', 'name': 'Mantenimiento Industrial', 'icon': 'Wrench', 'order': 3},
                    {'code': 'producto_terminado', 'name': 'Producto Terminado', 'icon': 'PackageCheck', 'order': 4},
                ]
            },
            {
                'code': 'logistics_fleet',
                'name': 'Logistica y Flota',
                'description': 'Gestión de transporte, rutas y vehículos',
                'category': 'OPERATIVO',
                'color': 'cyan',
                'icon': 'Truck',
                'is_core': False,
                'is_enabled': True,
                'order': 42,
                'tabs': [
                    {'code': 'gestion_transporte', 'name': 'Gestión Transporte', 'icon': 'Route', 'order': 1},
                    {'code': 'despachos', 'name': 'Despachos', 'icon': 'Send', 'order': 2},
                    {'code': 'gestion_flota', 'name': 'Gestión de Flota', 'icon': 'Car', 'order': 3},
                    {'code': 'pesv_operativo', 'name': 'PESV Operativo', 'icon': 'Shield', 'order': 4},
                ]
            },
            {
                'code': 'sales_crm',
                'name': 'Ventas y CRM',
                'description': 'Gestión comercial y relación con clientes',
                'category': 'OPERATIVO',
                'color': 'rose',
                'icon': 'TrendingUp',
                'is_core': False,
                'is_enabled': True,
                'order': 43,
                'tabs': [
                    {'code': 'gestion_clientes', 'name': 'Gestión de Clientes', 'icon': 'Users', 'order': 1},
                    {'code': 'pipeline_ventas', 'name': 'Pipeline Ventas', 'icon': 'Funnel', 'order': 2},
                    {'code': 'pedidos_facturacion', 'name': 'Pedidos y Facturación', 'icon': 'FileText', 'order': 3},
                    {'code': 'servicio_cliente', 'name': 'Servicio al Cliente', 'icon': 'Headphones', 'order': 4},
                ]
            },

            # =====================================================================
            # NIVEL 5: HABILITADORES (50, 51, 52)
            # =====================================================================
            {
                'code': 'talent_hub',
                'name': 'Centro de Talento',
                'description': 'Gestión integral del ciclo del colaborador',
                'category': 'SOPORTE',
                'color': 'violet',
                'icon': 'GraduationCap',
                'is_core': False,
                'is_enabled': True,
                'order': 50,
                'tabs': [
                    {'code': 'estructura_cargos', 'name': 'Estructura de Cargos', 'icon': 'Network', 'order': 1},
                    {'code': 'seleccion_contratacion', 'name': 'Selección/Contratación', 'icon': 'UserPlus', 'order': 2},
                    {'code': 'colaboradores', 'name': 'Colaboradores', 'icon': 'Users', 'order': 3},
                    {'code': 'onboarding_induccion', 'name': 'Onboarding/Inducción', 'icon': 'Rocket', 'order': 4},
                    {'code': 'formacion_reinduccion', 'name': 'Formación/Reinducción', 'icon': 'BookOpen', 'order': 5},
                    {'code': 'desempeno', 'name': 'Desempeño', 'icon': 'Award', 'order': 6},
                    {'code': 'control_tiempo', 'name': 'Control de Tiempo', 'icon': 'Clock', 'order': 7},
                    {'code': 'novedades', 'name': 'Novedades', 'icon': 'Bell', 'order': 8},
                    {'code': 'proceso_disciplinario', 'name': 'Proceso Disciplinario', 'icon': 'Gavel', 'order': 9},
                    {'code': 'nomina', 'name': 'Nómina', 'icon': 'DollarSign', 'order': 10},
                    {'code': 'off_boarding', 'name': 'Off Boarding', 'icon': 'LogOut', 'order': 11},
                ]
            },
            {
                'code': 'admin_finance',
                'name': 'Administracion y Financiero',
                'description': 'Gestión financiera, tesorería y activos',
                'category': 'SOPORTE',
                'color': 'emerald',
                'icon': 'Wallet',
                'is_core': False,
                'is_enabled': True,
                'order': 51,
                'tabs': [
                    {'code': 'tesoreria', 'name': 'Tesorería', 'icon': 'Landmark', 'order': 1},
                    {'code': 'presupuesto', 'name': 'Presupuesto', 'icon': 'PieChart', 'order': 2},
                    {'code': 'activos_fijos', 'name': 'Activos Fijos', 'icon': 'Building', 'order': 3},
                    {'code': 'servicios_generales', 'name': 'Servicios Generales', 'icon': 'Wrench', 'order': 4},
                ]
            },
            {
                'code': 'accounting',
                'name': 'Contabilidad',
                'description': 'Módulo contable básico (activable)',
                'category': 'SOPORTE',
                'color': 'lime',
                'icon': 'Calculator',
                'is_core': False,
                'is_enabled': True,
                'order': 52,
                'tabs': [
                    {'code': 'config_contable', 'name': 'Config. Contable', 'icon': 'Settings', 'order': 1},
                    {'code': 'movimientos', 'name': 'Movimientos', 'icon': 'ArrowLeftRight', 'order': 2},
                    {'code': 'informes_contables', 'name': 'Informes Contables', 'icon': 'FileText', 'order': 3},
                    {'code': 'integracion', 'name': 'Integración', 'icon': 'Link', 'order': 4},
                ]
            },

            # =====================================================================
            # NIVEL 6: INTELIGENCIA (60, 61)
            # =====================================================================
            {
                'code': 'analytics',
                'name': 'Inteligencia de Negocios',
                'description': 'BI, indicadores, dashboards y generación de informes',
                'category': 'INTELIGENCIA',
                'color': 'indigo',
                'icon': 'BarChart3',
                'is_core': False,
                'is_enabled': True,
                'order': 60,
                'tabs': [
                    {'code': 'config_indicadores', 'name': 'Config. Indicadores', 'icon': 'Settings', 'order': 1},
                    {'code': 'dashboard_gerencial', 'name': 'Dashboard Gerencial', 'icon': 'LayoutDashboard', 'order': 2},
                    {'code': 'indicadores_area', 'name': 'Indicadores por Área', 'icon': 'TrendingUp', 'order': 3},
                    {'code': 'analisis_tendencias', 'name': 'Análisis y Tendencias', 'icon': 'LineChart', 'order': 4},
                    {'code': 'generador_informes', 'name': 'Generador Informes', 'icon': 'FileText', 'order': 5},
                    {'code': 'acciones_indicador', 'name': 'Acciones x Indicador', 'icon': 'Zap', 'order': 6},
                    {'code': 'exportacion_integracion', 'name': 'Exportación/Integración', 'icon': 'Download', 'order': 7},
                ]
            },
            {
                'code': 'audit_system',
                'name': 'Sistema de Auditorias',
                'description': 'Logs, notificaciones, alertas y trazabilidad del sistema',
                'category': 'INTELIGENCIA',
                'color': 'slate',
                'icon': 'Shield',
                'is_core': True,
                'is_enabled': True,
                'order': 61,
                'tabs': [
                    {'code': 'logs_sistema', 'name': 'Logs del Sistema', 'icon': 'Terminal', 'order': 1},
                    {'code': 'centro_notificaciones', 'name': 'Centro Notificaciones', 'icon': 'Bell', 'order': 2},
                    {'code': 'config_alertas', 'name': 'Config. Alertas', 'icon': 'BellRing', 'order': 3},
                    {'code': 'tareas_recordatorios', 'name': 'Tareas/Recordatorios', 'icon': 'CheckSquare', 'order': 4},
                ]
            },
        ]

    def create_or_update_module(self, data):
        """Crear o actualizar un módulo"""
        code = data['code']

        module, created = SystemModule.objects.get_or_create(
            code=code,
            defaults=data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ [{data["order"]:02d}] {data["name"]} (CREADO)')
            )
        else:
            # Actualizar todos los campos
            for key, value in data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'  ↻ [{data["order"]:02d}] {data["name"]} (ACTUALIZADO)')
            )

        return module

    def create_or_update_tab(self, module, data):
        """Crear o actualizar un tab"""
        code = data['code']

        tab, created = ModuleTab.objects.get_or_create(
            module=module,
            code=code,
            defaults={
                'name': data['name'],
                'icon': data['icon'],
                'order': data['order'],
                'is_enabled': True,
                'is_core': False,
            }
        )

        if not created:
            tab.name = data['name']
            tab.icon = data['icon']
            tab.order = data['order']
            tab.is_enabled = True
            tab.save()

        return tab

    def print_summary(self, total_modules, total_tabs):
        """Imprimir resumen final"""
        self.stdout.write('\n' + '=' * 80)
        self.stdout.write(self.style.SUCCESS('  ESTRUCTURA FINAL CONFIGURADA'))
        self.stdout.write('=' * 80)

        # Obtener módulos ordenados
        modules = SystemModule.objects.all().order_by('order')

        self.stdout.write('\n  ORDEN DEL SIDEBAR:')
        self.stdout.write('  ' + '-' * 50)

        for module in modules:
            tab_count = module.tabs.filter(is_enabled=True).count()
            self.stdout.write(
                f'  [{module.order:02d}] {module.name:<30} ({tab_count} tabs)'
            )

        self.stdout.write('\n  ' + '-' * 50)
        self.stdout.write(f'  TOTAL: {total_modules} módulos | {total_tabs} tabs')
        self.stdout.write('=' * 80)

        self.stdout.write('\n  VERIFICAR EN:')
        self.stdout.write('  → GET /api/core/system-modules/sidebar/')
        self.stdout.write('  → Frontend: El sidebar debería reflejar el nuevo orden')
        self.stdout.write('')
