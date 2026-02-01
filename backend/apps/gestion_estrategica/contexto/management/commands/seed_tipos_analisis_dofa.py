"""
Comando para poblar tipos de análisis DOFA (catálogo base).

Ejecutar con:
    python manage.py seed_tipos_analisis_dofa

Catálogo basado en mejores prácticas de análisis estratégico y
requerimientos ISO 9001:2015 Cláusula 4.1 - Contexto Organizacional.
"""
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.contexto.models import TipoAnalisisDOFA


class Command(BaseCommand):
    help = 'Pobla el catálogo de tipos de análisis DOFA'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seed de Tipos de Análisis DOFA...')

        # =====================================================================
        # CATÁLOGO DE TIPOS DE ANÁLISIS DOFA
        # Basado en mejores prácticas de gestión estratégica
        # =====================================================================
        tipos_data = [
            {
                'codigo': 'ORG',
                'nombre': 'Organizacional',
                'descripcion': 'Análisis general de toda la organización. '
                               'Evalúa fortalezas, debilidades, oportunidades y amenazas '
                               'a nivel corporativo.',
                'icono': 'Building2',
                'color': 'purple',
                'orden': 1,
            },
            {
                'codigo': 'ANUAL',
                'nombre': 'Estratégico Anual',
                'descripcion': 'Revisión anual del contexto estratégico. '
                               'Realizado durante la planeación estratégica anual '
                               'como insumo para definición de objetivos.',
                'icono': 'Calendar',
                'color': 'blue',
                'orden': 2,
            },
            {
                'codigo': 'TRIM',
                'nombre': 'Revisión Trimestral',
                'descripcion': 'Actualización trimestral del análisis DOFA. '
                               'Permite ajustes ágiles a cambios en el entorno.',
                'icono': 'CalendarDays',
                'color': 'cyan',
                'orden': 3,
            },
            {
                'codigo': 'AREA',
                'nombre': 'Por Área/Departamento',
                'descripcion': 'Análisis específico de un área o departamento. '
                               'Identifica factores internos y externos que afectan '
                               'al área en particular.',
                'icono': 'Users',
                'color': 'green',
                'orden': 4,
            },
            {
                'codigo': 'PROC',
                'nombre': 'Por Proceso',
                'descripcion': 'Análisis enfocado en un proceso específico del SGC. '
                               'Útil para identificar mejoras en procesos críticos.',
                'icono': 'GitBranch',
                'color': 'teal',
                'orden': 5,
            },
            {
                'codigo': 'PROY',
                'nombre': 'Por Proyecto',
                'descripcion': 'Análisis vinculado a un proyecto específico. '
                               'Evalúa viabilidad y riesgos del proyecto.',
                'icono': 'FolderKanban',
                'color': 'orange',
                'orden': 6,
            },
            {
                'codigo': 'PROD',
                'nombre': 'Por Producto/Servicio',
                'descripcion': 'Análisis de un producto o línea de servicio. '
                               'Evalúa posicionamiento y competitividad.',
                'icono': 'Package',
                'color': 'amber',
                'orden': 7,
            },
            {
                'codigo': 'PRE_AUD',
                'nombre': 'Pre-Auditoría',
                'descripcion': 'Análisis previo a auditorías de certificación ISO. '
                               'Identifica gaps y áreas de mejora antes de la auditoría.',
                'icono': 'ClipboardCheck',
                'color': 'red',
                'orden': 8,
            },
            {
                'codigo': 'REV_DIR',
                'nombre': 'Revisión por Dirección',
                'descripcion': 'Análisis preparatorio para la Revisión por la Dirección. '
                               'Insumo para ISO 9001:2015 Cláusula 9.3.',
                'icono': 'Presentation',
                'color': 'indigo',
                'orden': 9,
            },
            {
                'codigo': 'MERC',
                'nombre': 'Análisis de Mercado',
                'descripcion': 'Análisis enfocado en el mercado y la competencia. '
                               'Complementa análisis Porter y PESTEL.',
                'icono': 'TrendingUp',
                'color': 'emerald',
                'orden': 10,
            },
        ]

        created_count = 0
        updated_count = 0

        for tipo_data in tipos_data:
            tipo, created = TipoAnalisisDOFA.objects.update_or_create(
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
        self.stdout.write(self.style.SUCCESS('SEED DE TIPOS DE ANÁLISIS DOFA COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        total = TipoAnalisisDOFA.objects.filter(is_active=True).count()

        self.stdout.write(f'''
Resultados:
  - Tipos creados: {created_count}
  - Tipos actualizados: {updated_count}
  - Total activos: {total}

Para probar:
  1. Ir a Dirección Estratégica > Contexto > DOFA
  2. Crear nuevo análisis DOFA
  3. Verificar que los tipos aparecen en el dropdown
        ''')
