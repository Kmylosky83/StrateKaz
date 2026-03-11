"""
Signals para Mejora Continua — hseq_management

Captura transiciones FSM vía post_transition y publica a EventBus.
Los handlers del EventBus envían notificaciones.
"""
import logging
from django.dispatch import receiver
from django_fsm.signals import post_transition

from .models import ProgramaAuditoria, Auditoria, Hallazgo

logger = logging.getLogger('mejora_continua')


@receiver(post_transition, sender=ProgramaAuditoria)
def programa_auditoria_transitioned(sender, instance, name, source, target, **kwargs):
    """Publica evento EventBus cuando ProgramaAuditoria cambia de estado."""
    from utils.event_bus import EventBus

    EventBus.publish(
        event_type='programa_auditoria.estado_cambiado',
        data={
            'id': instance.id,
            'codigo': instance.codigo,
            'nombre': instance.nombre,
            'estado_anterior': source,
            'estado_nuevo': target,
            'transicion': name,
            'responsable_programa_id': instance.responsable_programa_id,
        },
        async_mode=True,
    )


@receiver(post_transition, sender=Auditoria)
def auditoria_transitioned(sender, instance, name, source, target, **kwargs):
    """Publica evento EventBus cuando Auditoria cambia de estado."""
    from utils.event_bus import EventBus

    EventBus.publish(
        event_type='auditoria.estado_cambiado',
        data={
            'id': instance.id,
            'codigo': instance.codigo,
            'titulo': instance.titulo,
            'estado_anterior': source,
            'estado_nuevo': target,
            'transicion': name,
            'auditor_lider_id': instance.auditor_lider_id,
        },
        async_mode=True,
    )


@receiver(post_transition, sender=Hallazgo)
def hallazgo_transitioned(sender, instance, name, source, target, **kwargs):
    """Publica evento EventBus cuando Hallazgo cambia de estado."""
    from utils.event_bus import EventBus

    EventBus.publish(
        event_type='hallazgo.estado_cambiado',
        data={
            'id': instance.id,
            'codigo': instance.codigo,
            'titulo': instance.titulo,
            'tipo': instance.tipo,
            'estado_anterior': source,
            'estado_nuevo': target,
            'transicion': name,
            'identificado_por_id': instance.identificado_por_id,
            'responsable_proceso_id': getattr(instance, 'responsable_proceso_id', None),
        },
        async_mode=True,
    )
