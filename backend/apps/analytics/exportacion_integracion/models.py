"""
Modelos para Exportación e Integración - Analytics
===================================================

Define exportación de datos y logs:
- ConfiguracionExportacion: Configuración de exportaciones
- LogExportacion: Historial de exportaciones
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class ConfiguracionExportacion(BaseCompanyModel):
    """
    Configuración de exportaciones de datos analytics.
    Permite configurar exportaciones automáticas y bajo demanda.
    """

    TIPO_EXPORTACION_CHOICES = [
        ('kpi_valores', 'Valores de KPIs'),
        ('analisis_tendencias', 'Análisis de Tendencias'),
        ('anomalias', 'Anomalías Detectadas'),
        ('planes_accion', 'Planes de Acción'),
        ('informes', 'Informes Generados'),
        ('dashboard_completo', 'Dashboard Completo'),
    ]

    FORMATO_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
        ('xml', 'XML'),
    ]

    DESTINO_CHOICES = [
        ('descarga', 'Descarga Manual'),
        ('email', 'Envío por Email'),
        ('ftp', 'Servidor FTP'),
        ('api', 'API Externa'),
    ]

    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la configuración'
    )
    tipo_exportacion = models.CharField(
        max_length=30,
        choices=TIPO_EXPORTACION_CHOICES,
        verbose_name='Tipo de Exportación',
        help_text='Qué datos se exportarán'
    )
    formato_config = models.JSONField(
        default=dict,
        verbose_name='Configuración de Formato',
        help_text='Configuración específica del formato (columnas, filtros, etc.)'
    )
    formato_archivo = models.CharField(
        max_length=10,
        choices=FORMATO_CHOICES,
        default='excel',
        verbose_name='Formato de Archivo'
    )
    destino = models.CharField(
        max_length=15,
        choices=DESTINO_CHOICES,
        default='descarga',
        verbose_name='Destino'
    )
    destino_config = models.JSONField(
        default=dict,
        verbose_name='Configuración de Destino',
        help_text='Configuración del destino (emails, FTP, API endpoint, etc.)'
    )
    filtros_json = models.JSONField(
        default=dict,
        verbose_name='Filtros',
        help_text='Filtros a aplicar en los datos exportados'
    )
    esta_activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    frecuencia_automatica = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Frecuencia Automática',
        help_text='Si se programa exportación automática (diario, semanal, mensual)'
    )

    class Meta:
        db_table = 'analytics_configuracion_exportacion'
        verbose_name = 'Configuración de Exportación'
        verbose_name_plural = 'Configuraciones de Exportación'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['empresa', 'tipo_exportacion']),
            models.Index(fields=['esta_activa']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return self.nombre


class LogExportacion(BaseCompanyModel):
    """
    Log de exportaciones realizadas.
    Auditoría completa de todas las exportaciones de datos.
    """

    TIPO_CHOICES = [
        ('manual', 'Manual'),
        ('programada', 'Programada'),
        ('automatica', 'Automática'),
    ]

    ESTADO_CHOICES = [
        ('exitoso', 'Exitoso'),
        ('error', 'Error'),
        ('parcial', 'Parcial'),
    ]

    configuracion = models.ForeignKey(
        ConfiguracionExportacion,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name='Configuración'
    )
    tipo = models.CharField(
        max_length=15,
        choices=TIPO_CHOICES,
        verbose_name='Tipo'
    )
    usuario = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exportaciones_realizadas',
        verbose_name='Usuario'
    )
    fecha_ejecucion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Ejecución'
    )
    estado = models.CharField(
        max_length=10,
        choices=ESTADO_CHOICES,
        verbose_name='Estado'
    )
    registros_exportados = models.IntegerField(
        default=0,
        verbose_name='Registros Exportados'
    )
    archivo_generado = models.FileField(
        upload_to='analytics/exportaciones/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Generado'
    )
    tamaño_archivo_bytes = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño (bytes)'
    )
    duracion_segundos = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Duración (segundos)'
    )
    error_detalle = models.TextField(
        blank=True,
        verbose_name='Detalle del Error'
    )
    parametros_usados = models.JSONField(
        default=dict,
        verbose_name='Parámetros Usados',
        help_text='Filtros y parámetros aplicados en esta exportación'
    )

    class Meta:
        db_table = 'analytics_log_exportacion'
        verbose_name = 'Log de Exportación'
        verbose_name_plural = 'Logs de Exportación'
        ordering = ['-fecha_ejecucion']
        indexes = [
            models.Index(fields=['empresa', 'configuracion']),
            models.Index(fields=['fecha_ejecucion']),
            models.Index(fields=['estado']),
            models.Index(fields=['usuario']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.configuracion.nombre} - {self.fecha_ejecucion}"
