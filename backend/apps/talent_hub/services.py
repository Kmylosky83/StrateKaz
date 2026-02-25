"""
Services: TalentHub — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.talent_hub.services import TalentHubService
    colaborador = TalentHubService.get_colaborador(id)
"""
from django.apps import apps


class TalentHubService:
    """Contrato publico del modulo talent_hub."""

    @staticmethod
    def get_colaborador(colaborador_id: int):
        """Obtiene un colaborador por ID (lazy import)."""
        Colaborador = apps.get_model('colaboradores', 'Colaborador')
        return Colaborador.objects.filter(id=colaborador_id, is_deleted=False).first()

    @staticmethod
    def get_colaboradores_activos():
        """Lista de colaboradores activos."""
        Colaborador = apps.get_model('colaboradores', 'Colaborador')
        return Colaborador.objects.filter(is_active=True, is_deleted=False)
