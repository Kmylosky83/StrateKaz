"""
Services: MotorRiesgos — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.motor_riesgos.services import MotorRiesgosService
    riesgo = MotorRiesgosService.get_riesgo_proceso(id)
"""
from django.apps import apps


class MotorRiesgosService:
    """Contrato publico del modulo motor_riesgos."""

    @staticmethod
    def get_riesgo_proceso(riesgo_proceso_id: int):
        """Obtiene un riesgo de proceso por ID (lazy import)."""
        RiesgoProceso = apps.get_model('riesgos_procesos', 'RiesgoProceso')
        return RiesgoProceso.objects.filter(id=riesgo_proceso_id, is_deleted=False).first()

    @staticmethod
    def get_riesgos_procesos_activos():
        """Lista de riesgos de proceso activos."""
        RiesgoProceso = apps.get_model('riesgos_procesos', 'RiesgoProceso')
        return RiesgoProceso.objects.filter(is_active=True, is_deleted=False)
