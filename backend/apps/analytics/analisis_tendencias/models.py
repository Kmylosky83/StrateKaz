"""
Modelos para Análisis de Tendencias - Analytics
================================================

Define el análisis avanzado de KPIs:
- AnalisisKPI: Comparación de valores en diferentes períodos
- TendenciaKPI: Análisis de tendencias y proyecciones
- AnomaliaDetectada: Detección automática de valores anómalos
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class AnalisisKPI(BaseCompanyModel):
    """
    Análisis comparativo de un KPI entre períodos.
    Permite comparar el desempeño actual vs histórico.
    """

    TIPO_ANALISIS_CHOICES = [
        ('periodo_anterior', 'Período Anterior'),
        ('mismo_periodo_año_anterior', 'Mismo Período Año Anterior'),
        ('promedio_historico', 'Promedio Histórico'),
        ('meta', 'vs Meta'),
    ]

    DIRECCION_CHOICES = [
        ('mejora', 'Mejora'),
        ('deterioro', 'Deterioro'),
        ('estable', 'Estable'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.CASCADE,
        related_name='analisis',
        verbose_name='KPI'
    )
    periodo_analisis = models.DateField(
        verbose_name='Período de Análisis',
        help_text='Fecha del período que se está analizando'
    )
    tipo_analisis = models.CharField(
        max_length=40,
        choices=TIPO_ANALISIS_CHOICES,
        verbose_name='Tipo de Análisis',
        help_text='Tipo de comparación realizada'
    )
    valor_actual = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Actual',
        help_text='Valor del KPI en el período analizado'
    )
    valor_comparacion = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor de Comparación',
        help_text='Valor contra el que se compara (período anterior, meta, etc.)'
    )
    variacion_absoluta = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Variación Absoluta',
        help_text='Diferencia absoluta entre valor actual y comparación'
    )
    variacion_porcentual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Variación Porcentual',
        help_text='Variación porcentual respecto al valor de comparación'
    )
    direccion = models.CharField(
        max_length=15,
        choices=DIRECCION_CHOICES,
        verbose_name='Dirección',
        help_text='Si la variación representa mejora, deterioro o estabilidad'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Comentarios sobre el análisis'
    )

    class Meta:
        db_table = 'analytics_analisis_kpi'
        verbose_name = 'Análisis KPI'
        verbose_name_plural = 'Análisis de KPIs'
        ordering = ['-periodo_analisis', 'kpi']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['periodo_analisis']),
            models.Index(fields=['tipo_analisis']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"Análisis {self.kpi.codigo} - {self.periodo_analisis}"

    def save(self, *args, **kwargs):
        """Calcular variaciones antes de guardar"""
        # Calcular variación absoluta
        self.variacion_absoluta = self.valor_actual - self.valor_comparacion

        # Calcular variación porcentual
        if self.valor_comparacion != 0:
            self.variacion_porcentual = (
                (self.variacion_absoluta / abs(self.valor_comparacion)) * 100
            )
        else:
            self.variacion_porcentual = 0

        # Determinar dirección según si mayor es mejor
        if abs(self.variacion_porcentual) < 2:  # Tolerancia de 2%
            self.direccion = 'estable'
        elif self.variacion_absoluta > 0:
            # Si mayor es mejor y creció -> mejora, si menor es mejor y creció -> deterioro
            self.direccion = 'mejora' if self.kpi.es_mayor_mejor else 'deterioro'
        else:
            # Si mayor es mejor y decreció -> deterioro, si menor es mejor y decreció -> mejora
            self.direccion = 'deterioro' if self.kpi.es_mayor_mejor else 'mejora'

        super().save(*args, **kwargs)


class TendenciaKPI(BaseCompanyModel):
    """
    Análisis de tendencia de un KPI en un rango de tiempo.
    Incluye regresión lineal y proyecciones.
    """

    TIPO_TENDENCIA_CHOICES = [
        ('creciente', 'Creciente'),
        ('decreciente', 'Decreciente'),
        ('estable', 'Estable'),
        ('volatil', 'Volátil'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.CASCADE,
        related_name='tendencias',
        verbose_name='KPI'
    )
    periodo_inicio = models.DateField(
        verbose_name='Inicio del Período',
        help_text='Fecha de inicio del rango analizado'
    )
    periodo_fin = models.DateField(
        verbose_name='Fin del Período',
        help_text='Fecha de fin del rango analizado'
    )
    tipo_tendencia = models.CharField(
        max_length=15,
        choices=TIPO_TENDENCIA_CHOICES,
        verbose_name='Tipo de Tendencia',
        help_text='Clasificación de la tendencia observada'
    )
    coeficiente_correlacion = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        verbose_name='Coeficiente de Correlación (r)',
        help_text='Coeficiente de correlación de Pearson (-1 a 1)'
    )
    r_cuadrado = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        verbose_name='R² (Coeficiente de Determinación)',
        help_text='Proporción de varianza explicada por el modelo (0 a 1)'
    )
    pendiente = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        verbose_name='Pendiente',
        help_text='Pendiente de la recta de regresión'
    )
    intercepto = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        verbose_name='Intercepto',
        help_text='Intercepto de la recta de regresión'
    )
    proyeccion_3_meses = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Proyección 3 Meses',
        help_text='Valor proyectado para dentro de 3 meses'
    )
    proyeccion_6_meses = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Proyección 6 Meses',
        help_text='Valor proyectado para dentro de 6 meses'
    )
    proyeccion_12_meses = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Proyección 12 Meses',
        help_text='Valor proyectado para dentro de 12 meses'
    )
    datos_historicos = models.JSONField(
        default=list,
        verbose_name='Datos Históricos',
        help_text='Array de {fecha, valor} utilizados en el análisis'
    )

    class Meta:
        db_table = 'analytics_tendencia_kpi'
        verbose_name = 'Tendencia KPI'
        verbose_name_plural = 'Tendencias de KPIs'
        ordering = ['-periodo_fin', 'kpi']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['periodo_inicio', 'periodo_fin']),
            models.Index(fields=['tipo_tendencia']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"Tendencia {self.kpi.codigo} ({self.periodo_inicio} - {self.periodo_fin})"


class AnomaliaDetectada(BaseCompanyModel):
    """
    Registro de anomalías detectadas en valores de KPIs.
    Utiliza análisis estadístico para identificar valores atípicos.
    """

    TIPO_ANOMALIA_CHOICES = [
        ('valor_extremo_superior', 'Valor Extremo Superior'),
        ('valor_extremo_inferior', 'Valor Extremo Inferior'),
        ('cambio_abrupto', 'Cambio Abrupto'),
        ('patron_inusual', 'Patrón Inusual'),
    ]

    SEVERIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    valor_kpi = models.ForeignKey(
        'indicadores_area.ValorKPI',
        on_delete=models.CASCADE,
        related_name='anomalias',
        verbose_name='Valor KPI'
    )
    tipo_anomalia = models.CharField(
        max_length=30,
        choices=TIPO_ANOMALIA_CHOICES,
        verbose_name='Tipo de Anomalía',
        help_text='Clasificación de la anomalía detectada'
    )
    severidad = models.CharField(
        max_length=10,
        choices=SEVERIDAD_CHOICES,
        default='media',
        verbose_name='Severidad',
        help_text='Nivel de criticidad de la anomalía'
    )
    valor_detectado = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Detectado',
        help_text='Valor anómalo que disparó la alerta'
    )
    valor_esperado = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Esperado',
        help_text='Valor que se esperaba según el patrón histórico'
    )
    desviacion_std = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        verbose_name='Desviación Estándar',
        help_text='Cuántas desviaciones estándar se desvía del promedio'
    )
    fecha_deteccion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Detección',
        help_text='Cuándo se detectó la anomalía'
    )
    esta_revisada = models.BooleanField(
        default=False,
        verbose_name='Revisada',
        help_text='Si la anomalía ha sido revisada por un usuario'
    )
    fecha_revision = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revisión',
        help_text='Cuándo se revisó la anomalía'
    )
    usuario_revision = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anomalias_revisadas',
        verbose_name='Usuario que Revisó'
    )
    accion_tomada = models.TextField(
        blank=True,
        verbose_name='Acción Tomada',
        help_text='Qué acción se tomó al revisar la anomalía'
    )
    es_falso_positivo = models.BooleanField(
        default=False,
        verbose_name='Falso Positivo',
        help_text='Si la anomalía fue determinada como falso positivo'
    )

    class Meta:
        db_table = 'analytics_anomalia_detectada'
        verbose_name = 'Anomalía Detectada'
        verbose_name_plural = 'Anomalías Detectadas'
        ordering = ['-fecha_deteccion', '-severidad']
        indexes = [
            models.Index(fields=['empresa', 'valor_kpi']),
            models.Index(fields=['fecha_deteccion']),
            models.Index(fields=['severidad', 'esta_revisada']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"Anomalía {self.tipo_anomalia} - {self.valor_kpi.kpi.codigo} ({self.fecha_deteccion})"
