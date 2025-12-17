"""
Modelos del módulo Identidad Corporativa - Dirección Estratégica

Secciones: mision_vision, valores, politica
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class CorporateIdentity(models.Model):
    """
    Identidad Corporativa - Misión, Visión, Política Integral

    Solo puede existir un registro activo a la vez.
    Permite firma digital de la Política Integral.
    """

    mission = models.TextField(
        verbose_name='Misión',
        help_text='Declaración de misión de la organización'
    )
    vision = models.TextField(
        verbose_name='Visión',
        help_text='Declaración de visión de la organización'
    )
    integral_policy = models.TextField(
        verbose_name='Política Integral',
        help_text='Política integral del sistema de gestión (Calidad, SST, Ambiental)'
    )
    policy_signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='policies_signed',
        verbose_name='Firmada por',
        help_text='Usuario que firmó digitalmente la política'
    )
    policy_signed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de firma',
        help_text='Fecha y hora de la firma digital'
    )
    policy_signature_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Hash de firma',
        help_text='Hash SHA-256 de la firma digital'
    )
    effective_date = models.DateField(
        verbose_name='Fecha de vigencia',
        help_text='Fecha desde la cual esta identidad está vigente'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión',
        help_text='Versión del documento (ej: 1.0, 2.1)'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Solo una identidad puede estar activa'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='identities_created',
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
        db_table = 'identidad_corporate_identity'
        verbose_name = 'Identidad Corporativa'
        verbose_name_plural = 'Identidades Corporativas'
        ordering = ['-effective_date']

    def __str__(self):
        return f"Identidad Corporativa v{self.version} ({self.effective_date})"

    def save(self, *args, **kwargs):
        # Si se activa esta identidad, desactivar las demás
        if self.is_active:
            CorporateIdentity.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def sign_policy(self, user):
        """Firma digitalmente la política integral"""
        import hashlib
        content = f"{self.integral_policy}|{user.id}|{timezone.now().isoformat()}"
        self.policy_signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.policy_signed_by = user
        self.policy_signed_at = timezone.now()
        self.save(update_fields=['policy_signature_hash', 'policy_signed_by', 'policy_signed_at'])

    @property
    def is_signed(self):
        """Verifica si la política está firmada"""
        return self.policy_signed_by is not None and self.policy_signature_hash is not None

    @classmethod
    def get_active(cls):
        """Obtiene la identidad corporativa activa"""
        return cls.objects.filter(is_active=True).first()


class CorporateValue(models.Model):
    """
    Valores Corporativos

    Lista de valores organizacionales con descripción e ícono.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='values',
        verbose_name='Identidad Corporativa'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del valor (ej: Integridad, Compromiso)'
    )
    description = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del valor'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Heart, Shield)'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        db_table = 'identidad_corporate_value'
        verbose_name = 'Valor Corporativo'
        verbose_name_plural = 'Valores Corporativos'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
