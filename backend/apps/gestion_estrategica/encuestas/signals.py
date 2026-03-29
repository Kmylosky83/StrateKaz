"""
Signals para Encuestas Colaborativas DOFA/PCI-POAM
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


def _actualizar_total_invitados(encuesta):
    """Recalcula y guarda total_invitados en la encuesta."""
    encuesta.total_invitados = encuesta.participantes.count()
    encuesta.save(update_fields=['total_invitados', 'updated_at'])


@receiver(post_save, sender='encuestas.ParticipanteEncuesta')
def participante_creado(sender, instance, created, **kwargs):
    if created:
        _actualizar_total_invitados(instance.encuesta)


@receiver(post_delete, sender='encuestas.ParticipanteEncuesta')
def participante_eliminado(sender, instance, **kwargs):
    _actualizar_total_invitados(instance.encuesta)
