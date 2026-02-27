"""
Modelos para Generador de Informes - Analytics
===============================================

Define la generación automática de informes:
- PlantillaInforme: Plantillas configurables de informes
- InformeDinamico: Informes generados a partir de plantillas
- ProgramacionInforme: Programación de generación automática
- HistorialInforme: Historial de generaciones
"""
from django.db import models
from django.conf import settings
from apps.core.base_models import BaseCompanyModel


class PlantillaInforme(BaseCompanyModel):
    """
    Plantillas configurables para generación de informes.
    Define la estructura y formato de los informes dinámicos.
    """

    TIPO_INFORME_CHOICES = [
        ('kpi_resumen', 'Resumen de KPIs'),
        ('cumplimiento_metas', 'Cumplimiento de Metas'),
        ('analisis_tendencias', 'Análisis de Tendencias'),
        ('desempeño_proceso', 'Desempeño por Proceso'),
        ('dashboard_ejecutivo', 'Dashboard Ejecutivo'),
        ('informe_regulatorio', 'Informe Regulatorio'),
    ]

    FORMATO_SALIDA_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('word', 'Word'),
        ('html', 'HTML'),
        ('json', 'JSON'),
    ]

    codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código',
        help_text='Código único de la plantilla'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la plantilla'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del propósito del informe'
    )
    tipo_informe = models.CharField(
        max_length=30,
        choices=TIPO_INFORME_CHOICES,
        verbose_name='Tipo de Informe',
        help_text='Categoría del informe'
    )
    norma_relacionada = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Norma Relacionada',
        help_text='Norma o estándar al que responde (ISO, Decreto, etc.)'
    )
    estructura_json = models.JSONField(
        default=dict,
        verbose_name='Estructura JSON',
        help_text='Definición de la estructura del informe en formato JSON'
    )
    formato_salida = models.CharField(
        max_length=10,
        choices=FORMATO_SALIDA_CHOICES,
        default='pdf',
        verbose_name='Formato de Salida',
        help_text='Formato predeterminado para generar el informe'
    )
    template_archivo = models.FileField(
        upload_to='informes/plantillas/',
        null=True,
        blank=True,
        verbose_name='Archivo de Plantilla',
        help_text='Archivo de plantilla (opcional, para Word/Excel)'
    )
    es_predefinida = models.BooleanField(
        default=False,
        verbose_name='Predefinida',
        help_text='Si es una plantilla predefinida del sistema'
    )

    class Meta:
        db_table = 'analytics_plantilla_informe'
        verbose_name = 'Plantilla de Informe'
        verbose_name_plural = 'Plantillas de Informes'
        ordering = ['tipo_informe', 'nombre']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'tipo_informe']),
            models.Index(fields=['codigo']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'PLANTILLA_INFORME')
        super().save(*args, **kwargs)


