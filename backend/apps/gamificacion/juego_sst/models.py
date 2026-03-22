"""
Modelos del Juego SST: Los Héroes de la Seguridad
Módulo independiente de gamificación — apps.gamificacion.juego_sst

Modelos:
- GamificacionColaborador: Estado de gamificación por colaborador
- GameLevel: Niveles del juego
- GameQuizQuestion: Preguntas quiz por nivel
- GameProgress: Progreso persistente del jugador
- GameSession: Log de cada partida individual
"""
from django.db import models
from django.conf import settings

from utils.models import TenantModel


# =============================================================================
# CONSTANTES
# =============================================================================

ZONA_JUEGO_CHOICES = [
    ('obra_civil', 'Obra Civil'),
    ('industria', 'Planta Industrial'),
    ('quimica', 'Planta Química'),
    ('oficinas', 'Edificio Corporativo'),
    ('logistica', 'Centro Logístico'),
    ('final', 'Torre RISKORP'),
]

CATEGORIA_QUIZ_CHOICES = [
    ('epp', 'Elementos de Protección Personal'),
    ('procedimientos', 'Procedimientos de Seguridad'),
    ('normas', 'Normativa Legal'),
    ('emergencias', 'Emergencias y Evacuación'),
    ('senalizacion', 'Señalización Industrial'),
    ('riesgos', 'Identificación de Riesgos'),
    ('ambiental', 'Gestión Ambiental'),
    ('ergonomia', 'Ergonomía'),
]

DIFICULTAD_QUIZ_CHOICES = [
    ('facil', 'Fácil'),
    ('medio', 'Medio'),
    ('dificil', 'Difícil'),
]

NOMBRES_NIVEL = {
    1: 'Novato', 2: 'Aprendiz', 3: 'Inspector Jr.',
    4: 'Inspector', 5: 'Inspector Sr.', 6: 'Supervisor SST',
    7: 'Jefe SST', 8: 'Director SST', 9: 'Experto SST',
    10: 'Héroe de la Seguridad',
}


# =============================================================================
# GAMIFICACIÓN DEL COLABORADOR
# =============================================================================

class GamificacionColaborador(TenantModel):
    """
    Gamificación del Colaborador — Puntos, nivel y badges.

    Mantiene el estado actual de gamificación de cada colaborador.
    Consumible por cualquier módulo vía API (formación, HSEQ, cumplimiento).
    """

    colaborador = models.OneToOneField(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='gamificacion_juego',
        verbose_name='Colaborador'
    )

    # Puntos
    puntos_totales = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos Totales'
    )
    puntos_mes = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos del Mes'
    )
    puntos_anio = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos del Año'
    )

    # Nivel
    nivel = models.PositiveIntegerField(
        default=1,
        verbose_name='Nivel Actual'
    )
    nombre_nivel = models.CharField(
        max_length=50,
        default='Novato',
        verbose_name='Nombre del Nivel'
    )

    # Estadísticas
    capacitaciones_completadas = models.PositiveIntegerField(
        default=0,
        verbose_name='Capacitaciones Completadas'
    )
    badges_obtenidos = models.PositiveIntegerField(
        default=0,
        verbose_name='Badges Obtenidos'
    )
    racha_actual = models.PositiveIntegerField(
        default=0,
        verbose_name='Racha Actual (días)'
    )
    racha_maxima = models.PositiveIntegerField(
        default=0,
        verbose_name='Racha Máxima (días)'
    )

    # Ranking
    posicion_ranking = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Posición en Ranking'
    )

    ultima_actividad = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Actividad'
    )

    class Meta:
        db_table = 'gamificacion_colaborador'
        verbose_name = 'Gamificación del Colaborador'
        verbose_name_plural = 'Gamificación de Colaboradores'
        ordering = ['-puntos_totales']

    def __str__(self):
        return f"{self.colaborador} - Nivel {self.nivel} ({self.puntos_totales} pts)"


# =============================================================================
# NIVELES DEL JUEGO
# =============================================================================

