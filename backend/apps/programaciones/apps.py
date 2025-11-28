"""
Configuración de la aplicación Programaciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class ProgramacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.programaciones'
    verbose_name = 'Programaciones de Recolección'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        try:
            import apps.programaciones.signals  # noqa
        except ImportError:
            pass
