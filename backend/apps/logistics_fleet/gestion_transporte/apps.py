"""
Configuración de la app Gestión de Transporte
"""

from django.apps import AppConfig


class GestionTransporteConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.logistics_fleet.gestion_transporte'
    verbose_name = 'Gestión de Transporte'

    def ready(self):
        """Import signals when app is ready"""
        try:
            import apps.logistics_fleet.gestion_transporte.signals  # noqa
        except ImportError:
            pass
