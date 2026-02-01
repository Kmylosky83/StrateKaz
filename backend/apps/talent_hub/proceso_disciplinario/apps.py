"""
Configuración de la app Proceso Disciplinario
"""
from django.apps import AppConfig


class ProcesoDisciplinarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.proceso_disciplinario'
    verbose_name = 'Proceso Disciplinario'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        try:
            import apps.talent_hub.proceso_disciplinario.signals  # noqa
        except ImportError:
            pass
