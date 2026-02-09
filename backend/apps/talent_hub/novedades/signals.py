"""
Signals para Novedades - Talent Hub
Notificaciones automáticas para vacaciones, permisos e incapacidades.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SolicitudVacaciones, Permiso, Incapacidad


@receiver(post_save, sender=SolicitudVacaciones)
def notificar_solicitud_vacaciones(sender, instance, created, **kwargs):
    """Notifica sobre solicitudes de vacaciones."""
    try:
        from apps.talent_hub.services import NotificadorTH
        if created:
            NotificadorTH.notificar_vacaciones_solicitud(instance)
        elif hasattr(instance, 'estado'):
            if instance.estado == 'aprobada':
                NotificadorTH.notificar_vacaciones_aprobadas(instance)
            elif instance.estado == 'rechazada':
                NotificadorTH.notificar_vacaciones_rechazadas(instance)
    except Exception:
        pass


@receiver(post_save, sender=Permiso)
def notificar_solicitud_permiso(sender, instance, created, **kwargs):
    """Notifica al jefe sobre solicitud de permiso."""
    if created:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_permiso_solicitud(instance)
        except Exception:
            pass


@receiver(post_save, sender=Incapacidad)
def notificar_incapacidad(sender, instance, created, **kwargs):
    """Notifica al jefe sobre incapacidad registrada."""
    if created:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_incapacidad_registrada(instance)
        except Exception:
            pass
