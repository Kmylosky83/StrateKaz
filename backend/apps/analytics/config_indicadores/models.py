"""
Modelos para Config Indicadores - Analytics
============================================

Define la configuración de KPIs:
- CatalogoKPI: Catálogo maestro de indicadores
- FichaTecnicaKPI: Ficha técnica detallada
- MetaKPI: Metas por período
- ConfiguracionSemaforo: Umbrales de semáforo
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class CatalogoKPI(BaseCompanyModel):
    """
    Catálogo maestro de indicadores (KPIs).
    Define los indicadores disponibles para medición.
    """

    TIPO_INDICADOR_CHOICES = [
        ('eficiencia', 'Eficiencia'),
        ('eficacia', 'Eficacia'),
        ('efectividad', 'Efectividad'),
    ]

    CATEGORIA_CHOICES = [
        ('sst', 'SST - Seguridad y Salud en el Trabajo'),
        ('pesv', 'PESV - Plan Estratégico de Seguridad Vial'),
        ('ambiental', 'Ambiental'),
        ('calidad', 'Calidad'),
        ('financiero', 'Financiero'),
        ('operacional', 'Operacional'),
        ('rrhh', 'Recursos Humanos'),
        ('comercial', 'Comercial'),
    ]

    FRECUENCIA_CHOICES = [
        ('diario', 'Diario'),
        ('semanal', 'Semanal'),
        ('quincenal', 'Quincenal'),
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]

    codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código KPI',
        help_text='Código único del indicador (ej: SST-001, FIN-002)'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del KPI',
        help_text='Nombre descriptivo del indicador'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del indicador'
    )
    tipo_indicador = models.CharField(
        max_length=20,
        choices=TIPO_INDICADOR_CHOICES,
        verbose_name='Tipo de Indicador',
        help_text='Clasificación según su propósito'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría',
        help_text='Área o módulo al que pertenece'
    )
    frecuencia_medicion = models.CharField(
        max_length=20,
        choices=FRECUENCIA_CHOICES,
        verbose_name='Frecuencia de Medición',
        help_text='Con qué frecuencia se debe medir'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de Medida',
        help_text='Unidad en que se expresa (%, $, unidades, días, etc.)'
    )
    es_mayor_mejor = models.BooleanField(
        default=True,
        verbose_name='¿Mayor es Mejor?',
        help_text='True si valores altos son positivos, False si valores bajos son mejores'
    )

    class Meta:
        db_table = 'analytics_catalogo_kpi'
        verbose_name = 'Catálogo KPI'
        verbose_name_plural = 'Catálogo de KPIs'
        ordering = ['categoria', 'codigo']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'categoria']),
            models.Index(fields=['empresa', 'tipo_indicador']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'CATALOGO_KPI')
        super().save(*args, **kwargs)


class FichaTecnicaKPI(BaseCompanyModel):
    """
    Ficha técnica detallada de un KPI.
    Documenta la metodología y responsables.
    """

    kpi = models.OneToOneField(
        CatalogoKPI,
        on_delete=models.CASCADE,
        related_name='ficha_tecnica',
        verbose_name='KPI'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo',
        help_text='Qué se busca medir y por qué es importante'
    )
    formula = models.TextField(
        verbose_name='Fórmula',
        help_text='Fórmula matemática para calcular el indicador'
    )
    variables = models.JSONField(
        default=dict,
        verbose_name='Variables',
        help_text='Definición de cada variable de la fórmula (JSON dict)'
    )
    fuente_datos = models.TextField(
        verbose_name='Fuente de Datos',
        help_text='De dónde se obtienen los datos para el cálculo'
    )
    responsable_medicion = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='kpis_medir',
        verbose_name='Responsable de Medición',
        help_text='Cargo responsable de recopilar y registrar los datos'
    )
    responsable_analisis = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='kpis_analizar',
        verbose_name='Responsable de Análisis',
        help_text='Cargo responsable de analizar resultados y tomar acciones'
    )
    fecha_inicio_medicion = models.DateField(
        verbose_name='Fecha Inicio Medición',
        help_text='Desde cuándo se empezó a medir este indicador'
    )
    notas = models.TextField(
        blank=True,
        verbose_name='Notas Adicionales',
        help_text='Información adicional relevante'
    )

    class Meta:
        db_table = 'analytics_ficha_tecnica_kpi'
        verbose_name = 'Ficha Técnica KPI'
        verbose_name_plural = 'Fichas Técnicas de KPIs'
        ordering = ['kpi']

    def __str__(self):
        return f"Ficha Técnica: {self.kpi.nombre}"


class MetaKPI(BaseCompanyModel):
    """
    Metas definidas para un KPI en un período específico.
    Permite establecer objetivos escalonados.
    """

    kpi = models.ForeignKey(
        CatalogoKPI,
        on_delete=models.CASCADE,
        related_name='metas',
        verbose_name='KPI'
    )
    periodo_inicio = models.DateField(
        verbose_name='Inicio del Período',
        help_text='Fecha de inicio del período de la meta'
    )
    periodo_fin = models.DateField(
        verbose_name='Fin del Período',
        help_text='Fecha de finalización del período de la meta'
    )
    valor_meta = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Meta',
        help_text='Valor objetivo principal a alcanzar'
    )
    valor_minimo_aceptable = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Mínimo Aceptable',
        help_text='Valor mínimo aceptable (umbral crítico)'
    )
    valor_satisfactorio = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Satisfactorio',
        help_text='Valor que se considera satisfactorio'
    )
    valor_sobresaliente = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Sobresaliente',
        help_text='Valor excepcional (supera expectativas)'
    )

    class Meta:
        db_table = 'analytics_meta_kpi'
        verbose_name = 'Meta KPI'
        verbose_name_plural = 'Metas de KPIs'
        ordering = ['kpi', '-periodo_inicio']
        indexes = [
            models.Index(fields=['empresa', 'kpi']),
            models.Index(fields=['periodo_inicio', 'periodo_fin']),
        ]

    def __str__(self):
        return f"Meta {self.kpi.codigo} ({self.periodo_inicio} - {self.periodo_fin})"


class ConfiguracionSemaforo(BaseCompanyModel):
    """
    Configuración de umbrales de semáforo para un KPI.
    Define los rangos para rojo, amarillo y verde.
    """

    kpi = models.OneToOneField(
        CatalogoKPI,
        on_delete=models.CASCADE,
        related_name='configuracion_semaforo',
        verbose_name='KPI'
    )

    # Umbrales Rojos (Crítico)
    umbral_rojo_min = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Umbral Rojo Mínimo',
        help_text='Valor mínimo del rango rojo (null = sin límite inferior)'
    )
    umbral_rojo_max = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Umbral Rojo Máximo',
        help_text='Valor máximo del rango rojo (null = sin límite superior)'
    )

    # Umbrales Amarillos (Alerta)
    umbral_amarillo_min = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Umbral Amarillo Mínimo',
        help_text='Valor mínimo del rango amarillo'
    )
    umbral_amarillo_max = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Umbral Amarillo Máximo',
        help_text='Valor máximo del rango amarillo'
    )

    # Umbrales Verdes (Óptimo)
    umbral_verde_min = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Umbral Verde Mínimo',
        help_text='Valor mínimo del rango verde'
    )
    umbral_verde_max = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Umbral Verde Máximo',
        help_text='Valor máximo del rango verde (null = sin límite superior)'
    )

    class Meta:
        db_table = 'analytics_configuracion_semaforo'
        verbose_name = 'Configuración de Semáforo'
        verbose_name_plural = 'Configuraciones de Semáforos'
        ordering = ['kpi']

    def __str__(self):
        return f"Semáforo: {self.kpi.nombre}"

    def obtener_color(self, valor):
        """
        Determina el color del semáforo según el valor.

        Args:
            valor (Decimal): Valor a evaluar

        Returns:
            str: 'verde', 'amarillo' o 'rojo'
        """
        # Verificar verde
        if self.umbral_verde_max:
            if self.umbral_verde_min <= valor <= self.umbral_verde_max:
                return 'verde'
        else:
            if valor >= self.umbral_verde_min:
                return 'verde'

        # Verificar amarillo
        if self.umbral_amarillo_min <= valor <= self.umbral_amarillo_max:
            return 'amarillo'

        # Resto es rojo
        return 'rojo'
