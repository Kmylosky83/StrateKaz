"""
Modelos del módulo Identidad Corporativa - Dirección Estratégica v4.0

Modelos:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión por norma ISO

NOTA v4.0: PoliticaEspecifica eliminada. Las políticas se gestionan
exclusivamente desde Gestión Documental (tipo_documento=POL).
Identidad Corporativa solo muestra políticas vigentes como referencia read-only.
"""
from django.db import models
from django.utils import timezone

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel, OrderedModel


class CorporateIdentity(AuditModel, SoftDeleteModel):
    """
    Identidad Corporativa - Misión, Visión

    Solo puede existir un registro activo por empresa (multi-tenant).
    Las políticas se gestionan desde Gestión Documental (tipo_documento=POL).
    """

    # Multi-tenancy
    empresa = models.OneToOneField(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='identidad_corporativa',
        verbose_name='Empresa',
        help_text='Empresa a la que pertenece esta identidad corporativa'
    )

    mission = models.TextField(
        verbose_name='Misión',
        help_text='Declaración de misión de la organización'
    )
    vision = models.TextField(
        verbose_name='Visión',
        help_text='Declaración de visión de la organización'
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

    # =========================================================================
    # CAMPOS DE ALCANCE DEL SISTEMA INTEGRADO DE GESTIÓN
    # =========================================================================
    # Estos campos permiten definir opcionalmente el alcance general del
    # sistema integrado de gestión. El toggle declara_alcance controla la
    # visibilidad de esta sección en el frontend.
    # =========================================================================
    declara_alcance = models.BooleanField(
        default=False,
        verbose_name='¿Declara Alcance?',
        help_text='Si es True, muestra la sección de Alcance del Sistema Integrado de Gestión'
    )
    alcance_general = models.TextField(
        blank=True,
        null=True,
        verbose_name='Alcance General del SIG',
        help_text='Descripción general del alcance del Sistema Integrado de Gestión'
    )
    alcance_geografico = models.TextField(
        blank=True,
        null=True,
        verbose_name='Cobertura Geográfica',
        help_text='Descripción de la cobertura geográfica del sistema (ej: Colombia, oficinas en Bogotá, Medellín y Cali)'
    )
    alcance_procesos = models.TextField(
        blank=True,
        null=True,
        verbose_name='[LEGACY] Procesos Cubiertos (texto)',
        help_text='DEPRECATED: Usar procesos_cubiertos ManyToMany. Campo legacy para retrocompatibilidad.'
    )
    procesos_cubiertos = models.ManyToManyField(
        'organizacion.Area',
        blank=True,
        related_name='identidades_alcance',
        verbose_name='Procesos Cubiertos',
        help_text='Áreas/procesos cubiertos por el Sistema Integrado de Gestión'
    )
    alcance_exclusiones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Exclusiones Generales',
        help_text='Exclusiones generales del sistema integrado (las exclusiones por norma se gestionan en AlcanceSistema)'
    )
    # =========================================================================
    # FIN CAMPOS DE ALCANCE
    # =========================================================================

    # Campos heredados de AuditModel: created_at, updated_at, created_by, updated_by
    # Campos heredados de SoftDeleteModel: is_active, deleted_at

    class Meta:
        db_table = 'identidad_corporate_identity'
        verbose_name = 'Identidad Corporativa'
        verbose_name_plural = 'Identidades Corporativas'
        ordering = ['-effective_date']

    def __str__(self):
        return f"Identidad Corporativa v{self.version} ({self.effective_date})"

    def save(self, *args, **kwargs):
        # Si se activa esta identidad, desactivar las demás de la misma empresa
        if self.is_active and self.empresa_id:
            CorporateIdentity.objects.filter(
                empresa_id=self.empresa_id
            ).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @property
    def is_signed(self):
        """
        Backward-compat: Siempre False.
        v4.0: La firma de políticas se gestiona desde Gestión Documental.
        """
        return False

    @classmethod
    def get_active(cls):
        """Obtiene la identidad corporativa activa"""
        return cls.objects.filter(is_active=True).first()


class CorporateValue(TimestampedModel, SoftDeleteModel, OrderedModel):
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
    # Campos heredados de TimestampedModel: created_at, updated_at
    # Campos heredados de SoftDeleteModel: is_active, deleted_at
    # Campos heredados de OrderedModel: orden

    class Meta:
        db_table = 'identidad_corporate_value'
        verbose_name = 'Valor Corporativo'
        verbose_name_plural = 'Valores Corporativos'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name


# =============================================================================
# NUEVOS MODELOS - Semana 4
# =============================================================================

class AlcanceSistema(AuditModel, SoftDeleteModel):
    """
    Alcance del Sistema de Gestión por norma ISO.

    Define el alcance de cada sistema de gestión implementado,
    incluyendo exclusiones justificadas y datos de certificación.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='alcances',
        verbose_name='Identidad Corporativa'
    )
    norma_iso = models.ForeignKey(
        'configuracion.NormaISO',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='alcances_sistema',
        verbose_name='Norma ISO',
        db_index=True
    )
    # DEPRECATED: Campo legacy para migración
    iso_standard_legacy = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='[DEPRECATED] Norma ISO (código)',
        db_index=True
    )
    scope = models.TextField(
        verbose_name='Alcance',
        help_text='Descripción del alcance del sistema de gestión'
    )
    exclusions = models.TextField(
        blank=True,
        null=True,
        verbose_name='Exclusiones',
        help_text='Requisitos excluidos del sistema (si aplica)'
    )
    exclusion_justification = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación de Exclusiones',
        help_text='Justificación de por qué se excluyen ciertos requisitos'
    )
    is_certified = models.BooleanField(
        default=False,
        verbose_name='¿Certificado?',
        db_index=True
    )
    certification_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Certificación'
    )
    certification_body = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Organismo Certificador',
        help_text='Nombre del ente certificador (ej: ICONTEC, Bureau Veritas)'
    )
    certificate_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Número de Certificado'
    )
    expiry_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha de vencimiento del certificado'
    )
    last_audit_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Última Auditoría'
    )
    next_audit_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Próxima Auditoría'
    )
    certificate_file = models.FileField(
        upload_to='certificates/',
        blank=True,
        null=True,
        verbose_name='Archivo del Certificado'
    )

    class Meta:
        db_table = 'identidad_alcance_sistema'
        verbose_name = 'Alcance del Sistema'
        verbose_name_plural = 'Alcances del Sistema'
        ordering = ['norma_iso__orden', 'norma_iso__code']
        unique_together = [['identity', 'norma_iso']]
        indexes = [
            models.Index(fields=['is_certified'], name='alcance_cert_idx'),
        ]

    def __str__(self):
        cert_status = "✓" if self.is_certified else "○"
        norma_str = self.norma_iso.short_name if self.norma_iso else 'Sin Norma'
        return f"{cert_status} {norma_str}"

    @property
    def is_certificate_valid(self):
        """Verifica si el certificado está vigente"""
        if not self.is_certified or not self.expiry_date:
            return False
        return self.expiry_date >= timezone.now().date()

    @property
    def days_until_expiry(self):
        """Días hasta el vencimiento del certificado"""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - timezone.now().date()
        return delta.days



# =============================================================================
# NOTA v4.0: PoliticaEspecifica ELIMINADA
# =============================================================================
# Las políticas se gestionan exclusivamente desde Gestión Documental
# (tipo_documento=POL). Identidad Corporativa solo muestra políticas vigentes
# como referencia read-only.
# =============================================================================
