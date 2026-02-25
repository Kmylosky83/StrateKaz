"""
Services: SalesCRM — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.sales_crm.services import SalesCRMService
    cliente = SalesCRMService.get_cliente(id)
"""
from django.apps import apps


class SalesCRMService:
    """Contrato publico del modulo sales_crm."""

    @staticmethod
    def get_cliente(cliente_id: int):
        """Obtiene un cliente por ID (lazy import)."""
        Cliente = apps.get_model('gestion_clientes', 'Cliente')
        return Cliente.objects.filter(id=cliente_id, is_deleted=False).first()

    @staticmethod
    def get_clientes_activos():
        """Lista de clientes activos."""
        Cliente = apps.get_model('gestion_clientes', 'Cliente')
        return Cliente.objects.filter(is_active=True, is_deleted=False)
