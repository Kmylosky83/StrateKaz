"""
Seed command para crear plantillas de prueba pre-configuradas.

Crea 3 plantillas reutilizables en PlantillaPruebaDinamica:
1. Evaluación de Perfil DISC (28 preguntas forced-choice, 4 dimensiones)
2. Evaluación de Competencias Laborales (20 preguntas Likert, 5 competencias)
3. Prueba de Razonamiento Lógico (15 preguntas opción múltiple con respuesta correcta)

Multi-tenant safe: itera todos los tenants activos.

Uso:
    python manage.py seed_plantillas_prueba
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# =============================================================================
# TEMPLATE 1: EVALUACIÓN DE PERFIL DISC (28 preguntas)
# =============================================================================
# Formato forced-choice: 4 opciones por pregunta, cada una mapeada a D/I/S/C.
# El candidato selecciona la que MEJOR lo describe.

DISC_CAMPOS = [
    # --- Pregunta 1 ---
    {
        'nombre_campo': 'disc_01',
        'etiqueta': 'Pregunta 1: En un proyecto de equipo, usted tiende a:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 1,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Tomar el control y dirigir las acciones del grupo'},
            {'valor': 'I', 'etiqueta': 'Motivar al equipo y mantener un ambiente positivo'},
            {'valor': 'S', 'etiqueta': 'Apoyar a los demás y buscar consenso'},
            {'valor': 'C', 'etiqueta': 'Organizar los detalles y asegurar la calidad'},
        ],
    },
    # --- Pregunta 2 ---
    {
        'nombre_campo': 'disc_02',
        'etiqueta': 'Pregunta 2: Cuando enfrenta un problema difícil en el trabajo, usted prefiere:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 2,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Tomar decisiones rápidas y asumir la responsabilidad'},
            {'valor': 'I', 'etiqueta': 'Reunir al equipo y buscar ideas creativas juntos'},
            {'valor': 'S', 'etiqueta': 'Analizar la situación con calma antes de actuar'},
            {'valor': 'C', 'etiqueta': 'Investigar a fondo los datos y buscar la solución más precisa'},
        ],
    },
    # --- Pregunta 3 ---
    {
        'nombre_campo': 'disc_03',
        'etiqueta': 'Pregunta 3: En una reunión de trabajo, usted generalmente:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 3,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Expone sus ideas de forma directa y decidida'},
            {'valor': 'I', 'etiqueta': 'Participa activamente y genera entusiasmo en los demás'},
            {'valor': 'S', 'etiqueta': 'Escucha atentamente y aporta cuando se lo piden'},
            {'valor': 'C', 'etiqueta': 'Toma notas, analiza la información y hace preguntas precisas'},
        ],
    },
    # --- Pregunta 4 ---
    {
        'nombre_campo': 'disc_04',
        'etiqueta': 'Pregunta 4: Cuando su jefe le asigna una nueva tarea, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 4,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'La inicia de inmediato y busca resultados rápidos'},
            {'valor': 'I', 'etiqueta': 'La comenta con colegas para generar ideas y colaborar'},
            {'valor': 'S', 'etiqueta': 'Planifica paso a paso antes de comenzar'},
            {'valor': 'C', 'etiqueta': 'Lee las instrucciones con detalle y verifica los requisitos'},
        ],
    },
    # --- Pregunta 5 ---
    {
        'nombre_campo': 'disc_05',
        'etiqueta': 'Pregunta 5: Ante un conflicto entre compañeros de trabajo, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 5,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Interviene directamente para resolver la situación'},
            {'valor': 'I', 'etiqueta': 'Usa el humor y la empatía para distender el ambiente'},
            {'valor': 'S', 'etiqueta': 'Escucha a ambas partes y busca un acuerdo pacífico'},
            {'valor': 'C', 'etiqueta': 'Analiza los hechos objetivamente para mediar con imparcialidad'},
        ],
    },
    # --- Pregunta 6 ---
    {
        'nombre_campo': 'disc_06',
        'etiqueta': 'Pregunta 6: Lo que más lo motiva en su trabajo es:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 6,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Lograr metas y superar desafíos'},
            {'valor': 'I', 'etiqueta': 'El reconocimiento y la interacción con otros'},
            {'valor': 'S', 'etiqueta': 'La estabilidad y un ambiente de trabajo armonioso'},
            {'valor': 'C', 'etiqueta': 'La excelencia y la precisión en lo que hace'},
        ],
    },
    # --- Pregunta 7 ---
    {
        'nombre_campo': 'disc_07',
        'etiqueta': 'Pregunta 7: Cuando tiene que comunicar una mala noticia, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 7,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Va directo al grano sin rodeos'},
            {'valor': 'I', 'etiqueta': 'Busca el momento adecuado y suaviza el mensaje'},
            {'valor': 'S', 'etiqueta': 'Lo hace con tacto, asegurándose de que la persona se sienta apoyada'},
            {'valor': 'C', 'etiqueta': 'Presenta los hechos y datos que respaldan la situación'},
        ],
    },
    # --- Pregunta 8 ---
    {
        'nombre_campo': 'disc_08',
        'etiqueta': 'Pregunta 8: En cuanto a los cambios en la organización, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 8,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Los impulsa y lidera con entusiasmo'},
            {'valor': 'I', 'etiqueta': 'Los promueve comunicando los beneficios a todos'},
            {'valor': 'S', 'etiqueta': 'Prefiere que sean graduales y bien planificados'},
            {'valor': 'C', 'etiqueta': 'Los evalúa críticamente antes de adoptarlos'},
        ],
    },
    # --- Pregunta 9 ---
    {
        'nombre_campo': 'disc_09',
        'etiqueta': 'Pregunta 9: Al trabajar bajo presión, usted tiende a:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 9,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Aumentar su ritmo de trabajo y exigir más al equipo'},
            {'valor': 'I', 'etiqueta': 'Mantener la calma y animar a los demás'},
            {'valor': 'S', 'etiqueta': 'Seguir su rutina habitual y evitar improvisar'},
            {'valor': 'C', 'etiqueta': 'Revisar todo con más cuidado para evitar errores'},
        ],
    },
    # --- Pregunta 10 ---
    {
        'nombre_campo': 'disc_10',
        'etiqueta': 'Pregunta 10: Lo que más le frustra en el trabajo es:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 10,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'La falta de acción y las demoras innecesarias'},
            {'valor': 'I', 'etiqueta': 'El aislamiento y la falta de comunicación'},
            {'valor': 'S', 'etiqueta': 'Los cambios repentinos y la falta de estabilidad'},
            {'valor': 'C', 'etiqueta': 'La falta de calidad y el desorden en los procesos'},
        ],
    },
    # --- Pregunta 11 ---
    {
        'nombre_campo': 'disc_11',
        'etiqueta': 'Pregunta 11: Cuando lidera un equipo, usted se enfoca en:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 11,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Establecer metas claras y exigir resultados'},
            {'valor': 'I', 'etiqueta': 'Crear un ambiente divertido y colaborativo'},
            {'valor': 'S', 'etiqueta': 'Asegurar que todos se sientan cómodos y escuchados'},
            {'valor': 'C', 'etiqueta': 'Definir procesos y estándares de calidad'},
        ],
    },
    # --- Pregunta 12 ---
    {
        'nombre_campo': 'disc_12',
        'etiqueta': 'Pregunta 12: Al tomar una decisión importante, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 12,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Decide rápido y asume las consecuencias'},
            {'valor': 'I', 'etiqueta': 'Consulta con personas de confianza y valora sus opiniones'},
            {'valor': 'S', 'etiqueta': 'Se toma su tiempo para considerar todas las opciones'},
            {'valor': 'C', 'etiqueta': 'Recopila todos los datos disponibles antes de decidir'},
        ],
    },
    # --- Pregunta 13 ---
    {
        'nombre_campo': 'disc_13',
        'etiqueta': 'Pregunta 13: Los demás lo describirían como una persona:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 13,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Decidida, competitiva y orientada a resultados'},
            {'valor': 'I', 'etiqueta': 'Carismática, optimista y sociable'},
            {'valor': 'S', 'etiqueta': 'Confiable, paciente y buen oyente'},
            {'valor': 'C', 'etiqueta': 'Meticulosa, analítica y precisa'},
        ],
    },
    # --- Pregunta 14 ---
    {
        'nombre_campo': 'disc_14',
        'etiqueta': 'Pregunta 14: En su espacio de trabajo, usted prefiere:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 14,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Un ambiente dinámico con retos constantes'},
            {'valor': 'I', 'etiqueta': 'Un espacio abierto y colaborativo con mucha interacción'},
            {'valor': 'S', 'etiqueta': 'Un lugar tranquilo y predecible donde pueda concentrarse'},
            {'valor': 'C', 'etiqueta': 'Un entorno organizado con reglas y procedimientos claros'},
        ],
    },
    # --- Pregunta 15 ---
    {
        'nombre_campo': 'disc_15',
        'etiqueta': 'Pregunta 15: Cuando alguien no cumple con una tarea, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 15,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Lo confronta directamente y exige una solución'},
            {'valor': 'I', 'etiqueta': 'Lo aborda de forma amigable para entender qué pasó'},
            {'valor': 'S', 'etiqueta': 'Ofrece ayuda adicional para que pueda completarla'},
            {'valor': 'C', 'etiqueta': 'Revisa si las instrucciones fueron claras y documenta el incumplimiento'},
        ],
    },
    # --- Pregunta 16 ---
    {
        'nombre_campo': 'disc_16',
        'etiqueta': 'Pregunta 16: Para usted, el éxito profesional significa:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 16,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Alcanzar posiciones de poder y lograr grandes resultados'},
            {'valor': 'I', 'etiqueta': 'Ser reconocido y tener una red amplia de contactos'},
            {'valor': 'S', 'etiqueta': 'Tener un trabajo estable con buenas relaciones laborales'},
            {'valor': 'C', 'etiqueta': 'Ser experto en su área y entregar trabajos impecables'},
        ],
    },
    # --- Pregunta 17 ---
    {
        'nombre_campo': 'disc_17',
        'etiqueta': 'Pregunta 17: Cuando recibe retroalimentación negativa, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 17,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'La acepta si es justa y actúa para mejorar de inmediato'},
            {'valor': 'I', 'etiqueta': 'La toma en cuenta pero le afecta emocionalmente al principio'},
            {'valor': 'S', 'etiqueta': 'La escucha con calma y reflexiona antes de responder'},
            {'valor': 'C', 'etiqueta': 'La analiza en detalle para verificar si es correcta'},
        ],
    },
    # --- Pregunta 18 ---
    {
        'nombre_campo': 'disc_18',
        'etiqueta': 'Pregunta 18: Al planificar un proyecto nuevo, lo primero que hace es:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 18,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Definir el objetivo final y los plazos de entrega'},
            {'valor': 'I', 'etiqueta': 'Reunir al equipo para una lluvia de ideas'},
            {'valor': 'S', 'etiqueta': 'Identificar los recursos disponibles y las personas involucradas'},
            {'valor': 'C', 'etiqueta': 'Crear un cronograma detallado con cada paso del proceso'},
        ],
    },
    # --- Pregunta 19 ---
    {
        'nombre_campo': 'disc_19',
        'etiqueta': 'Pregunta 19: Si pudiera elegir su rol ideal en un equipo, sería:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 19,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'El líder que toma las decisiones clave'},
            {'valor': 'I', 'etiqueta': 'El comunicador que conecta a las personas'},
            {'valor': 'S', 'etiqueta': 'El mediador que mantiene la armonía del grupo'},
            {'valor': 'C', 'etiqueta': 'El analista que garantiza la calidad del trabajo'},
        ],
    },
    # --- Pregunta 20 ---
    {
        'nombre_campo': 'disc_20',
        'etiqueta': 'Pregunta 20: Lo que más valora en un compañero de trabajo es:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 20,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Que sea eficiente y cumpla con sus compromisos'},
            {'valor': 'I', 'etiqueta': 'Que sea positivo y fácil de tratar'},
            {'valor': 'S', 'etiqueta': 'Que sea leal y confiable'},
            {'valor': 'C', 'etiqueta': 'Que sea preciso y cuidadoso con los detalles'},
        ],
    },
    # --- Pregunta 21 ---
    {
        'nombre_campo': 'disc_21',
        'etiqueta': 'Pregunta 21: Cuando debe presentar una idea ante un grupo, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 21,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Presenta con seguridad y convicción, buscando convencer'},
            {'valor': 'I', 'etiqueta': 'Usa historias y ejemplos para conectar con la audiencia'},
            {'valor': 'S', 'etiqueta': 'Prefiere hablar en grupos pequeños o de forma individual'},
            {'valor': 'C', 'etiqueta': 'Prepara una presentación detallada con datos y evidencias'},
        ],
    },
    # --- Pregunta 22 ---
    {
        'nombre_campo': 'disc_22',
        'etiqueta': 'Pregunta 22: En su tiempo libre, usted prefiere:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 22,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Actividades competitivas o que impliquen desafíos'},
            {'valor': 'I', 'etiqueta': 'Socializar, ir a eventos o conocer gente nueva'},
            {'valor': 'S', 'etiqueta': 'Estar con su familia o amigos cercanos en un ambiente tranquilo'},
            {'valor': 'C', 'etiqueta': 'Leer, investigar o realizar actividades que requieran concentración'},
        ],
    },
    # --- Pregunta 23 ---
    {
        'nombre_campo': 'disc_23',
        'etiqueta': 'Pregunta 23: Ante una fecha límite muy ajustada, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 23,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Se enfoca en lo esencial y delega lo que puede'},
            {'valor': 'I', 'etiqueta': 'Pide colaboración y motiva al equipo para lograrlo'},
            {'valor': 'S', 'etiqueta': 'Trabaja de forma constante y pide una extensión si es necesario'},
            {'valor': 'C', 'etiqueta': 'Revisa las prioridades y organiza un plan detallado'},
        ],
    },
    # --- Pregunta 24 ---
    {
        'nombre_campo': 'disc_24',
        'etiqueta': 'Pregunta 24: Si comete un error en el trabajo, usted:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 24,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Lo corrige rápidamente y sigue adelante'},
            {'valor': 'I', 'etiqueta': 'Lo reconoce abiertamente y busca apoyo para solucionarlo'},
            {'valor': 'S', 'etiqueta': 'Se disculpa y trabaja para que no vuelva a ocurrir'},
            {'valor': 'C', 'etiqueta': 'Investiga la causa raíz para prevenir que se repita'},
        ],
    },
    # --- Pregunta 25 ---
    {
        'nombre_campo': 'disc_25',
        'etiqueta': 'Pregunta 25: En una negociación laboral, usted tiende a:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 25,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Ir directamente a los puntos clave y buscar ganar'},
            {'valor': 'I', 'etiqueta': 'Crear una relación de confianza antes de negociar'},
            {'valor': 'S', 'etiqueta': 'Buscar un acuerdo que beneficie a ambas partes'},
            {'valor': 'C', 'etiqueta': 'Preparar argumentos sólidos basados en datos'},
        ],
    },
    # --- Pregunta 26 ---
    {
        'nombre_campo': 'disc_26',
        'etiqueta': 'Pregunta 26: Cuando debe aprender algo nuevo, usted prefiere:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 26,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Aprender haciendo, con prueba y error'},
            {'valor': 'I', 'etiqueta': 'Aprender en grupo, con discusiones e intercambio de ideas'},
            {'valor': 'S', 'etiqueta': 'Aprender paso a paso con un instructor paciente'},
            {'valor': 'C', 'etiqueta': 'Aprender leyendo manuales y documentación detallada'},
        ],
    },
    # --- Pregunta 27 ---
    {
        'nombre_campo': 'disc_27',
        'etiqueta': 'Pregunta 27: Lo que más le estresa en el trabajo es:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 27,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Perder el control de la situación o depender de otros'},
            {'valor': 'I', 'etiqueta': 'El rechazo social o ser ignorado por el equipo'},
            {'valor': 'S', 'etiqueta': 'La incertidumbre y los cambios constantes'},
            {'valor': 'C', 'etiqueta': 'La falta de información o los errores de otros'},
        ],
    },
    # --- Pregunta 28 ---
    {
        'nombre_campo': 'disc_28',
        'etiqueta': 'Pregunta 28: Si tuviera que describirse en una palabra, sería:',
        'tipo_campo': 'RADIO',
        'descripcion': 'Seleccione la opción que mejor lo describe.',
        'es_obligatorio': True,
        'puntaje': 0,
        'orden': 28,
        'opciones': [
            {'valor': 'D', 'etiqueta': 'Determinado/a'},
            {'valor': 'I', 'etiqueta': 'Entusiasta'},
            {'valor': 'S', 'etiqueta': 'Confiable'},
            {'valor': 'C', 'etiqueta': 'Riguroso/a'},
        ],
    },
]

DISC_SCORING_CONFIG = {
    'tipo': 'psicometrico',
    'modelo': 'disc',
    'puntaje_maximo': 100,
    'puntaje_aprobacion': 0,
    'escalas': {
        'D': {
            'nombre': 'Dominancia',
            'descripcion': 'Enfoque en resultados, toma de decisiones, control, competitividad',
            'color': '#EF4444',
        },
        'I': {
            'nombre': 'Influencia',
            'descripcion': 'Comunicación, persuasión, optimismo, relaciones interpersonales',
            'color': '#F59E0B',
        },
        'S': {
            'nombre': 'Estabilidad',
            'descripcion': 'Paciencia, lealtad, trabajo en equipo, resistencia al cambio',
            'color': '#10B981',
        },
        'C': {
            'nombre': 'Cumplimiento',
            'descripcion': 'Precisión, análisis, cumplimiento de normas, calidad',
            'color': '#3B82F6',
        },
    },
    'interpretacion': (
        'El perfil DISC identifica el estilo de comportamiento dominante. '
        'La dimensión con mayor puntaje indica la tendencia principal. '
        'No hay respuestas correctas o incorrectas; todos los perfiles son valiosos.'
    ),
}


# =============================================================================
# TEMPLATE 2: EVALUACIÓN DE COMPETENCIAS LABORALES (20 preguntas)
# =============================================================================
# Escala Likert 1-5. 4 preguntas por competencia. 5 competencias.

def _likert_opciones():
    """Genera opciones Likert 1-5 estándar."""
    return [
        {'valor': '1', 'etiqueta': '1 - Totalmente en desacuerdo'},
        {'valor': '2', 'etiqueta': '2 - En desacuerdo'},
        {'valor': '3', 'etiqueta': '3 - Neutral'},
        {'valor': '4', 'etiqueta': '4 - De acuerdo'},
        {'valor': '5', 'etiqueta': '5 - Totalmente de acuerdo'},
    ]


COMPETENCIAS_CAMPOS = [
    # --- Trabajo en Equipo (preguntas 1-4) ---
    {
        'nombre_campo': 'te_01',
        'etiqueta': '1. Colaboro activamente con mis compañeros para alcanzar los objetivos del equipo.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Trabajo en Equipo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 1,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'te_02',
        'etiqueta': '2. Comparto información y recursos con los demás sin que me lo pidan.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Trabajo en Equipo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 2,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'te_03',
        'etiqueta': '3. Acepto y valoro las ideas de otros, incluso cuando difieren de las mías.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Trabajo en Equipo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 3,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'te_04',
        'etiqueta': '4. Contribuyo a resolver conflictos dentro del equipo de forma constructiva.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Trabajo en Equipo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 4,
        'opciones': _likert_opciones(),
    },
    # --- Liderazgo (preguntas 5-8) ---
    {
        'nombre_campo': 'lid_01',
        'etiqueta': '5. Tomo la iniciativa para proponer mejoras en los procesos de trabajo.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Liderazgo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 5,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'lid_02',
        'etiqueta': '6. Inspiro y motivo a otros para dar lo mejor de sí mismos.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Liderazgo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 6,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'lid_03',
        'etiqueta': '7. Asumo la responsabilidad de los resultados, tanto positivos como negativos.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Liderazgo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 7,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'lid_04',
        'etiqueta': '8. Delego tareas de forma efectiva considerando las fortalezas de cada persona.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Liderazgo',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 8,
        'opciones': _likert_opciones(),
    },
    # --- Comunicación (preguntas 9-12) ---
    {
        'nombre_campo': 'com_01',
        'etiqueta': '9. Expreso mis ideas de forma clara y organizada, tanto verbal como escrita.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Comunicación',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 9,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'com_02',
        'etiqueta': '10. Escucho activamente a los demás antes de responder o emitir un juicio.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Comunicación',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 10,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'com_03',
        'etiqueta': '11. Adapto mi estilo de comunicación según la audiencia o la situación.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Comunicación',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 11,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'com_04',
        'etiqueta': '12. Proporciono retroalimentación constructiva a mis compañeros de trabajo.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Comunicación',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 12,
        'opciones': _likert_opciones(),
    },
    # --- Resolución de Problemas (preguntas 13-16) ---
    {
        'nombre_campo': 'rp_01',
        'etiqueta': '13. Identifico las causas raíz de los problemas antes de buscar soluciones.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Resolución de Problemas',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 13,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'rp_02',
        'etiqueta': '14. Genero múltiples alternativas de solución ante un mismo problema.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Resolución de Problemas',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 14,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'rp_03',
        'etiqueta': '15. Mantengo la calma y pienso con claridad bajo situaciones de presión.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Resolución de Problemas',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 15,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'rp_04',
        'etiqueta': '16. Evalúo los resultados de mis decisiones y aprendo de los errores.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Resolución de Problemas',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 16,
        'opciones': _likert_opciones(),
    },
    # --- Orientación a Resultados (preguntas 17-20) ---
    {
        'nombre_campo': 'or_01',
        'etiqueta': '17. Establezco metas claras y realistas para mi trabajo diario.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Orientación a Resultados',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 17,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'or_02',
        'etiqueta': '18. Persisto en mis tareas hasta completarlas, incluso ante dificultades.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Orientación a Resultados',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 18,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'or_03',
        'etiqueta': '19. Priorizo mis actividades según su impacto en los objetivos organizacionales.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Orientación a Resultados',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 19,
        'opciones': _likert_opciones(),
    },
    {
        'nombre_campo': 'or_04',
        'etiqueta': '20. Busco constantemente formas de mejorar mi productividad y eficiencia.',
        'tipo_campo': 'RADIO',
        'descripcion': 'Competencia: Orientación a Resultados',
        'es_obligatorio': True,
        'puntaje': 5,
        'orden': 20,
        'opciones': _likert_opciones(),
    },
]

COMPETENCIAS_SCORING_CONFIG = {
    'tipo': 'competencias',
    'puntaje_maximo': 100,
    'puntaje_aprobacion': 60,
    'escalas': {
        'trabajo_equipo': {
            'nombre': 'Trabajo en Equipo',
            'descripcion': 'Capacidad para colaborar, compartir y resolver conflictos en grupo',
            'campos': ['te_01', 'te_02', 'te_03', 'te_04'],
            'color': '#3B82F6',
        },
        'liderazgo': {
            'nombre': 'Liderazgo',
            'descripcion': 'Capacidad para inspirar, delegar y asumir responsabilidad',
            'campos': ['lid_01', 'lid_02', 'lid_03', 'lid_04'],
            'color': '#EF4444',
        },
        'comunicacion': {
            'nombre': 'Comunicación',
            'descripcion': 'Habilidad para expresarse, escuchar y dar retroalimentación',
            'campos': ['com_01', 'com_02', 'com_03', 'com_04'],
            'color': '#F59E0B',
        },
        'resolucion_problemas': {
            'nombre': 'Resolución de Problemas',
            'descripcion': 'Capacidad analítica, creatividad y toma de decisiones bajo presión',
            'campos': ['rp_01', 'rp_02', 'rp_03', 'rp_04'],
            'color': '#10B981',
        },
        'orientacion_resultados': {
            'nombre': 'Orientación a Resultados',
            'descripcion': 'Enfoque en metas, persistencia y mejora continua',
            'campos': ['or_01', 'or_02', 'or_03', 'or_04'],
            'color': '#8B5CF6',
        },
    },
    'escala_min': 1,
    'escala_max': 5,
    'preguntas_por_escala': 4,
    'puntaje_max_escala': 20,
    'interpretacion': (
        'Cada competencia se evalúa sobre 20 puntos (4 preguntas x 5 puntos). '
        'Puntaje total sobre 100. Se aprueba con 60 o más.'
    ),
}


# =============================================================================
# TEMPLATE 3: PRUEBA DE RAZONAMIENTO LÓGICO (15 preguntas)
# =============================================================================
# Opción múltiple con respuesta correcta marcada. Cada respuesta correcta = ~6.67 pts.

RAZONAMIENTO_CAMPOS = [
    # --- Secuencias Numéricas (preguntas 1-5) ---
    {
        'nombre_campo': 'rl_01',
        'etiqueta': '1. ¿Cuál es el número que sigue en la secuencia? 2, 4, 8, 16, __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Secuencias Numéricas',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 1,
        'respuesta_correcta': '32',
        'opciones': [
            {'valor': '24', 'etiqueta': '24'},
            {'valor': '32', 'etiqueta': '32'},
            {'valor': '30', 'etiqueta': '30'},
            {'valor': '20', 'etiqueta': '20'},
        ],
    },
    {
        'nombre_campo': 'rl_02',
        'etiqueta': '2. ¿Cuál es el número que sigue en la secuencia? 3, 6, 12, 24, __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Secuencias Numéricas',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 2,
        'respuesta_correcta': '48',
        'opciones': [
            {'valor': '36', 'etiqueta': '36'},
            {'valor': '48', 'etiqueta': '48'},
            {'valor': '30', 'etiqueta': '30'},
            {'valor': '42', 'etiqueta': '42'},
        ],
    },
    {
        'nombre_campo': 'rl_03',
        'etiqueta': '3. ¿Cuál es el número que sigue en la secuencia? 1, 1, 2, 3, 5, 8, __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Secuencias Numéricas',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 3,
        'respuesta_correcta': '13',
        'opciones': [
            {'valor': '10', 'etiqueta': '10'},
            {'valor': '11', 'etiqueta': '11'},
            {'valor': '12', 'etiqueta': '12'},
            {'valor': '13', 'etiqueta': '13'},
        ],
    },
    {
        'nombre_campo': 'rl_04',
        'etiqueta': '4. ¿Cuál es el número que sigue en la secuencia? 5, 10, 20, 40, __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Secuencias Numéricas',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 4,
        'respuesta_correcta': '80',
        'opciones': [
            {'valor': '60', 'etiqueta': '60'},
            {'valor': '70', 'etiqueta': '70'},
            {'valor': '80', 'etiqueta': '80'},
            {'valor': '50', 'etiqueta': '50'},
        ],
    },
    {
        'nombre_campo': 'rl_05',
        'etiqueta': '5. ¿Cuál es el número que sigue en la secuencia? 100, 81, 64, 49, __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Secuencias Numéricas',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 5,
        'respuesta_correcta': '36',
        'opciones': [
            {'valor': '25', 'etiqueta': '25'},
            {'valor': '36', 'etiqueta': '36'},
            {'valor': '42', 'etiqueta': '42'},
            {'valor': '30', 'etiqueta': '30'},
        ],
    },
    # --- Analogías Verbales (preguntas 6-10) ---
    {
        'nombre_campo': 'rl_06',
        'etiqueta': '6. Perro es a Cachorro como Gato es a __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Analogías Verbales',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 6,
        'respuesta_correcta': 'gatito',
        'opciones': [
            {'valor': 'felino', 'etiqueta': 'Felino'},
            {'valor': 'gatito', 'etiqueta': 'Gatito'},
            {'valor': 'minino', 'etiqueta': 'Minino'},
            {'valor': 'mascota', 'etiqueta': 'Mascota'},
        ],
    },
    {
        'nombre_campo': 'rl_07',
        'etiqueta': '7. Médico es a Hospital como Profesor es a __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Analogías Verbales',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 7,
        'respuesta_correcta': 'escuela',
        'opciones': [
            {'valor': 'libro', 'etiqueta': 'Libro'},
            {'valor': 'estudiante', 'etiqueta': 'Estudiante'},
            {'valor': 'escuela', 'etiqueta': 'Escuela'},
            {'valor': 'clase', 'etiqueta': 'Clase'},
        ],
    },
    {
        'nombre_campo': 'rl_08',
        'etiqueta': '8. Pintor es a Pincel como Escritor es a __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Analogías Verbales',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 8,
        'respuesta_correcta': 'pluma',
        'opciones': [
            {'valor': 'libro', 'etiqueta': 'Libro'},
            {'valor': 'pluma', 'etiqueta': 'Pluma'},
            {'valor': 'palabra', 'etiqueta': 'Palabra'},
            {'valor': 'papel', 'etiqueta': 'Papel'},
        ],
    },
    {
        'nombre_campo': 'rl_09',
        'etiqueta': '9. Hambre es a Comer como Sed es a __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Analogías Verbales',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 9,
        'respuesta_correcta': 'beber',
        'opciones': [
            {'valor': 'agua', 'etiqueta': 'Agua'},
            {'valor': 'beber', 'etiqueta': 'Beber'},
            {'valor': 'vaso', 'etiqueta': 'Vaso'},
            {'valor': 'saciar', 'etiqueta': 'Saciar'},
        ],
    },
    {
        'nombre_campo': 'rl_10',
        'etiqueta': '10. Árbol es a Bosque como Estrella es a __',
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Analogías Verbales',
        'es_obligatorio': True,
        'puntaje': 7,
        'orden': 10,
        'respuesta_correcta': 'constelacion',
        'opciones': [
            {'valor': 'cielo', 'etiqueta': 'Cielo'},
            {'valor': 'constelacion', 'etiqueta': 'Constelación'},
            {'valor': 'galaxia', 'etiqueta': 'Galaxia'},
            {'valor': 'noche', 'etiqueta': 'Noche'},
        ],
    },
    # --- Patrones Lógicos (preguntas 11-15) ---
    {
        'nombre_campo': 'rl_11',
        'etiqueta': (
            '11. Todos los ingenieros de la empresa hablan inglés. '
            'Carlos es ingeniero de la empresa. Por lo tanto:'
        ),
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Patrones Lógicos',
        'es_obligatorio': True,
        'puntaje': 6,
        'orden': 11,
        'respuesta_correcta': 'carlos_habla_ingles',
        'opciones': [
            {'valor': 'carlos_habla_ingles', 'etiqueta': 'Carlos habla inglés'},
            {'valor': 'carlos_es_bilingue', 'etiqueta': 'Carlos es bilingüe'},
            {'valor': 'carlos_podria_hablar', 'etiqueta': 'Carlos podría hablar inglés'},
            {'valor': 'no_se_puede_concluir', 'etiqueta': 'No se puede concluir nada'},
        ],
    },
    {
        'nombre_campo': 'rl_12',
        'etiqueta': (
            '12. Si llueve, las calles se mojan. Las calles están mojadas. '
            '¿Qué se puede concluir?'
        ),
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Patrones Lógicos',
        'es_obligatorio': True,
        'puntaje': 6,
        'orden': 12,
        'respuesta_correcta': 'no_necesariamente_llovio',
        'opciones': [
            {'valor': 'llovio_seguro', 'etiqueta': 'Definitivamente llovió'},
            {'valor': 'no_necesariamente_llovio', 'etiqueta': 'No necesariamente llovió, puede haber otra causa'},
            {'valor': 'va_a_llover', 'etiqueta': 'Va a seguir lloviendo'},
            {'valor': 'nunca_llovio', 'etiqueta': 'Nunca llovió'},
        ],
    },
    {
        'nombre_campo': 'rl_13',
        'etiqueta': (
            '13. En una fila, Ana está delante de Pedro, Pedro está delante de Luis, '
            'y María está detrás de Luis. ¿Quién está de último?'
        ),
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Patrones Lógicos',
        'es_obligatorio': True,
        'puntaje': 6,
        'orden': 13,
        'respuesta_correcta': 'maria',
        'opciones': [
            {'valor': 'ana', 'etiqueta': 'Ana'},
            {'valor': 'pedro', 'etiqueta': 'Pedro'},
            {'valor': 'luis', 'etiqueta': 'Luis'},
            {'valor': 'maria', 'etiqueta': 'María'},
        ],
    },
    {
        'nombre_campo': 'rl_14',
        'etiqueta': (
            '14. Si A es mayor que B, y B es mayor que C, '
            '¿cuál de las siguientes afirmaciones es SIEMPRE verdadera?'
        ),
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Patrones Lógicos',
        'es_obligatorio': True,
        'puntaje': 6,
        'orden': 14,
        'respuesta_correcta': 'a_mayor_c',
        'opciones': [
            {'valor': 'c_mayor_a', 'etiqueta': 'C es mayor que A'},
            {'valor': 'a_mayor_c', 'etiqueta': 'A es mayor que C'},
            {'valor': 'b_igual_c', 'etiqueta': 'B es igual a C'},
            {'valor': 'a_igual_b', 'etiqueta': 'A es igual a B'},
        ],
    },
    {
        'nombre_campo': 'rl_15',
        'etiqueta': (
            '15. Un reloj marca las 3:15. ¿Cuál es el ángulo '
            'que forman las manecillas de la hora y los minutos?'
        ),
        'tipo_campo': 'RADIO',
        'descripcion': 'Sección: Patrones Lógicos',
        'es_obligatorio': True,
        'puntaje': 6,
        'orden': 15,
        'respuesta_correcta': '7_5',
        'opciones': [
            {'valor': '0', 'etiqueta': '0 grados'},
            {'valor': '7_5', 'etiqueta': '7,5 grados'},
            {'valor': '15', 'etiqueta': '15 grados'},
            {'valor': '90', 'etiqueta': '90 grados'},
        ],
    },
]

RAZONAMIENTO_SCORING_CONFIG = {
    'tipo': 'conocimiento',
    'puntaje_maximo': 100,
    'puntaje_aprobacion': 60,
    'penalizar_incorrectas': False,
    'secciones': {
        'secuencias_numericas': {
            'nombre': 'Secuencias Numéricas',
            'descripcion': 'Capacidad para identificar patrones en series de números',
            'campos': ['rl_01', 'rl_02', 'rl_03', 'rl_04', 'rl_05'],
            'color': '#3B82F6',
        },
        'analogias_verbales': {
            'nombre': 'Analogías Verbales',
            'descripcion': 'Habilidad para identificar relaciones entre conceptos',
            'campos': ['rl_06', 'rl_07', 'rl_08', 'rl_09', 'rl_10'],
            'color': '#10B981',
        },
        'patrones_logicos': {
            'nombre': 'Patrones Lógicos',
            'descripcion': 'Razonamiento deductivo e inferencia lógica',
            'campos': ['rl_11', 'rl_12', 'rl_13', 'rl_14', 'rl_15'],
            'color': '#8B5CF6',
        },
    },
    'interpretacion': (
        'Puntaje basado en respuestas correctas. '
        'Cada respuesta correcta suma su puntaje asignado. '
        'Se aprueba con 60 puntos o más sobre 100.'
    ),
}


# =============================================================================
# MANAGEMENT COMMAND
# =============================================================================

PLANTILLAS = [
    {
        'nombre': 'Evaluación de Perfil DISC',
        'descripcion': (
            'Evaluación psicométrica que identifica el estilo de comportamiento '
            'dominante del candidato según el modelo DISC (Dominancia, Influencia, '
            'Estabilidad, Cumplimiento).'
        ),
        'instrucciones': (
            'Para cada grupo de afirmaciones, seleccione la que MEJOR lo describe. '
            'No hay respuestas correctas o incorrectas.\n\n'
            'Las 4 opciones representan diferentes estilos de comportamiento. '
            'Elija la que más se acerque a su forma habitual de actuar en el trabajo.\n\n'
            'Sea honesto y espontáneo: el objetivo es identificar su perfil natural, '
            'no evaluar si es bueno o malo.'
        ),
        'campos': DISC_CAMPOS,
        'scoring_config': DISC_SCORING_CONFIG,
        'tipo_scoring': 'automatico',
        'duracion_estimada_minutos': 20,
        'tiempo_limite_minutos': 40,
        'categoria': 'psicometrico',
    },
    {
        'nombre': 'Evaluación de Competencias Laborales',
        'descripcion': (
            'Evaluación que mide 5 competencias clave: Trabajo en Equipo, '
            'Liderazgo, Comunicación, Resolución de Problemas y Orientación a Resultados.'
        ),
        'instrucciones': (
            'Para cada afirmación, indique qué tan de acuerdo está en una escala del 1 al 5:\n\n'
            '1 = Totalmente en Desacuerdo\n'
            '2 = En Desacuerdo\n'
            '3 = Neutral\n'
            '4 = De Acuerdo\n'
            '5 = Totalmente de Acuerdo\n\n'
            'Responda de forma honesta según su comportamiento habitual en el entorno laboral. '
            'No hay respuestas correctas o incorrectas.'
        ),
        'campos': COMPETENCIAS_CAMPOS,
        'scoring_config': COMPETENCIAS_SCORING_CONFIG,
        'tipo_scoring': 'automatico',
        'duracion_estimada_minutos': 15,
        'tiempo_limite_minutos': 30,
        'categoria': 'competencias',
    },
    {
        'nombre': 'Prueba de Razonamiento Lógico',
        'descripcion': (
            'Evaluación de capacidad analítica y razonamiento lógico mediante '
            'secuencias numéricas, analogías verbales y patrones lógicos.'
        ),
        'instrucciones': (
            'Seleccione la respuesta correcta para cada pregunta.\n\n'
            'La prueba consta de 3 secciones:\n'
            '  - Secuencias Numéricas (5 preguntas)\n'
            '  - Analogías Verbales (5 preguntas)\n'
            '  - Patrones Lógicos (5 preguntas)\n\n'
            'Tiene un tiempo estimado de 20 minutos. Lea cada pregunta con atención '
            'antes de responder. Solo hay una respuesta correcta por pregunta.'
        ),
        'campos': RAZONAMIENTO_CAMPOS,
        'scoring_config': RAZONAMIENTO_SCORING_CONFIG,
        'tipo_scoring': 'automatico',
        'duracion_estimada_minutos': 20,
        'tiempo_limite_minutos': 35,
        'categoria': 'conocimiento',
    },
]


class Command(BaseCommand):
    help = (
        'Crea 3 plantillas de prueba pre-configuradas (DISC, Competencias, '
        'Razonamiento Lógico) en todos los tenants activos.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Schema name de un tenant específico. Si no se indica, se ejecuta en todos.',
        )

    def handle(self, *args, **options):
        from django_tenants.utils import schema_context
        from apps.tenant.models import Tenant

        tenant_schema = options.get('tenant')

        if tenant_schema:
            tenants = Tenant.objects.filter(schema_name=tenant_schema)
            if not tenants.exists():
                self.stderr.write(self.style.ERROR(
                    f'No se encontró el tenant con schema "{tenant_schema}".'
                ))
                return
        else:
            tenants = Tenant.objects.exclude(schema_name='public')

        if not tenants.exists():
            self.stderr.write(self.style.WARNING('No hay tenants disponibles.'))
            return

        self.stdout.write(self.style.HTTP_INFO('=' * 65))
        self.stdout.write(self.style.HTTP_INFO(
            'SEED PLANTILLAS DE PRUEBA (DISC + Competencias + Razonamiento)'
        ))
        self.stdout.write(self.style.HTTP_INFO('=' * 65))

        total_created = 0
        total_updated = 0

        for tenant in tenants:
            self.stdout.write(f'\nTenant: {tenant.schema_name}')

            with schema_context(tenant.schema_name):
                created, updated = self._seed_tenant()
                total_created += created
                total_updated += updated

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Resultado: {total_created} plantillas creadas, '
            f'{total_updated} actualizadas en {tenants.count()} tenant(s).'
        ))

    def _seed_tenant(self):
        from django.apps import apps
        from apps.talent_hub.seleccion_contratacion.models import PlantillaPruebaDinamica

        EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')

        try:
            empresa = EmpresaConfig.objects.first()
        except Exception:
            self.stderr.write(self.style.WARNING(
                '  [SKIP] No se pudo obtener EmpresaConfig.'
            ))
            return 0, 0

        if not empresa:
            self.stderr.write(self.style.WARNING(
                '  [SKIP] No existe EmpresaConfig en este tenant.'
            ))
            return 0, 0

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for plantilla_data in PLANTILLAS:
                nombre = plantilla_data['nombre']
                obj, created = PlantillaPruebaDinamica.objects.update_or_create(
                    empresa=empresa,
                    nombre=nombre,
                    defaults={
                        'descripcion': plantilla_data['descripcion'],
                        'instrucciones': plantilla_data['instrucciones'],
                        'campos': plantilla_data['campos'],
                        'scoring_config': plantilla_data['scoring_config'],
                        'tipo_scoring': plantilla_data['tipo_scoring'],
                        'duracion_estimada_minutos': plantilla_data['duracion_estimada_minutos'],
                        'tiempo_limite_minutos': plantilla_data['tiempo_limite_minutos'],
                        'categoria': plantilla_data['categoria'],
                        'is_active': True,
                    },
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'  + {nombre}'))
                else:
                    updated_count += 1
                    self.stdout.write(f'  ~ {nombre} (actualizada)')

        return created_count, updated_count
