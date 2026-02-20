"""
Seed command para crear plantillas psicometricas pre-configuradas.

Crea 2 plantillas tipo 'psicometrico' reutilizando PlantillaPruebaDinamica:
1. Test DISC (4 dimensiones: Dominancia, Influencia, Estabilidad, Cumplimiento)
2. Test Big Five (5 dimensiones: Apertura, Responsabilidad, Extraversion, Amabilidad, Neuroticismo)

Las preguntas usan escala Likert 1-5 (NUMBER tipo_campo).
scoring_config define las escalas/dimensiones para interpretacion frontend (radar chart).

Uso:
  python manage.py seed_plantillas_psicometricas
  # O con migrate_schemas:
  DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas --schema=tenant_xxx seed_plantillas_psicometricas
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# ============================================================================
# DISC - 4 dimensiones, 20 preguntas (5 por dimension)
# ============================================================================

DISC_CAMPOS = [
    # Dominancia (D) - preguntas 1-5
    {
        'nombre_campo': 'd1',
        'etiqueta': 'Me siento cómodo tomando decisiones rápidas y asumiendo el control',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 1,
    },
    {
        'nombre_campo': 'd2',
        'etiqueta': 'Prefiero los resultados por encima de los procesos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 2,
    },
    {
        'nombre_campo': 'd3',
        'etiqueta': 'Me gusta enfrentar desafíos y superar obstáculos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 3,
    },
    {
        'nombre_campo': 'd4',
        'etiqueta': 'Soy directo y franco al comunicarme con los demás',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 4,
    },
    {
        'nombre_campo': 'd5',
        'etiqueta': 'Busco ganar y ser competitivo en lo que hago',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 5,
    },
    # Influencia (I) - preguntas 6-10
    {
        'nombre_campo': 'i1',
        'etiqueta': 'Disfruto persuadir y motivar a otras personas',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 6,
    },
    {
        'nombre_campo': 'i2',
        'etiqueta': 'Soy optimista y entusiasta en las situaciones sociales',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 7,
    },
    {
        'nombre_campo': 'i3',
        'etiqueta': 'Me resulta fácil iniciar conversaciones con desconocidos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 8,
    },
    {
        'nombre_campo': 'i4',
        'etiqueta': 'Prefiero trabajar en equipo antes que individualmente',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 9,
    },
    {
        'nombre_campo': 'i5',
        'etiqueta': 'Me importa ser aceptado y reconocido por los demás',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 10,
    },
    # Estabilidad (S) - preguntas 11-15
    {
        'nombre_campo': 's1',
        'etiqueta': 'Prefiero un ambiente de trabajo estable y predecible',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 11,
    },
    {
        'nombre_campo': 's2',
        'etiqueta': 'Soy paciente y buen oyente cuando alguien necesita hablar',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 12,
    },
    {
        'nombre_campo': 's3',
        'etiqueta': 'Valoro la lealtad y las relaciones a largo plazo',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 13,
    },
    {
        'nombre_campo': 's4',
        'etiqueta': 'Me cuesta adaptarme a cambios repentinos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 14,
    },
    {
        'nombre_campo': 's5',
        'etiqueta': 'Evito los conflictos y busco la armonía en el equipo',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 15,
    },
    # Cumplimiento (C) - preguntas 16-20
    {
        'nombre_campo': 'c1',
        'etiqueta': 'Soy detallista y me preocupo por la precisión',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 16,
    },
    {
        'nombre_campo': 'c2',
        'etiqueta': 'Prefiero seguir reglas y procedimientos establecidos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 17,
    },
    {
        'nombre_campo': 'c3',
        'etiqueta': 'Analizo la información a fondo antes de tomar decisiones',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 18,
    },
    {
        'nombre_campo': 'c4',
        'etiqueta': 'La calidad de mi trabajo es más importante que la velocidad',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 19,
    },
    {
        'nombre_campo': 'c5',
        'etiqueta': 'Me siento incómodo cuando las cosas no están bien organizadas',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 20,
    },
]

DISC_SCORING_CONFIG = {
    'tipo': 'psicometrico',
    'modelo': 'disc',
    'escalas': {
        'D': {
            'nombre': 'Dominancia',
            'descripcion': 'Enfoque en resultados, toma de decisiones, control del entorno',
            'campos': ['d1', 'd2', 'd3', 'd4', 'd5'],
            'color': '#EF4444',
        },
        'I': {
            'nombre': 'Influencia',
            'descripcion': 'Comunicación, persuasión, optimismo, trabajo en equipo',
            'campos': ['i1', 'i2', 'i3', 'i4', 'i5'],
            'color': '#F59E0B',
        },
        'S': {
            'nombre': 'Estabilidad',
            'descripcion': 'Paciencia, lealtad, estabilidad, resistencia al cambio',
            'campos': ['s1', 's2', 's3', 's4', 's5'],
            'color': '#10B981',
        },
        'C': {
            'nombre': 'Cumplimiento',
            'descripcion': 'Precisión, análisis, cumplimiento de reglas, calidad',
            'campos': ['c1', 'c2', 'c3', 'c4', 'c5'],
            'color': '#3B82F6',
        },
    },
    'escala_min': 1,
    'escala_max': 5,
    'preguntas_por_escala': 5,
    'puntaje_max_escala': 25,
}


# ============================================================================
# Big Five (OCEAN) - 5 dimensiones, 25 preguntas (5 por dimension)
# ============================================================================

BIG_FIVE_CAMPOS = [
    # Apertura a la Experiencia (O) - preguntas 1-5
    {
        'nombre_campo': 'o1',
        'etiqueta': 'Disfruto explorar ideas nuevas y poco convencionales',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 1,
    },
    {
        'nombre_campo': 'o2',
        'etiqueta': 'Tengo una imaginación muy activa',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 2,
    },
    {
        'nombre_campo': 'o3',
        'etiqueta': 'Me interesan temas de arte, cultura o filosofía',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 3,
    },
    {
        'nombre_campo': 'o4',
        'etiqueta': 'Prefiero la variedad y los cambios a la rutina',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 4,
    },
    {
        'nombre_campo': 'o5',
        'etiqueta': 'Me considero una persona creativa e innovadora',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 5,
    },
    # Responsabilidad / Conscientiousness (C) - preguntas 6-10
    {
        'nombre_campo': 'co1',
        'etiqueta': 'Soy organizado y mantengo mis cosas en orden',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 6,
    },
    {
        'nombre_campo': 'co2',
        'etiqueta': 'Siempre cumplo con mis compromisos y plazos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 7,
    },
    {
        'nombre_campo': 'co3',
        'etiqueta': 'Planifico con anticipación y sigo un plan de trabajo',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 8,
    },
    {
        'nombre_campo': 'co4',
        'etiqueta': 'Presto atención a los detalles en mi trabajo',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 9,
    },
    {
        'nombre_campo': 'co5',
        'etiqueta': 'Soy perseverante y termino lo que empiezo',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 10,
    },
    # Extraversion (E) - preguntas 11-15
    {
        'nombre_campo': 'e1',
        'etiqueta': 'Me siento energizado cuando estoy rodeado de personas',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 11,
    },
    {
        'nombre_campo': 'e2',
        'etiqueta': 'Soy sociable y disfruto conocer gente nueva',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 12,
    },
    {
        'nombre_campo': 'e3',
        'etiqueta': 'Me gusta ser el centro de atención en reuniones sociales',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 13,
    },
    {
        'nombre_campo': 'e4',
        'etiqueta': 'Hablo con facilidad y frecuencia en grupos',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 14,
    },
    {
        'nombre_campo': 'e5',
        'etiqueta': 'Tengo un alto nivel de energía y actividad',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 15,
    },
    # Amabilidad / Agreeableness (A) - preguntas 16-20
    {
        'nombre_campo': 'a1',
        'etiqueta': 'Me preocupo por el bienestar de los demás',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 16,
    },
    {
        'nombre_campo': 'a2',
        'etiqueta': 'Soy cooperativo y dispuesto a ayudar a los compañeros',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 17,
    },
    {
        'nombre_campo': 'a3',
        'etiqueta': 'Confío en las buenas intenciones de las personas',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 18,
    },
    {
        'nombre_campo': 'a4',
        'etiqueta': 'Evito las discusiones y prefiero buscar el consenso',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 19,
    },
    {
        'nombre_campo': 'a5',
        'etiqueta': 'Me resulta fácil perdonar y olvidar',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 20,
    },
    # Neuroticismo / Neuroticism (N) - preguntas 21-25
    {
        'nombre_campo': 'n1',
        'etiqueta': 'Me estreso con facilidad ante situaciones difíciles',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 21,
    },
    {
        'nombre_campo': 'n2',
        'etiqueta': 'Mis emociones cambian con frecuencia durante el día',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 22,
    },
    {
        'nombre_campo': 'n3',
        'etiqueta': 'Me preocupo excesivamente por cosas que podrían salir mal',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 23,
    },
    {
        'nombre_campo': 'n4',
        'etiqueta': 'Me siento ansioso o nervioso con frecuencia',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 24,
    },
    {
        'nombre_campo': 'n5',
        'etiqueta': 'Me cuesta recuperarme emocionalmente de situaciones negativas',
        'tipo_campo': 'NUMBER',
        'descripcion': '1 = Totalmente en desacuerdo, 5 = Totalmente de acuerdo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 25,
    },
]

BIG_FIVE_SCORING_CONFIG = {
    'tipo': 'psicometrico',
    'modelo': 'big_five',
    'escalas': {
        'O': {
            'nombre': 'Apertura',
            'descripcion': 'Curiosidad intelectual, creatividad, preferencia por la novedad',
            'campos': ['o1', 'o2', 'o3', 'o4', 'o5'],
            'color': '#8B5CF6',
        },
        'C': {
            'nombre': 'Responsabilidad',
            'descripcion': 'Organización, disciplina, orientación al logro',
            'campos': ['co1', 'co2', 'co3', 'co4', 'co5'],
            'color': '#3B82F6',
        },
        'E': {
            'nombre': 'Extraversion',
            'descripcion': 'Sociabilidad, energia, asertividad, emociones positivas',
            'campos': ['e1', 'e2', 'e3', 'e4', 'e5'],
            'color': '#F59E0B',
        },
        'A': {
            'nombre': 'Amabilidad',
            'descripcion': 'Cooperación, confianza, empatía, altruismo',
            'campos': ['a1', 'a2', 'a3', 'a4', 'a5'],
            'color': '#10B981',
        },
        'N': {
            'nombre': 'Neuroticismo',
            'descripcion': 'Estabilidad emocional, manejo del estrés, ansiedad',
            'campos': ['n1', 'n2', 'n3', 'n4', 'n5'],
            'color': '#EF4444',
        },
    },
    'escala_min': 1,
    'escala_max': 5,
    'preguntas_por_escala': 5,
    'puntaje_max_escala': 25,
}


# ============================================================================
# Command
# ============================================================================

class Command(BaseCommand):
    help = 'Crea plantillas psicometricas pre-configuradas (DISC + Big Five)'

    def handle(self, *args, **options):
        from django.db import connection
        from apps.talent_hub.seleccion_contratacion.models import PlantillaPruebaDinamica
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig

        schema = getattr(connection, 'schema_name', 'public')
        if schema == 'public':
            self.stderr.write(self.style.ERROR(
                'Este comando debe ejecutarse dentro de un schema de tenant, no en public.'
            ))
            return

        try:
            empresa = EmpresaConfig.objects.first()
        except Exception:
            self.stderr.write(self.style.ERROR('No se encontró EmpresaConfig.'))
            return

        if not empresa:
            self.stderr.write(self.style.ERROR('No existe EmpresaConfig en este tenant.'))
            return

        created_count = 0

        with transaction.atomic():
            # DISC
            _, created = PlantillaPruebaDinamica.objects.update_or_create(
                empresa=empresa,
                nombre='Test DISC',
                defaults={
                    'descripcion': (
                        'Evaluación del perfil de comportamiento DISC. '
                        'Mide 4 dimensiones: Dominancia (D), Influencia (I), '
                        'Estabilidad (S) y Cumplimiento (C). '
                        'Responda cada pregunta en escala de 1 a 5.'
                    ),
                    'instrucciones': (
                        'Lea cada afirmación y seleccione un valor del 1 al 5 según '
                        'qué tan identificado se siente:\n\n'
                        '1 = Totalmente en desacuerdo\n'
                        '2 = En desacuerdo\n'
                        '3 = Neutral\n'
                        '4 = De acuerdo\n'
                        '5 = Totalmente de acuerdo\n\n'
                        'No hay respuestas correctas o incorrectas. Sea honesto para '
                        'obtener un resultado preciso.'
                    ),
                    'campos': DISC_CAMPOS,
                    'scoring_config': DISC_SCORING_CONFIG,
                    'tipo_scoring': 'automatico',
                    'duracion_estimada_minutos': 15,
                    'tiempo_limite_minutos': 30,
                    'categoria': 'psicometrico',
                    'is_active': True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS('  + Test DISC creado'))
            else:
                self.stdout.write('  ~ Test DISC ya existía (actualizado)')

            # Big Five
            _, created = PlantillaPruebaDinamica.objects.update_or_create(
                empresa=empresa,
                nombre='Test Big Five (OCEAN)',
                defaults={
                    'descripcion': (
                        'Evaluación de los 5 grandes factores de personalidad (OCEAN). '
                        'Mide: Apertura (O), Responsabilidad (C), Extraversión (E), '
                        'Amabilidad (A) y Neuroticismo (N). '
                        'Responda cada pregunta en escala de 1 a 5.'
                    ),
                    'instrucciones': (
                        'Lea cada afirmación y seleccione un valor del 1 al 5 según '
                        'qué tan identificado se siente:\n\n'
                        '1 = Totalmente en desacuerdo\n'
                        '2 = En desacuerdo\n'
                        '3 = Neutral\n'
                        '4 = De acuerdo\n'
                        '5 = Totalmente de acuerdo\n\n'
                        'No hay respuestas correctas o incorrectas. Responda de '
                        'forma espontánea y honesta.'
                    ),
                    'campos': BIG_FIVE_CAMPOS,
                    'scoring_config': BIG_FIVE_SCORING_CONFIG,
                    'tipo_scoring': 'automatico',
                    'duracion_estimada_minutos': 20,
                    'tiempo_limite_minutos': 40,
                    'categoria': 'psicometrico',
                    'is_active': True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS('  + Test Big Five (OCEAN) creado'))
            else:
                self.stdout.write('  ~ Test Big Five (OCEAN) ya existía (actualizado)')

        self.stdout.write(self.style.SUCCESS(
            f'\nPlantillas psicometricas: {created_count} creadas'
        ))
