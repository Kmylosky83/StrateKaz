"""
Configuración de la App de Producto Terminado
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class ProductoTerminadoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.production_ops.producto_terminado'
    verbose_name = 'Producto Terminado'

    def ready(self):
        """Importar señales cuando la app esté lista."""
        try:
            import apps.production_ops.producto_terminado.signals  # noqa
        except ImportError:
            pass
