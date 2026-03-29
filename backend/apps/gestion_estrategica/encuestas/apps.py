"""
Configuración de la app Encuestas Colaborativas
"""
from django.apps import AppConfig


class EncuestasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.encuestas'
    verbose_name = 'Encuestas Colaborativas DOFA'

    def ready(self):
        import apps.gestion_estrategica.encuestas.signals  # noqa: F401
