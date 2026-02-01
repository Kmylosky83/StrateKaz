"""
Configuración de la app Contexto Organizacional.
"""
from django.apps import AppConfig


class ContextoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.contexto'
    label = 'gestion_estrategica_contexto'
    verbose_name = 'Contexto Organizacional'

    def ready(self):
        """Registrar signals si es necesario."""
        pass
