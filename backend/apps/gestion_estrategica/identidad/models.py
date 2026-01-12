"""
Modelos del módulo Identidad Corporativa - Dirección Estratégica

Secciones: mision_vision, valores, politica, alcances, politicas_especificas

Modelos:
- CorporateIdentity: Identidad corporativa (misión, visión, política integral)
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión por norma ISO
- PoliticaIntegral: Versiones de la política integral con firma digital
- PoliticaEspecifica: Políticas específicas por área/módulo
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel, OrderedModel


# =============================================================================
# CHOICES TÉCNICOS (estados de workflow - fijos)
# =============================================================================

POLICY_STATUS_CHOICES = [
    ('BORRADOR', 'Borrador'),
    ('EN_REVISION', 'En Revisión'),
    ('FIRMADO', 'Firmado'),  # Nuevo: Listo para enviar a Gestor Documental
    ('VIGENTE', 'Vigente'),
    ('OBSOLETO', 'Obsoleto'),
]


class CorporateIdentity(AuditModel, SoftDeleteModel):
    """
    Identidad Corporativa - Misión, Visión, Política Integral

    Solo puede existir un registro activo por empresa (multi-tenant).
    Permite firma digital de la Política Integral.

    NOTA SOBRE POLÍTICA INTEGRAL:
    =============================
    Este modelo contiene campos DEPRECADOS relacionados con la política integral:
    - integral_policy (TextField)
    - policy_signed_by, policy_signed_at, policy_signature_hash

    ENFOQUE CORRECTO (Enterprise):
    El modelo `PoliticaIntegral` (relacionado via FK `politicas_integrales`) es el
    enfoque correcto para gestionar la política integral porque soporta:
    - Versionamiento de políticas
    - Workflow de estados (BORRADOR -> EN_REVISION -> VIGENTE -> OBSOLETO)
    - Historial completo de versiones anteriores
    - Firma digital independiente por versión
    - Fechas de vigencia, expiración y revisión
    - Control de cambios con justificación
    - Normas ISO aplicables por versión
    - Archivos PDF adjuntos

    ESTRATEGIA DE MIGRACIÓN:
    1. Nuevas implementaciones deben usar PoliticaIntegral
    2. Los campos deprecados se mantienen por compatibilidad con datos existentes
    3. El método get_current_integral_policy() debe usarse para obtener la política vigente
    4. Los campos deprecados serán removidos en una versión futura (v3.0)

    USO RECOMENDADO:
    - Para obtener la política vigente: identity.politicas_integrales.filter(status='VIGENTE').first()
    - O usar: PoliticaIntegral.get_current(identity)
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

    # =========================================================================
    # CAMPOS DEPRECADOS - Política Integral
    # =========================================================================
    # DEPRECATED desde v2.0: Usar el modelo PoliticaIntegral en su lugar.
    # Estos campos se mantienen por compatibilidad con datos existentes.
    # Serán removidos en v3.0.
    # Ver: identity.politicas_integrales (relación con PoliticaIntegral)
    # =========================================================================
    integral_policy = models.TextField(
        verbose_name='[DEPRECATED] Política Integral',
        help_text='DEPRECATED: Usar modelo PoliticaIntegral. Campo legacy para migración.',
        blank=True,
        default=''
    )
    policy_signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='policies_signed',
        verbose_name='[DEPRECATED] Firmada por',
        help_text='DEPRECATED: Usar PoliticaIntegral.signed_by'
    )
    policy_signed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='[DEPRECATED] Fecha de firma',
        help_text='DEPRECATED: Usar PoliticaIntegral.signed_at'
    )
    policy_signature_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='[DEPRECATED] Hash de firma',
        help_text='DEPRECATED: Usar PoliticaIntegral.signature_hash'
    )
    # =========================================================================
    # FIN CAMPOS DEPRECADOS
    # =========================================================================
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

    def sign_policy(self, user):
        """
        DEPRECATED: Firma digitalmente la política integral.

        Este método está DEPRECADO. Usar PoliticaIntegral.sign() en su lugar.
        Se mantiene por compatibilidad con implementaciones existentes.

        Uso recomendado:
            politica = PoliticaIntegral.get_current(identity)
            politica.sign(user)
        """
        import warnings
        warnings.warn(
            "CorporateIdentity.sign_policy() está deprecado. "
            "Usar PoliticaIntegral.sign() en su lugar.",
            DeprecationWarning,
            stacklevel=2
        )
        import hashlib
        content = f"{self.integral_policy}|{user.id}|{timezone.now().isoformat()}"
        self.policy_signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.policy_signed_by = user
        self.policy_signed_at = timezone.now()
        self.save(update_fields=['policy_signature_hash', 'policy_signed_by', 'policy_signed_at'])

    @property
    def is_signed(self):
        """
        DEPRECATED: Verifica si la política está firmada (campo legacy).

        Para verificar firma de la política vigente, usar:
            politica = PoliticaIntegral.get_current(identity)
            politica.is_signed if politica else False
        """
        return self.policy_signed_by is not None and self.policy_signature_hash is not None

    def get_current_integral_policy(self):
        """
        Obtiene la política integral vigente desde el modelo PoliticaIntegral.

        Este es el método RECOMENDADO para obtener la política integral.
        Retorna la instancia de PoliticaIntegral vigente o None.

        Returns:
            PoliticaIntegral | None: La política integral vigente actual
        """
        return self.politicas_integrales.filter(
            status='VIGENTE',
            is_active=True
        ).first()

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


