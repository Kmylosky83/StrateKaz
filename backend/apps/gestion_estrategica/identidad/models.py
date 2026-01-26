"""
Modelos del módulo Identidad Corporativa - Dirección Estratégica v3.1

Secciones: mision_vision, valores, politica, alcances, politicas

Modelos:
- CorporateIdentity: Identidad corporativa (misión, visión)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión por norma ISO
- PoliticaEspecifica: Políticas (integrales con is_integral_policy=True, específicas por área)

NOTA v3.1: PoliticaIntegral ha sido eliminado y consolidado en PoliticaEspecifica.
Las políticas integrales se identifican con is_integral_policy=True.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel, OrderedModel


# =============================================================================
# CHOICES TÉCNICOS (estados de workflow simplificado)
# =============================================================================
# El flujo de firmas y codificación se maneja en Gestor Documental.
# Identidad solo crea políticas y recibe callbacks de estado.
# =============================================================================

POLICY_STATUS_CHOICES = [
    ('BORRADOR', 'Borrador'),           # Editable en Identidad
    ('EN_GESTION', 'En Gestión'),       # Enviado a Gestor Documental (no editable)
    ('VIGENTE', 'Vigente'),             # Publicado (callback desde Gestor Documental)
    ('OBSOLETO', 'Obsoleto'),           # Versión anterior reemplazada
]


class CorporateIdentity(AuditModel, SoftDeleteModel):
    """
    Identidad Corporativa - Misión, Visión

    Solo puede existir un registro activo por empresa (multi-tenant).

    v4.0: Campos legacy de política integral eliminados.
    Las políticas integrales se gestionan en PoliticaEspecifica con is_integral_policy=True.

    Para obtener la política integral vigente:
        PoliticaEspecifica.get_integral_vigente(identity)
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

    def get_current_integral_policy(self):
        """
        Obtiene la política integral vigente desde PoliticaEspecifica.

        v3.1: Este método ahora usa PoliticaEspecifica con is_integral_policy=True.

        Returns:
            PoliticaEspecifica | None: La política integral vigente actual
        """
        return PoliticaEspecifica.get_integral_vigente(self)

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
# NOTA v3.1: PoliticaIntegral ha sido eliminado y consolidado en PoliticaEspecifica.
# Las políticas integrales se identifican con is_integral_policy=True.
# Ver migración 0010_consolidate_politicas.py para detalles de la migración.
# =============================================================================


