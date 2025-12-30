from django.apps import AppConfig


class AuditSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit_system'
    verbose_name = 'Sistema de Auditoría y Notificaciones'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.audit_system.logs_sistema.signals  # noqa
        except ImportError:
            pass