class PoliticaIntegral(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Política Integral con versionamiento y firma digital.

    Gestiona las diferentes versiones de la política integral,
    permitiendo trazabilidad histórica y firma electrónica.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='politicas_integrales',
        verbose_name='Identidad Corporativa'
    )
    version = models.CharField(
        max_length=20,
        verbose_name='Versión',
        help_text='Versión de la política (ej: 1.0, 2.1)'
    )
    title = models.CharField(
        max_length=200,
        default='Política Integral del Sistema de Gestión',
        verbose_name='Título'
    )
    content = models.TextField(
        verbose_name='Contenido',
        help_text='Texto completo de la política integral'
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
    expiry_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Vencimiento'
    )
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='politicas_firmadas',
        verbose_name='Firmada por'
    )
    signed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Firma'
    )
    signature_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Hash de Firma',
        help_text='Hash SHA-256 de la firma digital'
    )
    applicable_standards = models.JSONField(
        default=list,
        verbose_name='Normas Aplicables',
        help_text='Lista de normas ISO que cubre esta política'
    )
    document_file = models.FileField(
        upload_to='policies/integral/',
        blank=True,
        null=True,
        verbose_name='Documento PDF'
    )
    change_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo del Cambio',
        help_text='Razón del cambio respecto a la versión anterior'
    )
    review_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Revisión',
        help_text='Próxima fecha de revisión programada'
    )

    class Meta:
        db_table = 'identidad_politica_integral'
        verbose_name = 'Política Integral'
        verbose_name_plural = 'Políticas Integrales'
        ordering = ['-version']
        unique_together = [['identity', 'version']]
        indexes = [
            models.Index(fields=['status', 'is_active'], name='pol_int_status_idx'),
        ]

    def __str__(self):
        return f"Política Integral v{self.version} - {self.get_status_display()}"

    def sign(self, user):
        """Firma digitalmente la política"""
        import hashlib
        content = f"{self.content}|{user.id}|{timezone.now().isoformat()}"
        self.signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.signed_by = user
        self.signed_at = timezone.now()
        self.save(update_fields=['signature_hash', 'signed_by', 'signed_at', 'updated_at'])

    def publish(self, user):
        """Publica la política (cambia a VIGENTE y obsoleta las anteriores)"""
        if self.status != 'BORRADOR' and self.status != 'EN_REVISION':
            raise ValueError("Solo se pueden publicar políticas en borrador o en revisión")

        # Obsoleta las políticas vigentes anteriores
        PoliticaIntegral.objects.filter(
            identity=self.identity,
            status='VIGENTE'
        ).update(status='OBSOLETO')

        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.updated_by = user
        self.save()

    @property
    def is_signed(self):
        """Verifica si la política está firmada"""
        return self.signed_by is not None and self.signature_hash is not None

    @classmethod
    def get_current(cls, identity):
        """Obtiene la política vigente actual"""
        return cls.objects.filter(
            identity=identity,
            status='VIGENTE',
            is_active=True
        ).first()


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

    class Meta:
        db_table = 'identidad_politica_especifica'
        verbose_name = 'Política Específica'
        verbose_name_plural = 'Políticas Específicas'
        ordering = ['norma_iso__orden', 'orden', 'code']
        unique_together = [['identity', 'code']]
        indexes = [
            models.Index(fields=['status'], name='pol_esp_status_idx'),
            models.Index(fields=['area', 'is_active'], name='pol_esp_area_active_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.title}"

    def approve(self, user):
        """Aprueba la política"""
        self.approved_by = user
        self.approved_at = timezone.now()
        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.updated_by = user
        self.save()

    @property
    def needs_review(self):
        """Indica si la política necesita revisión"""
        if not self.review_date:
            return False
        return self.review_date <= timezone.now().date()
