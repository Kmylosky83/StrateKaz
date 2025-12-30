"""
Configuración de la App de Recepción de Materia Prima
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class RecepcionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.production_ops.recepcion'
    verbose_name = 'Recepción de Materia Prima'

    def ready(self):
        """Importar señales cuando la app esté lista."""
        try:
            import apps.production_ops.recepcion.signals  # noqa
        except ImportError:
            pass
