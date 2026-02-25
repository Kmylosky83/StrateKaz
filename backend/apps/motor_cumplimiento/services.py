"""
Services: MotorCumplimiento — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.motor_cumplimiento.services import MotorCumplimientoService
    requisito = MotorCumplimientoService.get_requisito_legal(id)
"""
from django.apps import apps


class MotorCumplimientoService:
    """Contrato publico del modulo motor_cumplimiento."""

    @staticmethod
    def get_requisito_legal(requisito_legal_id: int):
        """Obtiene un requisito legal por ID (lazy import)."""
        RequisitoLegal = apps.get_model('requisitos_legales', 'RequisitoLegal')
        return RequisitoLegal.objects.filter(id=requisito_legal_id, is_deleted=False).first()

    @staticmethod
    def get_requisitos_legales_activos():
        """Lista de requisitos legales activos."""
        RequisitoLegal = apps.get_model('requisitos_legales', 'RequisitoLegal')
        return RequisitoLegal.objects.filter(is_active=True, is_deleted=False)
