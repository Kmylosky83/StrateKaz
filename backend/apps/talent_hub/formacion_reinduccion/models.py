"""
Modelos de Formación y Reinducción - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte

Gestión del desarrollo profesional y capacitación continua:
- PlanFormacion: Plan anual de capacitaciones
- Capacitacion: Cursos y programas de formación
- ProgramacionCapacitacion: Calendario de sesiones
- EjecucionCapacitacion: Registro de asistencia y participación
- Gamificacion: Sistema de puntos, badges y logros
- EvaluacionEficacia: Evaluación post-capacitación
- Certificado: Certificados de capacitación emitidos
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

TIPO_CAPACITACION_CHOICES = [
    ('induccion', 'Inducción'),
    ('reinduccion', 'Reinducción'),
    ('tecnica', 'Técnica'),
    ('habilidades_blandas', 'Habilidades Blandas'),
    ('sst', 'Seguridad y Salud en el Trabajo'),
    ('calidad', 'Sistema de Calidad'),
    ('ambiente', 'Gestión Ambiental'),
    ('pesv', 'Seguridad Vial'),
    ('liderazgo', 'Liderazgo'),
    ('normativa', 'Normativa/Legal'),
    ('otro', 'Otro'),
]

MODALIDAD_CHOICES = [
    ('presencial', 'Presencial'),
    ('virtual', 'Virtual Sincrónica'),
    ('asincronica', 'Virtual Asincrónica'),
    ('mixta', 'Mixta'),
    ('outdoor', 'Outdoor/Experiencial'),
]

ESTADO_CAPACITACION_CHOICES = [
    ('borrador', 'Borrador'),
    ('publicada', 'Publicada'),
    ('en_ejecucion', 'En Ejecución'),
    ('finalizada', 'Finalizada'),
    ('cancelada', 'Cancelada'),
]

ESTADO_PROGRAMACION_CHOICES = [
    ('programada', 'Programada'),
    ('confirmada', 'Confirmada'),
    ('en_curso', 'En Curso'),
    ('completada', 'Completada'),
    ('cancelada', 'Cancelada'),
    ('reprogramada', 'Reprogramada'),
]

ESTADO_EJECUCION_CHOICES = [
    ('inscrito', 'Inscrito'),
    ('confirmado', 'Confirmado'),
    ('asistio', 'Asistió'),
    ('no_asistio', 'No Asistió'),
    ('cancelado', 'Cancelado'),
    ('pendiente_evaluacion', 'Pendiente Evaluación'),
    ('aprobado', 'Aprobado'),
    ('reprobado', 'Reprobado'),
]

TIPO_BADGE_CHOICES = [
    ('logro', 'Logro'),
    ('nivel', 'Nivel'),
    ('especial', 'Especial'),
    ('competencia', 'Competencia'),
    ('racha', 'Racha'),
]

NIVEL_EFICACIA_CHOICES = [
    ('reaccion', '1. Reacción'),
    ('aprendizaje', '2. Aprendizaje'),
    ('comportamiento', '3. Comportamiento'),
    ('resultados', '4. Resultados'),
]


# =============================================================================
# PLAN DE FORMACIÓN
# =============================================================================

class PlanFormacion(BaseCompanyModel):
    """
    Plan de Formación - Plan anual o periódico de capacitaciones.

    Define el marco general de formación para un período determinado,
    incluyendo objetivos, presupuesto y capacitaciones planificadas.
    """

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código del Plan',
        help_text='Código único del plan (ej: PF-2025)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Plan'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Período
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Fin'
    )
    anio = models.PositiveIntegerField(
        verbose_name='Año',
        db_index=True
    )

    # Presupuesto
    presupuesto_asignado = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Presupuesto Asignado (COP)'
    )
    presupuesto_ejecutado = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Presupuesto Ejecutado (COP)'
    )

    # Objetivos
    objetivos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Objetivos del Plan',
        help_text='Lista de objetivos en formato JSON'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_formacion_responsable',
        verbose_name='Responsable del Plan'
    )

    # Estado
    aprobado = models.BooleanField(
        default=False,
        verbose_name='Plan Aprobado'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_formacion_aprobados',
        verbose_name='Aprobado Por'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_plan_formacion'
        verbose_name = 'Plan de Formación'
        verbose_name_plural = 'Planes de Formación'
        ordering = ['-anio', '-fecha_inicio']
        unique_together = ['empresa', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'anio']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.anio})"

    @property
    def porcentaje_ejecucion_presupuesto(self):
        """Calcula el porcentaje de ejecución del presupuesto."""
        if self.presupuesto_asignado > 0:
            return round((self.presupuesto_ejecutado / self.presupuesto_asignado) * 100, 2)
        return 0


# =============================================================================
# CAPACITACIÓN
# =============================================================================

class Capacitacion(BaseCompanyModel):
    """
    Capacitación - Curso o programa de formación.

    Define el contenido, duración, requisitos y evaluación de una capacitación.
    """

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código de Capacitación',
        help_text='Código único de la capacitación (ej: CAP-2025-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Capacitación'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Clasificación
    tipo_capacitacion = models.CharField(
        max_length=25,
        choices=TIPO_CAPACITACION_CHOICES,
        default='tecnica',
        db_index=True,
        verbose_name='Tipo de Capacitación'
    )
    modalidad = models.CharField(
        max_length=15,
        choices=MODALIDAD_CHOICES,
        default='presencial',
        verbose_name='Modalidad'
    )

    # Plan
    plan_formacion = models.ForeignKey(
        PlanFormacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='capacitaciones',
        verbose_name='Plan de Formación'
    )

    # Duración
    duracion_horas = models.PositiveIntegerField(
        default=1,
        verbose_name='Duración (horas)'
    )
    numero_sesiones = models.PositiveIntegerField(
        default=1,
        verbose_name='Número de Sesiones'
    )

    # Instructor
    instructor_interno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='capacitaciones_dictadas',
        verbose_name='Instructor Interno'
    )
    instructor_externo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Instructor Externo'
    )
    proveedor_externo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Proveedor/Institución Externa'
    )

    # Contenido
    objetivos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Objetivos de Aprendizaje'
    )
    contenido_tematico = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Contenido Temático'
    )
    material_apoyo = models.FileField(
        upload_to='formacion/materiales/',
        null=True,
        blank=True,
        verbose_name='Material de Apoyo'
    )

    # Requisitos
    cupo_maximo = models.PositiveIntegerField(
        default=20,
        verbose_name='Cupo Máximo'
    )
    cupo_minimo = models.PositiveIntegerField(
        default=5,
        verbose_name='Cupo Mínimo'
    )
    requisitos_previos = models.TextField(
        blank=True,
        verbose_name='Requisitos Previos'
    )
    cargos_objetivo = models.ManyToManyField(
        'core.Cargo',
        blank=True,
        related_name='capacitaciones_objetivo',
        verbose_name='Cargos Objetivo'
    )

    # Evaluación
    requiere_evaluacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Evaluación'
    )
    nota_aprobacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('70.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Nota Mínima Aprobación (%)'
    )
    genera_certificado = models.BooleanField(
        default=True,
        verbose_name='Genera Certificado'
    )

    # Costos
    costo_por_persona = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Costo por Persona (COP)'
    )
    costo_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Costo Total (COP)'
    )

    # Puntos de gamificación
    puntos_otorgados = models.PositiveIntegerField(
        default=10,
        verbose_name='Puntos Otorgados',
        help_text='Puntos que recibe el colaborador al completar'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CAPACITACION_CHOICES,
        default='borrador',
        db_index=True,
        verbose_name='Estado'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_capacitacion'
        verbose_name = 'Capacitación'
        verbose_name_plural = 'Capacitaciones'
        ordering = ['-created_at']
        unique_together = ['empresa', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'tipo_capacitacion']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# =============================================================================
# PROGRAMACIÓN DE CAPACITACIÓN
# =============================================================================

class ProgramacionCapacitacion(BaseCompanyModel):
    """
    Programación de Capacitación - Sesión programada de una capacitación.

    Define fecha, hora, lugar y detalles logísticos de cada sesión.
    """

    capacitacion = models.ForeignKey(
        Capacitacion,
        on_delete=models.CASCADE,
        related_name='programaciones',
        verbose_name='Capacitación'
    )

    # Sesión
    numero_sesion = models.PositiveIntegerField(
        default=1,
        verbose_name='Número de Sesión'
    )
    titulo_sesion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Título de la Sesión'
    )

    # Fechas
    fecha = models.DateField(
        verbose_name='Fecha',
        db_index=True
    )
    hora_inicio = models.TimeField(
        verbose_name='Hora de Inicio'
    )
    hora_fin = models.TimeField(
        verbose_name='Hora de Fin'
    )

    # Lugar
    lugar = models.CharField(
        max_length=200,
        verbose_name='Lugar/Ubicación'
    )
    direccion = models.CharField(
        max_length=300,
        blank=True,
        verbose_name='Dirección'
    )
    enlace_virtual = models.URLField(
        blank=True,
        verbose_name='Enlace Reunión Virtual'
    )

    # Instructor
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sesiones_dictadas',
        verbose_name='Instructor'
    )
    instructor_externo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Instructor Externo'
    )

    # Cupos
    inscritos = models.PositiveIntegerField(
        default=0,
        verbose_name='Inscritos'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_PROGRAMACION_CHOICES,
        default='programada',
        db_index=True,
        verbose_name='Estado'
    )

    # Materiales
    material_sesion = models.FileField(
        upload_to='formacion/sesiones/',
        null=True,
        blank=True,
        verbose_name='Material de la Sesión'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_programacion_capacitacion'
        verbose_name = 'Programación de Capacitación'
        verbose_name_plural = 'Programaciones de Capacitación'
        ordering = ['fecha', 'hora_inicio']
        unique_together = ['capacitacion', 'numero_sesion']
        indexes = [
            models.Index(fields=['fecha']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.capacitacion.nombre} - Sesión {self.numero_sesion} ({self.fecha})"

    @property
    def cupo_disponible(self):
        """Retorna el cupo disponible."""
        return max(0, self.capacitacion.cupo_maximo - self.inscritos)

    @property
    def esta_llena(self):
        """Verifica si la sesión está llena."""
        return self.inscritos >= self.capacitacion.cupo_maximo


# =============================================================================
# EJECUCIÓN DE CAPACITACIÓN
# =============================================================================

class EjecucionCapacitacion(BaseCompanyModel):
    """
    Ejecución de Capacitación - Registro de participación de un colaborador.

    Seguimiento de asistencia, evaluaciones y resultados por participante.
    """

    programacion = models.ForeignKey(
        ProgramacionCapacitacion,
        on_delete=models.CASCADE,
        related_name='ejecuciones',
        verbose_name='Programación'
    )
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='capacitaciones_recibidas',
        verbose_name='Colaborador'
    )

    # Estado
    estado = models.CharField(
        max_length=25,
        choices=ESTADO_EJECUCION_CHOICES,
        default='inscrito',
        db_index=True,
        verbose_name='Estado'
    )

    # Asistencia
    asistio = models.BooleanField(
        default=False,
        verbose_name='Asistió'
    )
    hora_entrada = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de Entrada'
    )
    hora_salida = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de Salida'
    )
    justificacion_inasistencia = models.TextField(
        blank=True,
        verbose_name='Justificación de Inasistencia'
    )

    # Evaluación
    nota_evaluacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Nota Evaluación (%)'
    )
    fecha_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Evaluación'
    )
    intentos_evaluacion = models.PositiveIntegerField(
        default=0,
        verbose_name='Intentos de Evaluación'
    )
    respuestas_evaluacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Respuestas de Evaluación'
    )

    # Puntos
    puntos_ganados = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos Ganados'
    )

    # Retroalimentación
    retroalimentacion = models.TextField(
        blank=True,
        verbose_name='Retroalimentación del Participante'
    )
    calificacion_instructor = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Calificación al Instructor (1-5)'
    )
    calificacion_contenido = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Calificación al Contenido (1-5)'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_ejecucion_capacitacion'
        verbose_name = 'Ejecución de Capacitación'
        verbose_name_plural = 'Ejecuciones de Capacitación'
        unique_together = ['programacion', 'colaborador']
        ordering = ['programacion__fecha', 'colaborador']
        indexes = [
            models.Index(fields=['colaborador', 'estado']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.programacion.capacitacion.nombre}"

    @property
    def aprobo(self):
        """Verifica si aprobó la capacitación."""
        cap = self.programacion.capacitacion
        if not cap.requiere_evaluacion:
            return self.asistio
        if self.nota_evaluacion is None:
            return False
        return self.nota_evaluacion >= cap.nota_aprobacion


# =============================================================================
# GAMIFICACIÓN
# =============================================================================

class Badge(BaseCompanyModel):
    """
    Badge - Insignia o reconocimiento de gamificación.

    Define los badges disponibles para los colaboradores.
    """

    codigo = models.CharField(
        max_length=20,
        verbose_name='Código del Badge'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Badge'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    tipo = models.CharField(
        max_length=15,
        choices=TIPO_BADGE_CHOICES,
        default='logro',
        verbose_name='Tipo de Badge'
    )

    # Icono/Imagen
    icono = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono (nombre del icono)'
    )
    imagen = models.ImageField(
        upload_to='formacion/badges/',
        null=True,
        blank=True,
        verbose_name='Imagen del Badge'
    )
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        verbose_name='Color (hex)',
        help_text='Color en formato hexadecimal'
    )

    # Requisitos
    puntos_requeridos = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos Requeridos',
        help_text='Puntos necesarios para obtener este badge'
    )
    capacitaciones_requeridas = models.PositiveIntegerField(
        default=0,
        verbose_name='Capacitaciones Requeridas'
    )
    criterio_especial = models.TextField(
        blank=True,
        verbose_name='Criterio Especial',
        help_text='Descripción de criterios adicionales'
    )

    # Puntos otorgados
    puntos_otorgados = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos que Otorga',
        help_text='Puntos bonus al obtener este badge'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'talent_hub_badge'
        verbose_name = 'Badge'
        verbose_name_plural = 'Badges'
        ordering = ['orden', 'nombre']
        unique_together = ['empresa', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class GamificacionColaborador(BaseCompanyModel):
    """
    Gamificación del Colaborador - Puntos, nivel y badges del colaborador.

    Mantiene el estado actual de gamificación de cada colaborador.
    """

    colaborador = models.OneToOneField(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='gamificacion',
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
        db_table = 'talent_hub_gamificacion_colaborador'
        verbose_name = 'Gamificación del Colaborador'
        verbose_name_plural = 'Gamificación de Colaboradores'
        ordering = ['-puntos_totales']

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - Nivel {self.nivel} ({self.puntos_totales} pts)"


class BadgeColaborador(BaseCompanyModel):
    """
    Badge del Colaborador - Badges obtenidos por un colaborador.

    Registro histórico de badges ganados.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='badges',
        verbose_name='Colaborador'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='colaboradores',
        verbose_name='Badge'
    )

    fecha_obtencion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Obtención'
    )
    motivo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Motivo de Otorgamiento'
    )

    # Capacitación relacionada (si aplica)
    capacitacion_relacionada = models.ForeignKey(
        Capacitacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='badges_otorgados',
        verbose_name='Capacitación Relacionada'
    )

    class Meta:
        db_table = 'talent_hub_badge_colaborador'
        verbose_name = 'Badge del Colaborador'
        verbose_name_plural = 'Badges de Colaboradores'
        unique_together = ['colaborador', 'badge']
        ordering = ['-fecha_obtencion']

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.badge.nombre}"


