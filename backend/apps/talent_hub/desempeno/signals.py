"""
Signals para Desempeño - Talent Hub
Notificaciones automáticas para evaluaciones de desempeño.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import EvaluacionDesempeno


@receiver(post_save, sender=EvaluacionDesempeno)
def notificar_evaluacion(sender, instance, created, **kwargs):
    """Notifica sobre evaluaciones de desempeño."""
    if created:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_evaluacion_pendiente(instance)
        except Exception:
            pass
