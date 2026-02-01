"""
Management command para actualizar el icono de un tab específico de HSEQ

Uso:
    python manage.py update_hseq_icon <tab_code> <nuevo_icono>

Ejemplos:
    python manage.py update_hseq_icon emergencias Ambulance
    python manage.py update_hseq_icon calidad Star
    python manage.py update_hseq_icon sistema_documental FileText
"""
from django.core.management.base import BaseCommand, CommandError
from apps.core.models import SystemModule, ModuleTab


class Command(BaseCommand):
    help = 'Actualiza el icono de un tab HSEQ Management'

    def add_arguments(self, parser):
        parser.add_argument(
            'tab_code',
            type=str,
            help='Código del tab a actualizar (ej: emergencias, calidad)'
        )
        parser.add_argument(
            'icon_name',
            type=str,
            help='Nombre del icono de Lucide React (ej: Ambulance, Star)'
        )

    def handle(self, *args, **options):
        tab_code = options['tab_code']
        icon_name = options['icon_name']

        self.stdout.write('=' * 60)
        self.stdout.write(self.style.MIGRATE_HEADING('🎨 ACTUALIZAR ICONO HSEQ TAB'))
        self.stdout.write('=' * 60)

        # Verificar que el módulo HSEQ existe
        try:
            module = SystemModule.objects.get(code='hseq_management')
        except SystemModule.DoesNotExist:
            raise CommandError(
                'Módulo HSEQ Management no encontrado. '
                'Ejecuta primero: python manage.py seed_hseq_modules'
            )

        # Buscar el tab
        try:
            tab = ModuleTab.objects.get(module=module, code=tab_code)
        except ModuleTab.DoesNotExist:
            # Mostrar tabs disponibles
            available_tabs = module.tabs.all().values_list('code', flat=True)
            self.stdout.write(
                self.style.ERROR(f'\n❌ Tab "{tab_code}" no encontrado')
            )
            self.stdout.write('\n📑 Tabs disponibles:')
            for t in available_tabs:
                self.stdout.write(f'   - {t}')
            raise CommandError('Tab no encontrado')

        # Guardar icono anterior
        old_icon = tab.icon

        # Actualizar icono
        tab.icon = icon_name
        tab.save(update_fields=['icon', 'updated_at'])

        # Confirmar cambio
        self.stdout.write(f'\n✅ Icono actualizado exitosamente')
        self.stdout.write(f'\n📋 Tab: {tab.name}')
        self.stdout.write(f'   - Código: {tab.code}')
        self.stdout.write(f'   - Icono anterior: {old_icon}')
        self.stdout.write(f'   - Icono nuevo: {icon_name}')

        route = f"/hseq-management/{tab.code.replace('_', '-')}"
        self.stdout.write(f'   - Ruta: {route}')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✓ Cambio completado'))
        self.stdout.write('=' * 60)

        self.stdout.write('\n💡 Próximos pasos:')
        self.stdout.write('   1. Verifica el nuevo icono en Lucide React')
        self.stdout.write('      https://lucide.dev/icons/')
        self.stdout.write('   2. Recarga el frontend para ver el cambio')
        self.stdout.write('   3. Si el icono no existe, revertir con:')
        self.stdout.write(f'      python manage.py update_hseq_icon {tab_code} {old_icon}')
        self.stdout.write('')
