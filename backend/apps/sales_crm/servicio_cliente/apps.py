"""
Configuración de la aplicación Servicio al Cliente
"""
from django.apps import AppConfig


class ServicioClienteConfig(AppConfig):
    """Configuración de Servicio al Cliente"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sales_crm.servicio_cliente'
    verbose_name = 'Servicio al Cliente'

    def ready(self):
        """Importar señales cuando la app esté lista"""
        try:
            import apps.sales_crm.servicio_cliente.signals  # noqa
        except ImportError:
            pass
