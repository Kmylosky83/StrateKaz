"""
Servicio de Onboarding Automático - Talent Hub
Sprint 20: Asignación automática de checklist y módulos de inducción

Cuando se contrata un nuevo colaborador, este servicio:
1. Busca los ItemChecklist que aplican al cargo (o a todos los cargos)
2. Crea ChecklistIngreso para cada item
3. Busca AsignacionPorCargo para el cargo del colaborador
4. Crea EjecucionIntegral para cada módulo asignado
"""
import logging
from datetime import timedelta

from django.apps import apps
from django.utils import timezone

logger = logging.getLogger(__name__)


class OnboardingService:
    """
    Servicio de onboarding automático.

    Crea automáticamente las tareas de inducción basándose
    en la configuración por cargo.
    """

    @classmethod
    def iniciar_onboarding(cls, colaborador, empresa, usuario) -> dict:
        """
        Inicia el proceso de onboarding para un nuevo colaborador.

        Busca la configuración de ItemChecklist y AsignacionPorCargo
        para el cargo del colaborador y crea los registros correspondientes.

        Args:
            colaborador: Colaborador recién creado
            empresa: EmpresaConfig
            usuario: User que ejecuta la acción

        Returns:
            {
                'checklist_items': int (cantidad de items creados),
                'modulos_asignados': int (cantidad de módulos asignados),
            }
        """
        checklist_count = cls._crear_checklist_ingreso(
            colaborador=colaborador,
            empresa=empresa,
            usuario=usuario,
        )

        modulos_count = cls._crear_ejecuciones_induccion(
            colaborador=colaborador,
            empresa=empresa,
            usuario=usuario,
        )

        if checklist_count > 0 or modulos_count > 0:
            logger.info(
                f"Onboarding iniciado para {colaborador.get_nombre_completo()}: "
                f"{checklist_count} items checklist, {modulos_count} módulos"
            )

        return {
            'checklist_items': checklist_count,
            'modulos_asignados': modulos_count,
        }

    @classmethod
    def _crear_checklist_ingreso(cls, colaborador, empresa, usuario) -> int:
        """
        Crea ChecklistIngreso para cada ItemChecklist aplicable al cargo.

        Items aplican si:
        - aplica_a_todos = True, o
        - cargo está en cargos_aplicables M2M
        """
        ItemChecklist = apps.get_model('onboarding_induccion', 'ItemChecklist')
        ChecklistIngreso = apps.get_model('onboarding_induccion', 'ChecklistIngreso')

        # Items que aplican a todos los cargos
        items_todos = ItemChecklist.objects.filter(
            is_active=True,
            aplica_a_todos=True,
        )

        # Items específicos para este cargo
        items_cargo = ItemChecklist.objects.filter(
            is_active=True,
            aplica_a_todos=False,
            cargos_aplicables=colaborador.cargo,
        )

        # Unir sin duplicados
        items = (items_todos | items_cargo).distinct()

        created_count = 0
        for item in items:
            _, created = ChecklistIngreso.objects.get_or_create(
                colaborador=colaborador,
                item=item,
                defaults={
                    'empresa': empresa,
                    'estado': 'pendiente',
                    'created_by': usuario,
                    'updated_by': usuario,
                }
            )
            if created:
                created_count += 1

        return created_count

    @classmethod
    def _crear_ejecuciones_induccion(cls, colaborador, empresa, usuario) -> int:
        """
        Crea EjecucionIntegral para cada ModuloInduccion asignado al cargo.

        Usa AsignacionPorCargo para determinar qué módulos corresponden.
        """
        AsignacionPorCargo = apps.get_model('onboarding_induccion', 'AsignacionPorCargo')
        EjecucionIntegral = apps.get_model('onboarding_induccion', 'EjecucionIntegral')

        asignaciones = AsignacionPorCargo.objects.filter(
            cargo=colaborador.cargo,
            is_active=True,
        ).select_related('modulo').order_by('orden_ejecucion')

        created_count = 0
        fecha_ingreso = colaborador.fecha_ingreso

        for asignacion in asignaciones:
            fecha_limite = fecha_ingreso + timedelta(
                days=asignacion.dias_para_completar
            )

            _, created = EjecucionIntegral.objects.get_or_create(
                colaborador=colaborador,
                modulo=asignacion.modulo,
                defaults={
                    'empresa': empresa,
                    'estado': 'pendiente',
                    'fecha_limite': fecha_limite,
                    'created_by': usuario,
                    'updated_by': usuario,
                }
            )
            if created:
                created_count += 1

        return created_count
