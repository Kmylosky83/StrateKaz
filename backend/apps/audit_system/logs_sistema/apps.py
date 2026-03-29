import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class LogsSistemaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit_system.logs_sistema'
    verbose_name = 'Logs del Sistema'

    def ready(self):
        """Import signals when app is ready."""
        import apps.audit_system.logs_sistema.signals  # noqa: F401
        logger.debug("LogsSistema signals conectados")
