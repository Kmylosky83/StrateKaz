"""
Signals para Selección y Contratación - Talent Hub
Notificaciones automáticas para eventos de contratos.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HistorialContrato


@receiver(post_save, sender=HistorialContrato)
def notificar_contrato_creado(sender, instance, created, **kwargs):
    """Notifica cuando se firma un contrato."""
    if instance.firmado and instance.fecha_firma:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_contrato_firmado(instance)
        except Exception:
            pass
