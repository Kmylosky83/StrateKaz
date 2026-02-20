"""
Modelos para Evidencias Centralizadas.

Hub central que permite vincular archivos de evidencia a CUALQUIER entidad
del sistema via GenericForeignKey (similar a FirmaDigital en workflow_engine).

Resuelve el problema de evidencias dispersas en 21+ FileFields sin búsqueda
cruzada ni lifecycle.
"""
import hashlib
from django.conf import settings
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import FileExtensionValidator


def evidencia_upload_path(instance, filename):
    """Genera path: evidencias/{empresa_id}/{año}/{mes}/{filename}"""
    from django.utils import timezone
    now = timezone.now()
    return f'evidencias/{instance.empresa_id}/{now.year}/{now.month:02d}/{filename}'


class Evidencia(models.Model):
    """
    Registro central de evidencias vinculable a CUALQUIER entidad del sistema.

    Permite:
    - Buscar evidencias por norma ISO, categoría, estado
    - Lifecycle: PENDIENTE → APROBADA/RECHAZADA → VENCIDA/ARCHIVADA
    - Cadena de custodia via HistorialEvidencia
    - Integridad via SHA-256 checksum

    Ejemplo de uso desde cualquier módulo:
        from apps.motor_cumplimiento.evidencias.services import EvidenciaService
        from apps.core.base_models.mixins import get_tenant_empresa
        EvidenciaService.registrar_evidencia(
            archivo=request.FILES['archivo'],
            entidad=no_conformidad,
            usuario=request.user,
            empresa_id=get_tenant_empresa().id,
            titulo='Foto evidencia NC-2024-001',
            categoria='FOTOGRAFICA',
            normas_relacionadas=['ISO_9001'],
        )
    """

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('VENCIDA', 'Vencida'),
        ('ARCHIVADA', 'Archivada'),
    ]

    CATEGORIA_CHOICES = [
        ('FOTOGRAFICA', 'Evidencia Fotográfica'),
        ('DOCUMENTAL', 'Evidencia Documental'),
        ('REGISTRO', 'Registro'),
        ('CERTIFICADO', 'Certificado'),
        ('ACTA', 'Acta'),
        ('INFORME', 'Informe'),
        ('RESULTADO_PRUEBA', 'Resultado de Prueba'),
        ('CAPACITACION', 'Evidencia de Capacitación'),
        ('INSPECCION', 'Evidencia de Inspección'),
        ('VIDEO', 'Video'),
        ('OTRO', 'Otro'),
    ]

    EXTENSIONES_PERMITIDAS = [
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
        'mp4', 'avi', 'mov', 'mp3', 'wav',
        'zip', 'rar', '7z',
        'csv', 'txt',
    ]

    # ============ MULTI-TENANCY ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    # ============ GENERIC FOREIGN KEY ============
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de entidad',
        help_text='Modelo al que pertenece esta evidencia'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID de entidad',
        help_text='ID del objeto al que pertenece esta evidencia'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # ============ ARCHIVO ============
    archivo = models.FileField(
        upload_to=evidencia_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
            'mp4', 'avi', 'mov', 'mp3', 'wav',
            'zip', 'rar', '7z', 'csv', 'txt',
        ])],
        verbose_name='Archivo',
        help_text='Archivo de evidencia'
    )
    nombre_original = models.CharField(
        max_length=255,
        verbose_name='Nombre original',
        help_text='Nombre original del archivo subido'
    )
    mime_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Tipo MIME',
        help_text='Tipo MIME del archivo (ej: application/pdf)'
    )
    tamano_bytes = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño (bytes)',
        help_text='Tamaño del archivo en bytes'
    )
    checksum_sha256 = models.CharField(
        max_length=64,
        blank=True,
        verbose_name='Checksum SHA-256',
        help_text='Hash SHA-256 para verificar integridad'
    )

    # ============ METADATA ============
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título descriptivo de la evidencia'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la evidencia'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        default='OTRO',
        verbose_name='Categoría',
        help_text='Tipo de evidencia'
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado de aprobación de la evidencia'
    )

    # ============ CLASIFICACIÓN ISO ============
    normas_relacionadas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Normas relacionadas',
        help_text='Normas ISO aplicables: ["ISO_9001", "ISO_45001", "DECRETO_1072"]'
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Etiquetas',
        help_text='Tags de clasificación: ["auditoria-2024", "proceso-calidad"]'
    )

    # ============ VIGENCIA ============
    fecha_vigencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de vigencia',
        help_text='Para certificados, licencias: fecha de vencimiento'
    )

    # ============ APROBACIÓN ============
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evidencias_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        verbose_name='Motivo de rechazo',
        help_text='Razón por la cual se rechazó la evidencia'
    )

    # ============ AUDITORÍA ============
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='evidencias_subidas',
        verbose_name='Subido por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cumplimiento_evidencia'
        verbose_name = 'Evidencia'
        verbose_name_plural = 'Evidencias'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'content_type', 'object_id']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'categoria']),
            models.Index(fields=['fecha_vigencia']),
            models.Index(fields=['subido_por', 'created_at']),
        ]

    def __str__(self):
        return f"{self.titulo} ({self.get_estado_display()})"

    @property
    def tamano_legible(self):
        """Convierte el tamaño en bytes a formato legible."""
        if not self.tamano_bytes:
            return "Desconocido"
        size = self.tamano_bytes
        for unidad in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unidad}"
            size /= 1024.0
        return f"{size:.1f} TB"

    @property
    def es_imagen(self):
        return self.mime_type.startswith('image/') if self.mime_type else False

    @property
    def es_pdf(self):
        return self.mime_type == 'application/pdf'

    def calcular_checksum(self):
        """Calcula SHA-256 del archivo."""
        if not self.archivo:
            return ''
        sha256 = hashlib.sha256()
        self.archivo.seek(0)
        for chunk in self.archivo.chunks():
            sha256.update(chunk)
        self.archivo.seek(0)
        return sha256.hexdigest()

    def save(self, *args, **kwargs):
        if self.archivo and not self.checksum_sha256:
            try:
                self.checksum_sha256 = self.calcular_checksum()
            except Exception:
                pass
        if self.archivo and not self.tamano_bytes:
            try:
                self.tamano_bytes = self.archivo.size
            except Exception:
                pass
        super().save(*args, **kwargs)


class HistorialEvidencia(models.Model):
    """
    Audit trail de cambios de estado en evidencias.
    Proporciona cadena de custodia completa.
    """

    ACCION_CHOICES = [
        ('CREADA', 'Creada'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('RESUBIDA', 'Re-subida'),
        ('ARCHIVADA', 'Archivada'),
        ('VENCIDA', 'Marcada como Vencida'),
        ('METADATA_ACTUALIZADA', 'Metadata Actualizada'),
    ]

    evidencia = models.ForeignKey(
        Evidencia,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name='Evidencia'
    )
    empresa_id = models.PositiveBigIntegerField(db_index=True)
    accion = models.CharField(
        max_length=25,
        choices=ACCION_CHOICES,
        verbose_name='Acción'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Usuario'
    )
    comentario = models.TextField(
        blank=True,
        verbose_name='Comentario'
    )
    datos_anteriores = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos anteriores',
        help_text='Snapshot de campos antes del cambio'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cumplimiento_historial_evidencia'
        verbose_name = 'Historial de Evidencia'
        verbose_name_plural = 'Historiales de Evidencia'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['evidencia', 'fecha']),
            models.Index(fields=['empresa_id', 'accion']),
        ]

    def __str__(self):
        return f"{self.evidencia.titulo} - {self.get_accion_display()} ({self.fecha})"
