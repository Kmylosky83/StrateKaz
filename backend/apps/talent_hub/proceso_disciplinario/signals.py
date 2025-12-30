"""
Signals para Proceso Disciplinario - Talent Hub
Actualizaciones automáticas del historial disciplinario
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario


@receiver(post_save, sender=LlamadoAtencion)
def actualizar_historial_llamado(sender, instance, created, **kwargs):
    """Actualiza historial cuando se crea o modifica un llamado de atención"""
    if instance.is_active:
        historial, created = HistorialDisciplinario.objects.get_or_create(
            colaborador=instance.colaborador,
            empresa=instance.empresa,
            defaults={
                'created_by': instance.created_by,
                'updated_by': instance.updated_by
            }
        )
        historial.actualizar_contadores()


@receiver(post_save, sender=Descargo)
def actualizar_historial_descargo(sender, instance, created, **kwargs):
    """Actualiza historial cuando se crea o modifica un descargo"""
    if instance.is_active:
        historial, created = HistorialDisciplinario.objects.get_or_create(
            colaborador=instance.colaborador,
            empresa=instance.empresa,
            defaults={
                'created_by': instance.created_by,
                'updated_by': instance.updated_by
            }
        )
        historial.actualizar_contadores()


@receiver(post_save, sender=Memorando)
def actualizar_historial_memorando(sender, instance, created, **kwargs):
    """Actualiza historial cuando se crea o modifica un memorando"""
    if instance.is_active:
        historial, created = HistorialDisciplinario.objects.get_or_create(
            colaborador=instance.colaborador,
            empresa=instance.empresa,
            defaults={
                'created_by': instance.created_by,
                'updated_by': instance.updated_by
            }
        )
        historial.actualizar_contadores()


@receiver(post_delete, sender=LlamadoAtencion)
@receiver(post_delete, sender=Descargo)
@receiver(post_delete, sender=Memorando)
def actualizar_historial_eliminacion(sender, instance, **kwargs):
    """Actualiza historial cuando se elimina un registro"""
    try:
        historial = HistorialDisciplinario.objects.get(colaborador=instance.colaborador)
        historial.actualizar_contadores()
    except HistorialDisciplinario.DoesNotExist:
        pass