# =============================================================================
# EVALUACIÓN DE EFICACIA
# =============================================================================

class EvaluacionEficacia(BaseCompanyModel):
    """
    Evaluación de Eficacia - Evaluación post-capacitación según Kirkpatrick.

    Mide el impacto real de la capacitación en el colaborador y la organización.
    """

    ejecucion = models.ForeignKey(
        EjecucionCapacitacion,
        on_delete=models.CASCADE,
        related_name='evaluaciones_eficacia',
        verbose_name='Ejecución de Capacitación'
    )

    nivel_evaluacion = models.CharField(
        max_length=15,
        choices=NIVEL_EFICACIA_CHOICES,
        verbose_name='Nivel de Evaluación (Kirkpatrick)'
    )

    # Fechas
    fecha_evaluacion = models.DateField(
        verbose_name='Fecha de Evaluación'
    )
    fecha_programada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Programada'
    )

    # Evaluador
    evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='evaluaciones_eficacia_realizadas',
        verbose_name='Evaluador'
    )

    # Resultados
    calificacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificación (%)'
    )
    criterios_evaluados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Criterios Evaluados',
        help_text='Lista de criterios y sus calificaciones'
    )

    # Evidencias
    evidencias = models.TextField(
        blank=True,
        verbose_name='Evidencias de Aplicación'
    )
    mejoras_observadas = models.TextField(
        blank=True,
        verbose_name='Mejoras Observadas'
    )
    areas_oportunidad = models.TextField(
        blank=True,
        verbose_name='Áreas de Oportunidad'
    )

    # Seguimiento
    requiere_refuerzo = models.BooleanField(
        default=False,
        verbose_name='Requiere Refuerzo'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_evaluacion_eficacia'
        verbose_name = 'Evaluación de Eficacia'
        verbose_name_plural = 'Evaluaciones de Eficacia'
        ordering = ['-fecha_evaluacion']
        indexes = [
            models.Index(fields=['ejecucion', 'nivel_evaluacion']),
        ]

    def __str__(self):
        return f"{self.ejecucion} - {self.get_nivel_evaluacion_display()}"


# =============================================================================
# CERTIFICADO
# =============================================================================

class Certificado(BaseCompanyModel):
    """
    Certificado - Certificado de capacitación emitido.

    Registro de certificados emitidos a colaboradores por completar capacitaciones.
    """

    numero_certificado = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Número de Certificado'
    )

    ejecucion = models.ForeignKey(
        EjecucionCapacitacion,
        on_delete=models.CASCADE,
        related_name='certificados',
        verbose_name='Ejecución de Capacitación'
    )

    # Detalles
    fecha_emision = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Emisión'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Null si el certificado no vence'
    )

    # Contenido
    titulo_capacitacion = models.CharField(
        max_length=200,
        verbose_name='Título de la Capacitación'
    )
    duracion_horas = models.PositiveIntegerField(
        verbose_name='Duración (horas)'
    )
    nota_obtenida = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Nota Obtenida'
    )

    # Firmas
    firmado_por = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Firmado Por'
    )
    cargo_firmante = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Cargo del Firmante'
    )

    # Archivo
    archivo_certificado = models.FileField(
        upload_to='formacion/certificados/',
        null=True,
        blank=True,
        verbose_name='Archivo del Certificado (PDF)'
    )

    # Estado
    anulado = models.BooleanField(
        default=False,
        verbose_name='Anulado'
    )
    motivo_anulacion = models.TextField(
        blank=True,
        verbose_name='Motivo de Anulación'
    )

    # Verificación
    codigo_verificacion = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código de Verificación',
        help_text='Código para verificación de autenticidad'
    )

    class Meta:
        db_table = 'talent_hub_certificado'
        verbose_name = 'Certificado'
        verbose_name_plural = 'Certificados'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['numero_certificado']),
            models.Index(fields=['ejecucion']),
        ]

    def __str__(self):
        return f"Certificado {self.numero_certificado} - {self.ejecucion.colaborador.get_nombre_corto()}"

    @property
    def esta_vigente(self):
        """Verifica si el certificado está vigente."""
        if self.anulado:
            return False
        if not self.fecha_vencimiento:
            return True
        from django.utils import timezone
        return self.fecha_vencimiento >= timezone.now().date()
