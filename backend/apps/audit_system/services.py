"""
Services: AuditSystem — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.audit_system.services import AuditSystemService
    resultado = AuditSystemService.get_entity(id)
"""


class AuditSystemService:
    """Contrato publico del modulo audit_system."""

    pass
