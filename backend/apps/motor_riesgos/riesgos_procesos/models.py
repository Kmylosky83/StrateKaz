"""
Modelos para Riesgos de Procesos - ISO 31000
==============================================

Sistema de gestión de riesgos de procesos según ISO 31000.
Incluye categorización, evaluación inherente/residual, tratamiento y controles operacionales.

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import CASCADE, SET_NULL, PROTECT

from apps.core.base_models import BaseCompanyModel, TimestampedModel, SoftDeleteModel, OrderedModel


class CategoriaRiesgo(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo global de categorías de riesgo.

    Clasificación estándar según ISO 31000:
    - Estratégico, Operativo, Financiero, Cumplimiento,
      Tecnológico, Reputacional, SST, Ambiental, etc.
    """

    codigo = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de categoría (ej: EST, OPE, FIN)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de riesgo'
    )
    color = models.CharField(
        max_length=7,
        default='#6B7280',
        verbose_name='Color',
        help_text='Color hexadecimal para visualización (#RRGGBB)'
    )

    class Meta:
        db_table = 'motor_riesgos_categoria_riesgo'
        verbose_name = 'Categoría de Riesgo'
        verbose_name_plural = 'Categorías de Riesgos'
        ordering = ['orden', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class RiesgoProceso(BaseCompanyModel):
    """
    Registro de riesgos de procesos según ISO 31000.

    Gestiona el ciclo completo de riesgo:
    - Identificación y clasificación
    - Evaluación inherente (sin controles)
    - Evaluación residual (con controles)
    - Causa raíz y consecuencias
    - Responsable y estado
    """

    class TipoRiesgo(models.TextChoices):
        ESTRATEGICO = 'estrategico', 'Estratégico'
        OPERATIVO = 'operativo', 'Operativo'
        FINANCIERO = 'financiero', 'Financiero'
        CUMPLIMIENTO = 'cumplimiento', 'Cumplimiento'
        TECNOLOGICO = 'tecnologico', 'Tecnológico'
        REPUTACIONAL = 'reputacional', 'Reputacional'
        SST = 'sst', 'Seguridad y Salud en el Trabajo'
        AMBIENTAL = 'ambiental', 'Ambiental'

    class EstadoRiesgo(models.TextChoices):
        IDENTIFICADO = 'identificado', 'Identificado'
        EN_ANALISIS = 'en_analisis', 'En Análisis'
        EN_TRATAMIENTO = 'en_tratamiento', 'En Tratamiento'
        MONITOREADO = 'monitoreado', 'Monitoreado'
        CERRADO = 'cerrado', 'Cerrado'

    # Identificación
    codigo = models.CharField(
        max_length=20,
        verbose_name='Código',
        help_text='Código único del riesgo'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Riesgo',
        help_text='Descripción corta del riesgo'
    )
    descripcion = models.TextField(
        verbose_name='Descripción Detallada',
        help_text='Descripción completa del evento de riesgo'
    )

    # Clasificación
    tipo = models.CharField(
        max_length=20,
        choices=TipoRiesgo.choices,
        verbose_name='Tipo de Riesgo'
    )
    categoria = models.ForeignKey(
        CategoriaRiesgo,
        on_delete=PROTECT,
        null=True,
        blank=True,
        related_name='riesgos',
        verbose_name='Categoría',
        help_text='Categoría específica del riesgo'
    )
    proceso = models.CharField(
        max_length=200,
        verbose_name='Proceso Asociado',
        help_text='Proceso de negocio al que pertenece el riesgo'
    )

    # Análisis de causas y consecuencias
    causa_raiz = models.TextField(
        verbose_name='Causa Raíz',
        help_text='Causa o causas fundamentales del riesgo'
    )
    consecuencia = models.TextField(
        verbose_name='Consecuencia Potencial',
        help_text='Impacto potencial si el riesgo se materializa'
    )

    # Evaluación INHERENTE (sin controles) - Escala 1-5
    probabilidad_inherente = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Probabilidad Inherente',
        help_text='Probabilidad sin controles (1=Muy Baja, 5=Muy Alta)'
    )
    impacto_inherente = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Impacto Inherente',
        help_text='Impacto sin controles (1=Insignificante, 5=Catastrófico)'
    )

    # Evaluación RESIDUAL (con controles) - Escala 1-5
    probabilidad_residual = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Probabilidad Residual',
        help_text='Probabilidad con controles (1=Muy Baja, 5=Muy Alta)'
    )
    impacto_residual = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Impacto Residual',
        help_text='Impacto con controles (1=Insignificante, 5=Catastrófico)'
    )

    # Responsable y estado
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name='riesgos_responsable',
        verbose_name='Responsable del Riesgo',
        help_text='Propietario del riesgo'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoRiesgo.choices,
        default=EstadoRiesgo.IDENTIFICADO,
        verbose_name='Estado del Riesgo'
    )

    class Meta:
        db_table = 'motor_riesgos_riesgo_proceso'
        verbose_name = 'Riesgo de Proceso'
        verbose_name_plural = 'Riesgos de Procesos'
        ordering = ['-created_at']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'tipo']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'proceso']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def nivel_inherente(self):
        """Calcula nivel de riesgo inherente (Probabilidad × Impacto)."""
        return self.probabilidad_inherente * self.impacto_inherente

    @property
    def nivel_residual(self):
        """Calcula nivel de riesgo residual (Probabilidad × Impacto)."""
        return self.probabilidad_residual * self.impacto_residual

    @property
    def interpretacion_inherente(self):
        """Interpreta el nivel inherente según escala ISO 31000."""
        return self._interpretar_nivel(self.nivel_inherente)

    @property
    def interpretacion_residual(self):
        """Interpreta el nivel residual según escala ISO 31000."""
        return self._interpretar_nivel(self.nivel_residual)

    def _interpretar_nivel(self, nivel):
        """
        Interpreta el nivel de riesgo según escala:
        1-4: Bajo
        5-9: Moderado
        10-14: Alto
        15-25: Crítico
        """
        if nivel >= 15:
            return 'CRITICO'
        elif nivel >= 10:
            return 'ALTO'
        elif nivel >= 5:
            return 'MODERADO'
        else:
            return 'BAJO'

    @property
    def reduccion_riesgo_porcentaje(self):
        """Calcula el porcentaje de reducción del riesgo con controles."""
        if self.nivel_inherente == 0:
            return 0
        reduccion = ((self.nivel_inherente - self.nivel_residual) / self.nivel_inherente) * 100
        return round(reduccion, 2)


