"""
Modelos para matriz_legal - motor_cumplimiento

Tablas implementadas según DATABASE-ARCHITECTURE.md:
- TipoNorma: Catálogo de tipos de norma (global)
- NormaLegal: Normas legales con scraping
- EmpresaNorma: Relación empresa-norma con cumplimiento
"""
from django.db import models
from django.conf import settings


class TipoNorma(models.Model):
    """
    Catálogo de tipos de norma legal.

    Tabla global (no tiene empresa_id).
    Ejemplos: Ley, Decreto, Resolución, Circular, Acuerdo
    """

    codigo = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código',
        help_text='Código único del tipo de norma (ej: LEY, DEC, RES)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de norma (ej: Ley, Decreto)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'cumplimiento_tipo_norma'
        verbose_name = 'Tipo de Norma'
        verbose_name_plural = 'Tipos de Norma'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class NormaLegal(models.Model):
    """
    Normas legales del sistema.

    Almacena todas las normas legales colombianas aplicables
    a los sistemas de gestión (SST, Ambiental, Calidad, PESV).
    Soporta scraping automático de contenido.
    """

    tipo_norma = models.ForeignKey(
        TipoNorma,
        on_delete=models.PROTECT,
        related_name='normas',
        verbose_name='Tipo de Norma'
    )
    numero = models.CharField(
        max_length=50,
        verbose_name='Número',
        help_text='Número de la norma (ej: 1072, 0312)'
    )
    anio = models.PositiveSmallIntegerField(
        verbose_name='Año',
        help_text='Año de expedición'
    )
    titulo = models.CharField(
        max_length=500,
        verbose_name='Título',
        help_text='Título descriptivo de la norma'
    )
    entidad_emisora = models.CharField(
        max_length=200,
        verbose_name='Entidad Emisora',
        help_text='Entidad que emite la norma (ej: Ministerio del Trabajo)'
    )
    fecha_expedicion = models.DateField(
        verbose_name='Fecha de Expedición'
    )
    fecha_vigencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vigencia',
        help_text='Fecha desde la cual entra en vigor'
    )
    url_original = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL Original',
        help_text='Enlace a la norma en la fuente oficial'
    )
    resumen = models.TextField(
        blank=True,
        null=True,
        verbose_name='Resumen',
        help_text='Resumen ejecutivo de la norma'
    )
    contenido = models.TextField(
        blank=True,
        null=True,
        verbose_name='Contenido',
        help_text='Texto completo de la norma (extraído por scraping)'
    )

    # Flags de aplicabilidad por sistema de gestión
    aplica_sst = models.BooleanField(
        default=False,
        verbose_name='Aplica SST',
        help_text='Aplica al Sistema de Seguridad y Salud en el Trabajo'
    )
    aplica_ambiental = models.BooleanField(
        default=False,
        verbose_name='Aplica Ambiental',
        help_text='Aplica al Sistema de Gestión Ambiental'
    )
    aplica_calidad = models.BooleanField(
        default=False,
        verbose_name='Aplica Calidad',
        help_text='Aplica al Sistema de Gestión de Calidad'
    )
    aplica_pesv = models.BooleanField(
        default=False,
        verbose_name='Aplica PESV',
        help_text='Aplica al Plan Estratégico de Seguridad Vial'
    )

    vigente = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Vigente',
        help_text='Indica si la norma está vigente'
    )
    fecha_scraping = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Scraping',
        help_text='Última vez que se actualizó el contenido por scraping'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'cumplimiento_norma_legal'
        verbose_name = 'Norma Legal'
        verbose_name_plural = 'Normas Legales'
        ordering = ['-fecha_expedicion']
        indexes = [
            models.Index(fields=['tipo_norma', 'vigente']),
            models.Index(fields=['vigente', 'fecha_vigencia']),
            models.Index(fields=['aplica_sst']),
            models.Index(fields=['aplica_ambiental']),
            models.Index(fields=['aplica_pesv']),
        ]

    def __str__(self):
        return f"{self.tipo_norma.codigo} {self.numero} de {self.anio}"

    @property
    def codigo_completo(self):
        """Retorna el código completo de la norma"""
        return f"{self.tipo_norma.codigo} {self.numero}/{self.anio}"

    @classmethod
    def get_by_sistema(cls, sistema):
        """Filtra normas por sistema de gestión"""
        filters = {
            'sst': {'aplica_sst': True},
            'ambiental': {'aplica_ambiental': True},
            'calidad': {'aplica_calidad': True},
            'pesv': {'aplica_pesv': True},
        }
        return cls.objects.filter(vigente=True, **filters.get(sistema, {}))


class EmpresaNorma(models.Model):
    """
    Relación entre empresa y norma legal.

    Permite definir qué normas aplican a cada empresa,
    justificar exclusiones y trackear cumplimiento.
    """

    CUMPLIMIENTO_CHOICES = [
        (0, 'No evaluado'),
        (25, '25% - Bajo'),
        (50, '50% - Medio'),
        (75, '75% - Alto'),
        (100, '100% - Cumple'),
    ]

    # TODO: Cambiar a FK cuando exista modelo Empresa en gestion_estrategica.organizacion
    # Por ahora usamos campo simple para desarrollo inicial del módulo
    empresa_id = models.PositiveBigIntegerField(
        default=1,
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (para multi-tenant)'
    )
    norma = models.ForeignKey(
        NormaLegal,
        on_delete=models.PROTECT,
        related_name='empresas',
        verbose_name='Norma Legal'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='normas_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable del cumplimiento de esta norma'
    )

    aplica = models.BooleanField(
        default=True,
        verbose_name='Aplica',
        help_text='Indica si la norma aplica a esta empresa'
    )
    justificacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación',
        help_text='Justificación si la norma no aplica'
    )

    porcentaje_cumplimiento = models.PositiveSmallIntegerField(
        default=0,
        choices=CUMPLIMIENTO_CHOICES,
        verbose_name='% Cumplimiento',
        help_text='Porcentaje de cumplimiento (0-100)'
    )
    fecha_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Evaluación',
        help_text='Última fecha de evaluación de cumplimiento'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='empresa_normas_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'cumplimiento_empresa_norma'
        verbose_name = 'Norma por Empresa'
        verbose_name_plural = 'Normas por Empresa'
        unique_together = ['empresa_id', 'norma']
        ordering = ['-fecha_evaluacion', 'norma__numero']
        indexes = [
            models.Index(fields=['empresa_id', 'aplica']),
            models.Index(fields=['empresa_id', 'porcentaje_cumplimiento']),
        ]

    def __str__(self):
        return f"Empresa {self.empresa_id} - {self.norma}"

    @property
    def estado_cumplimiento(self):
        """Retorna el estado de cumplimiento como texto"""
        if self.porcentaje_cumplimiento == 100:
            return 'Cumple'
        elif self.porcentaje_cumplimiento >= 75:
            return 'Alto'
        elif self.porcentaje_cumplimiento >= 50:
            return 'Medio'
        elif self.porcentaje_cumplimiento >= 25:
            return 'Bajo'
        return 'No evaluado'
