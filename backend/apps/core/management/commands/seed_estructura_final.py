"""
Management command MAESTRO para configurar TODOS los 14 módulos del ERP StrateKaz
según la Estructura Final 22 (validada 2025-12-22)

ORDEN DEFINITIVO (Sprint 13.2 - TH sube a posición 2):
    10. Dirección Estratégica
    15. Centro de Talento (dato maestro: cargos, colaboradores)
    20. Sistema de Gestión
    25. Cumplimiento Normativo
    26. Motor de Riesgos
    27. Flujos de Trabajo
    30. Gestión Integral
    40. Cadena de Suministro
    41. Base de Operaciones
    42. Logística y Flota
    43. Ventas y CRM
    50. Administración y Financiero
    51. Contabilidad
    60. Inteligencia de Negocios
    61. Sistema de Auditorías

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
            '  14 Módulos | 83 Tabs | Secciones | 6 Niveles'
        ))
        self.stdout.write('=' * 80)

        # Definir TODOS los módulos según Estructura Final 22
        modules_config = self.get_modules_config()

        total_modules = 0
        total_tabs = 0
        total_sections = 0
        deleted_sections = 0
        deleted_tabs = 0

        # Construir mapa de secciones válidas por tab
        valid_sections_map = {}  # {(module_code, tab_code): [section_codes]}

        for module_data in modules_config:
            module_code = module_data['code']
            tabs = module_data.pop('tabs', [])
            module = self.create_or_update_module(module_data)
            total_modules += 1

            # Guardar códigos de tabs válidos para este módulo
            valid_tab_codes = [t['code'] for t in tabs]

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

            # Eliminar tabs que ya no están en la configuración del módulo
            deleted_tabs_count = self.cleanup_obsolete_tabs(module, valid_tab_codes)
            deleted_tabs += deleted_tabs_count

        self.print_summary(total_modules, total_tabs, total_sections, deleted_sections, deleted_tabs)

    def get_modules_config(self):
        """Retorna la configuración completa de los 14 módulos"""
        return [
            # =====================================================================
            # NIVEL 1: ESTRATÉGICO (10)
            # =====================================================================
            {
                'code': 'gestion_estrategica',
                'name': 'Dirección Estratégica',
                'description': 'Base del sistema, configuración empresarial y planificación estratégica',
                'category': 'STRATEGIC',
                'color': 'blue',
                'icon': 'Building2',
                'route': '/gestion-estrategica',
                'is_core': True,
                'is_enabled': True,
                'orden': 10,
                'tabs': [
                    {
                        'code': 'configuracion',
                        'name': 'Configuración',
                        'icon': 'Settings',
                        'route': 'configuracion',
                        'orden': 1,
                        'sections': [
                            {'code': 'empresa', 'name': 'Empresa', 'icon': 'Building2', 'orden': 1, 'description': 'Datos generales de la empresa'},
                            {'code': 'sedes', 'name': 'Sedes', 'icon': 'MapPin', 'orden': 2, 'description': 'Ubicaciones físicas de la empresa'},
                            {'code': 'integraciones', 'name': 'Integraciones', 'icon': 'Plug', 'orden': 3, 'description': 'Conexiones con sistemas externos'},
                            {'code': 'normas_iso', 'name': 'Normas', 'icon': 'Award', 'orden': 4, 'description': 'Normas ISO y sistemas de gestión'},
                            {'code': 'modulos', 'name': 'Módulos', 'icon': 'LayoutGrid', 'orden': 5, 'description': 'Activar o desactivar funcionalidades'},
                        ]
                    },
                    {
                        'code': 'organizacion',
                        'name': 'Organización',
                        'icon': 'Network',
                        'route': 'organizacion',
                        'orden': 2,
                        'sections': [
                            {'code': 'areas', 'name': 'Procesos', 'icon': 'FolderTree', 'orden': 1, 'description': 'Gestión de áreas y departamentos'},
                            {'code': 'mapa_procesos', 'name': 'Mapa de Procesos', 'icon': 'Grid3x3', 'orden': 2, 'description': 'Visualización interactiva de la estructura de procesos'},
                            {'code': 'consecutivos', 'name': 'Consecutivos', 'icon': 'Hash', 'orden': 3, 'description': 'Numeración automática de documentos'},
                            # NOTA: 'unidades_medida' eliminado — catálogo del sistema vía seeds, se consume desde choices endpoint
                            # NOTA: 'cargos' y 'colaboradores' migrados a Talento Humano (Sprint 13)
                            # NOTA: 'organigrama de cargos' migrado a TH > Estructura de Cargos (Sprint 13)
                        ]
                    },
                    {
                        'code': 'identidad',
                        'name': 'Identidad Corporativa',
                        'icon': 'Award',
                        'route': 'identidad',
                        'orden': 3,
                        'sections': [
                            {'code': 'mision_vision', 'name': 'Direccionamiento', 'icon': 'Eye', 'orden': 1, 'description': 'Misión, visión y propósito organizacional'},
                            {'code': 'valores', 'name': 'Valores', 'icon': 'Heart', 'orden': 2, 'description': 'Principios y valores corporativos'},
                            {'code': 'politicas', 'name': 'Políticas', 'icon': 'FileCheck', 'orden': 3, 'description': 'Políticas organizacionales'},
                        ]
                    },
                    {
                        'code': 'contexto',
                        'name': 'Contexto Organizacional',
                        'icon': 'Compass',
                        'route': 'contexto',
                        'orden': 4,
                        'sections': [
                            # Análisis del contexto interno y externo (ISO 9001:2015 Cláusula 4.1)
                            # Flujo: Stakeholders → Encuestas (PCI-POAM) → DOFA (visor matriz) → PESTEL (visor matriz) → Porter → TOWS
                            {'code': 'stakeholders', 'name': 'Stakeholders', 'icon': 'Users', 'orden': 1, 'description': 'Identificación y análisis de partes interesadas'},
                            {'code': 'encuestas_dofa', 'name': 'Encuestas', 'icon': 'ClipboardList', 'orden': 2, 'description': 'Encuestas PCI-POAM para recopilar factores internos y externos del contexto organizacional'},
                            {'code': 'analisis_dofa', 'name': 'DOFA', 'icon': 'Grid3X3', 'orden': 3, 'description': 'Matriz de Fortalezas, Oportunidades, Debilidades y Amenazas (alimentada desde Encuestas)'},
                            {'code': 'analisis_pestel', 'name': 'PESTEL', 'icon': 'Globe', 'orden': 4, 'description': 'Matriz de factores Políticos, Económicos, Sociales, Tecnológicos, Ecológicos y Legales (alimentada desde Encuestas)'},
                            {'code': 'fuerzas_porter', 'name': 'Porter', 'icon': 'Layers', 'orden': 5, 'description': 'Evalúa las 5 fuerzas competitivas que determinan la intensidad de la competencia'},
                            {'code': 'estrategias_tows', 'name': 'TOWS', 'icon': 'Lightbulb', 'orden': 6, 'description': 'Define estrategias cruzando Fortalezas, Oportunidades, Debilidades y Amenazas'},
                        ]
                    },
                    {
                        'code': 'planeacion',
                        'name': 'Planeación Estratégica',
                        'icon': 'Target',
                        'route': 'planeacion',
                        'orden': 5,
                        'sections': [
                            # Formulación y seguimiento estratégico
                            {'code': 'objetivos_bsc', 'name': 'Objetivos', 'icon': 'Target', 'orden': 1, 'description': 'Objetivos por perspectiva BSC vinculados al plan estratégico'},
                            {'code': 'mapa_estrategico', 'name': 'Mapa', 'icon': 'Map', 'orden': 2, 'description': 'Visualización interactiva de objetivos y relaciones causa-efecto'},
                            {'code': 'kpis', 'name': 'KPIs', 'icon': 'BarChart3', 'orden': 3, 'description': 'Indicadores de desempeño con metas y semáforos de seguimiento'},
                            {'code': 'gestion_cambio', 'name': 'Cambios', 'icon': 'RefreshCw', 'orden': 4, 'description': 'Registre y dé seguimiento a cambios estratégicos, organizacionales, de procesos o tecnológicos'},
                        ]
                    },
                    # Orden: Contexto (4) → Planeación (5) → Riesgos (6) → Proyectos (7) → Revisión (8)
                    {
                        'code': 'riesgos_oportunidades',
                        'name': 'Riesgos y Oportunidades',
                        'icon': 'ShieldAlert',
                        'route': 'riesgos-oportunidades',
                        'orden': 6,
                        'sections': [
                            {'code': 'resumen', 'name': 'Resumen', 'icon': 'PieChart', 'orden': 1, 'description': 'Vista general de indicadores de riesgos y oportunidades'},
                            {'code': 'mapa_calor', 'name': 'Mapa de Calor', 'icon': 'Grid3X3', 'orden': 2, 'description': 'Visualización matricial de probabilidad vs impacto'},
                            {'code': 'riesgos', 'name': 'Riesgos', 'icon': 'AlertTriangle', 'orden': 3, 'description': 'Identificación y gestión de riesgos organizacionales'},
                            {'code': 'oportunidades', 'name': 'Oportunidades', 'icon': 'TrendingUp', 'orden': 4, 'description': 'Identificación y aprovechamiento de oportunidades'},
                            {'code': 'tratamientos', 'name': 'Tratamientos', 'icon': 'ClipboardCheck', 'orden': 5, 'description': 'Planes de tratamiento y controles'},
                        ]
                    },
                    {
                        'code': 'gestion_proyectos',
                        'name': 'Gestión de Proyectos',
                        'icon': 'Gantt',
                        'route': 'proyectos',
                        'orden': 7,
                        'sections': [
                            {'code': 'portafolio', 'name': 'Portafolio', 'icon': 'Briefcase', 'orden': 1, 'description': 'Vista general del portafolio, programas y estado de proyectos'},
                            {'code': 'iniciacion', 'name': 'Iniciación', 'icon': 'FileSignature', 'orden': 2, 'description': 'Charter del proyecto, objetivos SMART y registro de stakeholders'},
                            {'code': 'planificacion', 'name': 'Planificación', 'icon': 'CalendarRange', 'orden': 3, 'description': 'Alcance, cronograma, recursos, costos y plan de riesgos'},
                            {'code': 'ejecucion_monitoreo', 'name': 'Ejecución y Monitoreo', 'icon': 'Activity', 'orden': 4, 'description': 'Seguimiento de avance, indicadores EVM y control de cambios'},
                            {'code': 'cierre', 'name': 'Cierre', 'icon': 'CheckCircle2', 'orden': 5, 'description': 'Lecciones aprendidas, acta de cierre y liberación de recursos'},
                        ]
                    },
                    {
                        'code': 'revision_direccion',
                        'name': 'Revisión por Dirección',
                        'icon': 'ClipboardCheck',
                        'route': 'revision-direccion',
                        'orden': 8,
                        'sections': [
                            {'code': 'programacion', 'name': 'Programación', 'icon': 'Calendar', 'orden': 1, 'description': 'Calendario y listado de revisiones gerenciales programadas'},
                            {'code': 'actas', 'name': 'Actas', 'icon': 'FileText', 'orden': 2, 'description': 'Gestión de actas generadas en las revisiones por la dirección'},
                            {'code': 'compromisos', 'name': 'Compromisos', 'icon': 'ClipboardList', 'orden': 3, 'description': 'Seguimiento de compromisos derivados de las revisiones'},
                        ]
                    },
                ]
            },

            # =====================================================================
            # NIVEL 1.5: SISTEMA DE GESTIÓN (15) - Control Documental y Planificación ISO
            # =====================================================================
            {
                'code': 'sistema_gestion',
                'name': 'Sistema de Gestión',
                'description': 'Control documental ISO y planificación del sistema de gestión',
                'category': 'STRATEGIC',
                'color': 'indigo',
                'icon': 'FolderCog',
                'route': '/sistema-gestion',
                'is_core': False,
                'is_enabled': True,
                'orden': 20,
                'tabs': [
                    {
                        'code': 'gestion_documental',
                        'name': 'Gestión Documental',
                        'icon': 'FileText',
                        'route': 'documentos',
                        'orden': 1,
                        'sections': [
                            {'code': 'tipos_documento', 'name': 'Tipos de Documento', 'icon': 'FileType', 'orden': 1, 'description': 'Clasificación de documentos del sistema'},
                            {'code': 'documentos', 'name': 'Documentos', 'icon': 'Files', 'orden': 2, 'description': 'Procedimientos, instructivos, formatos y registros'},
                            {'code': 'control_cambios', 'name': 'Control de Cambios', 'icon': 'History', 'orden': 3, 'description': 'Historial de versiones y cambios'},
                            {'code': 'distribucion', 'name': 'Distribución', 'icon': 'Share2', 'orden': 4, 'description': 'Control de copias y distribución'},
                        ]
                    },
                    {
                        'code': 'planificacion_sistema',
                        'name': 'Planificación del Sistema',
                        'icon': 'Calendar',
                        'route': 'planificacion',
                        'orden': 2,
                        'sections': [
                            {'code': 'programas', 'name': 'Programas', 'icon': 'ListChecks', 'orden': 1, 'description': 'Programas de gestión (SST, Ambiental, Calidad)'},
                            {'code': 'plan_auditorias', 'name': 'Plan de Auditorías', 'icon': 'ClipboardList', 'orden': 2, 'description': 'Programación de auditorías internas'},
                            {'code': 'objetivos_metas', 'name': 'Objetivos y Metas', 'icon': 'Target', 'orden': 3, 'description': 'Objetivos del sistema de gestión'},
                            {'code': 'indicadores_gestion', 'name': 'Indicadores', 'icon': 'BarChart3', 'orden': 4, 'description': 'Indicadores de desempeño del sistema'},
                        ]
                    },
                    {
                        'code': 'auditorias_internas',
                        'name': 'Auditorías Internas',
                        'icon': 'Search',
                        'route': 'auditorias',
                        'orden': 3,
                        'sections': [
                            {'code': 'programacion', 'name': 'Programación', 'icon': 'CalendarDays', 'orden': 1, 'description': 'Calendario y asignación de auditores'},
                            {'code': 'ejecucion_auditoria', 'name': 'Ejecución', 'icon': 'Play', 'orden': 2, 'description': 'Listas de verificación y hallazgos'},
                            {'code': 'informes', 'name': 'Informes', 'icon': 'FileText', 'orden': 3, 'description': 'Informes de auditoría y conclusiones'},
                        ]
                    },
                    {
                        'code': 'acciones_mejora',
                        'name': 'Acciones de Mejora',
                        'icon': 'TrendingUp',
                        'route': 'acciones',
                        'orden': 4,
                        'sections': [
                            {'code': 'no_conformidades', 'name': 'No Conformidades', 'icon': 'AlertCircle', 'orden': 1, 'description': 'Registro y tratamiento de NC'},
                            {'code': 'acciones_correctivas', 'name': 'Acciones Correctivas', 'icon': 'CheckCircle', 'orden': 2, 'description': 'Plan de acciones correctivas'},
                            {'code': 'acciones_preventivas', 'name': 'Acciones Preventivas', 'icon': 'Shield', 'orden': 3, 'description': 'Acciones para prevenir NC'},
                            {'code': 'oportunidades_mejora', 'name': 'Oportunidades de Mejora', 'icon': 'Lightbulb', 'orden': 4, 'description': 'Ideas y proyectos de mejora'},
                        ]
                    },
                ]
            },

            # =====================================================================
            # NIVEL 2: COMPLIANCE (20, 21, 22)
            # =====================================================================
            {
                'code': 'motor_cumplimiento',
                'name': 'Cumplimiento Normativo',
                'description': 'Gestión de normatividad legal y requisitos aplicables',
                'category': 'COMPLIANCE',
                'color': 'blue',
                'icon': 'Scale',
                'route': '/cumplimiento',
                'is_core': False,
                'is_enabled': True,
                'orden': 25,
                'tabs': [
                    {
                        'code': 'matriz_legal',
                        'name': 'Matriz Legal',
                        'icon': 'BookOpen',
                        'route': 'matriz-legal',
                        'orden': 1,
                        'sections': [
                            {'code': 'normas', 'name': 'Normas', 'icon': 'BookOpen', 'orden': 1, 'description': 'Registro de decretos, leyes y resoluciones'},
                            {'code': 'evaluacion', 'name': 'Evaluación', 'icon': 'ClipboardCheck', 'orden': 2, 'description': 'Evaluación de cumplimiento por norma'},
                        ]
                    },
                    {'code': 'requisitos_legales', 'name': 'Requisitos Legales', 'icon': 'FileCheck', 'route': 'requisitos-legales', 'orden': 2},
                    {'code': 'partes_interesadas', 'name': 'Partes Interesadas', 'icon': 'Users2', 'route': 'partes-interesadas', 'orden': 3},
                    {'code': 'reglamentos_internos', 'name': 'Reglamentos Internos', 'icon': 'Gavel', 'route': 'reglamentos-internos', 'orden': 4},
                ]
            },
            {
                'code': 'motor_riesgos',
                'name': 'Motor de Riesgos',
                'description': 'Gestión integral de riesgos organizacionales ISO 31000',
                'category': 'COMPLIANCE',
                'color': 'orange',
                'icon': 'AlertTriangle',
                'route': '/riesgos',
                'is_core': False,
                'is_enabled': True,
                'orden': 26,
                'tabs': [
                    # riesgos_oportunidades MOVIDO a gestion_estrategica (Tab 6)
                    {'code': 'ipevr', 'name': 'IPEVR (GTC-45)', 'icon': 'ShieldAlert', 'route': 'ipevr', 'orden': 1},
                    {'code': 'aspectos_ambientales', 'name': 'Aspectos Ambientales', 'icon': 'Leaf', 'route': 'ambientales', 'orden': 2},
                    {'code': 'riesgos_viales', 'name': 'Riesgos Viales', 'icon': 'Car', 'route': 'viales', 'orden': 3},
                    {'code': 'sagrilaft_ptee', 'name': 'SAGRILAFT/PTEE', 'icon': 'ShieldCheck', 'route': 'sagrilaft', 'orden': 4},
                    {'code': 'seguridad_informacion', 'name': 'Seguridad de la Información', 'icon': 'Lock', 'route': 'seguridad-info', 'orden': 5},
                ]
            },
            {
                'code': 'workflow_engine',
                'name': 'Flujos de Trabajo',
                'description': 'Motor BPM para automatización de procesos organizacionales',
                'category': 'COMPLIANCE',
                'color': 'purple',
                'icon': 'Workflow',
                'route': '/workflows',
                'is_core': False,
                'is_enabled': True,
                'orden': 27,
                'tabs': [
                    {'code': 'disenador_flujos', 'name': 'Diseñador de Flujos', 'icon': 'PenTool', 'route': 'disenador', 'orden': 1},
                    {'code': 'ejecucion', 'name': 'Ejecución', 'icon': 'Play', 'route': 'ejecucion', 'orden': 2},
                    {'code': 'monitoreo', 'name': 'Monitoreo', 'icon': 'Activity', 'route': 'monitoreo', 'orden': 3},
                ]
            },

            # =====================================================================
            # NIVEL 3: TORRE DE CONTROL (30)
            # =====================================================================
            {
                'code': 'hseq_management',
                'name': 'Gestión Integral',
                'description': 'Sistema integrado HSEQ - Calidad, SST, Ambiental, Seguridad Vial',
                'category': 'INTEGRATED',
                'color': 'teal',
                'icon': 'Shield',
                'route': '/hseq',
                'is_core': False,
                'is_enabled': True,
                'orden': 30,
                'tabs': [
                    # NOTA: sistema_documental y planificacion_sistema movidos a sistema_gestion [15]
                    {'code': 'calidad', 'name': 'Calidad', 'icon': 'CheckCircle', 'route': 'calidad', 'orden': 1},
                    {'code': 'medicina_laboral', 'name': 'Medicina Laboral', 'icon': 'Heart', 'route': 'medicina-laboral', 'orden': 2},
                    {'code': 'seguridad_industrial', 'name': 'Seguridad Industrial', 'icon': 'HardHat', 'route': 'seguridad-industrial', 'orden': 3},
                    {'code': 'higiene_industrial', 'name': 'Higiene Industrial', 'icon': 'Thermometer', 'route': 'higiene-industrial', 'orden': 4},
                    {'code': 'gestion_comites', 'name': 'Gestión de Comités', 'icon': 'Users', 'route': 'comites', 'orden': 5},
                    {'code': 'accidentalidad', 'name': 'Accidentalidad (ATEL)', 'icon': 'AlertCircle', 'route': 'accidentalidad', 'orden': 6},
                    {'code': 'emergencias', 'name': 'Emergencias', 'icon': 'Siren', 'route': 'emergencias', 'orden': 7},
                    {'code': 'gestion_ambiental', 'name': 'Gestión Ambiental', 'icon': 'Leaf', 'route': 'gestion-ambiental', 'orden': 8},
                    {'code': 'mejora_continua', 'name': 'Mejora Continua', 'icon': 'TrendingUp', 'route': 'mejora-continua', 'orden': 9},
                ]
            },

            # =====================================================================
            # NIVEL 4: CADENA DE VALOR (40, 41, 42, 43)
            # =====================================================================
            {
                'code': 'supply_chain',
                'name': 'Cadena de Suministro',
                'description': 'Gestión de proveedores, compras e inventarios',
                'category': 'OPERATIONAL',
                'color': 'green',
                'icon': 'Package',
                'route': '/proveedores',
                'is_core': False,
                'is_enabled': True,
                'orden': 40,
                'tabs': [
                    {'code': 'gestion_proveedores', 'name': 'Gestión Proveedores', 'icon': 'Users', 'route': 'materia-prima', 'orden': 1},
                    {'code': 'catalogos', 'name': 'Catálogos', 'icon': 'List', 'route': 'productos-servicios', 'orden': 2},
                    {'code': 'programacion_abastecimiento', 'name': 'Programación Abastecimiento', 'icon': 'Calendar', 'route': 'programacion', 'orden': 3},
                    {'code': 'compras', 'name': 'Compras', 'icon': 'ShoppingCart', 'route': 'compras', 'orden': 4},
                    {'code': 'almacenamiento', 'name': 'Almacenamiento', 'icon': 'Warehouse', 'route': 'almacenamiento', 'orden': 5},
                ]
            },
            {
                'code': 'production_ops',
                'name': 'Base de Operaciones',
                'description': 'Gestión de procesos productivos y transformación',
                'category': 'OPERATIONAL',
                'color': 'amber',
                'icon': 'Factory',
                'route': '/produccion',
                'is_core': False,
                'is_enabled': True,
                'orden': 41,
                'tabs': [
                    {'code': 'recepcion', 'name': 'Recepción', 'icon': 'Download', 'route': 'recepcion', 'orden': 1},
                    {'code': 'procesamiento', 'name': 'Procesamiento', 'icon': 'Cog', 'route': 'procesamiento', 'orden': 2},
                    {'code': 'mantenimiento_industrial', 'name': 'Mantenimiento Industrial', 'icon': 'Wrench', 'route': 'mantenimiento', 'orden': 3},
                    {'code': 'producto_terminado', 'name': 'Producto Terminado', 'icon': 'PackageCheck', 'route': 'producto-terminado', 'orden': 4},
                ]
            },
            {
                'code': 'logistics_fleet',
                'name': 'Logística y Flota',
                'description': 'Gestión de transporte, rutas y vehículos',
                'category': 'OPERATIONAL',
                'color': 'cyan',
                'icon': 'Truck',
                'route': '/logistica',
                'is_core': False,
                'is_enabled': True,
                'orden': 42,
                'tabs': [
                    {'code': 'gestion_transporte', 'name': 'Gestión Transporte', 'icon': 'Route', 'route': 'transporte', 'orden': 1},
                    {'code': 'despachos', 'name': 'Despachos', 'icon': 'Send', 'route': 'despachos', 'orden': 2},
                    {'code': 'gestion_flota', 'name': 'Gestión de Flota', 'icon': 'Car', 'route': 'flota', 'orden': 3},
                    {'code': 'pesv_operativo', 'name': 'PESV Operativo', 'icon': 'Shield', 'route': 'pesv', 'orden': 4},
                ]
            },
            {
                'code': 'sales_crm',
                'name': 'Ventas y CRM',
                'description': 'Gestión comercial y relación con clientes',
                'category': 'OPERATIONAL',
                'color': 'rose',
                'icon': 'TrendingUp',
                'route': '/ventas',
                'is_core': False,
                'is_enabled': True,
                'orden': 43,
                'tabs': [
                    {'code': 'gestion_clientes', 'name': 'Gestión de Clientes', 'icon': 'Users', 'route': 'clientes', 'orden': 1},
                    {'code': 'pipeline_ventas', 'name': 'Pipeline Ventas', 'icon': 'Funnel', 'route': 'pipeline', 'orden': 2},
                    {'code': 'pedidos_facturacion', 'name': 'Pedidos y Facturación', 'icon': 'FileText', 'route': 'pedidos', 'orden': 3},
                    {'code': 'servicio_cliente', 'name': 'Servicio al Cliente', 'icon': 'Headphones', 'route': 'pqrs', 'orden': 4},
                ]
            },

            # =====================================================================
            # NIVEL 5: HABILITADORES (50, 51, 52)
            # =====================================================================
            {
                'code': 'talent_hub',
                'name': 'Centro de Talento',
                'description': 'Gestión integral del ciclo del colaborador',
                'category': 'SUPPORT',
                'color': 'violet',
                'icon': 'GraduationCap',
                'route': '/talento',
                'is_core': False,
                'is_enabled': True,
                'orden': 15,
                'tabs': [
                    {
                        'code': 'estructura_cargos', 'name': 'Estructura de Cargos', 'icon': 'Network', 'route': 'estructura', 'orden': 1,
                        'sections': [
                            {'code': 'cargos', 'name': 'Cargos', 'icon': 'Network', 'orden': 1, 'description': 'Gestión de cargos y niveles jerárquicos'},
                            {'code': 'organigrama', 'name': 'Organigrama', 'icon': 'GitBranch', 'orden': 2, 'description': 'Visualización interactiva de la jerarquía de cargos'},
                        ]
                    },
                    {'code': 'seleccion_contratacion', 'name': 'Selección y Contratación', 'icon': 'UserPlus', 'route': 'seleccion', 'orden': 2},
                    {'code': 'colaboradores', 'name': 'Colaboradores', 'icon': 'Users', 'route': 'colaboradores', 'orden': 3},
                    {'code': 'onboarding_induccion', 'name': 'Onboarding e Inducción', 'icon': 'Rocket', 'route': 'onboarding', 'orden': 4},
                    {'code': 'formacion_reinduccion', 'name': 'Formación y Reinducción', 'icon': 'BookOpen', 'route': 'formacion', 'orden': 5},
                    {'code': 'desempeno', 'name': 'Desempeño', 'icon': 'Award', 'route': 'desempeno', 'orden': 6},
                    {'code': 'control_tiempo', 'name': 'Control de Tiempo', 'icon': 'Clock', 'route': 'control-tiempo', 'orden': 7},
                    {'code': 'novedades', 'name': 'Novedades', 'icon': 'Bell', 'route': 'novedades', 'orden': 8},
                    {'code': 'proceso_disciplinario', 'name': 'Proceso Disciplinario', 'icon': 'Gavel', 'route': 'disciplinario', 'orden': 9},
                    {'code': 'nomina', 'name': 'Nómina', 'icon': 'DollarSign', 'route': 'nomina', 'orden': 10},
                    {'code': 'off_boarding', 'name': 'Off Boarding', 'icon': 'LogOut', 'route': 'off-boarding', 'orden': 11},
                ]
            },
            {
                'code': 'admin_finance',
                'name': 'Administración y Financiero',
                'description': 'Gestión financiera, tesorería y activos',
                'category': 'SUPPORT',
                'color': 'emerald',
                'icon': 'Wallet',
                'route': '/finanzas',
                'is_core': False,
                'is_enabled': True,
                'orden': 50,
                'tabs': [
                    {'code': 'tesoreria', 'name': 'Tesorería', 'icon': 'Landmark', 'route': 'tesoreria', 'orden': 1},
                    {'code': 'presupuesto', 'name': 'Presupuesto', 'icon': 'PieChart', 'route': 'presupuesto', 'orden': 2},
                    {'code': 'activos_fijos', 'name': 'Activos Fijos', 'icon': 'Building', 'route': 'activos-fijos', 'orden': 3},
                    {'code': 'servicios_generales', 'name': 'Servicios Generales', 'icon': 'Wrench', 'route': 'servicios-generales', 'orden': 4},
                ]
            },
            {
                'code': 'accounting',
                'name': 'Contabilidad',
                'description': 'Módulo contable básico (activable)',
                'category': 'SUPPORT',
                'color': 'lime',
                'icon': 'Calculator',
                'route': '/contabilidad',
                'is_core': False,
                'is_enabled': True,
                'orden': 51,
                'tabs': [
                    {'code': 'config_contable', 'name': 'Config. Contable', 'icon': 'Settings', 'route': 'configuracion', 'orden': 1},
                    {'code': 'movimientos', 'name': 'Movimientos', 'icon': 'ArrowLeftRight', 'route': 'movimientos', 'orden': 2},
                    {'code': 'informes_contables', 'name': 'Informes Contables', 'icon': 'FileText', 'route': 'informes', 'orden': 3},
                    {'code': 'integracion', 'name': 'Integración', 'icon': 'Link', 'route': 'integracion', 'orden': 4},
                ]
            },

            # =====================================================================
            # NIVEL 6: INTELIGENCIA (60, 61)
            # =====================================================================
            {
                'code': 'analytics',
                'name': 'Inteligencia de Negocios',
                'description': 'BI, indicadores, dashboards y generación de informes',
                'category': 'INTELLIGENCE',
                'color': 'indigo',
                'icon': 'BarChart3',
                'route': '/analytics',
                'is_core': False,
                'is_enabled': True,
                'orden': 60,
                'tabs': [
                    {'code': 'config_indicadores', 'name': 'Config. Indicadores', 'icon': 'Settings', 'route': 'configuracion', 'orden': 1},
                    {'code': 'dashboard_gerencial', 'name': 'Dashboard Gerencial', 'icon': 'LayoutDashboard', 'route': 'dashboards', 'orden': 2},
                    {'code': 'indicadores_area', 'name': 'Indicadores por Área', 'icon': 'TrendingUp', 'route': 'indicadores', 'orden': 3},
                    {'code': 'analisis_tendencias', 'name': 'Análisis y Tendencias', 'icon': 'LineChart', 'route': 'analisis', 'orden': 4},
                    {'code': 'generador_informes', 'name': 'Generador Informes', 'icon': 'FileText', 'route': 'informes', 'orden': 5},
                    {'code': 'acciones_indicador', 'name': 'Acciones x Indicador', 'icon': 'Zap', 'route': 'acciones', 'orden': 6},
                    {'code': 'exportacion_integracion', 'name': 'Exportación/Integración', 'icon': 'Download', 'route': 'exportacion', 'orden': 7},
                ]
            },
            {
                'code': 'audit_system',
                'name': 'Sistema de Auditorías',
                'description': 'Logs, notificaciones, alertas y trazabilidad del sistema',
                'category': 'INTELLIGENCE',
                'color': 'slate',
                'icon': 'Shield',
                'route': '/auditoria',
                'is_core': True,
                'is_enabled': True,
                'orden': 61,
                'tabs': [
                    {'code': 'logs_sistema', 'name': 'Logs del Sistema', 'icon': 'Terminal', 'route': 'logs', 'orden': 1},
                    {'code': 'centro_notificaciones', 'name': 'Centro Notificaciones', 'icon': 'Bell', 'route': 'notificaciones', 'orden': 2},
                    {'code': 'config_alertas', 'name': 'Config. Alertas', 'icon': 'BellRing', 'route': 'alertas', 'orden': 3},
                    {'code': 'tareas_recordatorios', 'name': 'Tareas/Recordatorios', 'icon': 'CheckSquare', 'route': 'tareas', 'orden': 4},
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
                'route': data.get('route'),  # Ruta opcional para el frontend
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': False,
            }
        )

        if not created:
            tab.name = data['name']
            tab.icon = data['icon']
            tab.route = data.get('route')  # Actualizar ruta
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
                'description': data.get('description', ''),
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': data.get('is_core', False),
            }
        )

        if not created:
            section.name = data['name']
            section.icon = data.get('icon', '')
            section.description = data.get('description', '')
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

    def cleanup_obsolete_tabs(self, module, valid_tab_codes):
        """Eliminar tabs que ya no están en la configuración del módulo"""
        existing_tabs = ModuleTab.objects.filter(module=module)
        deleted_count = 0

        for tab in existing_tabs:
            if tab.code not in valid_tab_codes:
                self.stdout.write(
                    self.style.ERROR(f'    [DEL] Eliminando tab obsoleto: {tab.name} ({tab.code})')
                )
                tab.delete()
                deleted_count += 1

        return deleted_count

    def print_summary(self, total_modules, total_tabs, total_sections=0, deleted_sections=0, deleted_tabs=0):
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
        if deleted_tabs > 0:
            self.stdout.write(self.style.WARNING(f'  ELIMINADOS: {deleted_tabs} tabs obsoletos'))
        if deleted_sections > 0:
            self.stdout.write(self.style.WARNING(f'  ELIMINADAS: {deleted_sections} secciones obsoletas'))
        self.stdout.write('=' * 80)

        self.stdout.write('\n  VERIFICAR EN:')
        self.stdout.write('  GET /api/core/system-modules/sidebar/')
        self.stdout.write('  Frontend: El sidebar debería reflejar el nuevo orden')
        self.stdout.write('')
