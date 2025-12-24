"""
Management command para verificar la configuración de módulos HSEQ Management

Verifica:
1. Existencia del módulo HSEQ Management
2. Existencia de los 11 tabs
3. Estado de habilitación
4. Rutas generadas
5. Iconos configurados

Uso:
    python manage.py verify_hseq_modules
"""
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab


class Command(BaseCommand):
    help = 'Verifica la configuración del módulo HSEQ Management'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('🔍 VERIFICACIÓN MÓDULO HSEQ MANAGEMENT'))
        self.stdout.write('=' * 70)

        # Verificar módulo principal
        try:
            module = SystemModule.objects.get(code='hseq_management')
            self.stdout.write('\n✅ MÓDULO PRINCIPAL ENCONTRADO')
            self.stdout.write(f'   - Nombre: {module.name}')
            self.stdout.write(f'   - Código: {module.code}')
            self.stdout.write(f'   - Categoría: {module.get_category_display()}')
            self.stdout.write(f'   - Color: {module.color}')
            self.stdout.write(f'   - Icono: {module.icon}')
            self.stdout.write(f'   - Habilitado: {"✓ Sí" if module.is_enabled else "✗ No"}')
            self.stdout.write(f'   - Es Core: {"Sí" if module.is_core else "No"}')
            self.stdout.write(f'   - Orden: {module.order}')
        except SystemModule.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('\n❌ ERROR: Módulo HSEQ Management no encontrado')
            )
            self.stdout.write('   Ejecuta: python manage.py seed_hseq_modules')
            return

        # Verificar tabs
        tabs = module.tabs.all().order_by('order')
        total_tabs = tabs.count()

        self.stdout.write(f'\n📊 TABS ENCONTRADOS: {total_tabs}/11')

        if total_tabs == 0:
            self.stdout.write(
                self.style.ERROR('   ❌ No se encontraron tabs')
            )
            self.stdout.write('   Ejecuta: python manage.py seed_hseq_modules')
            return

        # Tabs esperados
        expected_tabs = [
            'sistema_documental',
            'planificacion_sistema',
            'calidad',
            'medicina_laboral',
            'seguridad_industrial',
            'higiene_industrial',
            'gestion_comites',
            'accidentalidad',
            'emergencias',
            'gestion_ambiental',
            'mejora_continua',
        ]

        found_codes = set(tabs.values_list('code', flat=True))
        expected_codes = set(expected_tabs)

        missing = expected_codes - found_codes
        extra = found_codes - expected_codes

        if missing:
            self.stdout.write(
                self.style.WARNING(f'\n⚠️  Tabs faltantes: {", ".join(missing)}')
            )

        if extra:
            self.stdout.write(
                self.style.WARNING(f'\n⚠️  Tabs extra (no esperados): {", ".join(extra)}')
            )

        # Detalle de cada tab
        self.stdout.write('\n📑 DETALLE DE TABS:')
        self.stdout.write('-' * 70)

        for tab in tabs:
            route = f"/hseq-management/{tab.code.replace('_', '-')}"
            status = "✓" if tab.is_enabled else "✗"
            icon_status = "✓" if tab.icon else "✗"

            self.stdout.write(f'\n  {tab.order}. {tab.name}')
            self.stdout.write(f'     - Código: {tab.code}')
            self.stdout.write(f'     - Ruta: {route}')
            self.stdout.write(f'     - Icono: {tab.icon} {icon_status}')
            self.stdout.write(f'     - Habilitado: {status}')
            self.stdout.write(f'     - Es Core: {"Sí" if tab.is_core else "No"}')

        # Resumen final
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write('📈 RESUMEN')
        self.stdout.write('=' * 70)

        enabled_tabs = tabs.filter(is_enabled=True).count()
        tabs_with_icons = tabs.exclude(icon__isnull=True).exclude(icon='').count()

        self.stdout.write(f'\n📦 Módulo: {"✓ OK" if module.is_enabled else "✗ Deshabilitado"}')
        self.stdout.write(f'📊 Tabs totales: {total_tabs}')
        self.stdout.write(f'✓ Tabs habilitados: {enabled_tabs}')
        self.stdout.write(f'🎨 Tabs con icono: {tabs_with_icons}')

        # Estado general
        if (total_tabs == 11 and
            enabled_tabs == 11 and
            tabs_with_icons == 11 and
            module.is_enabled and
            not missing):
            self.stdout.write('\n' + '=' * 70)
            self.stdout.write(
                self.style.SUCCESS('✅ CONFIGURACIÓN COMPLETA Y CORRECTA')
            )
            self.stdout.write('=' * 70)
            self.stdout.write('\n💡 El módulo está listo para usarse')
            self.stdout.write('   Verifica en: /api/core/system-modules/sidebar/')
        else:
            self.stdout.write('\n' + '=' * 70)
            self.stdout.write(
                self.style.WARNING('⚠️  CONFIGURACIÓN INCOMPLETA')
            )
            self.stdout.write('=' * 70)
            self.stdout.write('\n💡 Ejecuta el siguiente comando para corregir:')
            self.stdout.write('   python manage.py seed_hseq_modules')

        # Verificar API endpoint (simulación)
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write('🌐 SIMULACIÓN DE ESTRUCTURA API')
        self.stdout.write('=' * 70)

        self.stdout.write('\nEndpoint: GET /api/core/system-modules/sidebar/')
        self.stdout.write('\nEstructura esperada para HSEQ Management:')

        self.stdout.write("""
{
  "code": "hseq_management",
  "name": "HSEQ Management",
  "icon": "ShieldCheck",
  "color": "teal",
  "route": null,
  "is_category": false,
  "children": [""")

        for i, tab in enumerate(tabs[:3]):  # Mostrar solo 3 como ejemplo
            route = f"/hseq-management/{tab.code.replace('_', '-')}"
            comma = "," if i < 2 else ""
            self.stdout.write(f"""    {{
      "code": "{tab.code}",
      "name": "{tab.name}",
      "icon": "{tab.icon}",
      "color": "teal",
      "route": "{route}",
      "is_category": false,
      "children": null
    }}{comma}""")

        if total_tabs > 3:
            self.stdout.write(f"    ... ({total_tabs - 3} tabs más)")

        self.stdout.write("""  ]
}
        """)

        # Iconos de Lucide React
        self.stdout.write('=' * 70)
        self.stdout.write('🎨 ICONOS DE LUCIDE REACT')
        self.stdout.write('=' * 70)

        all_icons = set([module.icon] + list(tabs.values_list('icon', flat=True)))
        all_icons.discard(None)
        all_icons.discard('')

        self.stdout.write(f'\nIconos utilizados ({len(all_icons)}):')
        for icon in sorted(all_icons):
            self.stdout.write(f'  - {icon}')

        self.stdout.write('\n💡 Verifica que estos iconos existan en lucide-react')
        self.stdout.write('   Documentación: https://lucide.dev/icons/')

        self.stdout.write('\n')
