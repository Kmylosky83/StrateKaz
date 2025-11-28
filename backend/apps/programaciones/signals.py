"""
Signals del módulo Programaciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Programacion


@receiver(pre_save, sender=Programacion)
def programacion_pre_save(sender, instance, **kwargs):
    """
    Acciones antes de guardar una programación
    """
    # Si cambia a EN_RUTA automáticamente cuando llega la fecha
    # (Esta lógica se puede implementar con un cron job o celery task)
    pass


@receiver(post_save, sender=Programacion)
def programacion_post_save(sender, instance, created, **kwargs):
    """
    Acciones después de guardar una programación
    """
    # Aquí se pueden agregar notificaciones, emails, etc.
    # Por ejemplo:
    # - Notificar al recolector cuando se le asigna una programación
    # - Notificar al comercial cuando cambia el estado
    # - Crear registros de auditoría adicionales
    pass
