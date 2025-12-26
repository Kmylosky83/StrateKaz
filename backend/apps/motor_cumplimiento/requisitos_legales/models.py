"""
Modelos para Requisitos Legales
Subtabs: Licencias, Permisos, Conceptos, Vencimientos, Alertas

Arquitectura:
- TipoRequisito: Catálogo global (TimestampedModel + SoftDeleteModel)
- RequisitoLegal: Catálogo global (TimestampedModel + SoftDeleteModel + AuditModel)
- EmpresaRequisito: Por empresa (BaseCompanyModel)
- AlertaVencimiento: Por empresa, sin soft delete (hereda de empresa_requisito)
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.base_models import TimestampedModel, SoftDeleteModel, AuditModel, BaseCompanyModel


class TipoRequisito(TimestampedModel, SoftDeleteModel):
    """
    Catálogo global de tipos de requisitos legales.
    Ejemplos: Licencia Ambiental, Permiso Sanitario, Concepto Bomberos, etc.

    Hereda de:
    - TimestampedModel: created_at, updated_at
    - SoftDeleteModel: is_active, deleted_at, soft_delete(), restore()
    """
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    requiere_renovacion = models.BooleanField(default=True)
    dias_anticipacion_alerta = models.PositiveSmallIntegerField(default=30)

    class Meta:
        verbose_name = "Tipo de Requisito"
        verbose_name_plural = "Tipos de Requisito"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class RequisitoLegal(TimestampedModel, SoftDeleteModel, AuditModel):
    """
    Catálogo global de requisitos legales aplicables.
    Define qué documentos/licencias/permisos existen y a qué módulos aplican.

    Hereda de:
    - TimestampedModel: created_at, updated_at
    - SoftDeleteModel: is_active, deleted_at, soft_delete(), restore()
    - AuditModel: created_by, updated_by
    """
    class Estado(models.TextChoices):
        VIGENTE = "vigente", "Vigente"
        PROXIMO_VENCER = "proximo_vencer", "Proximo a Vencer"
        VENCIDO = "vencido", "Vencido"
        EN_TRAMITE = "en_tramite", "En Tramite"
        NO_APLICA = "no_aplica", "No Aplica"

    # Identificación
    tipo = models.ForeignKey(TipoRequisito, on_delete=models.PROTECT, related_name="requisitos")
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)

    # Información legal
    entidad_emisora = models.CharField(max_length=200)
    base_legal = models.TextField(blank=True, help_text="Ley, decreto o resolución que lo sustenta")

    # Aplicabilidad a módulos
    aplica_sst = models.BooleanField(default=False, verbose_name="Aplica a SST")
    aplica_ambiental = models.BooleanField(default=False, verbose_name="Aplica a Ambiental")
    aplica_calidad = models.BooleanField(default=False, verbose_name="Aplica a Calidad")
    aplica_pesv = models.BooleanField(default=False, verbose_name="Aplica a PESV")

    # Configuración
    es_obligatorio = models.BooleanField(default=True)
    periodicidad_renovacion = models.CharField(
        max_length=50,
        blank=True,
        help_text="Ejemplo: Anual, Semestral, Cada 2 años"
    )

    class Meta:
        verbose_name = "Requisito Legal"
        verbose_name_plural = "Requisitos Legales"
        ordering = ["tipo", "nombre"]
        unique_together = ["tipo", "codigo"]

    def __str__(self):
        return f"{self.tipo.codigo}-{self.codigo}: {self.nombre}"


class EmpresaRequisito(BaseCompanyModel):
    """
    Requisitos legales asignados a una empresa específica.
    Representa el estado de cumplimiento de cada requisito por empresa.

    Hereda de BaseCompanyModel:
    - empresa (FK a EmpresaConfig)
    - created_at, updated_at (TimestampedModel)
    - created_by, updated_by (AuditModel)
    - is_active, deleted_at (SoftDeleteModel)
    - soft_delete(), restore(), get_empresa_info()
    """
    class Estado(models.TextChoices):
        VIGENTE = "vigente", "Vigente"
        PROXIMO_VENCER = "proximo_vencer", "Proximo a Vencer"
        VENCIDO = "vencido", "Vencido"
        EN_TRAMITE = "en_tramite", "En Tramite"
        RENOVANDO = "renovando", "En Renovacion"
        NO_APLICA = "no_aplica", "No Aplica"

    # Relación con catálogo
    requisito = models.ForeignKey(
        RequisitoLegal,
        on_delete=models.PROTECT,
        related_name="empresas",
        verbose_name="Requisito Legal"
    )

    # Información del documento
    numero_documento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Número de Documento/Licencia"
    )
    fecha_expedicion = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True, db_index=True)

    # Estado y seguimiento
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.EN_TRAMITE,
        db_index=True
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requisitos_responsable",
        verbose_name="Responsable del seguimiento"
    )

    # Archivos y observaciones
    documento_soporte = models.FileField(
        upload_to="requisitos/documentos/",
        blank=True,
        null=True,
        verbose_name="Documento soporte (PDF, imagen)"
    )
    observaciones = models.TextField(blank=True)
    justificacion_no_aplica = models.TextField(
        blank=True,
        help_text="Si el estado es NO_APLICA, justificar el motivo"
    )

    # Trazabilidad de renovaciones
    requisito_anterior = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="renovaciones",
        verbose_name="Requisito que renueva",
        help_text="Referencia al requisito anterior en caso de renovación"
    )

    class Meta:
        verbose_name = "Requisito de Empresa"
        verbose_name_plural = "Requisitos de Empresa"
        ordering = ["fecha_vencimiento"]
        indexes = [
            models.Index(fields=["empresa", "estado"]),
            models.Index(fields=["empresa", "fecha_vencimiento"]),
        ]

    def __str__(self):
        empresa_info = self.get_empresa_info()
        empresa_nombre = empresa_info['nombre_comercial'] if empresa_info else 'Sin empresa'
        return f"{self.requisito.nombre} - {empresa_nombre}"

    @property
    def dias_para_vencer(self):
        """Calcula los días restantes hasta el vencimiento."""
        if self.fecha_vencimiento:
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None

    @property
    def esta_vencido(self):
        """Verifica si el requisito está vencido."""
        dias = self.dias_para_vencer
        return dias is not None and dias < 0

    @property
    def esta_proximo_vencer(self):
        """Verifica si el requisito está próximo a vencer según los días de anticipación."""
        if not self.fecha_vencimiento or not self.requisito.tipo:
            return False
        dias = self.dias_para_vencer
        dias_anticipacion = self.requisito.tipo.dias_anticipacion_alerta
        return dias is not None and 0 <= dias <= dias_anticipacion


class AlertaVencimiento(TimestampedModel):
    """
    Alertas programadas para vencimientos de requisitos.
    No necesita soft delete porque se eliminan con el EmpresaRequisito (CASCADE).
    No necesita empresa_id porque hereda del empresa_requisito.

    Hereda de:
    - TimestampedModel: created_at, updated_at
    """
    class TipoAlerta(models.TextChoices):
        EMAIL = "email", "Correo Electronico"
        SISTEMA = "sistema", "Notificacion Sistema"
        AMBOS = "ambos", "Correo y Sistema"

    # Relación con el requisito de empresa
    empresa_requisito = models.ForeignKey(
        EmpresaRequisito,
        on_delete=models.CASCADE,
        related_name="alertas",
        verbose_name="Requisito de Empresa"
    )

    # Configuración de la alerta
    dias_antes = models.PositiveSmallIntegerField(
        verbose_name="Días de anticipación",
        help_text="Número de días antes del vencimiento para enviar la alerta"
    )
    tipo_alerta = models.CharField(
        max_length=10,
        choices=TipoAlerta.choices,
        default=TipoAlerta.SISTEMA
    )
    destinatarios = models.TextField(
        blank=True,
        help_text="Emails separados por comas para alertas por correo"
    )
    mensaje_personalizado = models.TextField(blank=True)

    # Programación y seguimiento
    fecha_programada = models.DateField(
        db_index=True,
        verbose_name="Fecha programada de envío"
    )
    enviada = models.BooleanField(default=False, db_index=True)
    fecha_envio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha/hora de envío real"
    )

    class Meta:
        verbose_name = "Alerta de Vencimiento"
        verbose_name_plural = "Alertas de Vencimiento"
        ordering = ["fecha_programada"]
        unique_together = ["empresa_requisito", "dias_antes"]
        indexes = [
            models.Index(fields=["fecha_programada", "enviada"]),
        ]

    def __str__(self):
        return f"Alerta {self.dias_antes}d - {self.empresa_requisito}"

    @property
    def esta_pendiente(self):
        """Verifica si la alerta está pendiente de enviar."""
        return not self.enviada and self.fecha_programada <= timezone.now().date()

    def marcar_como_enviada(self):
        """Marca la alerta como enviada."""
        self.enviada = True
        self.fecha_envio = timezone.now()
        self.save(update_fields=['enviada', 'fecha_envio', 'updated_at'])
