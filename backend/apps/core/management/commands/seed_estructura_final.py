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
from apps.core.models import SystemModule, ModuleTab, TabSection


class Command(BaseCommand):
    help = 'Configura los 14 módulos del ERP según Estructura Final 22'

    def handle(self, *args, **options):
        self.stdout.write('=' * 80)
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  SEED ESTRUCTURA FINAL - ERP STRATEKAZ'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  14 Módulos | 81 Tabs | Secciones | 6 Niveles'
        ))
        self.stdout.write('=' * 80)

        # Definir TODOS los módulos según Estructura Final 22
        modules_config = self.get_modules_config()

        total_modules = 0
        total_tabs = 0
        total_sections = 0
        deleted_sections = 0

        # Construir mapa de secciones válidas por tab
        valid_sections_map = {}  # {(module_code, tab_code): [section_codes]}

        for module_data in modules_config:
            module_code = module_data['code']
            tabs = module_data.pop('tabs', [])
            module = self.create_or_update_module(module_data)
            total_modules += 1

            for tab_data in tabs:
                tab_code = tab_data['code']
                sections = tab_data.pop('sections', [])
                tab = self.create_or_update_tab(module, tab_data)
                total_tabs += 1

                # Registrar secciones válidas para este tab
                valid_sections_map[(module_code, tab_code)] = [s['code'] for s in sections]

                # Crear secciones del tab
                for section_data in sections:
                    self.create_or_update_section(tab, section_data)
                    total_sections += 1

                # Eliminar secciones que ya no están en la configuración
                deleted_count = self.cleanup_obsolete_sections(tab, [s['code'] for s in sections])
                deleted_sections += deleted_count

        self.print_summary(total_modules, total_tabs, total_sections, deleted_sections)

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
                'orden': 10,
                'tabs': [
                    {
                        'code': 'configuracion',
                        'name': 'Configuración',
                        'icon': 'Settings',
                        'orden': 1,
                        'sections': [
                            {'code': 'empresa', 'name': 'Datos de Empresa', 'icon': 'Building2', 'orden': 1},
                            {'code': 'sedes', 'name': 'Sedes', 'icon': 'MapPin', 'orden': 2},
                            {'code': 'integraciones', 'name': 'Integraciones', 'icon': 'Plug', 'orden': 3},
                            {'code': 'branding', 'name': 'Branding', 'icon': 'Palette', 'orden': 4},
                            {'code': 'modulos', 'name': 'Módulos y Funciones', 'icon': 'LayoutGrid', 'orden': 5},
                        ]
                    },
                    {
                        'code': 'organizacion',
                        'name': 'Organización',
                        'icon': 'Network',
                        'orden': 2,
                        'sections': [
                            {'code': 'areas', 'name': 'Áreas', 'icon': 'FolderTree', 'orden': 1},
                            {'code': 'cargos', 'name': 'Cargos', 'icon': 'Briefcase', 'orden': 2},
                            {'code': 'organigrama', 'name': 'Organigrama', 'icon': 'Network', 'orden': 3},
                            {'code': 'colaboradores', 'name': 'Colaboradores', 'icon': 'Users', 'orden': 4},
                            {'code': 'roles', 'name': 'Control de Acceso', 'icon': 'ShieldCheck', 'orden': 5},
                        ]
                    },
                    {
                        'code': 'identidad',
                        'name': 'Identidad Corporativa',
                        'icon': 'Award',
                        'orden': 3,
                        'sections': [
                            {'code': 'mision_vision', 'name': 'Misión y Visión', 'icon': 'Eye', 'orden': 1},
                            {'code': 'valores', 'name': 'Valores Corporativos', 'icon': 'Heart', 'orden': 2},
                            {'code': 'politica', 'name': 'Política Integral', 'icon': 'FileText', 'orden': 3},
                            {'code': 'politicas', 'name': 'Políticas Específicas', 'icon': 'FileCheck', 'orden': 4},
                        ]
                    },
                    {'code': 'planeacion', 'name': 'Planeación Estratégica', 'icon': 'Target', 'orden': 4},
                    {'code': 'gestion_proyectos', 'name': 'Gestión Proyectos (PMI)', 'icon': 'Gantt', 'orden': 5},
                    {'code': 'revision_direccion', 'name': 'Revisión por Dirección', 'icon': 'ClipboardCheck', 'orden': 6},
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
                'orden': 20,
                'tabs': [
                    {'code': 'matriz_legal', 'name': 'Matriz Legal', 'icon': 'BookOpen', 'orden': 1},
                    {'code': 'requisitos_legales', 'name': 'Requisitos Legales', 'icon': 'FileCheck', 'orden': 2},
                    {'code': 'partes_interesadas', 'name': 'Partes Interesadas', 'icon': 'Users2', 'orden': 3},
                    {'code': 'reglamentos_internos', 'name': 'Reglamentos Internos', 'icon': 'Gavel', 'orden': 4},
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
                'orden': 21,
                'tabs': [
                    {'code': 'contexto_organizacional', 'name': 'Contexto Organizacional', 'icon': 'Building2', 'orden': 1},
                    {'code': 'riesgos_procesos', 'name': 'Riesgos y Oportunidades', 'icon': 'GitBranch', 'orden': 2},
                    {'code': 'ipevr', 'name': 'IPEVR (GTC-45)', 'icon': 'ShieldAlert', 'orden': 3},
                    {'code': 'aspectos_ambientales', 'name': 'Aspectos Ambientales', 'icon': 'Leaf', 'orden': 4},
                    {'code': 'riesgos_viales', 'name': 'Riesgos Viales', 'icon': 'Car', 'orden': 5},
                    {'code': 'sagrilaft_ptee', 'name': 'SAGRILAFT/PTEE', 'icon': 'ShieldCheck', 'orden': 6},
                    {'code': 'seguridad_informacion', 'name': 'Seguridad Información', 'icon': 'Lock', 'orden': 7},
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
                'orden': 22,
                'tabs': [
                    {'code': 'disenador_flujos', 'name': 'Diseñador de Flujos', 'icon': 'PenTool', 'orden': 1},
                    {'code': 'ejecucion', 'name': 'Ejecución', 'icon': 'Play', 'orden': 2},
                    {'code': 'monitoreo', 'name': 'Monitoreo', 'icon': 'Activity', 'orden': 3},
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
                'orden': 30,
                'tabs': [
                    {'code': 'sistema_documental', 'name': 'Sistema Documental', 'icon': 'FileText', 'orden': 1},
                    {'code': 'planificacion_sistema', 'name': 'Planificación Sistema', 'icon': 'Calendar', 'orden': 2},
                    {'code': 'calidad', 'name': 'Calidad', 'icon': 'CheckCircle', 'orden': 3},
                    {'code': 'medicina_laboral', 'name': 'Medicina Laboral', 'icon': 'Heart', 'orden': 4},
                    {'code': 'seguridad_industrial', 'name': 'Seguridad Industrial', 'icon': 'HardHat', 'orden': 5},
                    {'code': 'higiene_industrial', 'name': 'Higiene Industrial', 'icon': 'Thermometer', 'orden': 6},
                    {'code': 'gestion_comites', 'name': 'Gestión de Comités', 'icon': 'Users', 'orden': 7},
                    {'code': 'accidentalidad', 'name': 'Accidentalidad (ATEL)', 'icon': 'AlertCircle', 'orden': 8},
                    {'code': 'emergencias', 'name': 'Emergencias', 'icon': 'Siren', 'orden': 9},
                    {'code': 'gestion_ambiental', 'name': 'Gestión Ambiental', 'icon': 'Leaf', 'orden': 10},
                    {'code': 'mejora_continua', 'name': 'Mejora Continua', 'icon': 'TrendingUp', 'orden': 11},
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
                'orden': 40,
                'tabs': [
                    {'code': 'gestion_proveedores', 'name': 'Gestión Proveedores', 'icon': 'Users', 'orden': 1},
                    {'code': 'catalogos', 'name': 'Catálogos', 'icon': 'List', 'orden': 2},
                    {'code': 'programacion_abastecimiento', 'name': 'Programación Abastecimiento', 'icon': 'Calendar', 'orden': 3},
                    {'code': 'compras', 'name': 'Compras', 'icon': 'ShoppingCart', 'orden': 4},
                    {'code': 'almacenamiento', 'name': 'Almacenamiento', 'icon': 'Warehouse', 'orden': 5},
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
                'orden': 41,
                'tabs': [
                    {'code': 'recepcion', 'name': 'Recepción', 'icon': 'Download', 'orden': 1},
                    {'code': 'procesamiento', 'name': 'Procesamiento', 'icon': 'Cog', 'orden': 2},
                    {'code': 'mantenimiento_industrial', 'name': 'Mantenimiento Industrial', 'icon': 'Wrench', 'orden': 3},
                    {'code': 'producto_terminado', 'name': 'Producto Terminado', 'icon': 'PackageCheck', 'orden': 4},
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
                'orden': 42,
                'tabs': [
                    {'code': 'gestion_transporte', 'name': 'Gestión Transporte', 'icon': 'Route', 'orden': 1},
                    {'code': 'despachos', 'name': 'Despachos', 'icon': 'Send', 'orden': 2},
                    {'code': 'gestion_flota', 'name': 'Gestión de Flota', 'icon': 'Car', 'orden': 3},
                    {'code': 'pesv_operativo', 'name': 'PESV Operativo', 'icon': 'Shield', 'orden': 4},
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
                'orden': 43,
                'tabs': [
                    {'code': 'gestion_clientes', 'name': 'Gestión de Clientes', 'icon': 'Users', 'orden': 1},
                    {'code': 'pipeline_ventas', 'name': 'Pipeline Ventas', 'icon': 'Funnel', 'orden': 2},
                    {'code': 'pedidos_facturacion', 'name': 'Pedidos y Facturación', 'icon': 'FileText', 'orden': 3},
                    {'code': 'servicio_cliente', 'name': 'Servicio al Cliente', 'icon': 'Headphones', 'orden': 4},
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
                'orden': 50,
                'tabs': [
                    {'code': 'estructura_cargos', 'name': 'Estructura de Cargos', 'icon': 'Network', 'orden': 1},
                    {'code': 'seleccion_contratacion', 'name': 'Selección/Contratación', 'icon': 'UserPlus', 'orden': 2},
                    {'code': 'colaboradores', 'name': 'Colaboradores', 'icon': 'Users', 'orden': 3},
                    {'code': 'onboarding_induccion', 'name': 'Onboarding/Inducción', 'icon': 'Rocket', 'orden': 4},
                    {'code': 'formacion_reinduccion', 'name': 'Formación/Reinducción', 'icon': 'BookOpen', 'orden': 5},
                    {'code': 'desempeno', 'name': 'Desempeño', 'icon': 'Award', 'orden': 6},
                    {'code': 'control_tiempo', 'name': 'Control de Tiempo', 'icon': 'Clock', 'orden': 7},
                    {'code': 'novedades', 'name': 'Novedades', 'icon': 'Bell', 'orden': 8},
                    {'code': 'proceso_disciplinario', 'name': 'Proceso Disciplinario', 'icon': 'Gavel', 'orden': 9},
                    {'code': 'nomina', 'name': 'Nómina', 'icon': 'DollarSign', 'orden': 10},
                    {'code': 'off_boarding', 'name': 'Off Boarding', 'icon': 'LogOut', 'orden': 11},
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
                'orden': 51,
                'tabs': [
                    {'code': 'tesoreria', 'name': 'Tesorería', 'icon': 'Landmark', 'orden': 1},
                    {'code': 'presupuesto', 'name': 'Presupuesto', 'icon': 'PieChart', 'orden': 2},
                    {'code': 'activos_fijos', 'name': 'Activos Fijos', 'icon': 'Building', 'orden': 3},
                    {'code': 'servicios_generales', 'name': 'Servicios Generales', 'icon': 'Wrench', 'orden': 4},
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
                'orden': 52,
                'tabs': [
                    {'code': 'config_contable', 'name': 'Config. Contable', 'icon': 'Settings', 'orden': 1},
                    {'code': 'movimientos', 'name': 'Movimientos', 'icon': 'ArrowLeftRight', 'orden': 2},
                    {'code': 'informes_contables', 'name': 'Informes Contables', 'icon': 'FileText', 'orden': 3},
                    {'code': 'integracion', 'name': 'Integración', 'icon': 'Link', 'orden': 4},
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
                'orden': 60,
                'tabs': [
                    {'code': 'config_indicadores', 'name': 'Config. Indicadores', 'icon': 'Settings', 'orden': 1},
                    {'code': 'dashboard_gerencial', 'name': 'Dashboard Gerencial', 'icon': 'LayoutDashboard', 'orden': 2},
                    {'code': 'indicadores_area', 'name': 'Indicadores por Área', 'icon': 'TrendingUp', 'orden': 3},
                    {'code': 'analisis_tendencias', 'name': 'Análisis y Tendencias', 'icon': 'LineChart', 'orden': 4},
                    {'code': 'generador_informes', 'name': 'Generador Informes', 'icon': 'FileText', 'orden': 5},
                    {'code': 'acciones_indicador', 'name': 'Acciones x Indicador', 'icon': 'Zap', 'orden': 6},
                    {'code': 'exportacion_integracion', 'name': 'Exportación/Integración', 'icon': 'Download', 'orden': 7},
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
                'orden': 61,
                'tabs': [
                    {'code': 'logs_sistema', 'name': 'Logs del Sistema', 'icon': 'Terminal', 'orden': 1},
                    {'code': 'centro_notificaciones', 'name': 'Centro Notificaciones', 'icon': 'Bell', 'orden': 2},
                    {'code': 'config_alertas', 'name': 'Config. Alertas', 'icon': 'BellRing', 'orden': 3},
                    {'code': 'tareas_recordatorios', 'name': 'Tareas/Recordatorios', 'icon': 'CheckSquare', 'orden': 4},
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
                self.style.SUCCESS(f'  [OK] [{data["orden"]:02d}] {data["name"]} (CREADO)')
            )
        else:
            # Actualizar todos los campos
            for key, value in data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'  [UPD] [{data["orden"]:02d}] {data["name"]} (ACTUALIZADO)')
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
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': False,
            }
        )

        if not created:
            tab.name = data['name']
            tab.icon = data['icon']
            tab.orden = data['orden']
            tab.is_enabled = True
            tab.save()

        return tab

    def create_or_update_section(self, tab, data):
        """Crear o actualizar una sección de tab"""
        code = data['code']

        section, created = TabSection.objects.get_or_create(
            tab=tab,
            code=code,
            defaults={
                'name': data['name'],
                'icon': data.get('icon', ''),
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': data.get('is_core', False),
            }
        )

        if not created:
            section.name = data['name']
            section.icon = data.get('icon', '')
            section.orden = data['orden']
            section.is_enabled = True
            section.save()

        return section

    def cleanup_obsolete_sections(self, tab, valid_section_codes):
        """Eliminar secciones que ya no están en la configuración"""
        # Obtener secciones existentes en la BD para este tab
        existing_sections = TabSection.objects.filter(tab=tab)
        deleted_count = 0

        for section in existing_sections:
            if section.code not in valid_section_codes:
                self.stdout.write(
                    self.style.ERROR(f'    [DEL] Eliminando sección obsoleta: {section.name} ({section.code})')
                )
                section.delete()
                deleted_count += 1

        return deleted_count

    def print_summary(self, total_modules, total_tabs, total_sections=0, deleted_sections=0):
        """Imprimir resumen final"""
        self.stdout.write('\n' + '=' * 80)
        self.stdout.write(self.style.SUCCESS('  ESTRUCTURA FINAL CONFIGURADA'))
        self.stdout.write('=' * 80)

        # Obtener módulos ordenados
        modules = SystemModule.objects.all().order_by('orden')

        self.stdout.write('\n  ORDEN DEL SIDEBAR:')
        self.stdout.write('  ' + '-' * 50)

        for module in modules:
            tab_count = module.tabs.filter(is_enabled=True).count()
            self.stdout.write(
                f'  [{module.orden:02d}] {module.name:<30} ({tab_count} tabs)'
            )

        self.stdout.write('\n  ' + '-' * 50)
        self.stdout.write(f'  TOTAL: {total_modules} módulos | {total_tabs} tabs | {total_sections} secciones')
        if deleted_sections > 0:
            self.stdout.write(self.style.WARNING(f'  ELIMINADAS: {deleted_sections} secciones obsoletas'))
        self.stdout.write('=' * 80)

        self.stdout.write('\n  VERIFICAR EN:')
        self.stdout.write('  GET /api/core/system-modules/sidebar/')
        self.stdout.write('  Frontend: El sidebar deberia reflejar el nuevo orden')
        self.stdout.write('')
