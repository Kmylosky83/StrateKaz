"""
Configuración de la app Pedidos y Facturación
"""
from django.apps import AppConfig


class PedidosFacturacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sales_crm.pedidos_facturacion'
    verbose_name = 'Pedidos y Facturación'

    def ready(self):
        """Registra signals al iniciar la app"""
        import apps.sales_crm.pedidos_facturacion.signals  # noqa
