"""
Modelos para Acciones por Indicador - Analytics
================================================

Define acciones vinculadas a KPIs:
- PlanAccionKPI: Planes de acción para mejorar KPIs
- ActividadPlanKPI: Actividades dentro de un plan
- SeguimientoPlanKPI: Seguimiento periódico del plan
- IntegracionAccionCorrectiva: Vinculación con mejora continua
"""
from django.db import models
from django.conf import settings
from apps.core.base_models import BaseCompanyModel


class PlanAccionKPI(BaseCompanyModel):
    """
    Plan de acción para mejorar un KPI específico.
    Permite definir acciones cuando un KPI no cumple metas.
    """

    ESTADO_CHOICES = [
        ('planificado', 'Planificado'),
        ('en_ejecucion', 'En Ejecución'),
        ('completado', 'Completado'),
        ('suspendido', 'Suspendido'),
        ('cancelado', 'Cancelado'),
    ]

    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.CASCADE,
        related_name='planes_accion',
        verbose_name='KPI'
    )
    valor_kpi = models.ForeignKey(
        'indicadores_area.ValorKPI',
        on_delete=models.CASCADE,
        related_name='planes_accion',
        verbose_name='Valor KPI',
        help_text='Valor específico que originó el plan'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Plan',
        help_text='Nombre descriptivo del plan de acción'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo',
        help_text='Qué se busca lograr con este plan'
    )
    meta_valor = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Meta de Valor',
        help_text='Valor objetivo a alcanzar en el KPI'
    )
    fecha_meta = models.DateField(
        verbose_name='Fecha Meta',
        help_text='Cuándo se debe alcanzar la meta'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='planes_kpi_responsable',
        verbose_name='Responsable'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='planificado',
        verbose_name='Estado'
    )
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='media',
        verbose_name='Prioridad'
    )
    presupuesto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto',
        help_text='Presupuesto asignado al plan'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'analytics_plan_accion_kpi'
        verbose_name = 'Plan de Acción KPI'
        verbose_name_plural = 'Planes de Acción de KPIs'
        ordering = ['-prioridad', 'fecha_meta']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['estado', 'prioridad']),
            models.Index(fields=['fecha_meta']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.kpi.codigo}"


class ActividadPlanKPI(BaseCompanyModel):
    """
    Actividad específica dentro de un plan de acción de KPI.
    Detalla las tareas concretas a ejecutar.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En Progreso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    plan = models.ForeignKey(
        PlanAccionKPI,
        on_delete=models.CASCADE,
        related_name='actividades',
        verbose_name='Plan de Acción'
    )
    numero_actividad = models.PositiveIntegerField(
        verbose_name='Número',
        help_text='Número secuencial de la actividad'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la actividad'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='actividades_kpi',
        verbose_name='Responsable'
    )
    fecha_inicio_programada = models.DateField(
        verbose_name='Inicio Programado'
    )
    fecha_fin_programada = models.DateField(
        verbose_name='Fin Programado'
    )
    fecha_inicio_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Inicio Real'
    )
    fecha_fin_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fin Real'
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    porcentaje_avance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='% Avance',
        help_text='Porcentaje de completitud (0-100)'
    )
    evidencia = models.FileField(
        upload_to='kpi/actividades/',
        null=True,
        blank=True,
        verbose_name='Evidencia'
    )
    comentarios = models.TextField(
        blank=True,
        verbose_name='Comentarios'
    )

    class Meta:
        db_table = 'analytics_actividad_plan_kpi'
        verbose_name = 'Actividad Plan KPI'
        verbose_name_plural = 'Actividades de Planes KPI'
        ordering = ['plan', 'numero_actividad']
        unique_together = [['plan', 'numero_actividad']]
        indexes = [
            models.Index(fields=['plan', 'estado']),
            models.Index(fields=['responsable']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.plan.nombre} - Actividad {self.numero_actividad}"


class SeguimientoPlanKPI(BaseCompanyModel):
    """
    Registro de seguimiento periódico de un plan de acción.
    Permite monitorear el progreso y resultados.
    """

    plan = models.ForeignKey(
        PlanAccionKPI,
        on_delete=models.CASCADE,
        related_name='seguimientos',
        verbose_name='Plan de Acción'
    )
    fecha_seguimiento = models.DateField(
        verbose_name='Fecha de Seguimiento'
    )
    valor_kpi_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor KPI Actual',
        help_text='Valor del KPI en este seguimiento'
    )
    avance_general = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Avance General (%)',
        help_text='Porcentaje de avance general del plan'
    )
    logros = models.TextField(
        blank=True,
        verbose_name='Logros',
        help_text='Logros alcanzados desde el último seguimiento'
    )
    dificultades = models.TextField(
        blank=True,
        verbose_name='Dificultades',
        help_text='Dificultades encontradas'
    )
    acciones_correctivas = models.TextField(
        blank=True,
        verbose_name='Acciones Correctivas',
        help_text='Acciones a tomar para superar dificultades'
    )
    comentarios = models.TextField(
        blank=True,
        verbose_name='Comentarios'
    )
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='seguimientos_kpi',
        verbose_name='Realizado Por'
    )

    class Meta:
        db_table = 'analytics_seguimiento_plan_kpi'
        verbose_name = 'Seguimiento Plan KPI'
        verbose_name_plural = 'Seguimientos de Planes KPI'
        ordering = ['-fecha_seguimiento']
        indexes = [
            models.Index(fields=['plan', 'fecha_seguimiento']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.plan.nombre} - {self.fecha_seguimiento}"


class IntegracionAccionCorrectiva(BaseCompanyModel):
    """
    Vinculación entre planes de acción de KPIs y acciones correctivas del módulo de mejora continua.
    Integra analytics con el sistema de mejora continua.
    """

    TIPO_VINCULO_CHOICES = [
        ('origen', 'KPI es Origen de Acción'),
        ('seguimiento', 'KPI Mide Acción'),
        ('resultado', 'KPI es Resultado de Acción'),
    ]

    plan_kpi = models.ForeignKey(
        PlanAccionKPI,
        on_delete=models.CASCADE,
        related_name='integraciones_mejora',
        verbose_name='Plan KPI'
    )
    accion_correctiva_id = models.PositiveIntegerField(
        verbose_name='ID Acción de Mejora',
        help_text='ID de referencia a AccionMejora (módulo mejora_continua pendiente)',
        null=True,
        blank=True
    )
    tipo_vinculo = models.CharField(
        max_length=15,
        choices=TIPO_VINCULO_CHOICES,
        verbose_name='Tipo de Vínculo',
        help_text='Naturaleza de la relación entre KPI y acción'
    )
    descripcion_vinculo = models.TextField(
        verbose_name='Descripción del Vínculo',
        help_text='Explicación de cómo se relacionan'
    )
    fecha_vinculacion = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Vinculación'
    )

    class Meta:
        db_table = 'analytics_integracion_accion_correctiva'
        verbose_name = 'Integración con Acción Correctiva'
        verbose_name_plural = 'Integraciones con Acciones Correctivas'
        ordering = ['-fecha_vinculacion']
        indexes = [
            models.Index(fields=['plan_kpi']),
            models.Index(fields=['accion_correctiva_id']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.plan_kpi.nombre} <-> Acción #{self.accion_correctiva_id}"
