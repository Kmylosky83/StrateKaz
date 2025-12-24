from django.apps import AppConfig


class HigieneIndustrialConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.higiene_industrial'
    verbose_name = 'Higiene Industrial'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        try:
            import apps.hseq_management.higiene_industrial.signals
        except ImportError:
            pass
