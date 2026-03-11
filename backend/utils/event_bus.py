"""
EventBus — Pub/sub ligero para eventos cross-módulo.

Capa 2 de la arquitectura de automatización:
  Layer 1: django-fsm (state machines por entidad)
  Layer 2: EventBus (este archivo — router de eventos)
  Layer 3: Workflow Engine (BPMN 2.0 ya existente)

Uso:
    from utils.event_bus import EventBus

    # Suscribir (en AppConfig.ready() o en event_handlers.py)
    EventBus.subscribe('auditoria.estado_cambiado', handle_auditoria_cambio)

    # Publicar sync
    EventBus.publish('auditoria.estado_cambiado', data={...})

    # Publicar async vía Celery (para notificaciones, cross-module)
    EventBus.publish('auditoria.estado_cambiado', data={...}, async_mode=True)

Convención de nombres:
    {entidad}.{accion} — ej: 'hallazgo.estado_cambiado', 'programa_auditoria.completado'
"""
import logging
from collections import defaultdict

logger = logging.getLogger('event_bus')


class EventBus:
    """
    Singleton pub/sub event bus.
    Handlers se registran al cargar el módulo (AppConfig.ready).
    Eventos se despachan sync o async vía Celery.
    """
    _handlers = defaultdict(list)

    @classmethod
    def subscribe(cls, event_type, handler):
        """Registra un handler para un tipo de evento."""
        if handler not in cls._handlers[event_type]:
            cls._handlers[event_type].append(handler)
            logger.debug("EventBus: suscrito %s a '%s'", handler.__name__, event_type)

    @classmethod
    def unsubscribe(cls, event_type, handler):
        """Remueve un handler."""
        cls._handlers[event_type] = [
            h for h in cls._handlers[event_type] if h != handler
        ]

    @classmethod
    def publish(cls, event_type, data=None, async_mode=False, schema_name=None):
        """
        Publica un evento a todos los suscriptores.

        Args:
            event_type: Nombre del evento (ej: 'auditoria.estado_cambiado')
            data: Payload dict (debe ser JSON-serializable para async)
            async_mode: Si True, despacha vía Celery task
            schema_name: Schema del tenant (requerido para async, auto-detectado para sync)
        """
        data = data or {}

        if async_mode:
            from utils.tasks import dispatch_event_async
            if not schema_name:
                from django.db import connection
                schema_name = connection.schema_name
            dispatch_event_async.delay(event_type, data, schema_name)
        else:
            cls._dispatch(event_type, data)

    @classmethod
    def _dispatch(cls, event_type, data):
        """Despacha síncronamente el evento a todos los handlers."""
        handlers = cls._handlers.get(event_type, [])
        if not handlers:
            logger.debug("EventBus: sin handlers para '%s'", event_type)
            return

        for handler in handlers:
            try:
                handler(event_type=event_type, data=data)
            except Exception as e:
                logger.error(
                    "EventBus: handler %s falló para '%s': %s",
                    handler.__name__, event_type, e,
                    exc_info=True,
                )

    @classmethod
    def clear(cls):
        """Limpia todos los handlers (para testing)."""
        cls._handlers.clear()
