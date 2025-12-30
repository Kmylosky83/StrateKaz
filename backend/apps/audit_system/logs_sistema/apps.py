from django.apps import AppConfig


class LogsSistemaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit_system.logs_sistema'
    verbose_name = 'Logs del Sistema'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.audit_system.logs_sistema.signals  # noqa
        except ImportError:
            pass
