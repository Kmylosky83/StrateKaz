"""
Configuración de la App de Mantenimiento de Equipos
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class MantenimientoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.production_ops.mantenimiento'
    verbose_name = 'Mantenimiento de Equipos'

    def ready(self):
        """Importar señales cuando la app esté lista."""
        try:
            import apps.production_ops.mantenimiento.signals  # noqa
        except ImportError:
            pass
