"""
Sistema de Workflow de Firmas Digitales y Revisión Periódica para Políticas
============================================================================

CUMPLIMIENTO NORMATIVO:
- ISO 9001:2015 (Cláusula 5.2 - Política de Calidad)
- ISO 45001:2018 (Cláusula 5.2 - Política de SST)
- Decreto 1072/2015 Colombia (Art. 2.2.4.6.5 - Política SST)

FUNCIONALIDADES:
1. Firma digital múltiple con orden secuencial/paralelo
2. Almacenamiento seguro de firmas manuscritas (canvas signature)
3. Verificación de integridad SHA-256
4. Ciclo de revisión periódica automatizado
5. Versionamiento semántico automático
6. Historial completo de cambios
7. Delegación de firma
8. Alertas automáticas de vencimiento
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models import Q, Max
import hashlib
import json
from datetime import timedelta
from decimal import Decimal

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel


# =============================================================================
# CHOICES - ESTADOS Y CONFIGURACIONES
# =============================================================================

FIRMA_ROL_CHOICES = [
    ('ELABORO', 'Elaboró'),
    ('REVISO', 'Revisó'),
    ('APROBO', 'Aprobó'),
    ('VALIDO', 'Validó'),
    ('AUTORIZO', 'Autorizó'),
]

FIRMA_STATUS_CHOICES = [
    ('PENDIENTE', 'Pendiente'),
    ('FIRMADO', 'Firmado'),
    ('RECHAZADO', 'Rechazado'),
    ('DELEGADO', 'Delegado'),
    ('VENCIDO', 'Vencido'),
]

TIPO_ORDEN_FIRMA_CHOICES = [
    ('SECUENCIAL', 'Secuencial'),  # Orden obligatorio
    ('PARALELO', 'Paralelo'),      # Sin orden específico
]

FRECUENCIA_REVISION_CHOICES = [
    ('ANUAL', 'Anual - 12 meses'),
    ('SEMESTRAL', 'Semestral - 6 meses'),
    ('TRIMESTRAL', 'Trimestral - 3 meses'),
    ('BIANUAL', 'Bianual - 24 meses'),
    ('PERSONALIZADO', 'Personalizado'),
]

TIPO_REVISION_CHOICES = [
    ('RENOVACION', 'Renovación'),         # Mantiene versión, actualiza vigencia
    ('NUEVA_VERSION', 'Nueva Versión'),   # Incrementa versión
    ('REVISION_MAYOR', 'Revisión Mayor'), # Incrementa major (1.0 → 2.0)
]

ESTADO_REVISION_CHOICES = [
    ('VIGENTE', 'Vigente'),
    ('PROXIMO_VENCIMIENTO', 'Próximo a Vencer'),  # 30 días antes
    ('VENCIDA', 'Vencida'),
    ('EN_REVISION', 'En Revisión'),
]


# =============================================================================
# MODELO: FIRMA DIGITAL MANUSCRITA (REUTILIZABLE - GENERIC)
# =============================================================================

class FirmaDigital(AuditModel, SoftDeleteModel):
    """
    Firma digital manuscrita reutilizable para cualquier documento.

    Usa GenericForeignKey para asociarse a PoliticaIntegral, PoliticaEspecifica,
    o cualquier otro documento que requiera firma.

    CARACTERÍSTICAS:
    - Firma manuscrita en formato base64 (canvas signature)
    - Hash SHA-256 para verificación de integridad
    - Metadatos: rol, orden, IP, navegador
    - Soporte para firma secuencial y paralela
    - Delegación de firma
    - Historial de intentos y rechazos

    CUMPLIMIENTO:
    - ISO 9001: Control de documentos (Cláusula 7.5)
    - ISO 45001: Documentación del SGSST
    - Decreto 1072: Trazabilidad de políticas SST
    """

    # Generic relationship - puede firmar cualquier documento
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento',
        help_text='Tipo de documento firmado (PoliticaIntegral, PoliticaEspecifica, etc.)'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del Documento'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Información del firmante
    firmante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='firmas_identidad',
        verbose_name='Firmante',
        db_index=True
    )
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_cargo',
        verbose_name='Cargo al momento de firmar',
        help_text='Cargo que tenía el firmante al momento de firmar'
    )
    rol_firma = models.CharField(
        max_length=20,
        choices=FIRMA_ROL_CHOICES,
        verbose_name='Rol en la Firma',
        help_text='Rol del firmante (Elaboró, Revisó, Aprobó)',
        db_index=True
    )
    orden_firma = models.PositiveSmallIntegerField(
        default=1,
        verbose_name='Orden de Firma',
        help_text='Orden en que debe firmar (1=primero). 0 si es paralelo'
    )

    # Firma manuscrita
    firma_manuscrita = models.TextField(
        verbose_name='Firma Manuscrita',
        help_text='Firma en formato base64 (canvas signature)',
        blank=True,
        null=True
    )
    firma_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Hash SHA-256',
        help_text='Hash de verificación de integridad'
    )

    # Estado y fechas
    status = models.CharField(
        max_length=20,
        choices=FIRMA_STATUS_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado',
        db_index=True
    )
    fecha_firma = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Firma',
        db_index=True
    )
    fecha_vencimiento = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha límite para firmar'
    )

    # Comentarios y observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Comentarios del firmante'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Rechazo',
        help_text='Razón del rechazo (si aplica)'
    )

    # Delegación
    delegado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delegaciones_otorgadas',
        verbose_name='Delegado por',
        help_text='Usuario que delegó la firma'
    )
    fecha_delegacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Delegación'
    )
    motivo_delegacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Delegación'
    )

    # Metadatos de trazabilidad
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP',
        help_text='IP desde donde se firmó'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='Navegador',
        help_text='User agent del navegador'
    )
    geolocation = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Geolocalización',
        help_text='Coordenadas GPS si están disponibles'
    )

    # Campos de auditoría heredados: created_at, updated_at, created_by, updated_by

    class Meta:
        db_table = 'identidad_firma_digital'
        verbose_name = 'Firma Digital'
        verbose_name_plural = 'Firmas Digitales'
        ordering = ['orden_firma', 'created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='firma_content_idx'),
            models.Index(fields=['firmante', 'status'], name='firma_firmante_status_idx'),
            models.Index(fields=['status', 'fecha_vencimiento'], name='firma_vencimiento_idx'),
        ]
        unique_together = [
            ['content_type', 'object_id', 'firmante', 'rol_firma'],  # Un rol por persona por documento
        ]

    def __str__(self):
        return f"{self.get_rol_firma_display()} - {self.firmante.get_full_name()} [{self.get_status_display()}]"

    def clean(self):
        """Validaciones del modelo"""
        # Si está firmado, debe tener firma manuscrita y fecha
        if self.status == 'FIRMADO':
            if not self.firma_manuscrita:
                raise ValidationError("La firma manuscrita es obligatoria para estado FIRMADO")
            if not self.fecha_firma:
                raise ValidationError("La fecha de firma es obligatoria para estado FIRMADO")

        # Si está rechazado, debe tener motivo
        if self.status == 'RECHAZADO' and not self.motivo_rechazo:
            raise ValidationError("El motivo de rechazo es obligatorio para estado RECHAZADO")

        # Si está delegado, debe tener delegado_por
        if self.status == 'DELEGADO' and not self.delegado_por:
            raise ValidationError("Debe especificar quién delegó la firma")

    def generar_hash(self):
        """
        Genera hash SHA-256 de la firma para verificación de integridad.

        Incluye:
        - Contenido de la firma manuscrita
        - ID del firmante
        - Timestamp (fecha_firma para idempotencia)
        - Rol de firma
        - Content type y object id
        """
        if not self.firma_manuscrita:
            raise ValueError("No hay firma manuscrita para generar hash")

        # Usar fecha_firma en lugar de timezone.now() para que el hash sea verificable
        timestamp = self.fecha_firma.isoformat() if self.fecha_firma else timezone.now().isoformat()
        content = f"{self.firma_manuscrita}|{self.firmante.id}|{timestamp}|{self.rol_firma}|{self.content_type.id}|{self.object_id}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def firmar(self, firma_base64, ip_address=None, user_agent=None, geolocation=None, observaciones=None):
        """
        Registra la firma del usuario.

        Args:
            firma_base64: Firma manuscrita en formato base64
            ip_address: IP del firmante
            user_agent: Navegador del firmante
            geolocation: Coordenadas GPS (dict con lat, lng)
            observaciones: Comentarios opcionales
        """
        if self.status not in ['PENDIENTE', 'DELEGADO']:
            raise ValidationError(f"No se puede firmar. Estado actual: {self.get_status_display()}")

        # Verificar si es su turno (en firmas secuenciales)
        if not self.es_mi_turno():
            raise ValidationError("Aún no es su turno para firmar (firma secuencial)")

        self.firma_manuscrita = firma_base64
        self.firma_hash = self.generar_hash()
        self.status = 'FIRMADO'
        self.fecha_firma = timezone.now()
        self.observaciones = observaciones
        self.ip_address = ip_address
        self.user_agent = user_agent
        if geolocation:
            self.geolocation = geolocation

        self.save()

        # Notificar al siguiente firmante (si es secuencial)
        self.notificar_siguiente_firmante()

    def rechazar(self, motivo, rechazado_por=None):
        """
        Rechaza la firma del documento.

        Args:
            motivo: Razón del rechazo
            rechazado_por: Usuario que rechaza (puede ser el mismo firmante o un supervisor)
        """
        self.status = 'RECHAZADO'
        self.motivo_rechazo = motivo
        self.fecha_firma = timezone.now()
        if rechazado_por:
            self.updated_by = rechazado_por
        self.save()

        # Notificar a creador del documento
        self.notificar_rechazo()

    def delegar(self, nuevo_firmante, motivo, delegado_por):
        """
        Delega la firma a otro usuario.

        Args:
            nuevo_firmante: Usuario que recibirá la delegación
            motivo: Razón de la delegación
            delegado_por: Usuario que delega (debe ser el firmante actual)
        """
        if delegado_por.id != self.firmante.id:
            raise ValidationError("Solo el firmante asignado puede delegar")

        if self.status != 'PENDIENTE':
            raise ValidationError(f"No se puede delegar. Estado actual: {self.get_status_display()}")

        # Actualizar firmante
        self.delegado_por = self.firmante
        self.firmante = nuevo_firmante
        self.status = 'DELEGADO'
        self.motivo_delegacion = motivo
        self.fecha_delegacion = timezone.now()
        self.updated_by = delegado_por
        self.save()

        # Notificar al nuevo firmante
        self.notificar_delegacion()

    def es_mi_turno(self):
        """
        Verifica si es el turno del firmante (para firmas secuenciales).

        En firmas paralelas (orden_firma=0), siempre es el turno.
        En firmas secuenciales, verifica que los anteriores hayan firmado.
        """
        # Si es firma paralela, siempre es su turno
        if self.orden_firma == 0:
            return True

        # Verificar que todas las firmas anteriores estén completadas
        firmas_anteriores = FirmaDigital.objects.filter(
            content_type=self.content_type,
            object_id=self.object_id,
            orden_firma__lt=self.orden_firma,
            orden_firma__gt=0  # Solo considerar firmas secuenciales
        )

        return not firmas_anteriores.exclude(status='FIRMADO').exists()

    @property
    def esta_vencida(self):
        """Verifica si la firma está vencida"""
        if not self.fecha_vencimiento:
            return False
        return timezone.now() > self.fecha_vencimiento

    def verificar_integridad(self):
        """
        Verifica la integridad de la firma comparando el hash.

        Returns:
            bool: True si la firma es íntegra, False si fue alterada
        """
        if not self.firma_manuscrita:
            return False

        hash_calculado = self.generar_hash()
        return hash_calculado == self.firma_hash

    def notificar_siguiente_firmante(self):
        """Notifica al siguiente firmante en la secuencia"""
        # Buscar siguiente firma pendiente
        siguiente = FirmaDigital.objects.filter(
            content_type=self.content_type,
            object_id=self.object_id,
            orden_firma=self.orden_firma + 1,
            status='PENDIENTE'
        ).first()

        if siguiente:
            from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
            enviar_notificacion(
                destinatario=siguiente.firmante,
                tipo='FIRMA_REQUERIDA',
                asunto=f'Documento requiere su firma: {siguiente.get_rol_firma_display()}',
                mensaje=f'El documento está listo para su firma como {siguiente.get_rol_firma_display()}.',
                link=f'/gestion-estrategica/identidad/politicas/{self.object_id}',
                prioridad='ALTA'
            )

    def notificar_rechazo(self):
        """Notifica al creador del documento sobre el rechazo"""
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
        documento = self.content_object
        if hasattr(documento, 'created_by') and documento.created_by:
            enviar_notificacion(
                destinatario=documento.created_by,
                tipo='FIRMA_RECHAZADA',
                asunto=f'Documento rechazado en firma: {self.get_rol_firma_display()}',
                mensaje=f'El documento fue rechazado por {self.firmante.get_full_name()}. Motivo: {self.motivo_rechazo}',
                link=f'/gestion-estrategica/identidad/politicas/{self.object_id}',
                prioridad='ALTA'
            )

    def notificar_delegacion(self):
        """Notifica al nuevo firmante sobre la delegación"""
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
        enviar_notificacion(
            destinatario=self.firmante,
            tipo='FIRMA_DELEGADA',
            asunto=f'Firma delegada: {self.get_rol_firma_display()}',
            mensaje=f'Se le ha delegado la firma como {self.get_rol_firma_display()}. Delegado por: {self.delegado_por.get_full_name()}.',
            link=f'/gestion-estrategica/identidad/politicas/{self.object_id}',
            prioridad='ALTA'
        )


# =============================================================================
# MODELO: CONFIGURACIÓN DE REVISIÓN PERIÓDICA
# =============================================================================

class ConfiguracionRevision(AuditModel, SoftDeleteModel):
    """
    Configuración del ciclo de revisión periódica para políticas.

    Define la frecuencia y comportamiento de las revisiones periódicas
    de políticas según normativa ISO y Decreto 1072.

    CUMPLIMIENTO:
    - ISO 9001: Revisión periódica de política de calidad
    - ISO 45001: Revisión anual mínima de política SST
    - Decreto 1072: Revisión anual de SG-SST

    CARACTERÍSTICAS:
    - Frecuencias predefinidas (anual, semestral, trimestral)
    - Frecuencia personalizada (días específicos)
    - Alertas configurables (30, 15, 7 días antes)
    - Renovación vs nueva versión
    - Responsables de revisión
    """

    # Generic relationship - aplica a cualquier tipo de política
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del Documento'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Configuración de frecuencia
    frecuencia = models.CharField(
        max_length=20,
        choices=FRECUENCIA_REVISION_CHOICES,
        default='ANUAL',
        verbose_name='Frecuencia de Revisión',
        db_index=True
    )
    dias_personalizados = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Días (Personalizado)',
        help_text='Número de días para frecuencia personalizada'
    )

    # Comportamiento de revisión
    tipo_revision = models.CharField(
        max_length=20,
        choices=TIPO_REVISION_CHOICES,
        default='RENOVACION',
        verbose_name='Tipo de Revisión',
        help_text='Si crea nueva versión o solo renueva vigencia'
    )
    auto_renovar = models.BooleanField(
        default=False,
        verbose_name='Auto-renovar',
        help_text='Renovar automáticamente si no hay cambios'
    )

    # Responsables
    responsable_revision = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisiones_responsable',
        verbose_name='Responsable de Revisión'
    )
    cargo_responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisiones_cargo',
        verbose_name='Cargo Responsable',
        help_text='Cargo responsable de la revisión (si no hay persona asignada)'
    )

    # Alertas
    alertas_dias_previos = models.JSONField(
        default=list,
        verbose_name='Alertas (días previos)',
        help_text='Lista de días antes del vencimiento para enviar alertas. Ej: [30, 15, 7]'
    )
    alertar_creador = models.BooleanField(
        default=True,
        verbose_name='Alertar a Creador'
    )
    alertar_responsable = models.BooleanField(
        default=True,
        verbose_name='Alertar a Responsable'
    )
    destinatarios_adicionales = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='revisiones_alertas',
        verbose_name='Destinatarios Adicionales',
        help_text='Usuarios adicionales que recibirán alertas'
    )

    # Fechas de revisión
    ultima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Revisión',
        db_index=True
    )
    proxima_revision = models.DateField(
        verbose_name='Próxima Revisión',
        db_index=True,
        help_text='Fecha programada para la próxima revisión'
    )

    # Estado
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_REVISION_CHOICES,
        default='VIGENTE',
        verbose_name='Estado',
        db_index=True
    )

    # Control
    habilitado = models.BooleanField(
        default=True,
        verbose_name='Habilitado',
        help_text='Si la revisión periódica está activa'
    )

    class Meta:
        db_table = 'identidad_configuracion_revision'
        verbose_name = 'Configuración de Revisión'
        verbose_name_plural = 'Configuraciones de Revisión'
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='config_rev_content_idx'),
            models.Index(fields=['estado', 'proxima_revision'], name='config_rev_estado_fecha_idx'),
            models.Index(fields=['habilitado', 'proxima_revision'], name='config_rev_habilitado_idx'),
        ]
        unique_together = [
            ['content_type', 'object_id'],  # Una configuración por documento
        ]

    def __str__(self):
        return f"Revisión {self.get_frecuencia_display()} - Próx: {self.proxima_revision}"

    def clean(self):
        """Validaciones del modelo"""
        if self.frecuencia == 'PERSONALIZADO' and not self.dias_personalizados:
            raise ValidationError("Debe especificar los días para frecuencia personalizada")

        if self.frecuencia != 'PERSONALIZADO' and self.dias_personalizados:
            raise ValidationError("Los días personalizados solo aplican para frecuencia PERSONALIZADO")

    def calcular_proxima_revision(self, desde=None):
        """
        Calcula la fecha de la próxima revisión.

        Args:
            desde: Fecha desde la cual calcular (default: hoy)

        Returns:
            date: Fecha de la próxima revisión
        """
        if desde is None:
            desde = timezone.now().date()

        dias_map = {
            'ANUAL': 365,
            'SEMESTRAL': 182,
            'TRIMESTRAL': 91,
            'BIANUAL': 730,
        }

        if self.frecuencia == 'PERSONALIZADO':
            dias = self.dias_personalizados
        else:
            dias = dias_map.get(self.frecuencia, 365)

        return desde + timedelta(days=dias)

    def actualizar_proxima_revision(self):
        """Actualiza la fecha de próxima revisión y el estado"""
        self.ultima_revision = timezone.now().date()
        self.proxima_revision = self.calcular_proxima_revision()
        self.estado = 'VIGENTE'
        self.save(update_fields=['ultima_revision', 'proxima_revision', 'estado', 'updated_at'])

    def verificar_estado(self):
        """
        Verifica y actualiza el estado según la fecha de revisión.

        Estados:
        - VIGENTE: Más de 30 días para revisión
        - PROXIMO_VENCIMIENTO: Entre 1-30 días para revisión
        - VENCIDA: Fecha de revisión pasada
        - EN_REVISION: Proceso de revisión iniciado
        """
        if not self.habilitado:
            return

        hoy = timezone.now().date()
        dias_restantes = (self.proxima_revision - hoy).days

        if self.estado == 'EN_REVISION':
            # No cambiar estado si está en revisión
            return

        if dias_restantes < 0:
            nuevo_estado = 'VENCIDA'
        elif dias_restantes <= 30:
            nuevo_estado = 'PROXIMO_VENCIMIENTO'
        else:
            nuevo_estado = 'VIGENTE'

        if self.estado != nuevo_estado:
            self.estado = nuevo_estado
            self.save(update_fields=['estado', 'updated_at'])

    def debe_enviar_alerta(self):
        """
        Verifica si debe enviar alerta según los días configurados.

        Returns:
            bool: True si debe enviar alerta hoy
        """
        if not self.habilitado or not self.alertas_dias_previos:
            return False

        hoy = timezone.now().date()
        dias_restantes = (self.proxima_revision - hoy).days

        return dias_restantes in self.alertas_dias_previos

    def enviar_alerta_revision(self):
        """Envía alertas de revisión a los responsables"""
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion

        hoy = timezone.now().date()
        dias_restantes = (self.proxima_revision - hoy).days

        documento = self.content_object
        destinatarios = []

        # Agregar responsable de revisión
        if self.alertar_responsable and self.responsable_revision:
            destinatarios.append(self.responsable_revision)

        # Agregar creador del documento
        if self.alertar_creador and hasattr(documento, 'created_by') and documento.created_by:
            destinatarios.append(documento.created_by)

        # Agregar destinatarios adicionales
        destinatarios.extend(self.destinatarios_adicionales.all())

        # Determinar prioridad según días restantes
        if dias_restantes <= 7:
            prioridad = 'CRITICA'
        elif dias_restantes <= 15:
            prioridad = 'ALTA'
        else:
            prioridad = 'MEDIA'

        # Enviar notificaciones
        for destinatario in set(destinatarios):  # set para evitar duplicados
            nombre_documento = str(documento)
            enviar_notificacion(
                destinatario=destinatario,
                tipo='REVISION_PROXIMA',
                asunto=f'Revisión de política próxima: {nombre_documento}',
                mensaje=f'La política "{nombre_documento}" requiere revisión en {dias_restantes} días (fecha: {self.proxima_revision}).',
                link=f'/gestion-estrategica/identidad/politicas/{self.object_id}',
                prioridad=prioridad
            )

    def iniciar_revision(self, iniciado_por):
        """
        Inicia el proceso de revisión de la política.

        Args:
            iniciado_por: Usuario que inicia la revisión
        """
        self.estado = 'EN_REVISION'
        self.updated_by = iniciado_por
        self.save(update_fields=['estado', 'updated_by', 'updated_at'])

        # Crear historial de revisión
        documento = self.content_object
        if hasattr(documento, 'crear_historial'):
            documento.crear_historial(
                tipo_cambio='INICIO_REVISION',
                usuario=iniciado_por,
                descripcion=f'Revisión periódica iniciada ({self.get_frecuencia_display()})'
            )


# =============================================================================
# MODELO: HISTORIAL DE VERSIONES
# =============================================================================

class HistorialVersion(TimestampedModel):
    """
    Historial completo de versiones de políticas.

    Registra todos los cambios realizados a las políticas, permitiendo:
    - Trazabilidad completa de cambios
    - Comparación entre versiones (diff)
    - Auditoría de modificaciones
    - Cumplimiento normativo (ISO 9001 Cláusula 7.5.3)

    CARACTERÍSTICAS:
    - Snapshot completo de cada versión
    - Diff automático entre versiones
    - Metadatos de cambio (usuario, fecha, motivo)
    - Relación con firmas digitales de la versión
    """

    # Generic relationship - aplica a cualquier tipo de política
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del Documento'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Versionamiento
    version_numero = models.CharField(
        max_length=20,
        verbose_name='Número de Versión',
        help_text='Versión semántica (ej: 1.0, 1.1, 2.0)',
        db_index=True
    )
    version_anterior = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Versión Anterior',
        help_text='Número de la versión anterior'
    )

    # Snapshot del contenido
    snapshot_data = models.JSONField(
        verbose_name='Snapshot de Datos',
        help_text='Copia completa de los datos de la política en esta versión'
    )

    # Información del cambio
    tipo_cambio = models.CharField(
        max_length=50,
        verbose_name='Tipo de Cambio',
        help_text='Tipo de cambio realizado (CREACION, MODIFICACION, REVISION, RENOVACION, etc.)',
        db_index=True
    )
    descripcion_cambio = models.TextField(
        verbose_name='Descripción del Cambio',
        help_text='Descripción detallada de los cambios realizados'
    )
    cambios_diff = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Diferencias',
        help_text='Diff detallado de cambios campo por campo'
    )

    # Usuario que realizó el cambio
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cambios_politicas',
        verbose_name='Usuario'
    )
    cargo_usuario = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_cambios_identidad',
        verbose_name='Cargo del Usuario',
        help_text='Cargo que tenía el usuario al momento del cambio'
    )

    # Metadatos
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='Navegador'
    )

    # Hash de versión (para verificar integridad)
    version_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Hash de Versión',
        help_text='Hash SHA-256 del snapshot'
    )

    class Meta:
        db_table = 'identidad_historial_version'
        verbose_name = 'Historial de Versión'
        verbose_name_plural = 'Historiales de Versiones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'version_numero'], name='hist_ver_content_idx'),
            models.Index(fields=['tipo_cambio', 'created_at'], name='hist_ver_tipo_fecha_idx'),
        ]

    def __str__(self):
        return f"v{self.version_numero} - {self.tipo_cambio} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    def save(self, *args, **kwargs):
        """Genera hash de versión antes de guardar"""
        if not self.version_hash:
            content = json.dumps(self.snapshot_data, sort_keys=True)
            self.version_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    @classmethod
    def crear_version(cls, documento, tipo_cambio, usuario, descripcion, version_numero=None, ip_address=None, user_agent=None):
        """
        Crea un nuevo registro en el historial de versiones.

        Args:
            documento: Instancia del documento (PoliticaIntegral, PoliticaEspecifica, etc.)
            tipo_cambio: Tipo de cambio (CREACION, MODIFICACION, etc.)
            usuario: Usuario que realiza el cambio
            descripcion: Descripción del cambio
            version_numero: Número de versión (si no se especifica, se obtiene del documento)
            ip_address: IP del usuario
            user_agent: Navegador del usuario

        Returns:
            HistorialVersion: Instancia creada
        """
        from django.core.serializers import serialize
        import json

        # Obtener versión anterior
        content_type = ContentType.objects.get_for_model(documento)
        ultima_version = cls.objects.filter(
            content_type=content_type,
            object_id=documento.id
        ).first()

        version_anterior = ultima_version.version_numero if ultima_version else None

        # Crear snapshot de datos actuales
        # Serializamos el objeto completo
        snapshot_data = json.loads(serialize('json', [documento]))[0]['fields']

        # Agregar ID y metadata
        snapshot_data['id'] = documento.id
        snapshot_data['_model'] = f"{documento._meta.app_label}.{documento._meta.model_name}"

        # Calcular diff si hay versión anterior
        cambios_diff = {}
        if ultima_version:
            cambios_diff = cls.calcular_diff(ultima_version.snapshot_data, snapshot_data)

        # Crear registro
        historial = cls.objects.create(
            content_type=content_type,
            object_id=documento.id,
            version_numero=version_numero or getattr(documento, 'version', '1.0'),
            version_anterior=version_anterior,
            snapshot_data=snapshot_data,
            tipo_cambio=tipo_cambio,
            descripcion_cambio=descripcion,
            cambios_diff=cambios_diff,
            usuario=usuario,
            cargo_usuario=usuario.cargo if hasattr(usuario, 'cargo') else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return historial

    @staticmethod
    def calcular_diff(version_anterior, version_actual):
        """
        Calcula las diferencias entre dos versiones.

        Args:
            version_anterior: Dict con datos de la versión anterior
            version_actual: Dict con datos de la versión actual

        Returns:
            dict: Diferencias encontradas
        """
        diferencias = {}

        # Campos a comparar
        for campo in version_actual.keys():
            valor_anterior = version_anterior.get(campo)
            valor_actual = version_actual.get(campo)

            if valor_anterior != valor_actual:
                diferencias[campo] = {
                    'anterior': valor_anterior,
                    'actual': valor_actual
                }

        # Campos eliminados
        for campo in version_anterior.keys():
            if campo not in version_actual:
                diferencias[campo] = {
                    'anterior': version_anterior[campo],
                    'actual': None,
                    'eliminado': True
                }

        return diferencias

    def obtener_version_anterior_obj(self):
        """Obtiene el objeto de la versión anterior"""
        if not self.version_anterior:
            return None

        return HistorialVersion.objects.filter(
            content_type=self.content_type,
            object_id=self.object_id,
            version_numero=self.version_anterior
        ).first()

    def restaurar_version(self, usuario):
        """
        Restaura el documento a esta versión.

        Args:
            usuario: Usuario que realiza la restauración

        Returns:
            bool: True si se restauró correctamente
        """
        documento = self.content_object
        if not documento:
            return False

        # Actualizar campos del documento con los datos del snapshot
        for campo, valor in self.snapshot_data.items():
            if campo not in ['id', '_model'] and hasattr(documento, campo):
                setattr(documento, campo, valor)

        # Incrementar versión
        if hasattr(documento, 'version'):
            documento.version = self.incrementar_version_minor(documento.version)

        documento.save()

        # Crear nuevo historial
        HistorialVersion.crear_version(
            documento=documento,
            tipo_cambio='RESTAURACION',
            usuario=usuario,
            descripcion=f'Restauración a versión {self.version_numero}'
        )

        return True

    @staticmethod
    def incrementar_version_minor(version_actual):
        """
        Incrementa la versión minor (1.0 → 1.1).

        Args:
            version_actual: String con versión actual (ej: '1.0')

        Returns:
            str: Nueva versión (ej: '1.1')
        """
        partes = version_actual.split('.')
        if len(partes) >= 2:
            major = int(partes[0])
            minor = int(partes[1])
            return f"{major}.{minor + 1}"
        return version_actual


# =============================================================================
# MODELO: CONFIGURACIÓN DE WORKFLOW DE FIRMAS
# =============================================================================

class ConfiguracionWorkflowFirma(AuditModel, SoftDeleteModel):
    """
    Configuración del workflow de firmas para un tipo de política.

    Define:
    - Roles requeridos para firmar (Elaboró, Revisó, Aprobó)
    - Orden de firmas (secuencial vs paralelo)
    - Usuarios o cargos asignados a cada rol
    - Tiempo máximo para firmar

    Permite templates reutilizables para diferentes tipos de políticas.
    """

    # Identificación
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre del Workflow',
        help_text='Nombre descriptivo (ej: Workflow Política SST, Workflow Política Calidad)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Tipo de política a la que aplica (opcional)
    tipo_politica = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tipo de Política',
        help_text='Tipo de política (INTEGRAL, ESPECIFICA, etc.)',
        db_index=True
    )

    # Configuración de orden
    tipo_orden = models.CharField(
        max_length=20,
        choices=TIPO_ORDEN_FIRMA_CHOICES,
        default='SECUENCIAL',
        verbose_name='Tipo de Orden'
    )

    # Días para completar firma
    dias_para_firmar = models.PositiveSmallIntegerField(
        default=5,
        verbose_name='Días para Firmar',
        help_text='Días máximos para completar la firma'
    )

    # Permitir delegación
    permitir_delegacion = models.BooleanField(
        default=True,
        verbose_name='Permitir Delegación'
    )

    # Configuración JSON con roles
    roles_config = models.JSONField(
        default=list,
        verbose_name='Configuración de Roles',
        help_text="""
        Lista de roles de firma con configuración:
        [
            {
                "rol": "ELABORO",
                "nombre": "Elaboró",
                "orden": 1,
                "obligatorio": true,
                "cargo_id": null,
                "usuario_id": null
            },
            ...
        ]
        """
    )

    # Estado
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo',
        db_index=True
    )

    class Meta:
        db_table = 'identidad_config_workflow_firma'
        verbose_name = 'Configuración de Workflow de Firma'
        verbose_name_plural = 'Configuraciones de Workflow de Firma'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['tipo_politica', 'activo'], name='config_wf_tipo_activo_idx'),
        ]

    def __str__(self):
        return self.nombre

    def crear_firmas_para_documento(self, documento, creado_por):
        """
        Crea las firmas requeridas para un documento según esta configuración.

        Args:
            documento: Instancia del documento (PoliticaIntegral, PoliticaEspecifica, etc.)
            creado_por: Usuario que crea el documento

        Returns:
            list: Lista de instancias FirmaDigital creadas
        """
        content_type = ContentType.objects.get_for_model(documento)
        fecha_vencimiento = timezone.now() + timedelta(days=self.dias_para_firmar)

        firmas_creadas = []

        for rol_config in self.roles_config:
            # Determinar firmante
            firmante = None
            cargo = None

            if rol_config.get('usuario_id'):
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    firmante = User.objects.get(id=rol_config['usuario_id'])
                except User.DoesNotExist:
                    pass

            if not firmante and rol_config.get('cargo_id'):
                from apps.core.models import Cargo
                try:
                    cargo = Cargo.objects.get(id=rol_config['cargo_id'])
                    # Buscar usuario con ese cargo
                    if hasattr(cargo, 'usuarios'):
                        firmante = cargo.usuarios.filter(is_active=True).first()
                except Cargo.DoesNotExist:
                    pass

            if not firmante:
                # Si no hay firmante asignado, no crear la firma
                continue

            # Crear firma
            firma = FirmaDigital.objects.create(
                content_type=content_type,
                object_id=documento.id,
                firmante=firmante,
                cargo=cargo or (firmante.cargo if hasattr(firmante, 'cargo') else None),
                rol_firma=rol_config['rol'],
                orden_firma=rol_config.get('orden', 0) if self.tipo_orden == 'SECUENCIAL' else 0,
                fecha_vencimiento=fecha_vencimiento,
                created_by=creado_por,
                updated_by=creado_por
            )

            firmas_creadas.append(firma)

        # Notificar al primer firmante (si es secuencial)
        if firmas_creadas and self.tipo_orden == 'SECUENCIAL':
            primera_firma = firmas_creadas[0]
            from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
            enviar_notificacion(
                destinatario=primera_firma.firmante,
                tipo='FIRMA_REQUERIDA',
                asunto=f'Documento requiere su firma: {primera_firma.get_rol_firma_display()}',
                mensaje=f'El documento está listo para su firma como {primera_firma.get_rol_firma_display()}.',
                link=f'/gestion-estrategica/identidad/politicas/{documento.id}',
                prioridad='ALTA'
            )
        elif firmas_creadas and self.tipo_orden == 'PARALELO':
            # Notificar a todos los firmantes
            from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
            for firma in firmas_creadas:
                enviar_notificacion(
                    destinatario=firma.firmante,
                    tipo='FIRMA_REQUERIDA',
                    asunto=f'Documento requiere su firma: {firma.get_rol_firma_display()}',
                    mensaje=f'El documento está listo para su firma como {firma.get_rol_firma_display()}.',
                    link=f'/gestion-estrategica/identidad/politicas/{documento.id}',
                    prioridad='ALTA'
                )

        return firmas_creadas

    def validar_firmas_completas(self, documento):
        """
        Valida si todas las firmas del documento están completadas.

        Args:
            documento: Instancia del documento

        Returns:
            tuple: (bool, str) - (completo, mensaje)
        """
        content_type = ContentType.objects.get_for_model(documento)

        firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=documento.id,
            is_active=True
        )

        total = firmas.count()
        firmadas = firmas.filter(status='FIRMADO').count()
        rechazadas = firmas.filter(status='RECHAZADO').count()

        if rechazadas > 0:
            return False, f"Hay {rechazadas} firma(s) rechazada(s)"

        if firmadas < total:
            return False, f"Faltan {total - firmadas} firma(s) pendiente(s)"

        return True, "Todas las firmas completadas"
