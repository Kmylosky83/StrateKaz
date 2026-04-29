"""
Services: SupplyChain — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.supply_chain.services import SupplyChainService
    proveedor = SupplyChainService.get_proveedor(id)
"""
from django.apps import apps


class SupplyChainService:
    """Contrato publico del modulo supply_chain."""

    @staticmethod
    def get_proveedor(proveedor_id: int):
        """Obtiene un proveedor por ID (lazy import)."""
        Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
        return Proveedor.objects.filter(id=proveedor_id, is_deleted=False).first()

    @staticmethod
    def get_proveedores_activos():
        """Lista de proveedores activos."""
        Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
        return Proveedor.objects.filter(is_active=True, is_deleted=False)