class TratamientoRiesgo(BaseCompanyModel):
    """
    Planes de tratamiento para riesgos según ISO 31000.

    Estrategias de respuesta al riesgo:
    - Evitar: Eliminar la actividad que genera el riesgo
    - Mitigar: Reducir probabilidad o impacto
    - Transferir: Compartir con terceros (seguros, outsourcing)
    - Aceptar: Retener el riesgo de forma informada
    """

    class TipoTratamiento(models.TextChoices):
        EVITAR = 'evitar', 'Evitar'
        MITIGAR = 'mitigar', 'Mitigar'
        TRANSFERIR = 'transferir', 'Transferir'
        ACEPTAR = 'aceptar', 'Aceptar'

    class EstadoTratamiento(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_CURSO = 'en_curso', 'En Curso'
        COMPLETADO = 'completado', 'Completado'
        CANCELADO = 'cancelado', 'Cancelado'

    riesgo = models.ForeignKey(
        RiesgoProceso,
        on_delete=CASCADE,
        related_name='tratamientos',
        verbose_name='Riesgo'
    )
    tipo = models.CharField(
        max_length=15,
        choices=TipoTratamiento.choices,
        verbose_name='Tipo de Tratamiento'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Tratamiento',
        help_text='Detalle de las acciones a implementar'
    )
    control_propuesto = models.TextField(
        verbose_name='Control Propuesto',
        help_text='Control específico a implementar'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name='tratamientos_responsable',
        verbose_name='Responsable de Implementación'
    )
    fecha_implementacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Implementación Planificada'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoTratamiento.choices,
        default=EstadoTratamiento.PENDIENTE,
        verbose_name='Estado del Tratamiento'
    )
    efectividad = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Efectividad',
        help_text='Evaluación de efectividad: Alta/Media/Baja'
    )

    class Meta:
        db_table = 'motor_riesgos_tratamiento_riesgo'
        verbose_name = 'Tratamiento de Riesgo'
        verbose_name_plural = 'Tratamientos de Riesgos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'riesgo']),
            models.Index(fields=['empresa', 'estado']),
        ]

    def __str__(self):
        return f"{self.riesgo.codigo} - {self.get_tipo_display()}"


