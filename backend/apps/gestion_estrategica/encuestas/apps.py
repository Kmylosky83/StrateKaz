"""
Configuración de la app Encuestas Colaborativas
"""
from django.apps import AppConfig


class EncuestasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.encuestas'
    verbose_name = 'Encuestas Colaborativas DOFA'

    def ready(self):
        # Importar signals si es necesario
        pass
