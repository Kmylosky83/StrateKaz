"""
Services: WorkflowEngine — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.infraestructura.workflow_engine.services import WorkflowEngineService
    resultado = WorkflowEngineService.get_entity(id)
"""


class WorkflowEngineService:
    """Contrato publico del modulo workflow_engine."""

    pass
