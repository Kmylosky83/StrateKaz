"""
Services: ProductionOps — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.production_ops.services import ProductionOpsService
    resultado = ProductionOpsService.get_entity(id)
"""


class ProductionOpsService:
    """Contrato publico del modulo production_ops."""

    pass
