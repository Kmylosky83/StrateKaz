#!/usr/bin/env python
"""
Script para crear las 4 apps adicionales de Analytics - Semana 24
"""
import os

BASE_DIR = "apps/analytics"

# ===== ANALISIS_TENDENCIAS MODELS =====
analisis_models = '''"""
Modelos para Análisis de Tendencias - Analytics
=================================================

Define análisis comparativo, tendencias y detección de anomalías:
- AnalisisKPI: Análisis comparativo de KPIs
- TendenciaKPI: Tendencia calculada
- AnomaliaDetectada: Anomalías en valores
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class AnalisisKPI(BaseCompanyModel):
    """
    Análisis comparativo de KPIs.
    Compara valores actuales contra metas, períodos anteriores o históricos.
    """

    TIPO_ANALISIS_CHOICES = [
        ('vs_meta', 'Vs. Meta'),
        ('vs_periodo_anterior', 'Vs. Período Anterior'),
        ('vs_mejor_historico', 'Vs. Mejor Histórico'),
        ('tendencia', 'Tendencia'),
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
    periodo_analisis = models.CharField(
        max_length=50,
        verbose_name='Período Análisis',
        help_text='Período analizado (ej: "2025-Q1", "2025", "2025-03")'
    )
    tipo_analisis = models.CharField(
        max_length=30,
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
        help_text='Valor contra el que se compara (meta, período anterior, etc.)'
    )
    variacion_absoluta = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Variación Absoluta',
        help_text='Diferencia entre valor actual y comparación'
    )
    variacion_porcentual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Variación Porcentual',
        help_text='Variación en porcentaje'
    )
    direccion = models.CharField(
        max_length=20,
        choices=DIRECCION_CHOICES,
        verbose_name='Dirección',
        help_text='Dirección del cambio (mejora, deterioro, estable)'
    )
    es_significativo = models.BooleanField(
        default=False,
        verbose_name='¿Es Significativo?',
        help_text='True si la variación supera el umbral de significancia'
    )
    fecha_analisis = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Análisis',
        help_text='Cuándo se realizó el análisis'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones sobre el análisis'
    )

    class Meta:
        db_table = 'analytics_analisis_kpi'
        verbose_name = 'Análisis KPI'
        verbose_name_plural = 'Análisis de KPIs'
        ordering = ['-fecha_analisis']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['periodo_analisis']),
            models.Index(fields=['tipo_analisis']),
        ]

    def __str__(self):
        return f"Análisis {self.kpi.codigo} - {self.periodo_analisis}"


class TendenciaKPI(BaseCompanyModel):
    """
    Tendencia calculada para un KPI.
    Análisis estadístico de tendencias históricas con proyecciones.
    """

    TIPO_TENDENCIA_CHOICES = [
        ('lineal', 'Lineal'),
        ('exponencial', 'Exponencial'),
        ('estacional', 'Estacional'),
    ]

    kpi = models.ForeignKey(
        'config_indicadores.CatalogoKPI',
        on_delete=models.CASCADE,
        related_name='tendencias',
        verbose_name='KPI'
    )
    periodo_inicio = models.DateField(
        verbose_name='Inicio del Período',
        help_text='Fecha de inicio del análisis de tendencia'
    )
    periodo_fin = models.DateField(
        verbose_name='Fin del Período',
        help_text='Fecha de finalización del análisis de tendencia'
    )
    tipo_tendencia = models.CharField(
        max_length=20,
        choices=TIPO_TENDENCIA_CHOICES,
        verbose_name='Tipo de Tendencia',
        help_text='Modelo estadístico aplicado'
    )
    coeficiente_pendiente = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        verbose_name='Coeficiente de Pendiente',
        help_text='Pendiente de la recta de tendencia (m en y=mx+b)'
    )
    r_cuadrado = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        verbose_name='R²',
        help_text='Coeficiente de determinación (bondad de ajuste, 0-1)'
    )
    proyeccion_siguiente = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Proyección Siguiente',
        help_text='Valor proyectado para el siguiente período'
    )
    fecha_proyeccion = models.DateField(
        verbose_name='Fecha Proyección',
        help_text='Para qué fecha es válida la proyección'
    )
    confianza = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Confianza',
        help_text='Nivel de confianza de la proyección (%)'
    )

    class Meta:
        db_table = 'analytics_tendencia_kpi'
        verbose_name = 'Tendencia KPI'
        verbose_name_plural = 'Tendencias de KPIs'
        ordering = ['-fecha_proyeccion']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['periodo_inicio', 'periodo_fin']),
        ]

    def __str__(self):
        return f"Tendencia {self.kpi.codigo} ({self.periodo_inicio} - {self.periodo_fin})"


class AnomaliaDetectada(BaseCompanyModel):
    """
    Anomalías detectadas en valores de KPIs.
    Registra valores atípicos o patrones inusuales para revisión.
    """

    TIPO_ANOMALIA_CHOICES = [
        ('outlier', 'Outlier (Valor Atípico)'),
        ('cambio_brusco', 'Cambio Brusco'),
        ('patron_inusual', 'Patrón Inusual'),
        ('sin_datos', 'Sin Datos'),
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
        max_length=20,
        choices=TIPO_ANOMALIA_CHOICES,
        verbose_name='Tipo de Anomalía',
        help_text='Clasificación de la anomalía detectada'
    )
    severidad = models.CharField(
        max_length=10,
        choices=SEVERIDAD_CHOICES,
        verbose_name='Severidad',
        help_text='Nivel de severidad de la anomalía'
    )
    desviacion_std = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        verbose_name='Desviaciones Estándar',
        help_text='Cuántas desviaciones estándar se aleja de la media'
    )
    valor_esperado = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Esperado',
        help_text='Valor que se esperaba según el patrón histórico'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la anomalía'
    )
    esta_revisada = models.BooleanField(
        default=False,
        verbose_name='¿Está Revisada?',
        help_text='True si ya fue revisada por un usuario'
    )
    revisada_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anomalias_revisadas',
        verbose_name='Revisada Por',
        help_text='Usuario que revisó la anomalía'
    )
    fecha_revision = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revisión',
        help_text='Cuándo fue revisada'
    )
    accion_tomada = models.TextField(
        blank=True,
        verbose_name='Acción Tomada',
        help_text='Qué acción se tomó tras la revisión'
    )

    class Meta:
        db_table = 'analytics_anomalia_detectada'
        verbose_name = 'Anomalía Detectada'
        verbose_name_plural = 'Anomalías Detectadas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'severidad']),
            models.Index(fields=['esta_revisada']),
            models.Index(fields=['tipo_anomalia']),
        ]

    def __str__(self):
        return f"{self.get_tipo_anomalia_display()} - {self.valor_kpi.kpi.codigo} ({self.severidad})"
'''

# Escribir archivo
print("Creando analisis_tendencias/models.py...")
with open(f'{BASE_DIR}/analisis_tendencias/models.py', 'w', encoding='utf-8') as f:
    f.write(analisis_models)
print("✅ analisis_tendencias/models.py creado")
