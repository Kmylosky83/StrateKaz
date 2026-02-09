"""
Signals para Onboarding e Inducción - Talent Hub
Notificaciones automáticas para tareas de checklist.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChecklistIngreso


@receiver(post_save, sender=ChecklistIngreso)
def notificar_checklist_onboarding(sender, instance, created, **kwargs):
    """Notifica al nuevo empleado sobre tarea de onboarding."""
    if created:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_onboarding_tarea(instance)
        except Exception:
            pass
