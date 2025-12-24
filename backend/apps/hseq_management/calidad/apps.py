from django.apps import AppConfig


class CalidadConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.calidad'
    verbose_name = 'Gestión de Calidad'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.hseq_management.calidad.signals  # noqa
        except ImportError:
            pass
