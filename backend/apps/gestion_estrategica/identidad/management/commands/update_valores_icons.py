"""
Comando para actualizar iconos de valores corporativos existentes.

Ejecutar con:
    python manage.py update_valores_icons
"""
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.identidad.models import CorporateValue


class Command(BaseCommand):
    help = 'Actualiza los iconos de valores corporativos que estan vacios'

    def handle(self, *args, **options):
        self.stdout.write('Actualizando iconos de valores corporativos...')

        # Mapeo de nombres a iconos de Lucide React
        icon_mapping = {
            # Valores comunes
            'integridad': 'Shield',
            'honestidad': 'Shield',
            'compromiso': 'Heart',
            'responsabilidad': 'CheckCircle',
            'excelencia': 'Star',
            'calidad': 'Award',
            'trabajo en equipo': 'Users',
            'colaboracion': 'Users',
            'innovacion': 'Lightbulb',
            'creatividad': 'Sparkles',
            'sostenibilidad': 'Leaf',
            'medio ambiente': 'TreePine',
            'respeto': 'HeartHandshake',
            'lealtad': 'Shield',
            'transparencia': 'Eye',
            'seguridad': 'ShieldCheck',
            'servicio': 'Headphones',
            'liderazgo': 'Crown',
            'profesionalismo': 'Briefcase',
            'puntualidad': 'Clock',
            'eficiencia': 'Gauge',
            'confianza': 'Lock',
            'pasion': 'Flame',
            'perseverancia': 'Mountain',
            'humildad': 'Heart',
            'solidaridad': 'HandHeart',
            'equidad': 'Scale',
            'justicia': 'Scale',
        }

        # Icono por defecto si no hay match
        default_icons = ['Heart', 'Star', 'Shield', 'Award', 'Gem', 'Sparkles']

        valores = CorporateValue.objects.filter(icon__isnull=True) | CorporateValue.objects.filter(icon='')
        total = valores.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS('Todos los valores ya tienen iconos asignados'))
            return

        updated = 0
        for idx, valor in enumerate(valores):
            # Buscar por nombre (case insensitive)
            name_lower = valor.name.lower().strip()
            icon = icon_mapping.get(name_lower)

            if not icon:
                # Buscar coincidencia parcial
                for key, value in icon_mapping.items():
                    if key in name_lower or name_lower in key:
                        icon = value
                        break

            if not icon:
                # Usar icono por defecto basado en el orden
                icon = default_icons[idx % len(default_icons)]

            valor.icon = icon
            valor.save(update_fields=['icon'])
            updated += 1
            self.stdout.write(f'  [+] "{valor.name}" -> {icon}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Actualizados {updated} de {total} valores'))
