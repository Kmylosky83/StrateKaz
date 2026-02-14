"""
Configuración de la app Firma Digital - Workflow Engine
"""
from django.apps import AppConfig


class FirmaDigitalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.workflow_engine.firma_digital'
    verbose_name = 'Firma Digital'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        import apps.workflow_engine.firma_digital.signals  # noqa: F401
