"""
Signals para Formación y Reinducción - Talent Hub
Notificaciones automáticas para capacitaciones programadas.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ProgramacionCapacitacion


@receiver(post_save, sender=ProgramacionCapacitacion)
def notificar_capacitacion(sender, instance, created, **kwargs):
    """Notifica sobre capacitación programada."""
    if created:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_capacitacion_programada(instance)
        except Exception:
            pass
