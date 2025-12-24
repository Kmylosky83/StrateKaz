from django.apps import AppConfig


class EmergenciasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.emergencias'
    verbose_name = 'Gestión de Emergencias'

    def ready(self):
        try:
            import apps.hseq_management.emergencias.signals  # noqa
        except ImportError:
            pass
