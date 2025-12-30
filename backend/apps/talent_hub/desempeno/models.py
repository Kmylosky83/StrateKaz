"""
Modelos para Desempeño - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte

Este módulo implementa:
- Ciclos de Evaluación de Desempeño
- Competencias y Criterios de Evaluación
- Evaluaciones 360° (Autoevaluación, Jefe, Pares, Subordinados)
- Planes de Mejora y Desarrollo
- Reconocimientos
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# CONFIGURACIÓN DE EVALUACIÓN
# =============================================================================

class CicloEvaluacion(BaseCompanyModel):
    """
    Ciclo de evaluación de desempeño (anual, semestral, trimestral).
    Agrupa todas las evaluaciones de un período.
    """
    TIPO_CICLO_CHOICES = [
        ('anual', 'Anual'),
        ('semestral', 'Semestral'),
        ('trimestral', 'Trimestral'),
        ('especial', 'Especial'),
    ]
    ESTADO_CHOICES = [
        ('planificado', 'Planificado'),
        ('en_configuracion', 'En Configuración'),
        ('activo', 'Activo'),
        ('en_evaluacion', 'En Evaluación'),
        ('en_revision', 'En Revisión'),
        ('cerrado', 'Cerrado'),
        ('cancelado', 'Cancelado'),
    ]

    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo_ciclo = models.CharField(max_length=20, choices=TIPO_CICLO_CHOICES, default='anual')
    anio = models.PositiveIntegerField()
    periodo = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text="Período dentro del año (1-4)"
    )

    # Fechas del ciclo
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_inicio_evaluacion = models.DateField(null=True, blank=True)
    fecha_fin_evaluacion = models.DateField(null=True, blank=True)
    fecha_revision = models.DateField(null=True, blank=True)
    fecha_cierre = models.DateField(null=True, blank=True)

    # Configuración
    incluye_autoevaluacion = models.BooleanField(default=True)
    incluye_evaluacion_jefe = models.BooleanField(default=True)
    incluye_evaluacion_pares = models.BooleanField(default=False)
    incluye_evaluacion_subordinados = models.BooleanField(default=False)
    numero_pares_requeridos = models.PositiveSmallIntegerField(default=2)

    # Pesos de cada tipo de evaluación (deben sumar 100)
    peso_autoevaluacion = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    peso_evaluacion_jefe = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    peso_evaluacion_pares = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    peso_evaluacion_subordinados = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='planificado')
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_ciclo_evaluacion'
        verbose_name = 'Ciclo de Evaluación'
        verbose_name_plural = 'Ciclos de Evaluación'
        ordering = ['-anio', '-periodo']
        indexes = [
            models.Index(fields=['empresa', 'anio', 'periodo']),
            models.Index(fields=['empresa', 'estado']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='unique_ciclo_codigo'
            ),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def peso_total(self):
        """Suma de todos los pesos configurados."""
        pesos = [self.peso_autoevaluacion]
        if self.incluye_evaluacion_jefe:
            pesos.append(self.peso_evaluacion_jefe)
        if self.incluye_evaluacion_pares:
            pesos.append(self.peso_evaluacion_pares)
        if self.incluye_evaluacion_subordinados:
            pesos.append(self.peso_evaluacion_subordinados)
        return sum(pesos)


class CompetenciaEvaluacion(BaseCompanyModel):
    """
    Competencias que se evalúan en el ciclo.
    Pueden ser técnicas, comportamentales u organizacionales.
    """
    TIPO_COMPETENCIA_CHOICES = [
        ('tecnica', 'Técnica'),
        ('comportamental', 'Comportamental'),
        ('organizacional', 'Organizacional'),
        ('liderazgo', 'Liderazgo'),
        ('funcional', 'Funcional'),
    ]
    NIVEL_CHOICES = [
        ('basico', 'Básico'),
        ('intermedio', 'Intermedio'),
        ('avanzado', 'Avanzado'),
        ('experto', 'Experto'),
    ]

    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo_competencia = models.CharField(max_length=20, choices=TIPO_COMPETENCIA_CHOICES)
    nivel_esperado = models.CharField(max_length=20, choices=NIVEL_CHOICES, default='intermedio')

    # Indicadores de comportamiento por nivel
    indicadores_basico = models.TextField(blank=True, help_text="Comportamientos nivel básico")
    indicadores_intermedio = models.TextField(blank=True, help_text="Comportamientos nivel intermedio")
    indicadores_avanzado = models.TextField(blank=True, help_text="Comportamientos nivel avanzado")
    indicadores_experto = models.TextField(blank=True, help_text="Comportamientos nivel experto")

    peso = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        help_text="Peso de la competencia en la evaluación total"
    )
    orden = models.PositiveSmallIntegerField(default=0)
    aplica_a_todos = models.BooleanField(default=True)
    cargos_aplicables = models.ManyToManyField(
        'core.Cargo',
        blank=True,
        related_name='competencias_evaluacion'
    )

    class Meta:
        db_table = 'talent_competencia_evaluacion'
        verbose_name = 'Competencia de Evaluación'
        verbose_name_plural = 'Competencias de Evaluación'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'tipo_competencia']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class CriterioEvaluacion(BaseCompanyModel):
    """
    Criterios específicos dentro de cada competencia.
    """
    competencia = models.ForeignKey(
        CompetenciaEvaluacion,
        on_delete=models.CASCADE,
        related_name='criterios'
    )
    descripcion = models.CharField(max_length=500)
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'talent_criterio_evaluacion'
        verbose_name = 'Criterio de Evaluación'
        verbose_name_plural = 'Criterios de Evaluación'
        ordering = ['competencia', 'orden']

    def __str__(self):
        return f"{self.competencia.codigo}: {self.descripcion[:50]}"


class EscalaCalificacion(BaseCompanyModel):
    """
    Escala de calificación configurable.
    """
    ciclo = models.ForeignKey(
        CicloEvaluacion,
        on_delete=models.CASCADE,
        related_name='escala_calificacion'
    )
    valor = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    etiqueta = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#808080', help_text="Color HEX")

    class Meta:
        db_table = 'talent_escala_calificacion'
        verbose_name = 'Escala de Calificación'
        verbose_name_plural = 'Escalas de Calificación'
        ordering = ['ciclo', 'valor']
        constraints = [
            models.UniqueConstraint(
                fields=['ciclo', 'valor'],
                name='unique_escala_valor'
            ),
        ]

    def __str__(self):
        return f"{self.valor} - {self.etiqueta}"


# =============================================================================
# EVALUACIÓN DE DESEMPEÑO
# =============================================================================

class EvaluacionDesempeno(BaseCompanyModel):
    """
    Evaluación de desempeño de un colaborador en un ciclo.
    Registro maestro que agrupa todas las evaluaciones (360°).
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_autoevaluacion', 'En Autoevaluación'),
        ('en_evaluacion_jefe', 'En Evaluación de Jefe'),
        ('en_evaluacion_pares', 'En Evaluación de Pares'),
        ('en_revision', 'En Revisión'),
        ('calibracion', 'En Calibración'),
        ('retroalimentacion', 'Retroalimentación'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    ciclo = models.ForeignKey(
        CicloEvaluacion,
        on_delete=models.PROTECT,
        related_name='evaluaciones'
    )
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='evaluaciones_desempeno'
    )
    jefe_evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='evaluaciones_como_jefe',
        null=True, blank=True
    )

    # Fechas
    fecha_asignacion = models.DateField(auto_now_add=True)
    fecha_inicio_autoevaluacion = models.DateTimeField(null=True, blank=True)
    fecha_fin_autoevaluacion = models.DateTimeField(null=True, blank=True)
    fecha_evaluacion_jefe = models.DateTimeField(null=True, blank=True)
    fecha_revision = models.DateTimeField(null=True, blank=True)
    fecha_retroalimentacion = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    # Calificaciones finales
    calificacion_autoevaluacion = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    calificacion_jefe = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    calificacion_pares = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    calificacion_subordinados = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    calificacion_final = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    # Calibración (ajuste gerencial)
    calificacion_calibrada = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    motivo_calibracion = models.TextField(blank=True)
    calibrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='calibraciones_realizadas'
    )

    estado = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='pendiente')

    # Retroalimentación
    fortalezas = models.TextField(blank=True)
    areas_mejora = models.TextField(blank=True)
    compromisos = models.TextField(blank=True)
    comentarios_colaborador = models.TextField(blank=True)
    firma_colaborador = models.BooleanField(default=False)
    fecha_firma_colaborador = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'talent_evaluacion_desempeno'
        verbose_name = 'Evaluación de Desempeño'
        verbose_name_plural = 'Evaluaciones de Desempeño'
        ordering = ['-ciclo__anio', 'colaborador']
        indexes = [
            models.Index(fields=['empresa', 'ciclo', 'estado']),
            models.Index(fields=['empresa', 'colaborador']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['ciclo', 'colaborador'],
                name='unique_evaluacion_ciclo_colaborador'
            ),
        ]

    def __str__(self):
        return f"{self.colaborador} - {self.ciclo.codigo}"

    def calcular_calificacion_final(self):
        """Calcula la calificación final ponderada."""
        total = Decimal('0')
        peso_usado = Decimal('0')

        if self.calificacion_autoevaluacion and self.ciclo.incluye_autoevaluacion:
            total += self.calificacion_autoevaluacion * (self.ciclo.peso_autoevaluacion / 100)
            peso_usado += self.ciclo.peso_autoevaluacion

        if self.calificacion_jefe and self.ciclo.incluye_evaluacion_jefe:
            total += self.calificacion_jefe * (self.ciclo.peso_evaluacion_jefe / 100)
            peso_usado += self.ciclo.peso_evaluacion_jefe

        if self.calificacion_pares and self.ciclo.incluye_evaluacion_pares:
            total += self.calificacion_pares * (self.ciclo.peso_evaluacion_pares / 100)
            peso_usado += self.ciclo.peso_evaluacion_pares

        if self.calificacion_subordinados and self.ciclo.incluye_evaluacion_subordinados:
            total += self.calificacion_subordinados * (self.ciclo.peso_evaluacion_subordinados / 100)
            peso_usado += self.ciclo.peso_evaluacion_subordinados

        if peso_usado > 0:
            # Normalizar al peso total usado
            self.calificacion_final = (total / peso_usado) * 100
        return self.calificacion_final