class InformeDinamico(BaseCompanyModel):
    """
    Informes generados dinámicamente a partir de plantillas.
    Registra cada generación de informe.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('generando', 'Generando'),
        ('completado', 'Completado'),
        ('error', 'Error'),
    ]

    plantilla = models.ForeignKey(
        PlantillaInforme,
        on_delete=models.CASCADE,
        related_name='informes_generados',
        verbose_name='Plantilla'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Informe',
        help_text='Nombre identificativo de este informe específico'
    )
    periodo_inicio = models.DateField(
        null=True,
        blank=True,
        verbose_name='Inicio del Período',
        help_text='Fecha de inicio del período analizado'
    )
    periodo_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fin del Período',
        help_text='Fecha de fin del período analizado'
    )
    parametros_json = models.JSONField(
        default=dict,
        verbose_name='Parámetros',
        help_text='Parámetros específicos para esta generación'
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        help_text='Estado de la generación del informe'
    )
    fecha_generacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Generación',
        help_text='Cuándo se generó el informe'
    )
    archivo_generado = models.FileField(
        upload_to='informes/generados/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Generado',
        help_text='Archivo del informe generado'
    )
    tamaño_archivo = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño del Archivo',
        help_text='Tamaño en bytes del archivo generado'
    )
    error_mensaje = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error',
        help_text='Detalle del error si la generación falló'
    )
    generado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='informes_generados',
        verbose_name='Generado Por'
    )

    class Meta:
        db_table = 'analytics_informe_dinamico'
        verbose_name = 'Informe Dinámico'
        verbose_name_plural = 'Informes Dinámicos'
        ordering = ['-fecha_generacion', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'plantilla']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_generacion']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.estado})"


class ProgramacionInforme(BaseCompanyModel):
    """
    Programación de generación automática de informes.
    Permite configurar informes recurrentes.
    """

    FRECUENCIA_CHOICES = [
        ('diario', 'Diario'),
        ('semanal', 'Semanal'),
        ('quincenal', 'Quincenal'),
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]

    DIA_SEMANA_CHOICES = [
        (1, 'Lunes'),
        (2, 'Martes'),
        (3, 'Miércoles'),
        (4, 'Jueves'),
        (5, 'Viernes'),
        (6, 'Sábado'),
        (7, 'Domingo'),
    ]

    plantilla = models.ForeignKey(
        PlantillaInforme,
        on_delete=models.CASCADE,
        related_name='programaciones',
        verbose_name='Plantilla'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la programación'
    )
    frecuencia = models.CharField(
        max_length=15,
        choices=FRECUENCIA_CHOICES,
        verbose_name='Frecuencia',
        help_text='Frecuencia de generación automática'
    )
    dia_ejecucion = models.IntegerField(
        null=True,
        blank=True,
        choices=DIA_SEMANA_CHOICES,
        verbose_name='Día de Ejecución',
        help_text='Día del mes (1-31) o día de semana para ejecución'
    )
    hora_ejecucion = models.TimeField(
        verbose_name='Hora de Ejecución',
        help_text='Hora del día para generar el informe'
    )
    destinatarios = models.JSONField(
        default=list,
        verbose_name='Destinatarios',
        help_text='Lista de emails a los que se enviará el informe'
    )
    parametros_json = models.JSONField(
        default=dict,
        verbose_name='Parámetros',
        help_text='Parámetros predeterminados para la generación'
    )
    esta_activa = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Si la programación está activa'
    )
    proxima_ejecucion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Próxima Ejecución',
        help_text='Fecha y hora de la próxima ejecución programada'
    )
    ultima_ejecucion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Ejecución',
        help_text='Fecha y hora de la última ejecución'
    )

    class Meta:
        db_table = 'analytics_programacion_informe'
        verbose_name = 'Programación de Informe'
        verbose_name_plural = 'Programaciones de Informes'
        ordering = ['plantilla', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'plantilla']),
            models.Index(fields=['esta_activa', 'proxima_ejecucion']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.get_frecuencia_display()}"


class HistorialInforme(BaseCompanyModel):
    """
    Historial de ejecuciones de informes programados.
    Auditoría de generaciones automáticas.
    """

    programacion = models.ForeignKey(
        ProgramacionInforme,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name='Programación'
    )
    informe = models.ForeignKey(
        InformeDinamico,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_ejecuciones',
        verbose_name='Informe Generado'
    )
    fecha_ejecucion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Ejecución',
        help_text='Cuándo se ejecutó la programación'
    )
    fue_exitoso = models.BooleanField(
        default=False,
        verbose_name='Exitoso',
        help_text='Si la generación fue exitosa'
    )
    fue_enviado = models.BooleanField(
        default=False,
        verbose_name='Enviado',
        help_text='Si el informe fue enviado a los destinatarios'
    )
    destinatarios_enviados = models.JSONField(
        default=list,
        verbose_name='Destinatarios Enviados',
        help_text='Lista de emails a los que se envió exitosamente'
    )
    error_mensaje = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error',
        help_text='Detalle del error si la ejecución falló'
    )
    duracion_segundos = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Duración (segundos)',
        help_text='Tiempo que tomó generar el informe'
    )

    class Meta:
        db_table = 'analytics_historial_informe'
        verbose_name = 'Historial de Informe'
        verbose_name_plural = 'Historial de Informes'
        ordering = ['-fecha_ejecucion']
        indexes = [
            models.Index(fields=['empresa', 'programacion']),
            models.Index(fields=['fecha_ejecucion']),
            models.Index(fields=['fue_exitoso', 'fue_enviado']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.programacion.nombre} - {self.fecha_ejecucion}"
