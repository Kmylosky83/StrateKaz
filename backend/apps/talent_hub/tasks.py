"""
Tareas Celery para Talent Hub.

Tareas periódicas para:
- Verificar contratos próximos a vencer
- Verificar períodos de prueba por finalizar
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='apps.talent_hub.tasks.check_contratos_por_vencer',
    max_retries=2,
    default_retry_delay=60,
    time_limit=10 * 60,
    soft_time_limit=8 * 60,
)
def check_contratos_por_vencer(self):
    """
    Verifica contratos que vencen en 30, 15 o 7 días.
    Se ejecuta diariamente.
    """
    from apps.talent_hub.seleccion_contratacion.models import HistorialContrato
    from apps.talent_hub.services import NotificadorTH

    hoy = timezone.now().date()
    alertas = [30, 15, 7]
    total_notificados = 0

    for dias in alertas:
        fecha_vencimiento = hoy + timedelta(days=dias)
        contratos = HistorialContrato.objects.filter(
            fecha_fin=fecha_vencimiento,
            is_active=True,
        ).select_related('colaborador', 'tipo_contrato')

        for contrato in contratos:
            NotificadorTH.notificar_contrato_por_vencer(
                contrato.colaborador, dias
            )
            total_notificados += 1

    logger.info(
        f'check_contratos_por_vencer: {total_notificados} notificaciones enviadas'
    )
    return {'total_notificados': total_notificados}


@shared_task(
    bind=True,
    name='apps.talent_hub.tasks.check_periodos_prueba',
    max_retries=2,
    default_retry_delay=60,
    time_limit=10 * 60,
    soft_time_limit=8 * 60,
)
def check_periodos_prueba(self):
    """
    Verifica períodos de prueba que terminan en 15 o 7 días.
    Se ejecuta diariamente.
    """
    from apps.talent_hub.colaboradores.models import Colaborador
    from apps.talent_hub.services import NotificadorTH

    hoy = timezone.now().date()
    alertas = [15, 7]
    total_notificados = 0

    for dias in alertas:
        fecha_fin_prueba = hoy + timedelta(days=dias)
        colaboradores = Colaborador.objects.filter(
            fecha_fin_periodo_prueba=fecha_fin_prueba,
            estado='activo',
            is_active=True,
        ).select_related('cargo', 'cargo__parent_cargo')

        for colaborador in colaboradores:
            NotificadorTH.notificar_periodo_prueba(colaborador, dias)
            total_notificados += 1

    logger.info(
        f'check_periodos_prueba: {total_notificados} notificaciones enviadas'
    )
    return {'total_notificados': total_notificados}