class DetalleEvaluacion(BaseCompanyModel):
    """
    Detalle de calificación por competencia/criterio.
    Almacena cada respuesta individual de la evaluación.
    """
    TIPO_EVALUADOR_CHOICES = [
        ('autoevaluacion', 'Autoevaluación'),
        ('jefe', 'Jefe Directo'),
        ('par', 'Par/Colega'),
        ('subordinado', 'Subordinado'),
    ]

    evaluacion = models.ForeignKey(
        EvaluacionDesempeno,
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    competencia = models.ForeignKey(
        CompetenciaEvaluacion,
        on_delete=models.PROTECT,
        related_name='detalles_evaluacion'
    )
    criterio = models.ForeignKey(
        CriterioEvaluacion,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='detalles_evaluacion'
    )
    tipo_evaluador = models.CharField(max_length=20, choices=TIPO_EVALUADOR_CHOICES)
    evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='detalles_evaluacion_realizados'
    )
    calificacion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    comentario = models.TextField(blank=True)
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'talent_detalle_evaluacion'
        verbose_name = 'Detalle de Evaluación'
        verbose_name_plural = 'Detalles de Evaluación'
        ordering = ['evaluacion', 'competencia__orden', 'tipo_evaluador']

    def __str__(self):
        return f"{self.evaluacion} - {self.competencia.codigo}: {self.calificacion}"


