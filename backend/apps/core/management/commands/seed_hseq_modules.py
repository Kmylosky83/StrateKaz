"""
Management command para crear módulos HSEQ Management en el sistema

Este comando crea:
1. Un módulo padre "HSEQ Management" (Torre de Control HSEQ)
2. 11 tabs hijos correspondiendo a cada app HSEQ:
   - Sistema Documental
   - Planificación del Sistema
   - Gestión de Calidad
   - Medicina Laboral
   - Seguridad Industrial
   - Higiene Industrial
   - Gestión de Comités
   - Accidentalidad
   - Gestión de Emergencias
   - Gestión Ambiental
   - Mejora Continua

Uso:
    python manage.py seed_hseq_modules
"""
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab


class Command(BaseCommand):
    help = 'Crea el módulo HSEQ Management y sus tabs en el sistema'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('🏭 CREANDO MÓDULO HSEQ MANAGEMENT'))
        self.stdout.write('=' * 70)

        # ==========================================================================
        # 1. CREAR MÓDULO PADRE: HSEQ MANAGEMENT
        # ==========================================================================
        self.stdout.write('\n📦 MÓDULO PRINCIPAL:')

        module_data = {
            'code': 'hseq_management',
            'name': 'HSEQ Management',
            'description': 'Torre de Control HSEQ - Sistema integrado de gestión en Salud, Seguridad, Medio Ambiente y Calidad. Cumplimiento normativo, prevención de riesgos y mejora continua.',
            'category': 'INTEGRAL',
            'color': 'teal',
            'icon': 'ShieldCheck',
            'is_core': False,
            'is_enabled': True,
            'requires_license': False,
            'order': 20
        }

        module, created = SystemModule.objects.get_or_create(
            code=module_data['code'],
            defaults=module_data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Módulo creado: {module.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'  - Ya existe: {module.name}')
            )
            # Actualizar campos si ya existe
            for key, value in module_data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'  ↻ Módulo actualizado: {module.name}')
            )

        # ==========================================================================
        # 2. CREAR TABS (11 APPS HSEQ)
        # ==========================================================================
        self.stdout.write('\n📑 TABS DEL MÓDULO:')

        tabs_data = [
            {
                'code': 'sistema_documental',
                'name': 'Sistema Documental',
                'description': 'Gestión documental HSEQ - Control de documentos, registros y versiones',
                'icon': 'FolderTree',
                'order': 1,
            },
            {
                'code': 'planificacion_sistema',
                'name': 'Planificación del Sistema',
                'description': 'Planificación estratégica HSEQ - Objetivos, metas y programas de gestión',
                'icon': 'Calendar',
                'order': 2,
            },
            {
                'code': 'calidad',
                'name': 'Gestión de Calidad',
                'description': 'Sistema de gestión de calidad - ISO 9001, procesos y mejora continua',
                'icon': 'Award',
                'order': 3,
            },
            {
                'code': 'medicina_laboral',
                'name': 'Medicina Laboral',
                'description': 'Salud ocupacional - Exámenes médicos, vigilancia epidemiológica y bienestar',
                'icon': 'Stethoscope',
                'order': 4,
            },
            {
                'code': 'seguridad_industrial',
                'name': 'Seguridad Industrial',
                'description': 'Seguridad en el trabajo - Inspecciones, permisos de trabajo y control de riesgos',
                'icon': 'HardHat',
                'order': 5,
            },
            {
                'code': 'higiene_industrial',
                'name': 'Higiene Industrial',
                'description': 'Higiene ocupacional - Monitoreo ambiental, agentes físicos y químicos',
                'icon': 'Droplet',
                'order': 6,
            },
            {
                'code': 'gestion_comites',
                'name': 'Gestión de Comités HSEQ',
                'description': 'Comités y reuniones - COPASST, Comité de Convivencia, Brigada de Emergencias',
                'icon': 'Users',
                'order': 7,
            },
            {
                'code': 'accidentalidad',
                'name': 'Accidentalidad',
                'description': 'Investigación de incidentes - Accidentes, incidentes y casi-accidentes',
                'icon': 'AlertTriangle',
                'order': 8,
            },
            {
                'code': 'emergencias',
                'name': 'Gestión de Emergencias',
                'description': 'Plan de emergencias - Simulacros, brigadas y respuesta ante emergencias',
                'icon': 'Siren',
                'order': 9,
            },
            {
                'code': 'gestion_ambiental',
                'name': 'Gestión Ambiental',
                'description': 'Sistema de gestión ambiental - ISO 14001, aspectos e impactos ambientales',
                'icon': 'Leaf',
                'order': 10,
            },
            {
                'code': 'mejora_continua',
                'name': 'Mejora Continua',
                'description': 'Acciones correctivas y preventivas - No conformidades, auditorías y PHVA',
                'icon': 'TrendingUp',
                'order': 11,
            },
        ]

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
                    self.style.SUCCESS(f'  ✓ Tab creado: {tab.name} ({tab.code})')
                )
            else:
                tabs_updated += 1
                # Actualizar campos si ya existe
                tab.name = tab_data['name']
                tab.description = tab_data['description']
                tab.icon = tab_data['icon']
                tab.order = tab_data['order']
                tab.save()
                self.stdout.write(
                    self.style.WARNING(f'  ↻ Tab actualizado: {tab.name} ({tab.code})')
                )

        # ==========================================================================
        # 3. RESUMEN FINAL
        # ==========================================================================
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS('RESUMEN FINAL'))
        self.stdout.write('=' * 70)

        self.stdout.write(f'\n📦 Módulo: {module.name}')
        self.stdout.write(f'   - Código: {module.code}')
        self.stdout.write(f'   - Categoría: {module.get_category_display()}')
        self.stdout.write(f'   - Color: {module.color}')
        self.stdout.write(f'   - Icono: {module.icon}')
        self.stdout.write(f'   - Habilitado: {"Sí" if module.is_enabled else "No"}')
        self.stdout.write(f'   - Orden: {module.order}')

        self.stdout.write(f'\n📑 Tabs creados: {tabs_created}')
        self.stdout.write(f'📝 Tabs actualizados: {tabs_updated}')
        self.stdout.write(f'📊 Total tabs: {module.tabs.count()}')

        self.stdout.write('\n🌐 Rutas generadas:')
        for tab in module.tabs.all().order_by('order'):
            route = f"/hseq-management/{tab.code.replace('_', '-')}"
            self.stdout.write(f'   - {route} → {tab.name}')

        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(
            self.style.SUCCESS('✓ Módulo HSEQ Management configurado exitosamente')
        )
        self.stdout.write('=' * 70)

        self.stdout.write('\n💡 Próximos pasos:')
        self.stdout.write('   1. Verifica el sidebar en /core/system-modules/sidebar/')
        self.stdout.write('   2. El módulo debería aparecer con sus 11 tabs')
        self.stdout.write('   3. Navega a cada ruta para verificar las apps')
        self.stdout.write('')
