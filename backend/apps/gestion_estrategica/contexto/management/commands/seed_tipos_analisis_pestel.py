"""
Comando para poblar tipos de análisis PESTEL (catálogo base).

Ejecutar con:
    python manage.py seed_tipos_analisis_pestel

Catálogo basado en mejores prácticas de análisis del entorno externo y
requerimientos ISO 9001:2015 Cláusula 4.1 - Contexto Organizacional.
"""
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.contexto.models import TipoAnalisisPESTEL


class Command(BaseCommand):
    help = 'Pobla el catálogo de tipos de análisis PESTEL'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seed de Tipos de Análisis PESTEL...')

        # =====================================================================
        # CATÁLOGO DE TIPOS DE ANÁLISIS PESTEL
        # Basado en mejores prácticas de análisis estratégico del entorno
        # =====================================================================
        tipos_data = [
            {
                'codigo': 'MACRO',
                'nombre': 'Macro-Entorno General',
                'descripcion': 'Análisis integral del entorno externo. '
                               'Evalúa todos los factores PESTEL que afectan '
                               'a la organización a nivel macro.',
                'icono': 'Globe2',
                'color': 'cyan',
                'orden': 1,
            },
            {
                'codigo': 'ANUAL',
                'nombre': 'Análisis Anual',
                'descripcion': 'Revisión anual del entorno externo. '
                               'Actualización periódica para el plan estratégico.',
                'icono': 'Calendar',
                'color': 'blue',
                'orden': 2,
            },
            {
                'codigo': 'SECTOR',
                'nombre': 'Sectorial/Industria',
                'descripcion': 'Análisis enfocado en el sector o industria específica. '
                               'Evalúa factores que afectan directamente al rubro.',
                'icono': 'Factory',
                'color': 'purple',
                'orden': 3,
            },
            {
                'codigo': 'MERCADO',
                'nombre': 'Por Mercado Geográfico',
                'descripcion': 'Análisis de un mercado geográfico específico. '
                               'Útil para evaluación de expansión regional/internacional.',
                'icono': 'MapPin',
                'color': 'green',
                'orden': 4,
            },
            {
                'codigo': 'PAIS',
                'nombre': 'Por País',
                'descripcion': 'Análisis del entorno de un país específico. '
                               'Para operaciones internacionales o exportación.',
                'icono': 'Flag',
                'color': 'teal',
                'orden': 5,
            },
            {
                'codigo': 'EXPANSION',
                'nombre': 'Pre-Expansión',
                'descripcion': 'Análisis previo a expansión a nuevos mercados. '
                               'Evalúa viabilidad y riesgos del nuevo entorno.',
                'icono': 'Expand',
                'color': 'orange',
                'orden': 6,
            },
            {
                'codigo': 'INVERSION',
                'nombre': 'Pre-Inversión',
                'descripcion': 'Análisis previo a decisiones de inversión. '
                               'Evalúa estabilidad y tendencias del entorno.',
                'icono': 'TrendingUp',
                'color': 'emerald',
                'orden': 7,
            },
            {
                'codigo': 'CRISIS',
                'nombre': 'Análisis de Crisis',
                'descripcion': 'Evaluación del entorno durante situaciones de crisis. '
                               'Identifica amenazas y oportunidades emergentes.',
                'icono': 'AlertTriangle',
                'color': 'red',
                'orden': 8,
            },
            {
                'codigo': 'REGULAT',
                'nombre': 'Enfoque Regulatorio',
                'descripcion': 'Análisis enfocado en cambios legales y regulatorios. '
                               'Para sectores altamente regulados.',
                'icono': 'Scale',
                'color': 'amber',
                'orden': 9,
            },
            {
                'codigo': 'TECNOL',
                'nombre': 'Enfoque Tecnológico',
                'descripcion': 'Análisis con énfasis en tendencias tecnológicas. '
                               'Para industrias de alta innovación.',
                'icono': 'Cpu',
                'color': 'indigo',
                'orden': 10,
            },
        ]

        created_count = 0
        updated_count = 0

        for tipo_data in tipos_data:
            tipo, created = TipoAnalisisPESTEL.objects.update_or_create(
                codigo=tipo_data['codigo'],
                defaults={
                    'nombre': tipo_data['nombre'],
                    'descripcion': tipo_data['descripcion'],
                    'icono': tipo_data['icono'],
                    'color': tipo_data['color'],
                    'orden': tipo_data['orden'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'  [+] Tipo "{tipo.nombre}" creado')
            else:
                updated_count += 1
                self.stdout.write(f'  [~] Tipo "{tipo.nombre}" actualizado')

        # =====================================================================
        # RESUMEN
        # =====================================================================
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('SEED DE TIPOS DE ANÁLISIS PESTEL COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        total = TipoAnalisisPESTEL.objects.filter(is_active=True).count()

        self.stdout.write(f'''
Resultados:
  - Tipos creados: {created_count}
  - Tipos actualizados: {updated_count}
  - Total activos: {total}

Para probar:
  1. Ir a Dirección Estratégica > Contexto > PESTEL
  2. Crear nuevo análisis PESTEL
  3. Verificar que los tipos aparecen en el dropdown
        ''')
