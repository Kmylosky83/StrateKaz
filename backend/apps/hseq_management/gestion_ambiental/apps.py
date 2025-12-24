from django.apps import AppConfig


class GestionAmbientalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.gestion_ambiental'
    verbose_name = 'Gestión Ambiental'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.hseq_management.gestion_ambiental.signals  # noqa
        except ImportError:
            pass