class ControlOperacional(BaseCompanyModel):
    """
    Controles operacionales implementados para gestionar riesgos.

    Clasificación según naturaleza:
    - Preventivo: Previene la ocurrencia del riesgo
    - Detectivo: Detecta cuando el riesgo se materializa
    - Correctivo: Corrige después de la materialización
    """

    class TipoControl(models.TextChoices):
        PREVENTIVO = 'preventivo', 'Preventivo'
        DETECTIVO = 'detectivo', 'Detectivo'
        CORRECTIVO = 'correctivo', 'Correctivo'

    riesgo = models.ForeignKey(
        RiesgoProceso,
        on_delete=CASCADE,
        related_name='controles',
        verbose_name='Riesgo'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Control'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Control',
        help_text='Cómo funciona el control'
    )
    tipo_control = models.CharField(
        max_length=15,
        choices=TipoControl.choices,
        verbose_name='Tipo de Control'
    )
    frecuencia = models.CharField(
        max_length=20,
        verbose_name='Frecuencia',
        help_text='Ej: Diaria, Semanal, Mensual, Por evento'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name='controles_responsable',
        verbose_name='Responsable del Control'
    )
    documentacion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Documentación Asociada',
        help_text='Procedimientos, formatos, instrucciones'
    )
    efectividad = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Efectividad',
        help_text='Alta/Media/Baja'
    )
    fecha_ultima_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Última Evaluación'
    )

    class Meta:
        db_table = 'motor_riesgos_control_operacional'
        verbose_name = 'Control Operacional'
        verbose_name_plural = 'Controles Operacionales'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'riesgo']),
            models.Index(fields=['empresa', 'tipo_control']),
        ]

    def __str__(self):
        return f"{self.riesgo.codigo} - {self.nombre}"


class Oportunidad(BaseCompanyModel):
    """
    Registro de oportunidades identificadas según ISO 31000.

    Las oportunidades son el lado positivo del riesgo:
    eventos potenciales que pueden generar valor o beneficio.
    """

    class EstadoOportunidad(models.TextChoices):
        IDENTIFICADA = 'identificada', 'Identificada'
        EN_EVALUACION = 'en_evaluacion', 'En Evaluación'
        APROBADA = 'aprobada', 'Aprobada'
        EN_EJECUCION = 'en_ejecucion', 'En Ejecución'
        MATERIALIZADA = 'materializada', 'Materializada'
        DESCARTADA = 'descartada', 'Descartada'

    codigo = models.CharField(
        max_length=20,
        verbose_name='Código',
        help_text='Código único de la oportunidad'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Oportunidad'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la oportunidad'
    )
    fuente = models.CharField(
        max_length=50,
        verbose_name='Fuente',
        help_text='Origen de la oportunidad: Mercado, Tecnología, Proceso, etc.'
    )
    impacto_potencial = models.CharField(
        max_length=10,
        verbose_name='Impacto Potencial',
        help_text='Alto/Medio/Bajo'
    )
    viabilidad = models.CharField(
        max_length=10,
        verbose_name='Viabilidad',
        help_text='Alta/Media/Baja'
    )
    recursos_requeridos = models.TextField(
        blank=True,
        verbose_name='Recursos Requeridos',
        help_text='Recursos necesarios para aprovechar la oportunidad'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name='oportunidades_responsable',
        verbose_name='Responsable'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoOportunidad.choices,
        default=EstadoOportunidad.IDENTIFICADA,
        verbose_name='Estado'
    )

    class Meta:
        db_table = 'motor_riesgos_oportunidad'
        verbose_name = 'Oportunidad'
        verbose_name_plural = 'Oportunidades'
        ordering = ['-created_at']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'fuente']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
