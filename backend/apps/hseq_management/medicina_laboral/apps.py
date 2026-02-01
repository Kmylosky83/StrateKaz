"""
Configuración de la app Medicina Laboral
"""
from django.apps import AppConfig


class MedicinaLaboralConfig(AppConfig):
    """Configuración de Medicina Laboral"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.medicina_laboral'
    verbose_name = 'Medicina Laboral'
