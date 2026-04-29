"""
Management command para crear módulos del Nivel 2 en el sistema

Este comando crea los 3 módulos estratégicos del Nivel 2:

1. MOTOR DE CUMPLIMIENTO (motor_cumplimiento)
   - Matriz Legal
   - Requisitos Legales
   - Partes Interesadas
   - Reglamentos Internos

2. MOTOR DE RIESGOS (motor_riesgos)
   - Contexto Organizacional
   - Riesgos de Procesos
   - IPEVR (Identificación de Peligros y Evaluación de Riesgos)
   - Aspectos Ambientales
   - Riesgos Viales
   - SAGRILAFT/PTEE
   - Seguridad de la Información

3. WORKFLOW ENGINE (workflow_engine)
   - Diseñador de Flujos
   - Ejecución
   - Monitoreo

Uso:
    python manage.py seed_nivel2_modules
"""
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab


class Command(BaseCommand):
    help = 'Crea los módulos del Nivel 2 (Motor Cumplimiento, Motor Riesgos, Workflow Engine) en el sistema'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('⚙️  CREANDO MÓDULOS NIVEL 2 - MOTORES ESTRATÉGICOS'))
        self.stdout.write('=' * 70)

        # ==========================================================================
        # MOTOR DE CUMPLIMIENTO
        # ==========================================================================
        self.create_motor_cumplimiento()

        # ==========================================================================
        # MOTOR DE RIESGOS
        # ==========================================================================
        self.create_motor_riesgos()

        # ==========================================================================
        # WORKFLOW ENGINE
        # ==========================================================================
        self.create_workflow_engine()

        # ==========================================================================
        # RESUMEN FINAL
        # ==========================================================================
        self.print_summary()

    def create_motor_cumplimiento(self):
        """Crear módulo Motor de Cumplimiento y sus tabs"""
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('⚖️  MOTOR DE CUMPLIMIENTO'))
        self.stdout.write('=' * 70)

        # Crear módulo padre
        module_data = {
            'code': 'motor_cumplimiento',
            'name': 'Motor de Cumplimiento',
            'description': 'Sistema centralizado de gestión de cumplimiento legal y normativo. Matriz legal, requisitos, partes interesadas y reglamentos internos.',
            'category': 'INTEGRAL',
            'color': 'blue',
            'icon': 'Scale',
            'is_core': False,
            'is_enabled': True,
            'requires_license': False,
            'order': 30
        }

        module, created = SystemModule.objects.get_or_create(
            code=module_data['code'],
            defaults=module_data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Módulo creado: {module.name}')
            )
        else:
            for key, value in module_data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'↻ Módulo actualizado: {module.name}')
            )

        # Crear tabs
        tabs_data = [
            {
                'code': 'matriz_legal',
                'name': 'Matriz Legal',
                'description': 'Matriz de requisitos legales aplicables - Normativa colombiana e internacional',
                'icon': 'BookOpen',
                'order': 1,
            },
            {
                'code': 'requisitos_legales',
                'name': 'Requisitos Legales',
                'description': 'Gestión de cumplimiento de requisitos - Seguimiento, evaluación y evidencias',
                'icon': 'FileCheck',
                'order': 2,
            },
            # partes_interesadas ELIMINADO — fuente canónica en gestion_estrategica.contexto (ISO 9001:2015 §4.2)
            {
                'code': 'reglamentos_internos',
                'name': 'Reglamentos Internos',
                'description': 'Políticas, procedimientos y reglamentos internos de la organización',
                'icon': 'Gavel',
                'order': 3,
            },
        ]

        self.create_tabs(module, tabs_data)

    def create_motor_riesgos(self):
        """Crear módulo Motor de Riesgos y sus tabs"""
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('🛡️  MOTOR DE RIESGOS'))
        self.stdout.write('=' * 70)

        # Crear módulo padre
        module_data = {
            'code': 'motor_riesgos',
            'name': 'Motor de Riesgos',
            'description': 'Sistema integral de gestión de riesgos organizacionales. Contexto, riesgos operacionales, HSEQ, viales, SAGRILAFT y seguridad informática.',
            'category': 'INTEGRAL',
            'color': 'orange',
            'icon': 'AlertCircle',
            'is_core': False,
            'is_enabled': True,
            'requires_license': False,
            'order': 31
        }

        module, created = SystemModule.objects.get_or_create(
            code=module_data['code'],
            defaults=module_data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Módulo creado: {module.name}')
            )
        else:
            for key, value in module_data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'↻ Módulo actualizado: {module.name}')
            )

        # Crear tabs
        tabs_data = [
            {
                'code': 'contexto_organizacional',
                'name': 'Contexto Organizacional',
                'description': 'Análisis PESTEL, FODA y factores internos/externos que afectan la organización',
                'icon': 'Building2',
                'order': 1,
            },
            {
                'code': 'riesgos_procesos',
                'name': 'Riesgos de Procesos',
                'description': 'Identificación y evaluación de riesgos operacionales por proceso',
                'icon': 'GitBranch',
                'order': 2,
            },
            {
                'code': 'ipevr',
                'name': 'IPEVR',
                'description': 'Identificación de Peligros y Evaluación de Riesgos - Matriz GTC-45',
                'icon': 'ShieldAlert',
                'order': 3,
            },
            {
                'code': 'aspectos_ambientales',
                'name': 'Aspectos Ambientales',
                'description': 'Identificación de aspectos e impactos ambientales - ISO 14001',
                'icon': 'Leaf',
                'order': 4,
            },
            {
                'code': 'riesgos_viales',
                'name': 'Riesgos Viales',
                'description': 'Matriz de riesgos del Plan Estratégico de Seguridad Vial - PESV',
                'icon': 'Car',
                'order': 5,
            },
            {
                'code': 'sagrilaft_ptee',
                'name': 'SAGRILAFT/PTEE',
                'description': 'Sistema de Gestión del Riesgo de LA/FT y Financiación del Terrorismo',
                'icon': 'ShieldCheck',
                'order': 6,
            },
            {
                'code': 'seguridad_informacion',
                'name': 'Seguridad de la Información',
                'description': 'Riesgos de seguridad de la información - ISO 27001',
                'icon': 'Lock',
                'order': 7,
            },
        ]

        self.create_tabs(module, tabs_data)

    def create_workflow_engine(self):
        """Crear módulo Workflow Engine y sus tabs"""
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('🔀 WORKFLOW ENGINE'))
        self.stdout.write('=' * 70)

        # Crear módulo padre
        module_data = {
            'code': 'infra_workflow_engine',
            'name': 'Workflow Engine',
            'description': 'Motor de flujos de trabajo automatizados. Diseño, ejecución y monitoreo de procesos organizacionales.',
            'category': 'INTEGRAL',
            'color': 'purple',
            'icon': 'GitBranch',
            'is_core': False,
            'is_enabled': True,
            'requires_license': False,
            'order': 32
        }

        module, created = SystemModule.objects.get_or_create(
            code=module_data['code'],
            defaults=module_data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Módulo creado: {module.name}')
            )
        else:
            for key, value in module_data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'↻ Módulo actualizado: {module.name}')
            )

        # Crear tabs
        tabs_data = [
            {
                'code': 'disenador_flujos',
                'name': 'Diseñador de Flujos',
                'description': 'Editor visual de flujos de trabajo - Creación y configuración de workflows',
                'icon': 'PenTool',
                'order': 1,
            },
            {
                'code': 'ejecucion',
                'name': 'Ejecución',
                'description': 'Instancias activas de workflows - Seguimiento y gestión de tareas',
                'icon': 'Play',
                'order': 2,
            },
            {
                'code': 'monitoreo',
                'name': 'Monitoreo',
                'description': 'Analítica y reportes de workflows - KPIs, cuellos de botella y eficiencia',
                'icon': 'Activity',
                'order': 3,
            },
            {
                'code': 'firma_digital',
                'name': 'Firma Digital',
                'description': 'Gestión de firmas digitales - Asignación, firma con canvas SHA-256 y validación',
                'icon': 'PenTool',
                'order': 4,
            },
        ]

        self.create_tabs(module, tabs_data)

    def create_tabs(self, module, tabs_data):
        """Método auxiliar para crear tabs"""
        tabs_created = 0
        tabs_updated = 0

        for tab_data in tabs_data:
            tab, created = ModuleTab.objects.get_or_create(
                module=module,
                code=tab_data['code'],
                defaults={
                    'name': tab_data['name'],
                    'description': tab_data['description'],
                    'icon': tab_data['icon'],
                    'order': tab_data['order'],
                    'is_enabled': True,
                    'is_core': False,
                }
            )

            if created:
                tabs_created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Tab creado: {tab.name}')
                )
            else:
                tabs_updated += 1
                tab.name = tab_data['name']
                tab.description = tab_data['description']
                tab.icon = tab_data['icon']
                tab.order = tab_data['order']
                tab.save()
                self.stdout.write(
                    self.style.WARNING(f'  ↻ Tab actualizado: {tab.name}')
                )

        self.stdout.write(f'\n📊 Stats: {tabs_created} creados, {tabs_updated} actualizados')

    def print_summary(self):
        """Imprimir resumen final"""
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS('📊 RESUMEN FINAL'))
        self.stdout.write('=' * 70)

        modules = SystemModule.objects.filter(
            code__in=['motor_cumplimiento', 'motor_riesgos', 'infra_workflow_engine']
        ).order_by('order')

        for module in modules:
            self.stdout.write(f'\n📦 {module.name}')
            self.stdout.write(f'   Código: {module.code}')
            self.stdout.write(f'   Color: {module.color}')
            self.stdout.write(f'   Icono: {module.icon}')
            self.stdout.write(f'   Tabs: {module.tabs.count()}')

            self.stdout.write('\n   🌐 Rutas generadas:')
            for tab in module.tabs.all().order_by('order'):
                route = f"/{module.code.replace('_', '-')}/{tab.code.replace('_', '-')}"
                self.stdout.write(f'      - {route} → {tab.name}')

        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(
            self.style.SUCCESS('✓ Módulos del Nivel 2 configurados exitosamente')
        )
        self.stdout.write('=' * 70)

        self.stdout.write('\n💡 Próximos pasos:')
        self.stdout.write('   1. Verifica el sidebar en /core/system-modules/sidebar/')
        self.stdout.write('   2. Los 3 módulos deberían aparecer con sus tabs')
        self.stdout.write('   3. Motor de Cumplimiento: 4 tabs')
        self.stdout.write('   4. Motor de Riesgos: 7 tabs')
        self.stdout.write('   5. Workflow Engine: 3 tabs')
        self.stdout.write('')
