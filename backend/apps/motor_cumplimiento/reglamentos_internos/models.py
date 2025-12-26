"""
Modelos para Reglamentos Internos
"""
from django.db import models
from django.conf import settings

from apps.core.base_models import TimestampedModel, SoftDeleteModel, BaseCompanyModel, OrderedModel


class TipoReglamento(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo Global de Tipos de Reglamento.

    No pertenece a una empresa específica (catálogo global).
    Campos de negocio en español, auditoría en inglés (heredados).
    """
    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    requiere_aprobacion_legal = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación Legal'
    )
    vigencia_anios = models.PositiveSmallIntegerField(
        default=1,
        verbose_name='Vigencia (años)'
    )

    class Meta:
        verbose_name = "Tipo de Reglamento"
        verbose_name_plural = "Tipos de Reglamento"
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre


class Reglamento(BaseCompanyModel, OrderedModel):
    """
    Reglamento Interno de la Empresa.

    Pertenece a una empresa (usa BaseCompanyModel).
    Incluye versionamiento y control de estado.
    Campos de negocio en español, auditoría en inglés (heredados).
    """
    class Estado(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        EN_REVISION = "en_revision", "En Revision"
        APROBADO = "aprobado", "Aprobado"
        VIGENTE = "vigente", "Vigente"
        OBSOLETO = "obsoleto", "Obsoleto"

    # Campos de negocio
    tipo = models.ForeignKey(
        TipoReglamento,
        on_delete=models.PROTECT,
        related_name="reglamentos",
        verbose_name='Tipo de Reglamento'
    )
    codigo = models.CharField(max_length=50, verbose_name='Código')
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    estado = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.BORRADOR,
        db_index=True,
        verbose_name='Estado'
    )
    version_actual = models.CharField(
        max_length=20,
        default="1.0",
        verbose_name='Versión Actual'
    )

    # Fechas
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )
    fecha_vigencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vigencia'
    )
    fecha_proxima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Revisión'
    )

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reglamentos_aprobados",
        verbose_name='Aprobado Por'
    )

    # Documento
    documento = models.FileField(
        upload_to="reglamentos/documentos/",
        blank=True,
        null=True,
        verbose_name='Documento'
    )

    # Aplicabilidad a módulos
    aplica_sst = models.BooleanField(default=False, verbose_name='Aplica a SST')
    aplica_ambiental = models.BooleanField(default=False, verbose_name='Aplica a Ambiental')
    aplica_calidad = models.BooleanField(default=False, verbose_name='Aplica a Calidad')
    aplica_pesv = models.BooleanField(default=False, verbose_name='Aplica a PESV')

    # Observaciones
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    class Meta:
        verbose_name = "Reglamento Interno"
        verbose_name_plural = "Reglamentos Internos"
        ordering = ["empresa", "orden", "tipo", "nombre"]
        unique_together = ["empresa", "tipo", "codigo"]
        indexes = [
            models.Index(fields=["empresa", "estado"]),
            models.Index(fields=["estado"]),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} (v{self.version_actual})"


class VersionReglamento(BaseCompanyModel):
    """
    Control de versiones de reglamentos.

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
    """
    reglamento = models.ForeignKey(
        Reglamento,
        on_delete=models.CASCADE,
        related_name="versiones",
        verbose_name='Reglamento'
    )
    numero_version = models.CharField(max_length=20, verbose_name='Número de Versión')
    fecha_version = models.DateField(verbose_name='Fecha de Versión')
    cambios_realizados = models.TextField(verbose_name='Cambios Realizados')
    motivo_cambio = models.TextField(blank=True, verbose_name='Motivo del Cambio')
    documento = models.FileField(
        upload_to="reglamentos/versiones/",
        blank=True,
        null=True,
        verbose_name='Documento'
    )
    elaborado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="versiones_elaboradas",
        verbose_name='Elaborado Por'
    )
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="versiones_revisadas",
        verbose_name='Revisado Por'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="versiones_aprobadas",
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True, verbose_name='Fecha de Aprobación')

    class Meta:
        verbose_name = "Versión de Reglamento"
        verbose_name_plural = "Versiones de Reglamentos"
        ordering = ["-fecha_version"]
        unique_together = ["reglamento", "numero_version"]
        indexes = [
            models.Index(fields=["empresa", "reglamento"]),
            models.Index(fields=["empresa", "fecha_version"])
        ]

    def __str__(self):
        return f"{self.reglamento.codigo} - v{self.numero_version}"


class PublicacionReglamento(BaseCompanyModel):
    """
    Registro de publicaciones de reglamentos.

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
    """
    class MedioPublicacion(models.TextChoices):
        CARTELERA = "cartelera", "Cartelera"
        EMAIL = "email", "Correo Electrónico"
        INTRANET = "intranet", "Intranet"
        REUNION = "reunion", "Reunión"
        IMPRESO = "impreso", "Documento Impreso"

    reglamento = models.ForeignKey(
        Reglamento,
        on_delete=models.CASCADE,
        related_name="publicaciones",
        verbose_name='Reglamento'
    )
    version_publicada = models.CharField(max_length=20, verbose_name='Versión Publicada')
    fecha_publicacion = models.DateField(verbose_name='Fecha de Publicación')
    medio = models.CharField(
        max_length=15,
        choices=MedioPublicacion.choices,
        verbose_name='Medio de Publicación'
    )
    ubicacion = models.CharField(max_length=200, blank=True, verbose_name='Ubicación')
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')
    evidencia = models.FileField(
        upload_to="reglamentos/publicaciones/",
        blank=True,
        null=True,
        verbose_name='Evidencia'
    )
    publicado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="publicaciones_realizadas",
        verbose_name='Publicado Por'
    )

    class Meta:
        verbose_name = "Publicación de Reglamento"
        verbose_name_plural = "Publicaciones de Reglamentos"
        ordering = ["-fecha_publicacion"]
        indexes = [
            models.Index(fields=["empresa", "reglamento"]),
            models.Index(fields=["empresa", "fecha_publicacion"])
        ]

    def __str__(self):
        return f"{self.reglamento.codigo} - {self.get_medio_display()} ({self.fecha_publicacion})"


class SocializacionReglamento(BaseCompanyModel):
    """
    Registro de socializaciones de reglamentos.

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
    """
    class TipoSocializacion(models.TextChoices):
        INDUCCION = "induccion", "Inducción"
        REINDUCCION = "reinduccion", "Reinducción"
        CAPACITACION = "capacitacion", "Capacitación"
        REUNION = "reunion", "Reunión"
        VIRTUAL = "virtual", "Virtual"

    reglamento = models.ForeignKey(
        Reglamento,
        on_delete=models.CASCADE,
        related_name="socializaciones",
        verbose_name='Reglamento'
    )
    tipo = models.CharField(
        max_length=15,
        choices=TipoSocializacion.choices,
        verbose_name='Tipo de Socialización'
    )
    fecha = models.DateField(verbose_name='Fecha')
    duracion_horas = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=1.0,
        verbose_name='Duración (horas)'
    )
    facilitador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="socializaciones_facilitadas",
        verbose_name='Facilitador'
    )
    numero_asistentes = models.PositiveSmallIntegerField(default=0, verbose_name='Número de Asistentes')
    temas_tratados = models.TextField(blank=True, verbose_name='Temas Tratados')
    lista_asistencia = models.FileField(
        upload_to="reglamentos/socializaciones/",
        blank=True,
        null=True,
        verbose_name='Lista de Asistencia'
    )
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    class Meta:
        verbose_name = "Socialización de Reglamento"
        verbose_name_plural = "Socializaciones de Reglamentos"
        ordering = ["-fecha"]
        indexes = [
            models.Index(fields=["empresa", "reglamento"]),
            models.Index(fields=["empresa", "fecha"])
        ]

    def __str__(self):
        return f"{self.reglamento.codigo} - {self.get_tipo_display()} ({self.fecha})"
