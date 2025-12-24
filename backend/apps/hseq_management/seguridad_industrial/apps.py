"""
Configuración de la app Seguridad Industrial
"""
from django.apps import AppConfig


class SeguridadIndustrialConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.seguridad_industrial'
    verbose_name = 'Seguridad Industrial'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        try:
            import apps.hseq_management.seguridad_industrial.signals  # noqa
        except ImportError:
            pass
