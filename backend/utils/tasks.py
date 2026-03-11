"""
Celery tasks para EventBus — dispatch asíncrono multi-tenant.
"""
import logging
from celery import shared_task

logger = logging.getLogger('event_bus')


@shared_task(
    bind=True,
    name='utils.tasks.dispatch_event_async',
    max_retries=2,
    default_retry_delay=30,
    time_limit=60,
    soft_time_limit=45,
)
def dispatch_event_async(self, event_type, data, schema_name):
    """
    Despacha un evento EventBus dentro del schema del tenant correcto.

    Args:
        event_type: Nombre del evento
        data: Payload del evento
        schema_name: Schema del tenant para DB context
    """
    from django_tenants.utils import schema_context
    from utils.event_bus import EventBus

    try:
        with schema_context(schema_name):
            EventBus._dispatch(event_type, data)
            logger.info(
                "[EventBus async] despachado '%s' en schema '%s'",
                event_type, schema_name
            )
    except Exception as exc:
        logger.error(
            "[EventBus async] error despachando '%s': %s",
            event_type, exc
        )
        raise self.retry(exc=exc)
