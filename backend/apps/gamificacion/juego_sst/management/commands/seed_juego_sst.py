"""
Seed para Juego SST: Los Héroes de la Seguridad
Crea el Nivel 1 (Planta Industrial) + 10 preguntas quiz SST

Módulo independiente — apps.gamificacion.juego_sst

Uso:
  python manage.py seed_juego_sst
  python manage.py seed_juego_sst --force  (recrear todo)
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.gamificacion.juego_sst.models import GameLevel, GameQuizQuestion


# =============================================================================
# NIVEL 1 DATA
# =============================================================================

NIVEL_1 = {
    'codigo': 'nivel-1-planta-industrial',
    'nombre': 'Planta Industrial RISKORP',
    'descripcion': (
        'Tu primera misión como Inspector SST. Explora la planta industrial '
        'RISKORP, identifica riesgos, recolecta el EPP necesario y demuestra '
        'tus conocimientos en seguridad y salud en el trabajo.'
    ),
    'zona': 'industria',
    'numero_nivel': 1,
    'puntos_completar': 500,
    'tiempo_limite_segundos': 600,
    'min_preguntas_correctas': 4,
    'total_epps': 5,
    'mapa_key': 'level-1',
    'orden': 1,
    'es_boss': False,
    'config': {
        'tile_size': 48,
        'map_cols': 20,
        'map_rows': 12,
        'npcs': 3,
        'collectibles': 5,
    },
}


# =============================================================================
# PREGUNTAS SST — Decreto 1072 / Resolución 0312 / ISO 45001
# =============================================================================

PREGUNTAS_NIVEL_1 = [
    {
        'pregunta': '¿Cuál es el principal objetivo del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)?',
        'opciones': [
            {'id': 'a', 'texto': 'Aumentar la producción de la empresa', 'es_correcta': False},
            {'id': 'b', 'texto': 'Prevenir lesiones y enfermedades laborales, y proporcionar lugares de trabajo seguros', 'es_correcta': True},
            {'id': 'c', 'texto': 'Reducir costos operativos', 'es_correcta': False},
            {'id': 'd', 'texto': 'Cumplir requisitos tributarios', 'es_correcta': False},
        ],
        'explicacion': 'El SG-SST busca anticipar, reconocer, evaluar y controlar los riesgos que puedan afectar la seguridad y salud en el trabajo (Decreto 1072 de 2015, Art. 2.2.4.6.4).',
        'norma_referencia': 'Decreto 1072 de 2015 - Art. 2.2.4.6.4',
        'categoria': 'normas',
        'dificultad': 'facil',
        'puntos': 100,
        'orden': 1,
    },
    {
        'pregunta': '¿Qué significa EPP en el contexto de seguridad industrial?',
        'opciones': [
            {'id': 'a', 'texto': 'Equipo de Protección Personal', 'es_correcta': True},
            {'id': 'b', 'texto': 'Evaluación de Procesos Productivos', 'es_correcta': False},
            {'id': 'c', 'texto': 'Estándar de Prevención Primaria', 'es_correcta': False},
            {'id': 'd', 'texto': 'Elemento de Producción Principal', 'es_correcta': False},
        ],
        'explicacion': 'EPP significa Equipo de Protección Personal. Son dispositivos, accesorios y vestimentas que protegen al trabajador de riesgos que puedan amenazar su seguridad o salud.',
        'norma_referencia': 'Resolución 2400 de 1979 - Título IV',
        'categoria': 'epp',
        'dificultad': 'facil',
        'puntos': 100,
        'orden': 2,
    },
    {
        'pregunta': '¿Cuál es la jerarquía correcta de controles para gestionar un riesgo laboral?',
        'opciones': [
            {'id': 'a', 'texto': 'EPP → Señalización → Capacitación → Eliminación', 'es_correcta': False},
            {'id': 'b', 'texto': 'Eliminación → Sustitución → Controles de ingeniería → Controles administrativos → EPP', 'es_correcta': True},
            {'id': 'c', 'texto': 'Capacitación → EPP → Eliminación → Sustitución', 'es_correcta': False},
            {'id': 'd', 'texto': 'Señalización → Capacitación → Sustitución → EPP', 'es_correcta': False},
        ],
        'explicacion': 'La jerarquía de controles establece que primero se debe intentar eliminar el riesgo, luego sustituir, aplicar controles de ingeniería, controles administrativos y como última medida el EPP (ISO 45001:2018, Cláusula 8.1.2).',
        'norma_referencia': 'ISO 45001:2018 - Cláusula 8.1.2',
        'categoria': 'riesgos',
        'dificultad': 'medio',
        'puntos': 150,
        'orden': 3,
    },
    {
        'pregunta': 'Al ingresar a una zona de riesgo químico, ¿qué EPP es INDISPENSABLE además del overol?',
        'opciones': [
            {'id': 'a', 'texto': 'Solo casco de seguridad', 'es_correcta': False},
            {'id': 'b', 'texto': 'Gafas de seguridad, guantes químicos y respirador', 'es_correcta': True},
            {'id': 'c', 'texto': 'Solo botas de seguridad', 'es_correcta': False},
            {'id': 'd', 'texto': 'Chaleco reflectivo', 'es_correcta': False},
        ],
        'explicacion': 'En zonas de riesgo químico se requiere protección respiratoria (respirador), protección ocular (gafas) y protección dérmica (guantes químicos) como mínimo, según la ficha de datos de seguridad del producto.',
        'norma_referencia': 'Resolución 2400 de 1979 - Arts. 176-201',
        'categoria': 'epp',
        'dificultad': 'medio',
        'puntos': 150,
        'orden': 4,
    },
    {
        'pregunta': '¿Cada cuánto tiempo debe realizarse la identificación de peligros y valoración de riesgos según el Decreto 1072?',
        'opciones': [
            {'id': 'a', 'texto': 'Cada 5 años', 'es_correcta': False},
            {'id': 'b', 'texto': 'Solo cuando ocurre un accidente', 'es_correcta': False},
            {'id': 'c', 'texto': 'Como mínimo una vez al año y cada vez que ocurra un cambio significativo', 'es_correcta': True},
            {'id': 'd', 'texto': 'Cada 3 años', 'es_correcta': False},
        ],
        'explicacion': 'La identificación de peligros y valoración de riesgos debe actualizarse como mínimo una vez al año, cuando ocurran accidentes mortales o eventos catastróficos, o cuando haya cambios en procesos o instalaciones.',
        'norma_referencia': 'Decreto 1072 de 2015 - Art. 2.2.4.6.15',
        'categoria': 'riesgos',
        'dificultad': 'medio',
        'puntos': 150,
        'orden': 5,
    },
    {
        'pregunta': '¿Qué debe hacer un trabajador si detecta una condición insegura en su área de trabajo?',
        'opciones': [
            {'id': 'a', 'texto': 'Ignorarla si no le afecta directamente', 'es_correcta': False},
            {'id': 'b', 'texto': 'Intentar repararla él mismo sin importar su capacitación', 'es_correcta': False},
            {'id': 'c', 'texto': 'Reportarla inmediatamente a su supervisor o al área de SST', 'es_correcta': True},
            {'id': 'd', 'texto': 'Esperar a la próxima inspección programada', 'es_correcta': False},
        ],
        'explicacion': 'Todo trabajador tiene el deber de reportar inmediatamente condiciones inseguras o actos subestándar. La comunicación oportuna previene accidentes (Decreto 1072, Art. 2.2.4.6.10).',
        'norma_referencia': 'Decreto 1072 de 2015 - Art. 2.2.4.6.10',
        'categoria': 'procedimientos',
        'dificultad': 'facil',
        'puntos': 100,
        'orden': 6,
    },
    {
        'pregunta': '¿Cuál de los siguientes NO es un tipo de peligro reconocido en la GTC 45?',
        'opciones': [
            {'id': 'a', 'texto': 'Peligro biológico', 'es_correcta': False},
            {'id': 'b', 'texto': 'Peligro psicosocial', 'es_correcta': False},
            {'id': 'c', 'texto': 'Peligro financiero', 'es_correcta': True},
            {'id': 'd', 'texto': 'Peligro biomecánico', 'es_correcta': False},
        ],
        'explicacion': 'La GTC 45 clasifica los peligros en: biológico, físico, químico, psicosocial, biomecánico, condiciones de seguridad y fenómenos naturales. El riesgo financiero no es un peligro ocupacional.',
        'norma_referencia': 'GTC 45:2012 - Tabla 1',
        'categoria': 'riesgos',
        'dificultad': 'facil',
        'puntos': 100,
        'orden': 7,
    },
    {
        'pregunta': '¿Qué significa la señalización de color ROJO en seguridad industrial?',
        'opciones': [
            {'id': 'a', 'texto': 'Información general', 'es_correcta': False},
            {'id': 'b', 'texto': 'Precaución o advertencia', 'es_correcta': False},
            {'id': 'c', 'texto': 'Prohibición, peligro o equipo contra incendios', 'es_correcta': True},
            {'id': 'd', 'texto': 'Obligación', 'es_correcta': False},
        ],
        'explicacion': 'El color rojo en señalización de seguridad indica prohibición, peligro, alarma o equipos de lucha contra incendios. El amarillo indica advertencia, el azul obligación y el verde información de seguridad.',
        'norma_referencia': 'NTC 1461 - Colores y señales de seguridad',
        'categoria': 'senalizacion',
        'dificultad': 'facil',
        'puntos': 100,
        'orden': 8,
    },
    {
        'pregunta': '¿Cuántas horas mínimas de capacitación en SST deben recibir los trabajadores según la Resolución 0312 de 2019 para empresas de más de 50 trabajadores?',
        'opciones': [
            {'id': 'a', 'texto': '10 horas anuales', 'es_correcta': False},
            {'id': 'b', 'texto': '20 horas anuales distribuidas en el plan de capacitación', 'es_correcta': False},
            {'id': 'c', 'texto': '50 horas de formación para el responsable del SG-SST, capacitación continua según el plan', 'es_correcta': True},
            {'id': 'd', 'texto': 'No hay mínimo establecido', 'es_correcta': False},
        ],
        'explicacion': 'La Resolución 0312 exige que el responsable del SG-SST cuente con 50 horas de capacitación en SST, y que exista un plan de capacitación anual para todos los trabajadores según los peligros identificados.',
        'norma_referencia': 'Resolución 0312 de 2019 - Estándar 4.1',
        'categoria': 'normas',
        'dificultad': 'dificil',
        'puntos': 200,
        'orden': 9,
    },
    {
        'pregunta': 'En caso de un accidente de trabajo, ¿cuál es el plazo máximo para reportarlo a la ARL?',
        'opciones': [
            {'id': 'a', 'texto': 'Dentro de las siguientes 72 horas', 'es_correcta': False},
            {'id': 'b', 'texto': 'Dentro de los 2 días hábiles siguientes', 'es_correcta': True},
            {'id': 'c', 'texto': 'Dentro de la semana siguiente', 'es_correcta': False},
            {'id': 'd', 'texto': 'Dentro de las primeras 24 horas', 'es_correcta': False},
        ],
        'explicacion': 'El empleador debe reportar el accidente de trabajo a la ARL dentro de los 2 días hábiles siguientes a la ocurrencia del evento, según el Decreto 1072 de 2015.',
        'norma_referencia': 'Decreto 1072 de 2015 - Art. 2.2.4.1.6',
        'categoria': 'procedimientos',
        'dificultad': 'medio',
        'puntos': 150,
        'orden': 10,
    },
]


class Command(BaseCommand):
    help = 'Seed Juego SST: Nivel 1 (Planta Industrial) + 10 preguntas quiz SST'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar recreación de preguntas existentes',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('  SEED: Juego SST — Los Héroes de la Seguridad'))
        self.stdout.write(self.style.SUCCESS('  Nivel 1: Planta Industrial RISKORP + 10 preguntas'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        try:
            with transaction.atomic():
                # 1. Crear o actualizar Nivel 1
                nivel, nivel_created = GameLevel.objects.update_or_create(
                    codigo=NIVEL_1['codigo'],
                    defaults={
                        'nombre': NIVEL_1['nombre'],
                        'descripcion': NIVEL_1['descripcion'],
                        'zona': NIVEL_1['zona'],
                        'numero_nivel': NIVEL_1['numero_nivel'],
                        'puntos_completar': NIVEL_1['puntos_completar'],
                        'tiempo_limite_segundos': NIVEL_1['tiempo_limite_segundos'],
                        'min_preguntas_correctas': NIVEL_1['min_preguntas_correctas'],
                        'total_epps': NIVEL_1['total_epps'],
                        'mapa_key': NIVEL_1['mapa_key'],
                        'orden': NIVEL_1['orden'],
                        'es_boss': NIVEL_1['es_boss'],
                        'config': NIVEL_1['config'],
                    },
                )

                if nivel_created:
                    self.stdout.write(self.style.SUCCESS(f'  [+] Nivel creado: {nivel.nombre}'))
                else:
                    self.stdout.write(self.style.HTTP_INFO(f'  [~] Nivel actualizado: {nivel.nombre}'))

                # 2. Crear preguntas
                created_count = 0
                updated_count = 0
                skipped_count = 0

                for pregunta_data in PREGUNTAS_NIVEL_1:
                    existing = GameQuizQuestion.objects.filter(
                        nivel=nivel, orden=pregunta_data['orden']
                    ).first()

                    if existing and not force:
                        skipped_count += 1
                        continue

                    defaults = {
                        'pregunta': pregunta_data['pregunta'],
                        'opciones': pregunta_data['opciones'],
                        'explicacion': pregunta_data['explicacion'],
                        'norma_referencia': pregunta_data['norma_referencia'],
                        'categoria': pregunta_data['categoria'],
                        'dificultad': pregunta_data['dificultad'],
                        'puntos': pregunta_data['puntos'],
                    }

                    if existing and force:
                        for key, value in defaults.items():
                            setattr(existing, key, value)
                        existing.save()
                        updated_count += 1
                    else:
                        GameQuizQuestion.objects.create(
                            nivel=nivel,
                            orden=pregunta_data['orden'],
                            **defaults,
                        )
                        created_count += 1

                # Summary
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS(f'  [+] Preguntas creadas: {created_count}'))
                if updated_count:
                    self.stdout.write(self.style.HTTP_INFO(f'  [~] Preguntas actualizadas: {updated_count}'))
                if skipped_count:
                    self.stdout.write(f'  [SKIP] Preguntas existentes: {skipped_count}')
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS('  Seed completado exitosamente!'))
                self.stdout.write('')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n  [ERROR] {str(e)}\n'))
            raise
