"""
EventBus handlers para Mejora Continua — notificaciones.

Suscritos en MejoraContinuaConfig.ready().
Reciben eventos de signals.py y envían notificaciones
vía NotificationService.
"""
import logging
from django.contrib.auth import get_user_model

logger = logging.getLogger('mejora_continua')
User = get_user_model()


def handle_programa_estado_cambiado(event_type, data):
    """Envía notificación cuando un programa cambia de estado."""
    from apps.audit_system.centro_notificaciones.services import NotificationService

    transicion = data.get('transicion')
    responsable_id = data.get('responsable_programa_id')

    if not responsable_id:
        return

    NOTIF_MAP = {
        'aprobar': {
            'tipo_codigo': 'AUDITORIA_PROGRAMA_APROBADO',
            'titulo': f"Programa aprobado: {data.get('codigo')}",
            'mensaje': f"El programa de auditoría \"{data.get('nombre')}\" ha sido aprobado.",
        },
        'iniciar': {
            'tipo_codigo': 'AUDITORIA_PROGRAMA_INICIADO',
            'titulo': f"Programa iniciado: {data.get('codigo')}",
            'mensaje': f"El programa de auditoría \"{data.get('nombre')}\" ha iniciado ejecución.",
        },
        'completar': {
            'tipo_codigo': 'AUDITORIA_PROGRAMA_COMPLETADO',
            'titulo': f"Programa completado: {data.get('codigo')}",
            'mensaje': f"El programa de auditoría \"{data.get('nombre')}\" ha sido completado.",
        },
    }

    notif_config = NOTIF_MAP.get(transicion)
    if not notif_config:
        return

    try:
        usuario = User.objects.get(id=responsable_id)
        NotificationService.send_notification(
            tipo_codigo=notif_config['tipo_codigo'],
            usuario=usuario,
            titulo=notif_config['titulo'],
            mensaje=notif_config['mensaje'],
            url='/sistema-gestion/auditorias',
        )
    except User.DoesNotExist:
        logger.warning("Usuario %s no encontrado para notificación programa", responsable_id)
    except Exception as e:
        logger.error("Error enviando notificación programa: %s", e)


def handle_auditoria_estado_cambiado(event_type, data):
    """Envía notificación cuando una auditoría cambia de estado."""
    from apps.audit_system.centro_notificaciones.services import NotificationService

    transicion = data.get('transicion')
    auditor_lider_id = data.get('auditor_lider_id')

    if not auditor_lider_id:
        return

    NOTIF_MAP = {
        'iniciar': {
            'tipo_codigo': 'AUDITORIA_INICIADA',
            'titulo': f"Auditoría iniciada: {data.get('codigo')}",
            'mensaje': f"La auditoría \"{data.get('titulo')}\" ha iniciado ejecución.",
        },
        'cerrar': {
            'tipo_codigo': 'AUDITORIA_CERRADA',
            'titulo': f"Auditoría cerrada: {data.get('codigo')}",
            'mensaje': f"La auditoría \"{data.get('titulo')}\" ha sido cerrada.",
        },
    }

    notif_config = NOTIF_MAP.get(transicion)
    if not notif_config:
        return

    try:
        usuario = User.objects.get(id=auditor_lider_id)
        NotificationService.send_notification(
            tipo_codigo=notif_config['tipo_codigo'],
            usuario=usuario,
            titulo=notif_config['titulo'],
            mensaje=notif_config['mensaje'],
            url='/sistema-gestion/auditorias',
        )
    except User.DoesNotExist:
        logger.warning("Usuario %s no encontrado para notificación auditoría", auditor_lider_id)
    except Exception as e:
        logger.error("Error enviando notificación auditoría: %s", e)


def handle_hallazgo_estado_cambiado(event_type, data):
    """Envía notificación cuando un hallazgo cambia de estado."""
    from apps.audit_system.centro_notificaciones.services import NotificationService

    transicion = data.get('transicion')

    # comunicar → notificar al responsable_proceso
    # verificar/cerrar → notificar al identificado_por (auditor)
    if transicion == 'comunicar':
        target_user_id = data.get('responsable_proceso_id')
    elif transicion in ('verificar', 'cerrar'):
        target_user_id = data.get('identificado_por_id')
    else:
        return

    if not target_user_id:
        return

    NOTIF_MAP = {
        'comunicar': {
            'tipo_codigo': 'HALLAZGO_COMUNICADO',
            'titulo': f"Hallazgo comunicado: {data.get('codigo')}",
            'mensaje': (
                f"El hallazgo \"{data.get('titulo')}\" ({data.get('tipo')}) "
                "le ha sido comunicado. Requiere su atención."
            ),
            'prioridad': 'alta',
        },
        'verificar': {
            'tipo_codigo': 'HALLAZGO_VERIFICADO',
            'titulo': f"Hallazgo verificado: {data.get('codigo')}",
            'mensaje': f"El hallazgo \"{data.get('titulo')}\" ha sido verificado.",
            'prioridad': 'normal',
        },
        'cerrar': {
            'tipo_codigo': 'HALLAZGO_CERRADO',
            'titulo': f"Hallazgo cerrado: {data.get('codigo')}",
            'mensaje': f"El hallazgo \"{data.get('titulo')}\" ha sido cerrado exitosamente.",
            'prioridad': 'normal',
        },
    }

    notif_config = NOTIF_MAP.get(transicion)
    if not notif_config:
        return

    try:
        usuario = User.objects.get(id=target_user_id)
        NotificationService.send_notification(
            tipo_codigo=notif_config['tipo_codigo'],
            usuario=usuario,
            titulo=notif_config['titulo'],
            mensaje=notif_config['mensaje'],
            url='/sistema-gestion/auditorias',
            prioridad=notif_config.get('prioridad', 'normal'),
        )
    except User.DoesNotExist:
        logger.warning("Usuario %s no encontrado para notificación hallazgo", target_user_id)
    except Exception as e:
        logger.error("Error enviando notificación hallazgo: %s", e)


def register_handlers():
    """Registra todos los handlers del EventBus. Llamado desde AppConfig.ready()."""
    from utils.event_bus import EventBus

    EventBus.subscribe('programa_auditoria.estado_cambiado', handle_programa_estado_cambiado)
    EventBus.subscribe('auditoria.estado_cambiado', handle_auditoria_estado_cambiado)
    EventBus.subscribe('hallazgo.estado_cambiado', handle_hallazgo_estado_cambiado)