class GameLevel(TenantModel):
    """
    Nivel del Juego SST — Define cada nivel jugable.

    Cada nivel pertenece a una zona temática y contiene un mapa
    con riesgos, EPP y preguntas SST para neutralizar.
    """

    codigo = models.CharField(
        max_length=50,
        verbose_name='Código del Nivel',
        help_text='Código único del nivel (ej: nivel-1-planta-industrial)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre del Nivel'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    zona = models.CharField(
        max_length=20,
        choices=ZONA_JUEGO_CHOICES,
        default='obra_civil',
        db_index=True,
        verbose_name='Zona Temática'
    )
    numero_nivel = models.PositiveIntegerField(
        verbose_name='Número de Nivel',
        help_text='Número secuencial del nivel (1-24)'
    )

    # Objetivos y puntuación
    puntos_completar = models.PositiveIntegerField(
        default=100,
        verbose_name='Puntos al Completar'
    )
    tiempo_limite_segundos = models.PositiveIntegerField(
        default=600,
        verbose_name='Tiempo Límite (segundos)',
        help_text='0 = sin límite de tiempo'
    )
    min_preguntas_correctas = models.PositiveIntegerField(
        default=2,
        verbose_name='Preguntas Correctas Mínimas',
        help_text='Mínimo de preguntas correctas para completar'
    )
    total_epps = models.PositiveIntegerField(
        default=5,
        verbose_name='Total EPP a Recolectar'
    )

    # Mapa
    mapa_key = models.CharField(
        max_length=50,
        verbose_name='Clave del Mapa',
        help_text='Nombre del archivo JSON del mapa (sin extensión)'
    )

    # Config del nivel
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración Adicional',
        help_text='Config extra: NPCs, EPP positions, hazards, etc.'
    )

    # Disponibilidad
    disponible_desde = models.DateField(
        null=True,
        blank=True,
        verbose_name='Disponible Desde',
        help_text='Fecha desde la cual está disponible (fases mensuales)'
    )
    es_boss = models.BooleanField(
        default=False,
        verbose_name='Es Nivel Boss',
        help_text='Nivel final de zona con jefe'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'juego_sst_game_level'
        verbose_name = 'Nivel del Juego SST'
        verbose_name_plural = 'Niveles del Juego SST'
        ordering = ['orden', 'numero_nivel']
        indexes = [
            models.Index(fields=['zona']),
            models.Index(fields=['numero_nivel']),
        ]

    def __str__(self):
        return f"Nivel {self.numero_nivel}: {self.nombre} ({self.get_zona_display()})"


# =============================================================================
# PREGUNTAS QUIZ
# =============================================================================

class GameQuizQuestion(TenantModel):
    """
    Pregunta Quiz del Juego SST — Preguntas de conocimiento SST.

    Cada pregunta está asociada a un nivel y basada en normativa
    colombiana (Decreto 1072, ISO 45001, Resolución 0312, etc.).
    """

    nivel = models.ForeignKey(
        GameLevel,
        on_delete=models.CASCADE,
        related_name='preguntas',
        verbose_name='Nivel'
    )

    pregunta = models.TextField(
        verbose_name='Pregunta'
    )
    opciones = models.JSONField(
        verbose_name='Opciones de Respuesta',
        help_text='Lista: [{"id": "a", "texto": "...", "es_correcta": true/false}]'
    )
    explicacion = models.TextField(
        blank=True,
        verbose_name='Explicación',
        help_text='Explicación mostrada después de responder'
    )

    # Referencia normativa
    norma_referencia = models.CharField(
        max_length=150,
        blank=True,
        verbose_name='Referencia Normativa',
        help_text='Ej: Decreto 1072 Art. 2.2.4.6.12'
    )

    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_QUIZ_CHOICES,
        default='normas',
        db_index=True,
        verbose_name='Categoría'
    )
    dificultad = models.CharField(
        max_length=10,
        choices=DIFICULTAD_QUIZ_CHOICES,
        default='medio',
        verbose_name='Dificultad'
    )
    puntos = models.PositiveIntegerField(
        default=20,
        verbose_name='Puntos por Respuesta Correcta'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'juego_sst_game_quiz_question'
        verbose_name = 'Pregunta Quiz Juego SST'
        verbose_name_plural = 'Preguntas Quiz Juego SST'
        ordering = ['nivel', 'orden']
        indexes = [
            models.Index(fields=['nivel', 'categoria']),
        ]

    def __str__(self):
        return f"Q{self.orden} - Nivel {self.nivel.numero_nivel}: {self.pregunta[:60]}..."


# =============================================================================
# PROGRESO DEL JUGADOR
# =============================================================================

class GameProgress(TenantModel):
    """
    Progreso del Juego SST — Estado de juego por colaborador.

    Mantiene el progreso persistente del jugador: XP, nivel,
    EPPs recolectados, niveles completados, y estadísticas.
    Se sincroniza con GamificacionColaborador para el leaderboard global.
    """

    colaborador = models.OneToOneField(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='game_progress',
        verbose_name='Colaborador'
    )

    # Progreso
    nivel_actual = models.PositiveIntegerField(
        default=1,
        verbose_name='Nivel Actual'
    )
    xp_total = models.PositiveIntegerField(
        default=0,
        verbose_name='XP Total'
    )
    xp_nivel_actual = models.PositiveIntegerField(
        default=0,
        verbose_name='XP en Nivel Actual'
    )
    xp_siguiente_nivel = models.PositiveIntegerField(
        default=100,
        verbose_name='XP para Siguiente Nivel'
    )
    vidas = models.PositiveIntegerField(
        default=3,
        verbose_name='Vidas Restantes'
    )

    # Colecciones
    epps_recolectados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='EPPs Recolectados',
        help_text='Lista de IDs de EPP recolectados'
    )
    niveles_completados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Niveles Completados',
        help_text='Lista de IDs de niveles completados'
    )
    mejor_puntaje_nivel = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Mejor Puntaje por Nivel',
        help_text='Dict: {nivel_id: mejor_puntaje}'
    )

    # Estadísticas
    preguntas_correctas = models.PositiveIntegerField(
        default=0,
        verbose_name='Preguntas Correctas (Total)'
    )
    preguntas_totales = models.PositiveIntegerField(
        default=0,
        verbose_name='Preguntas Respondidas (Total)'
    )
    tiempo_jugado_segundos = models.PositiveIntegerField(
        default=0,
        verbose_name='Tiempo Jugado (segundos)'
    )
    sesiones_jugadas = models.PositiveIntegerField(
        default=0,
        verbose_name='Sesiones Jugadas'
    )

    ultima_sesion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Sesión'
    )

    class Meta:
        db_table = 'juego_sst_game_progress'
        verbose_name = 'Progreso Juego SST'
        verbose_name_plural = 'Progresos Juego SST'
        ordering = ['-xp_total']

    def __str__(self):
        return f"{self.colaborador} - Nivel {self.nivel_actual} ({self.xp_total} XP)"

    @property
    def porcentaje_xp(self):
        """Porcentaje de XP hacia el siguiente nivel."""
        if self.xp_siguiente_nivel <= 0:
            return 100
        return round((self.xp_nivel_actual / self.xp_siguiente_nivel) * 100, 1)

    @property
    def precision_quizzes(self):
        """Porcentaje de precisión en quizzes."""
        if self.preguntas_totales <= 0:
            return 0
        return round((self.preguntas_correctas / self.preguntas_totales) * 100, 1)

    @property
    def tiempo_jugado_formateado(self):
        """Tiempo jugado en formato legible."""
        horas = self.tiempo_jugado_segundos // 3600
        minutos = (self.tiempo_jugado_segundos % 3600) // 60
        if horas > 0:
            return f"{horas}h {minutos}min"
        return f"{minutos}min"


