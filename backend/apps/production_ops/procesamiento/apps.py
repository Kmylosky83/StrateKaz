"""
Configuración de la App de Procesamiento de Producción
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class ProcesamientoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.production_ops.procesamiento'
    verbose_name = 'Procesamiento de Producción'

    def ready(self):
        """Importar señales cuando la app esté lista."""
        try:
            import apps.production_ops.procesamiento.signals  # noqa
        except ImportError:
            pass
