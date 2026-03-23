"""
Onboarding de Usuario - StrateKaz

Rastrea el progreso de configuración inicial de cada usuario (perfil,
firma, datos de emergencia, etc.). Vive en el schema del tenant.

Se crea automáticamente cuando se crea un User (señal post_save).
El tipo de onboarding determina qué pasos se muestran al usuario.
"""
import logging

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from utils.models import TenantModel

logger = logging.getLogger(__name__)


class UserOnboarding(TenantModel):
    """
    Rastrea el progreso de onboarding a nivel de usuario.
    Vive en el schema del tenant (hereda de TenantModel).

    Se crea automáticamente al crear un User via señal post_save.
    Los campos booleanos son actualizados por OnboardingService.compute().
    """

    ONBOARDING_TYPE_CHOICES = [
        ('admin', 'Administrador'),
        ('jefe', 'Jefe/Líder'),
        ('empleado', 'Empleado'),
        ('proveedor', 'Proveedor'),
        ('cliente', 'Cliente'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='onboarding',
        verbose_name='Usuario',
    )
    onboarding_type = models.CharField(
        max_length=15,
        choices=ONBOARDING_TYPE_CHOICES,
        default='empleado',
        db_index=True,
        verbose_name='Tipo de onboarding',
        help_text='Determina qué pasos se muestran al usuario',
    )

    # ------------------------------------------------------------------
    # Campos calculados (computed por OnboardingService)
    # ------------------------------------------------------------------
    has_photo = models.BooleanField(
        default=False,
        verbose_name='Tiene foto de perfil',
        help_text='True cuando User.photo está definido',
    )
    has_firma = models.BooleanField(
        default=False,
        verbose_name='Tiene firma guardada',
        help_text='True cuando User.firma_guardada está definido',
    )
    has_emergencia = models.BooleanField(
        default=False,
        verbose_name='Tiene contacto de emergencia',
        help_text='True cuando InfoPersonal tiene nombre y teléfono de emergencia',
    )
    profile_percentage = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Porcentaje de perfil',
        help_text='Porcentaje ponderado de completitud del perfil (0–100)',
    )
    steps_completed = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Pasos completados',
        help_text='Diccionario {step_key: bool} según el tipo de onboarding',
    )

    # ------------------------------------------------------------------
    # Control
    # ------------------------------------------------------------------
    completado_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de finalización',
        help_text='Se establece cuando todos los pasos están completados',
    )
    dismissed = models.BooleanField(
        default=False,
        verbose_name='Descartado',
        help_text='El usuario cerró el widget de onboarding manualmente',
    )
    last_reminder_sent = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Último recordatorio enviado',
        help_text='Fecha del último email de recordatorio de onboarding',
    )

    class Meta:
        db_table = 'core_user_onboarding'
        verbose_name = 'Onboarding de Usuario'
        verbose_name_plural = 'Onboardings de Usuarios'

    def __str__(self):
        return (
            f'Onboarding ({self.onboarding_type}) — '
            f'{self.user.get_full_name() or self.user.email} '
            f'({self.profile_percentage}%)'
        )


# ==============================================================================
# SEÑAL: Crear UserOnboarding cuando se crea un User
# ==============================================================================

def _resolve_onboarding_type(user) -> str:
    """
    Determina el tipo de onboarding según el rol del usuario.

    Lógica (en orden de prioridad):
    1. is_superuser → 'admin'
    2. Cargo con is_jefatura=True → 'jefe'
    3. proveedor_id_ext definido → 'proveedor'
    4. cliente_id_ext definido → 'cliente'
    5. Default → 'empleado'
    """
    if user.is_superuser:
        return 'admin'

    if user.cargo_id and getattr(user.cargo, 'is_jefatura', False):
        return 'jefe'

    if getattr(user, 'proveedor_id_ext', None):
        return 'proveedor'

    if getattr(user, 'cliente_id_ext', None):
        return 'cliente'

    return 'empleado'


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_create_user_onboarding(sender, instance, created, **kwargs):
    """
    Crea UserOnboarding automáticamente cuando se crea un User.

    Solo actúa en creaciones nuevas (created=True).
    El tipo de onboarding se resuelve según el rol del usuario.
    """
    if not created:
        return

    # Evitar crear duplicado si ya existe (por ejemplo, en tests con fixtures)
    if UserOnboarding.objects.filter(user=instance).exists():
        return

    onboarding_type = _resolve_onboarding_type(instance)

    try:
        UserOnboarding.objects.create(
            user=instance,
            onboarding_type=onboarding_type,
        )
        logger.info(
            'UserOnboarding creado para User %s (%s) — tipo: %s',
            instance.pk,
            instance.email,
            onboarding_type,
        )
    except Exception as exc:
        logger.error(
            'Error al crear UserOnboarding para User %s (%s): %s',
            instance.pk,
            instance.email,
            exc,
            exc_info=True,
        )
