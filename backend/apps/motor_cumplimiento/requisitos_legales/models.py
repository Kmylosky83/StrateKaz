"""
Modelos para Requisitos Legales
Subtabs: Licencias, Permisos, Conceptos, Vencimientos, Alertas
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class TipoRequisito(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    requiere_renovacion = models.BooleanField(default=True)
    dias_anticipacion_alerta = models.PositiveSmallIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tipo de Requisito"
        verbose_name_plural = "Tipos de Requisito"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class RequisitoLegal(models.Model):
    class Estado(models.TextChoices):
        VIGENTE = "vigente", "Vigente"
        PROXIMO_VENCER = "proximo_vencer", "Proximo a Vencer"
        VENCIDO = "vencido", "Vencido"
        EN_TRAMITE = "en_tramite", "En Tramite"
        NO_APLICA = "no_aplica", "No Aplica"

    tipo = models.ForeignKey(TipoRequisito, on_delete=models.PROTECT, related_name="requisitos")
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    entidad_emisora = models.CharField(max_length=200)
    base_legal = models.TextField(blank=True)
    aplica_sst = models.BooleanField(default=False)
    aplica_ambiental = models.BooleanField(default=False)
    aplica_calidad = models.BooleanField(default=False)
    aplica_pesv = models.BooleanField(default=False)
    es_obligatorio = models.BooleanField(default=True)
    periodicidad_renovacion = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="requisitos_creados")

    class Meta:
        verbose_name = "Requisito Legal"
        verbose_name_plural = "Requisitos Legales"
        ordering = ["tipo", "nombre"]
        unique_together = ["tipo", "codigo"]

    def __str__(self):
        return f"{self.tipo.codigo}-{self.codigo}: {self.nombre}"


class EmpresaRequisito(models.Model):
    class Estado(models.TextChoices):
        VIGENTE = "vigente", "Vigente"
        PROXIMO_VENCER = "proximo_vencer", "Proximo a Vencer"
        VENCIDO = "vencido", "Vencido"
        EN_TRAMITE = "en_tramite", "En Tramite"
        RENOVANDO = "renovando", "En Renovacion"
        NO_APLICA = "no_aplica", "No Aplica"

    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    requisito = models.ForeignKey(RequisitoLegal, on_delete=models.PROTECT, related_name="empresas")
    numero_documento = models.CharField(max_length=100, blank=True)
    fecha_expedicion = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True, db_index=True)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.EN_TRAMITE, db_index=True)
    documento_soporte = models.FileField(upload_to="requisitos/documentos/", blank=True, null=True)
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="requisitos_responsable")
    observaciones = models.TextField(blank=True)
    justificacion_no_aplica = models.TextField(blank=True)
    requisito_anterior = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="renovaciones")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="empresa_requisitos_creados")

    class Meta:
        verbose_name = "Requisito de Empresa"
        verbose_name_plural = "Requisitos de Empresa"
        ordering = ["fecha_vencimiento"]
        indexes = [
            models.Index(fields=["empresa_id", "estado"]),
            models.Index(fields=["empresa_id", "fecha_vencimiento"]),
        ]

    def __str__(self):
        return f"{self.requisito.nombre} - Emp:{self.empresa_id}"

    @property
    def dias_para_vencer(self):
        if self.fecha_vencimiento:
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None


class AlertaVencimiento(models.Model):
    class TipoAlerta(models.TextChoices):
        EMAIL = "email", "Correo Electronico"
        SISTEMA = "sistema", "Notificacion Sistema"
        AMBOS = "ambos", "Correo y Sistema"

    empresa_requisito = models.ForeignKey(EmpresaRequisito, on_delete=models.CASCADE, related_name="alertas")
    dias_antes = models.PositiveSmallIntegerField()
    tipo_alerta = models.CharField(max_length=10, choices=TipoAlerta.choices, default=TipoAlerta.SISTEMA)
    destinatarios = models.TextField(blank=True)
    fecha_programada = models.DateField()
    enviada = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    mensaje_personalizado = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Alerta de Vencimiento"
        verbose_name_plural = "Alertas de Vencimiento"
        ordering = ["fecha_programada"]
        unique_together = ["empresa_requisito", "dias_antes"]

    def __str__(self):
        return f"Alerta {self.dias_antes}d - {self.empresa_requisito}"
