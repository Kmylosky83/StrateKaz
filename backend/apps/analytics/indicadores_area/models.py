"""
Modelos para Indicadores Área - Analytics
=========================================

Define el registro y seguimiento de valores de KPIs:
- ValorKPI: Valores históricos registrados
- AccionPorKPI: Acciones cuando KPI está en rojo
- AlertaKPI: Alertas automáticas del sistema
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.base_models import BaseCompanyModel


class ValorKPI(BaseCompanyModel):
    """
    Valores históricos de KPIs.
    Registra los valores medidos en cada período.
    """

    SEMAFORO_CHOICES = [
        ('verde', 'Verde - Óptimo'),
        ('amarillo', 'Amarillo - Alerta'),
        ('rojo', 'Rojo - Crítico'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.PROTECT,
        related_name='valores',
        verbose_name='KPI'
    )
    fecha_medicion = models.DateField(
        verbose_name='Fecha de Medición',
        help_text='Fecha en que se realizó la medición'
    )
    periodo = models.CharField(
        max_length=20,
        verbose_name='Período',
        help_text='Identificador del período (ej: 2025-01, 2025-Q1, 2025)'
    )
    valor = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Medido',
        help_text='Valor real medido del indicador'
    )
    valor_meta = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Valor Meta del Período',
        help_text='Meta que se esperaba alcanzar en este período'
    )
    semaforo = models.CharField(
        max_length=10,
        choices=SEMAFORO_CHOICES,
        verbose_name='Color Semáforo',
        help_text='Color del semáforo según umbrales configurados'
    )
    porcentaje_cumplimiento = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='% Cumplimiento',
        help_text='Porcentaje de cumplimiento vs meta'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Comentarios sobre el valor medido'
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='valores_kpi_registrados',
        verbose_name='Registrado por'
    )
    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Registro',
        help_text='Cuándo se registró el valor en el sistema'
    )
    datos_origen = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de Origen',
        help_text='Datos crudos usados para calcular el valor (JSON)'
    )

    class Meta:
        db_table = 'analytics_valor_kpi'
        verbose_name = 'Valor de KPI'
        verbose_name_plural = 'Valores de KPIs'
        ordering = ['kpi', '-fecha_medicion']
        unique_together = [['empresa', 'kpi', 'periodo']]
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['fecha_medicion']),
            models.Index(fields=['semaforo']),
            models.Index(fields=['empresa', 'kpi', 'fecha_medicion']),
        ]

    def __str__(self):
        return f"{self.kpi.codigo} - {self.periodo}: {self.valor}"

    def calcular_semaforo(self):
        """Calcula el color del semáforo según la configuración del KPI."""
        try:
            config = self.kpi.configuracion_semaforo
            return config.obtener_color(self.valor)
        except:
            return 'amarillo'  # Default si no hay configuración

    def calcular_porcentaje_cumplimiento(self):
        """Calcula el porcentaje de cumplimiento vs meta."""
        if not self.valor_meta or self.valor_meta == 0:
            return None

        porcentaje = (self.valor / self.valor_meta) * 100

        # Ajustar si para el KPI "menor es mejor"
        if not self.kpi.es_mayor_mejor:
            # Invertir la lógica: si valor es menor que meta, es mejor
            if self.valor <= self.valor_meta:
                porcentaje = 100 + ((self.valor_meta - self.valor) / self.valor_meta * 100)
            else:
                porcentaje = (self.valor_meta / self.valor) * 100

        return round(porcentaje, 2)

    def save(self, *args, **kwargs):
        """Override save para calcular semáforo y % cumplimiento automáticamente."""
        # Calcular semáforo
        if not self.semaforo:
            self.semaforo = self.calcular_semaforo()

        # Calcular porcentaje de cumplimiento
        if self.valor_meta and not self.porcentaje_cumplimiento:
            self.porcentaje_cumplimiento = self.calcular_porcentaje_cumplimiento()

        super().save(*args, **kwargs)


class AccionPorKPI(BaseCompanyModel):
    """
    Acciones tomadas cuando un KPI está en estado crítico.
    Permite vincular acciones correctivas del módulo HSEQ.
    """

    TIPO_ACCION_CHOICES = [
        ('accion_correctiva', 'Acción Correctiva'),
        ('plan_mejora', 'Plan de Mejora'),
        ('seguimiento', 'Seguimiento'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    valor_kpi = models.ForeignKey(
        ValorKPI,
        on_delete=models.CASCADE,
        related_name='acciones',
        verbose_name='Valor KPI',
        help_text='Valor de KPI que generó esta acción'
    )
    tipo_accion = models.CharField(
        max_length=20,
        choices=TIPO_ACCION_CHOICES,
        verbose_name='Tipo de Acción'
    )
    # Vinculación con acciones correctivas del módulo HSEQ (opcional)
    # NOTA: La app mejora_continua no tiene modelo AccionCorrectiva, se debe crear o usar calidad.NoConformidad
    accion_correctiva_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Acción Correctiva HSEQ',
        help_text='ID de acción correctiva del módulo HSEQ (si aplica)'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción de la acción a tomar'
    )
    responsable = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='acciones_kpi',
        verbose_name='Responsable',
        help_text='Colaborador responsable de ejecutar la acción'
    )
    fecha_compromiso = models.DateField(
        verbose_name='Fecha Compromiso',
        help_text='Fecha límite para completar la acción'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre',
        help_text='Cuándo se completó o canceló la acción'
    )
    efectividad = models.TextField(
        blank=True,
        verbose_name='Efectividad',
        help_text='Evaluación de la efectividad de la acción'
    )

    class Meta:
        db_table = 'analytics_accion_kpi'
        verbose_name = 'Acción por KPI'
        verbose_name_plural = 'Acciones por KPIs'
        ordering = ['fecha_compromiso', 'estado']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['responsable', 'estado']),
            models.Index(fields=['fecha_compromiso']),
        ]

    def __str__(self):
        return f"Acción {self.tipo_accion} - {self.valor_kpi.kpi.codigo}"

    @property
    def esta_vencida(self):
        """Verifica si la acción está vencida."""
        if self.estado in ['completada', 'cancelada']:
            return False
        return self.fecha_compromiso < timezone.now().date()


class AlertaKPI(BaseCompanyModel):
    """
    Alertas automáticas generadas por el sistema.
    Notifica cuando un KPI requiere atención.
    """

    TIPO_ALERTA_CHOICES = [
        ('umbral_rojo', 'KPI en Umbral Rojo'),
        ('tendencia_negativa', 'Tendencia Negativa Detectada'),
        ('sin_medicion', 'Sin Medición en Período'),
        ('meta_no_cumplida', 'Meta No Cumplida'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.CASCADE,
        related_name='alertas',
        verbose_name='KPI'
    )
    tipo_alerta = models.CharField(
        max_length=20,
        choices=TIPO_ALERTA_CHOICES,
        verbose_name='Tipo de Alerta'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje',
        help_text='Descripción de la alerta'
    )
    fecha_generacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Generación'
    )
    esta_leida = models.BooleanField(
        default=False,
        verbose_name='¿Leída?'
    )
    leida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_kpi_leidas',
        verbose_name='Leída por'
    )
    fecha_lectura = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Lectura'
    )

    class Meta:
        db_table = 'analytics_alerta_kpi'
        verbose_name = 'Alerta de KPI'
        verbose_name_plural = 'Alertas de KPIs'
        ordering = ['-fecha_generacion']
        indexes = [
            models.Index(fields=['empresa', 'esta_leida']),
            models.Index(fields=['kpi', 'fecha_generacion']),
            models.Index(fields=['tipo_alerta']),
        ]

    def __str__(self):
        return f"Alerta {self.tipo_alerta} - {self.kpi.codigo}"

    def marcar_como_leida(self, usuario):
        """Marca la alerta como leída por un usuario."""
        self.esta_leida = True
        self.leida_por = usuario
        self.fecha_lectura = timezone.now()
        self.save(update_fields=['esta_leida', 'leida_por', 'fecha_lectura'])
