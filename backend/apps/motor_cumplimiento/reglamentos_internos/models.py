"""
Modelos para Reglamentos Internos
"""
from django.db import models
from django.conf import settings


class TipoReglamento(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    requiere_aprobacion_legal = models.BooleanField(default=False)
    vigencia_anios = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tipo de Reglamento"
        verbose_name_plural = "Tipos de Reglamento"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Reglamento(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        EN_REVISION = "en_revision", "En Revision"
        APROBADO = "aprobado", "Aprobado"
        VIGENTE = "vigente", "Vigente"
        OBSOLETO = "obsoleto", "Obsoleto"

    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    tipo = models.ForeignKey(TipoReglamento, on_delete=models.PROTECT, related_name="reglamentos")
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.BORRADOR, db_index=True)
    version_actual = models.CharField(max_length=20, default="1.0")
    fecha_aprobacion = models.DateField(null=True, blank=True)
    fecha_vigencia = models.DateField(null=True, blank=True)
    fecha_proxima_revision = models.DateField(null=True, blank=True)
    aprobado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reglamentos_aprobados")
    documento = models.FileField(upload_to="reglamentos/documentos/", blank=True, null=True)
    aplica_sst = models.BooleanField(default=False)
    aplica_ambiental = models.BooleanField(default=False)
    aplica_calidad = models.BooleanField(default=False)
    aplica_pesv = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="reglamentos_creados")

    class Meta:
        verbose_name = "Reglamento Interno"
        verbose_name_plural = "Reglamentos Internos"
        ordering = ["tipo", "nombre"]
        unique_together = ["empresa_id", "tipo", "codigo"]
        indexes = [models.Index(fields=["empresa_id", "estado"])]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} (v{self.version_actual})"


class VersionReglamento(models.Model):
    reglamento = models.ForeignKey(Reglamento, on_delete=models.CASCADE, related_name="versiones")
    numero_version = models.CharField(max_length=20)
    fecha_version = models.DateField()
    cambios_realizados = models.TextField()
    motivo_cambio = models.TextField(blank=True)
    documento = models.FileField(upload_to="reglamentos/versiones/", blank=True, null=True)
    elaborado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="versiones_elaboradas")
    revisado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="versiones_revisadas")
    aprobado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="versiones_aprobadas")
    fecha_aprobacion = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Version de Reglamento"
        verbose_name_plural = "Versiones de Reglamentos"
        ordering = ["-fecha_version"]
        unique_together = ["reglamento", "numero_version"]


class PublicacionReglamento(models.Model):
    class MedioPublicacion(models.TextChoices):
        CARTELERA = "cartelera", "Cartelera"
        EMAIL = "email", "Correo Electronico"
        INTRANET = "intranet", "Intranet"
        REUNION = "reunion", "Reunion"
        IMPRESO = "impreso", "Documento Impreso"

    reglamento = models.ForeignKey(Reglamento, on_delete=models.CASCADE, related_name="publicaciones")
    version_publicada = models.CharField(max_length=20)
    fecha_publicacion = models.DateField()
    medio = models.CharField(max_length=15, choices=MedioPublicacion.choices)
    ubicacion = models.CharField(max_length=200, blank=True)
    observaciones = models.TextField(blank=True)
    evidencia = models.FileField(upload_to="reglamentos/publicaciones/", blank=True, null=True)
    publicado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="publicaciones_realizadas")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Publicacion de Reglamento"
        verbose_name_plural = "Publicaciones de Reglamentos"
        ordering = ["-fecha_publicacion"]


class SocializacionReglamento(models.Model):
    class TipoSocializacion(models.TextChoices):
        INDUCCION = "induccion", "Induccion"
        REINDUCCION = "reinduccion", "Reinduccion"
        CAPACITACION = "capacitacion", "Capacitacion"
        REUNION = "reunion", "Reunion"
        VIRTUAL = "virtual", "Virtual"

    reglamento = models.ForeignKey(Reglamento, on_delete=models.CASCADE, related_name="socializaciones")
    tipo = models.CharField(max_length=15, choices=TipoSocializacion.choices)
    fecha = models.DateField()
    duracion_horas = models.DecimalField(max_digits=4, decimal_places=1, default=1.0)
    facilitador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="socializaciones_facilitadas")
    numero_asistentes = models.PositiveSmallIntegerField(default=0)
    temas_tratados = models.TextField(blank=True)
    lista_asistencia = models.FileField(upload_to="reglamentos/socializaciones/", blank=True, null=True)
    observaciones = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="socializaciones_registradas")

    class Meta:
        verbose_name = "Socializacion de Reglamento"
        verbose_name_plural = "Socializaciones de Reglamentos"
        ordering = ["-fecha"]