class PoliticaEspecifica(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Políticas Específicas por área o módulo.

    Define políticas particulares para áreas funcionales o
    sistemas de gestión específicos.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='politicas_especificas',
        verbose_name='Identidad Corporativa'
    )
    norma_iso = models.ForeignKey(
        'configuracion.NormaISO',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='politicas_especificas',
        verbose_name='Norma ISO',
        db_index=True,
        help_text='Norma ISO a la que aplica esta política'
    )
    # DEPRECATED: Campo legacy para migración
    iso_standard_legacy = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='[DEPRECATED] Norma ISO (código)'
    )
    # Código oficial de la política
    # IMPORTANTE: Este campo es OPCIONAL y se llena DESPUÉS de que la política
    # es enviada al Gestor Documental. El código oficial (POL-SST-001, etc.)
    # es asignado por el Gestor Documental, no por Identidad.
    code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código',
        help_text='Código oficial asignado por Gestor Documental (ej: POL-SST-001). NULL hasta publicación.'
    )
    # Referencia al documento en Gestor Documental
    documento_id = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='ID Documento',
        help_text='ID del documento en Gestor Documental (referencia sin FK para evitar dependencia circular)'
    )
    title = models.CharField(
        max_length=200,
        verbose_name='Título',
        help_text='Título de la política'
    )
    content = models.TextField(
        verbose_name='Contenido',
        help_text='Texto completo de la política'
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='politicas',
        verbose_name='Área Responsable'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='politicas_responsable',
        verbose_name='Responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='politicas_cargo',
        verbose_name='Cargo Responsable'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión'
    )
    status = models.CharField(
        max_length=20,
        choices=POLICY_STATUS_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
        db_index=True
    )
    effective_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Vigencia'
    )
    review_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Revisión',
        help_text='Próxima fecha de revisión programada'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='politicas_aprobadas',
        verbose_name='Aprobada por'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )
    document_file = models.FileField(
        upload_to='policies/specific/',
        blank=True,
        null=True,
        verbose_name='Documento PDF'
    )
    keywords = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Palabras Clave',
        help_text='Lista de tags para búsqueda'
    )

    # =========================================================================
    # CAMPOS PARA CONSOLIDACIÓN CON PoliticaIntegral
    # Agregados en v3.1 para unificar el modelo de políticas
    # =========================================================================
    signature_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Hash de Firma',
        help_text='Hash SHA-256 de la firma digital'
    )
    expiry_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha en que la política deja de estar vigente'
    )
    change_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo del Cambio',
        help_text='Razón del cambio respecto a la versión anterior'
    )
    is_integral_policy = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Es Política Integral',
        help_text='Indica si es la política integral del sistema de gestión'
    )

    class Meta:
        db_table = 'identidad_politica_especifica'
        verbose_name = 'Política Específica'
        verbose_name_plural = 'Políticas Específicas'
        ordering = ['norma_iso__orden', 'orden', 'code']
        unique_together = [['identity', 'code']]
        indexes = [
            models.Index(fields=['status'], name='pol_esp_status_idx'),
            models.Index(fields=['area', 'is_active'], name='pol_esp_area_active_idx'),
            models.Index(fields=['is_integral_policy', 'status'], name='pol_esp_integral_status_idx'),
        ]

    def __str__(self):
        prefix = "[INTEGRAL] " if self.is_integral_policy else ""
        return f"{prefix}{self.code or 'Sin código'} - {self.title}"

    def approve(self, user):
        """Aprueba la política (para políticas específicas)"""
        self.approved_by = user
        self.approved_at = timezone.now()
        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.updated_by = user
        self.save()

    def sign(self, user):
        """
        Firma digitalmente la política (para políticas integrales).

        Genera un hash SHA-256 del contenido + usuario + timestamp
        para garantizar la integridad y no repudio de la firma.
        """
        import hashlib
        content = f"{self.content}|{user.id}|{timezone.now().isoformat()}"
        self.signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.approved_by = user
        self.approved_at = timezone.now()
        self.updated_by = user
        self.save(update_fields=[
            'signature_hash', 'approved_by', 'approved_at', 'updated_by', 'updated_at'
        ])

    def publish(self, user):
        """
        Publica la política (cambia a VIGENTE).

        Para políticas integrales: obsoleta las versiones vigentes anteriores.
        Para políticas específicas: comportamiento estándar.
        """
        if self.status not in ['BORRADOR', 'EN_REVISION', 'FIRMADO']:
            raise ValueError(
                f"Solo se pueden publicar políticas en BORRADOR, EN_REVISION o FIRMADO. "
                f"Estado actual: {self.status}"
            )

        # Si es política integral, obsoleta las anteriores
        if self.is_integral_policy:
            PoliticaEspecifica.objects.filter(
                identity=self.identity,
                is_integral_policy=True,
                status='VIGENTE'
            ).exclude(pk=self.pk).update(status='OBSOLETO')

        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.updated_by = user
        self.save()

    @property
    def is_signed(self):
        """Verifica si la política está firmada digitalmente"""
        return self.approved_by is not None and self.signature_hash is not None

    @property
    def needs_review(self):
        """Indica si la política necesita revisión"""
        if not self.review_date:
            return False
        return self.review_date <= timezone.now().date()

    @classmethod
    def get_integral_vigente(cls, identity):
        """
        Obtiene la política integral vigente de una identidad corporativa.

        Args:
            identity: Instancia de CorporateIdentity

        Returns:
            PoliticaEspecifica | None: La política integral vigente o None
        """
        return cls.objects.filter(
            identity=identity,
            is_integral_policy=True,
            status='VIGENTE',
            is_active=True
        ).first()


# =============================================================================
# NOTA: El flujo de firmas se maneja en Gestor Documental
# =============================================================================
# El modelo FirmaPolitica fue eliminado. Las políticas se crean aquí en estado
# BORRADOR y se envían al Gestor Documental para el proceso de firma,
# codificación y publicación. El estado se sincroniza via callback.
# =============================================================================
