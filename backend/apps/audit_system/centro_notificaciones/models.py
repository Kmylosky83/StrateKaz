"""
Modelos del módulo Centro de Notificaciones - Audit System
Sistema de Gestión StrateKaz

Define:
- TipoNotificacion: Tipos de notificación configurables
- Notificacion: Notificaciones individuales
- PreferenciaNotificacion: Preferencias por usuario
- NotificacionMasiva: Notificaciones enviadas a múltiples usuarios
"""

from django.db import models
from django.contrib.auth import get_user_model
from apps.core.base_models import BaseCompanyModel, TimestampedModel

User = get_user_model()


# ==============================================================================
# CHOICES
# ==============================================================================

CATEGORIA_NOTIFICACION_CHOICES = [
    ('sistema', 'Sistema'),
    ('tarea', 'Tarea'),
    ('alerta', 'Alerta'),
    ('recordatorio', 'Recordatorio'),
    ('aprobacion', 'Aprobación'),
]

PRIORIDAD_CHOICES = [
    ('baja', 'Baja'),
    ('normal', 'Normal'),
    ('alta', 'Alta'),
    ('urgente', 'Urgente'),
]

DESTINATARIOS_TIPO_CHOICES = [
    ('todos', 'Todos'),
    ('rol', 'Por Rol'),
    ('area', 'Por Área'),
    ('usuarios_especificos', 'Usuarios Específicos'),
]


# ==============================================================================
# MODELOS
# ==============================================================================