# =============================================================================
# SESIONES DE JUEGO
# =============================================================================

class GameSession(TenantModel):
    """
    Sesión del Juego SST — Log de cada partida individual.

    Registra el resultado de cada intento de juego en un nivel.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='game_sessions',
        verbose_name='Colaborador'
    )
    nivel = models.ForeignKey(
        GameLevel,
        on_delete=models.CASCADE,
        related_name='sesiones',
        verbose_name='Nivel Jugado'
    )

    # Resultados
    puntaje = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntaje Obtenido'
    )
    xp_ganado = models.PositiveIntegerField(
        default=0,
        verbose_name='XP Ganado'
    )
    preguntas_correctas = models.PositiveIntegerField(
        default=0,
        verbose_name='Preguntas Correctas'
    )
    preguntas_totales = models.PositiveIntegerField(
        default=0,
        verbose_name='Preguntas Respondidas'
    )
    epps_recolectados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='EPPs Recolectados en Sesión'
    )
    completado = models.BooleanField(
        default=False,
        verbose_name='Nivel Completado'
    )
    duracion_segundos = models.PositiveIntegerField(
        default=0,
        verbose_name='Duración (segundos)'
    )

    # Detalle de respuestas
    detalle_respuestas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Detalle de Respuestas',
        help_text='[{"pregunta_id": 1, "respuesta": "b", "correcta": true}]'
    )

    fecha_sesion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Sesión'
    )

    class Meta:
        db_table = 'juego_sst_game_session'
        verbose_name = 'Sesión Juego SST'
        verbose_name_plural = 'Sesiones Juego SST'
        ordering = ['-fecha_sesion']
        indexes = [
            models.Index(fields=['colaborador', '-fecha_sesion']),
            models.Index(fields=['nivel', 'completado']),
        ]

    def __str__(self):
        estado = "✓" if self.completado else "✗"
        return f"{estado} {self.colaborador} - Nivel {self.nivel.numero_nivel} ({self.puntaje} pts)"
