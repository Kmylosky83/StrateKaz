"""
Configuración de la aplicación Off-boarding
"""
from django.apps import AppConfig


class OffBoardingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.off_boarding'
    verbose_name = 'Off-boarding de Colaboradores'
