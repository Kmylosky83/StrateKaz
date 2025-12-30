"""
Configuración de la aplicación Control de Tiempo - Talent Hub
"""
from django.apps import AppConfig


class ControlTiempoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.control_tiempo'
    verbose_name = 'Control de Tiempo'

    def ready(self):
        """
        Importar señales cuando la app está lista.
        """
        try:
            import apps.talent_hub.control_tiempo.signals  # noqa
        except ImportError:
            pass