class TipoNotificacion(BaseCompanyModel):
    """
    Tipos de notificación configurables.

    Define plantillas y comportamiento para diferentes tipos de notificaciones.
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
        help_text='Código único identificador del tipo'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )

    # Apariencia
    icono = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Icono',
        help_text='Icono a mostrar (bell, warning, check, etc.)'
    )
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color',
        help_text='Color del icono/notificación'
    )

    # Categoría
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_NOTIFICACION_CHOICES,
        verbose_name='Categoría',
        db_index=True
    )

    # Plantillas
    plantilla_titulo = models.CharField(
        max_length=500,
        verbose_name='Plantilla Título',
        help_text='Plantilla para el título. Ej: "Nueva {entidad} asignada"'
    )
    plantilla_mensaje = models.TextField(
        verbose_name='Plantilla Mensaje',
        help_text='Plantilla para el mensaje. Usa {variable} para placeholders'
    )
    url_template = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='URL Template',
        help_text='Plantilla URL para navegar. Ej: "/modulo/{id}"'
    )

    # Canales
    es_email = models.BooleanField(
        default=False,
        verbose_name='Enviar Email',
        help_text='También enviar por correo electrónico'
    )
    es_push = models.BooleanField(
        default=False,
        verbose_name='Enviar Push',
        help_text='Enviar notificación push'
    )

    class Meta:
        db_table = 'notif_tipo_notificacion'
        verbose_name = 'Tipo de Notificación'
        verbose_name_plural = 'Tipos de Notificación'
        ordering = ['categoria', 'nombre']

    def __str__(self):
        return f'{self.nombre} ({self.categoria})'


class Notificacion(TimestampedModel):
    """
    Notificaciones individuales.

    Notificaciones enviadas a usuarios específicos.
    """

    tipo = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name='Tipo'
    )
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name='Usuario',
        db_index=True
    )

    # Contenido
    titulo = models.CharField(
        max_length=500,
        verbose_name='Título'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje'
    )
    url = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='URL',
        help_text='URL para navegar al hacer clic'
    )
    datos_extra = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos Extra',
        help_text='Datos adicionales en formato JSON'
    )

    # Prioridad
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='normal',
        verbose_name='Prioridad',
        db_index=True
    )

    # Estado
    esta_leida = models.BooleanField(
        default=False,
        verbose_name='Está Leída',
        db_index=True
    )
    fecha_lectura = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Lectura'
    )
    esta_archivada = models.BooleanField(
        default=False,
        verbose_name='Está Archivada',
        db_index=True
    )

    class Meta:
        db_table = 'notif_notificacion'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['usuario', '-created_at']),
            models.Index(fields=['usuario', 'esta_leida', '-created_at']),
            models.Index(fields=['tipo', '-created_at']),
        ]

    def __str__(self):
        return f'{self.titulo} - {self.usuario.get_full_name()}'

    def marcar_leida(self):
        """Marca la notificación como leída"""
        from django.utils import timezone
        if not self.esta_leida:
            self.esta_leida = True
            self.fecha_lectura = timezone.now()
            self.save(update_fields=['esta_leida', 'fecha_lectura'])


class PreferenciaNotificacion(BaseCompanyModel):
    """
    Preferencias de notificación por usuario.

    Permite a los usuarios configurar cómo desean recibir cada tipo de notificación.
    """

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='preferencias_notificacion',
        verbose_name='Usuario'
    )
    tipo_notificacion = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.CASCADE,
        related_name='preferencias',
        verbose_name='Tipo de Notificación'
    )

    # Canales
    recibir_app = models.BooleanField(
        default=True,
        verbose_name='Recibir en App',
        help_text='Mostrar notificación en la aplicación'
    )
    recibir_email = models.BooleanField(
        default=True,
        verbose_name='Recibir Email',
        help_text='Enviar por correo electrónico'
    )
    recibir_push = models.BooleanField(
        default=False,
        verbose_name='Recibir Push',
        help_text='Enviar notificación push'
    )

    # Horario (No molestar)
    horario_inicio = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Horario Inicio',
        help_text='No enviar notificaciones antes de esta hora'
    )
    horario_fin = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Horario Fin',
        help_text='No enviar notificaciones después de esta hora'
    )

    class Meta:
        db_table = 'notif_preferencia_notificacion'
        verbose_name = 'Preferencia de Notificación'
        verbose_name_plural = 'Preferencias de Notificación'
        unique_together = [['usuario', 'tipo_notificacion']]

    def __str__(self):
        return f'{self.usuario.get_full_name()} - {self.tipo_notificacion.nombre}'


class NotificacionMasiva(TimestampedModel):
    """
    Notificaciones masivas enviadas a múltiples usuarios.

    Permite enviar notificaciones a grupos de usuarios (por rol, área, etc.).
    """

    tipo = models.ForeignKey(
        TipoNotificacion,
        on_delete=models.CASCADE,
        related_name='notificaciones_masivas',
        verbose_name='Tipo'
    )

    # Contenido
    titulo = models.CharField(
        max_length=500,
        verbose_name='Título'
    )
    mensaje = models.TextField(
        verbose_name='Mensaje'
    )

    # Destinatarios
    destinatarios_tipo = models.CharField(
        max_length=30,
        choices=DESTINATARIOS_TIPO_CHOICES,
        verbose_name='Tipo de Destinatarios'
    )
    roles = models.ManyToManyField(
        'core.Cargo',
        blank=True,
        related_name='notificaciones_masivas',
        verbose_name='Roles'
    )
    areas = models.ManyToManyField(
        'organizacion.Area',
        blank=True,
        related_name='notificaciones_masivas',
        verbose_name='Áreas'
    )
    usuarios = models.ManyToManyField(
        User,
        blank=True,
        related_name='notificaciones_masivas_recibidas',
        verbose_name='Usuarios'
    )

    # Estadísticas
    total_enviadas = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Enviadas'
    )
    total_leidas = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Leídas'
    )

    # Auditoría
    enviada_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='notificaciones_masivas_enviadas',
        verbose_name='Enviada Por'
    )

    class Meta:
        db_table = 'notif_notificacion_masiva'
        verbose_name = 'Notificación Masiva'
        verbose_name_plural = 'Notificaciones Masivas'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.titulo} - {self.destinatarios_tipo}'
