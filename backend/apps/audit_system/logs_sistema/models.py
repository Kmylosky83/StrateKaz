"""
Modelos del módulo Logs del Sistema - Audit System
Sistema de Gestión StrateKaz

Define:
- ConfiguracionAuditoria: Configuración de qué auditar por modelo
- LogAcceso: Logs de acceso al sistema (login, logout, etc.)
- LogCambio: Logs de cambios en datos (CRUD)
- LogConsulta: Logs de consultas y exportaciones sensibles
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.core.base_models import BaseCompanyModel, TimestampedModel

User = get_user_model()


# ==============================================================================
# CHOICES
# ==============================================================================

TIPO_EVENTO_CHOICES = [
    ('login', 'Inicio de Sesión'),
    ('logout', 'Cierre de Sesión'),
    ('login_fallido', 'Inicio de Sesión Fallido'),
    ('sesion_expirada', 'Sesión Expirada'),
    ('cambio_password', 'Cambio de Contraseña'),
]

ACCION_CHOICES = [
    ('crear', 'Crear'),
    ('modificar', 'Modificar'),
    ('eliminar', 'Eliminar'),
]

FORMATO_EXPORTACION_CHOICES = [
    ('excel', 'Excel'),
    ('pdf', 'PDF'),
    ('csv', 'CSV'),
    ('json', 'JSON'),
]


# ==============================================================================
# MODELOS
# ==============================================================================

class ConfiguracionAuditoria(BaseCompanyModel):
    """
    Configuración de qué auditar por modelo.

    Permite configurar a nivel granular qué operaciones se deben auditar
    para cada modelo del sistema, incluyendo retención de datos.
    """

    modulo = models.CharField(
        max_length=100,
        verbose_name='Módulo',
        help_text='Nombre del módulo (ej: hseq_management, supply_chain)',
        db_index=True
    )
    modelo = models.CharField(
        max_length=100,
        verbose_name='Modelo',
        help_text='Nombre del modelo Django (ej: AccionCorrectiva, Pedido)',
        db_index=True
    )

    # Configuración de qué auditar
    auditar_creacion = models.BooleanField(
        default=True,
        verbose_name='Auditar Creación',
        help_text='Registrar cuando se crea un nuevo registro'
    )
    auditar_modificacion = models.BooleanField(
        default=True,
        verbose_name='Auditar Modificación',
        help_text='Registrar cuando se modifica un registro'
    )
    auditar_eliminacion = models.BooleanField(
        default=True,
        verbose_name='Auditar Eliminación',
        help_text='Registrar cuando se elimina un registro'
    )
    auditar_consulta = models.BooleanField(
        default=False,
        verbose_name='Auditar Consulta',
        help_text='Registrar cuando se consulta el modelo (APIs sensibles)'
    )

    # Campos sensibles que no se deben loggear
    campos_sensibles = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Campos Sensibles',
        help_text='Lista de campos que NO se deben registrar (ej: password, token)'
    )

    # Retención
    dias_retencion = models.PositiveIntegerField(
        default=365,
        verbose_name='Días de Retención',
        help_text='Días que se conservarán los logs antes de ser purgados'
    )

    class Meta:
        db_table = 'audit_configuracion_auditoria'
        verbose_name = 'Configuración de Auditoría'
        verbose_name_plural = 'Configuraciones de Auditoría'
        unique_together = [['empresa', 'modulo', 'modelo']]
        ordering = ['modulo', 'modelo']

    def __str__(self):
        return f'{self.modulo}.{self.modelo}'


class LogAcceso(TimestampedModel):
    """
    Logs de acceso al sistema.

    Registra todos los eventos de autenticación: login exitoso/fallido,
    logout, expiración de sesión, cambios de contraseña.
    """

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs_acceso',
        verbose_name='Usuario',
        help_text='Usuario que realizó el evento (null si falló el login)'
    )

    tipo_evento = models.CharField(
        max_length=20,
        choices=TIPO_EVENTO_CHOICES,
        verbose_name='Tipo de Evento',
        db_index=True
    )

    # Información de conexión
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP',
        help_text='Dirección IP desde donde se realizó el acceso'
    )
    user_agent = models.TextField(
        verbose_name='User Agent',
        help_text='User Agent del navegador/aplicación',
        blank=True
    )
    ubicacion = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='Ubicación',
        help_text='Geolocalización aproximada (ciudad, país)'
    )

    # Información del dispositivo
    dispositivo = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Dispositivo',
        help_text='Tipo de dispositivo (desktop, mobile, tablet)'
    )
    navegador = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Navegador',
        help_text='Navegador utilizado'
    )

    # Resultado
    fue_exitoso = models.BooleanField(
        default=True,
        verbose_name='Fue Exitoso',
        db_index=True
    )
    mensaje_error = models.TextField(
        null=True,
        blank=True,
        verbose_name='Mensaje de Error',
        help_text='Mensaje de error si el evento falló'
    )

    class Meta:
        db_table = 'audit_log_acceso'
        verbose_name = 'Log de Acceso'
        verbose_name_plural = 'Logs de Acceso'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['tipo_evento', '-created_at']),
            models.Index(fields=['ip_address', '-created_at']),
        ]

    def __str__(self):
        usuario_str = self.usuario.get_full_name() if self.usuario else 'Desconocido'
        return f'{self.tipo_evento} - {usuario_str} - {self.created_at}'


class LogCambio(TimestampedModel):
    """
    Logs de cambios en datos.

    Similar a django-auditlog, registra todos los cambios (CREATE, UPDATE, DELETE)
    en los modelos configurados, guardando el estado anterior y nuevo.
    """

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs_cambio',
        verbose_name='Usuario',
        help_text='Usuario que realizó el cambio'
    )

    # Referencia genérica al objeto modificado
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Contenido'
    )
    object_id = models.CharField(
        max_length=255,
        verbose_name='ID del Objeto',
        db_index=True
    )
    object_repr = models.CharField(
        max_length=500,
        verbose_name='Representación del Objeto',
        help_text='Representación en texto del objeto modificado'
    )

    # Acción realizada
    accion = models.CharField(
        max_length=10,
        choices=ACCION_CHOICES,
        verbose_name='Acción',
        db_index=True
    )

    # Cambios realizados
    cambios = models.JSONField(
        verbose_name='Cambios',
        help_text='Diccionario con los cambios: {"campo": {"old": valor_antiguo, "new": valor_nuevo}}'
    )

    # Información adicional
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP'
    )

    class Meta:
        db_table = 'audit_log_cambio'
        verbose_name = 'Log de Cambio'
        verbose_name_plural = 'Logs de Cambios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id', '-created_at']),
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['accion', '-created_at']),
        ]

    def __str__(self):
        return f'{self.accion} - {self.object_repr} - {self.created_at}'


class LogConsulta(TimestampedModel):
    """
    Logs de consultas y exportaciones sensibles.

    Registra cuando se accede a endpoints sensibles o se exportan datos,
    útil para auditorías de seguridad y cumplimiento.
    """

    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='logs_consulta',
        verbose_name='Usuario'
    )

    modulo = models.CharField(
        max_length=100,
        verbose_name='Módulo',
        db_index=True
    )
    endpoint = models.CharField(
        max_length=500,
        verbose_name='Endpoint',
        help_text='URL del endpoint consultado'
    )

    # Parámetros de la consulta
    parametros = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Parámetros',
        help_text='Parámetros de la consulta (filtros, búsqueda, etc.)'
    )

    # Resultado
    registros_accedidos = models.PositiveIntegerField(
        default=0,
        verbose_name='Registros Accedidos',
        help_text='Cantidad de registros devueltos en la consulta'
    )

    # Exportación
    fue_exportacion = models.BooleanField(
        default=False,
        verbose_name='Fue Exportación',
        db_index=True
    )
    formato_exportacion = models.CharField(
        max_length=20,
        choices=FORMATO_EXPORTACION_CHOICES,
        null=True,
        blank=True,
        verbose_name='Formato de Exportación'
    )

    # Información de conexión
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP'
    )

    class Meta:
        db_table = 'audit_log_consulta'
        verbose_name = 'Log de Consulta'
        verbose_name_plural = 'Logs de Consultas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['modulo', '-created_at']),
            models.Index(fields=['fue_exportacion', '-created_at']),
        ]

    def __str__(self):
        usuario_str = self.usuario.get_full_name() if self.usuario else 'Desconocido'
        return f'{self.modulo} - {usuario_str} - {self.created_at}'


# ==============================================================================
# IMPERSONATION AUDIT TRAIL
# ==============================================================================

ACTION_CHOICES = [
    ('view_profile', 'Ver perfil'),
    ('edit_profile', 'Editar perfil'),
    ('create_record', 'Crear registro'),
    ('update_record', 'Actualizar registro'),
    ('delete_record', 'Eliminar registro'),
    ('view_permissions', 'Ver permisos'),
    ('view_signature', 'Ver firma'),
    ('api_read', 'Lectura API'),
    ('api_write', 'Escritura API'),
    ('blocked_action', 'Acción bloqueada'),
]


class AuditImpersonation(models.Model):
    """
    Append-only audit log for superadmin impersonation events.

    This model is intentionally immutable by design:
    - No updates allowed (save() override rejects editing existing records)
    - No deletes allowed (delete() override rejects removal)
    - No soft-delete (does NOT inherit from TenantModel to prevent
      SoftDeleteManager from hiding records)

    Security rationale: impersonation logs are forensic evidence of
    privilege usage. Allowing modification or deletion would enable
    a malicious admin to hide evidence of their own abuse.

    The only valid operation is create() via the impersonation middleware
    (core.middleware.impersonation_audit.ImpersonationAuditMiddleware).

    Key fields: superadmin (who), target_user (whom), timestamp (when),
    action/endpoint/method (what), ip_address/user_agent (from where).
    """

    superadmin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='impersonation_actions',
        verbose_name='Superadmin',
        help_text='Superadmin que realizó la impersonación',
    )
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='impersonated_actions',
        verbose_name='Usuario impersonado',
        help_text='Usuario que estaba siendo impersonado',
    )

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        default='api_write',
        verbose_name='Acción',
        help_text='Tipo de acción realizada durante impersonación',
        db_index=True,
    )
    endpoint = models.CharField(
        max_length=500,
        verbose_name='Endpoint',
        help_text='URL path del endpoint accedido',
    )
    method = models.CharField(
        max_length=10,
        verbose_name='Método HTTP',
        help_text='GET, POST, PUT, PATCH, DELETE',
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        verbose_name='Dirección IP',
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        verbose_name='User Agent',
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha y hora',
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos',
        help_text='Contexto adicional: query params, body summary, response status, etc.',
    )

    class Meta:
        db_table = 'audit_impersonation'
        verbose_name = 'Log de Impersonación'
        verbose_name_plural = 'Logs de Impersonación'
        ordering = ['-timestamp']
        indexes = [
            models.Index(
                fields=['superadmin', '-timestamp'],
                name='idx_imp_superadmin_ts',
            ),
            models.Index(
                fields=['target_user', '-timestamp'],
                name='idx_imp_target_ts',
            ),
            models.Index(
                fields=['action', '-timestamp'],
                name='idx_imp_action_ts',
            ),
        ]

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise PermissionError("AuditImpersonation is append-only — editing forbidden")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("AuditImpersonation is append-only — deletion forbidden")

    def __str__(self):
        sa = self.superadmin.username if self.superadmin else '?'
        tu = self.target_user.username if self.target_user else '?'
        return f'{sa} → {tu} | {self.action} | {self.endpoint} | {self.timestamp}'
