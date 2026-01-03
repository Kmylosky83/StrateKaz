"""
AppConfig para Compras - Supply Chain
Sistema de Gestión StrateKaz
"""
from django.apps import AppConfig


class ComprasConfig(AppConfig):
    """Configuración de la aplicación Compras."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.compras'
    verbose_name = 'Compras'
    verbose_name_plural = 'Gestión de Compras'

    def ready(self):
        """
        Importar signals cuando la app esté lista.
        """
        # Importar signals si se crean en el futuro
        # import apps.supply_chain.compras.signals
        pass