class EvaluadorPar(BaseCompanyModel):
    """
    Evaluadores pares asignados para evaluación 360°.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completada', 'Completada'),
        ('rechazada', 'Rechazada'),
    ]

    evaluacion = models.ForeignKey(
        EvaluacionDesempeno,
        on_delete=models.CASCADE,
        related_name='evaluadores_pares'
    )
    evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='asignaciones_evaluador_par'
    )
    es_subordinado = models.BooleanField(default=False)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateField(null=True, blank=True)
    fecha_evaluacion = models.DateTimeField(null=True, blank=True)
    calificacion_otorgada = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    comentario = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_evaluador_par'
        verbose_name = 'Evaluador Par'
        verbose_name_plural = 'Evaluadores Pares'
        ordering = ['evaluacion', 'fecha_asignacion']
        constraints = [
            models.UniqueConstraint(
                fields=['evaluacion', 'evaluador'],
                name='unique_evaluador_par'
            ),
        ]

    def __str__(self):
        return f"{self.evaluacion.colaborador} <- {self.evaluador}"


# =============================================================================
# PLAN DE MEJORA
# =============================================================================

class PlanMejora(BaseCompanyModel):
    """
    Plan de mejora derivado de la evaluación de desempeño.
    Define acciones de desarrollo para el colaborador.
    """
    TIPO_PLAN_CHOICES = [
        ('desarrollo', 'Plan de Desarrollo'),
        ('mejora', 'Plan de Mejora'),
        ('alto_potencial', 'Desarrollo Alto Potencial'),
        ('correctivo', 'Plan Correctivo'),
        ('transicion', 'Plan de Transición'),
    ]
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('aprobado', 'Aprobado'),
        ('en_ejecucion', 'En Ejecución'),
        ('seguimiento', 'En Seguimiento'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    evaluacion = models.ForeignKey(
        EvaluacionDesempeno,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='planes_mejora'
    )
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='planes_mejora'
    )
    codigo = models.CharField(max_length=20, db_index=True)
    titulo = models.CharField(max_length=200)
    tipo_plan = models.CharField(max_length=20, choices=TIPO_PLAN_CHOICES, default='desarrollo')

    # Fechas
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_aprobacion = models.DateField(null=True, blank=True)

    # Responsables
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='planes_mejora_responsable'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='planes_mejora_aprobados'
    )

    # Contenido
    objetivo_general = models.TextField()
    competencias_a_desarrollar = models.TextField(blank=True)
    recursos_necesarios = models.TextField(blank=True)
    indicadores_exito = models.TextField(blank=True)

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    porcentaje_avance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_plan_mejora'
        verbose_name = 'Plan de Mejora'
        verbose_name_plural = 'Planes de Mejora'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa', 'colaborador', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.colaborador}"

    def actualizar_avance(self):
        """Actualiza el porcentaje de avance basado en las actividades."""
        actividades = self.actividades.all()
        if actividades.exists():
            completadas = actividades.filter(estado='completada').count()
            self.porcentaje_avance = (completadas / actividades.count()) * 100
            self.save(update_fields=['porcentaje_avance'])


class ActividadPlanMejora(BaseCompanyModel):
    """
    Actividades específicas del plan de mejora.
    """
    TIPO_ACTIVIDAD_CHOICES = [
        ('capacitacion', 'Capacitación'),
        ('coaching', 'Coaching'),
        ('mentoria', 'Mentoría'),
        ('proyecto', 'Proyecto Especial'),
        ('lectura', 'Lectura/Estudio'),
        ('rotacion', 'Rotación de Puesto'),
        ('asignacion', 'Asignación Especial'),
        ('otro', 'Otro'),
    ]
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En Progreso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    plan = models.ForeignKey(
        PlanMejora,
        on_delete=models.CASCADE,
        related_name='actividades'
    )
    tipo_actividad = models.CharField(max_length=20, choices=TIPO_ACTIVIDAD_CHOICES)
    descripcion = models.TextField()
    resultado_esperado = models.TextField(blank=True)

    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_completado = models.DateField(null=True, blank=True)

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='actividades_plan_mejora'
    )
    prioridad = models.PositiveSmallIntegerField(
        default=2,
        validators=[MinValueValidator(1), MaxValueValidator(3)]
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    comentarios = models.TextField(blank=True)
    evidencia = models.TextField(blank=True, help_text="Descripción de evidencias")

    class Meta:
        db_table = 'talent_actividad_plan_mejora'
        verbose_name = 'Actividad de Plan de Mejora'
        verbose_name_plural = 'Actividades de Plan de Mejora'
        ordering = ['plan', 'prioridad', 'fecha_inicio']

    def __str__(self):
        return f"{self.plan.codigo}: {self.descripcion[:50]}"


class SeguimientoPlanMejora(BaseCompanyModel):
    """
    Registro de seguimiento del plan de mejora.
    """
    plan = models.ForeignKey(
        PlanMejora,
        on_delete=models.CASCADE,
        related_name='seguimientos'
    )
    fecha_seguimiento = models.DateField()
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='seguimientos_plan_mejora'
    )
    porcentaje_avance = models.DecimalField(max_digits=5, decimal_places=2)
    logros = models.TextField(blank=True)
    dificultades = models.TextField(blank=True)
    acciones_correctivas = models.TextField(blank=True)
    proxima_fecha_seguimiento = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_seguimiento_plan_mejora'
        verbose_name = 'Seguimiento de Plan de Mejora'
        verbose_name_plural = 'Seguimientos de Plan de Mejora'
        ordering = ['-fecha_seguimiento']

    def __str__(self):
        return f"{self.plan.codigo} - {self.fecha_seguimiento}"


# =============================================================================
# RECONOCIMIENTOS
# =============================================================================

class TipoReconocimiento(BaseCompanyModel):
    """
    Tipos de reconocimiento configurables.
    """
    CATEGORIA_CHOICES = [
        ('desempeno', 'Desempeño Excepcional'),
        ('innovacion', 'Innovación'),
        ('servicio', 'Servicio al Cliente'),
        ('equipo', 'Trabajo en Equipo'),
        ('liderazgo', 'Liderazgo'),
        ('antiguedad', 'Antigüedad'),
        ('otro', 'Otro'),
    ]

    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    icono = models.CharField(max_length=50, blank=True, help_text="Clase de ícono")
    color = models.CharField(max_length=7, default='#FFD700', help_text="Color HEX")
    puntos_otorgados = models.PositiveIntegerField(default=0)
    tiene_premio = models.BooleanField(default=False)
    descripcion_premio = models.TextField(blank=True)
    valor_premio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'talent_tipo_reconocimiento'
        verbose_name = 'Tipo de Reconocimiento'
        verbose_name_plural = 'Tipos de Reconocimiento'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Reconocimiento(BaseCompanyModel):
    """
    Reconocimientos otorgados a colaboradores.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente Aprobación'),
        ('aprobado', 'Aprobado'),
        ('entregado', 'Entregado'),
        ('rechazado', 'Rechazado'),
    ]

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='reconocimientos'
    )
    tipo_reconocimiento = models.ForeignKey(
        TipoReconocimiento,
        on_delete=models.PROTECT,
        related_name='reconocimientos'
    )
    evaluacion = models.ForeignKey(
        EvaluacionDesempeno,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reconocimientos'
    )

    fecha_reconocimiento = models.DateField()
    motivo = models.TextField()
    logro_especifico = models.TextField(blank=True)

    nominado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reconocimientos_nominados'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reconocimientos_aprobados'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    puntos_otorgados = models.PositiveIntegerField(default=0)
    premio_entregado = models.BooleanField(default=False)
    fecha_entrega_premio = models.DateField(null=True, blank=True)

    # Publicación
    es_publico = models.BooleanField(default=True)
    publicado_en_muro = models.BooleanField(default=False)
    fecha_publicacion = models.DateTimeField(null=True, blank=True)

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_reconocimiento'
        verbose_name = 'Reconocimiento'
        verbose_name_plural = 'Reconocimientos'
        ordering = ['-fecha_reconocimiento']
        indexes = [
            models.Index(fields=['empresa', 'colaborador', 'estado']),
            models.Index(fields=['empresa', 'fecha_reconocimiento']),
        ]

    def __str__(self):
        return f"{self.colaborador} - {self.tipo_reconocimiento.nombre}"

    def aprobar(self, usuario):
        """Aprueba el reconocimiento."""
        from django.utils import timezone
        self.estado = 'aprobado'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now().date()
        self.puntos_otorgados = self.tipo_reconocimiento.puntos_otorgados
        self.save()

    def entregar(self):
        """Marca el reconocimiento como entregado."""
        from django.utils import timezone
        self.estado = 'entregado'
        self.premio_entregado = True
        self.fecha_entrega_premio = timezone.now().date()
        self.save()


class MuroReconocimientos(BaseCompanyModel):
    """
    Muro de reconocimientos para publicación y gamificación.
    """
    reconocimiento = models.OneToOneField(
        Reconocimiento,
        on_delete=models.CASCADE,
        related_name='publicacion_muro'
    )
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    imagen = models.ImageField(upload_to='reconocimientos/', null=True, blank=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    likes = models.PositiveIntegerField(default=0)
    comentarios_count = models.PositiveIntegerField(default=0)
    es_destacado = models.BooleanField(default=False)

    class Meta:
        db_table = 'talent_muro_reconocimientos'
        verbose_name = 'Publicación en Muro'
        verbose_name_plural = 'Publicaciones en Muro'
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return f"Muro: {self.titulo}"
