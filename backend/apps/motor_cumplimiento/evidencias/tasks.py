"""
Celery tasks para Evidencias Centralizadas.

NOTA: Itera sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.
"""
import logging
from celery import shared_task
from typing import Dict, Any

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(bind=True, max_retries=2)
def verificar_evidencias_vencidas(self) -> Dict[str, Any]:
    """
    Tarea periódica: Marca como VENCIDA las evidencias cuya fecha_vigencia
    ha pasado. Se ejecuta diariamente a las 6 AM.

    Scope: Todas las empresas (cross-tenant).
    """
    from django_tenants.utils import schema_context

    total_count = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import EvidenciaService

                count = EvidenciaService.verificar_vigencias(empresa_id=None)
                if count:
                    logger.info(
                        f'[Evidencias] {tenant.schema_name}: '
                        f'{count} evidencias vencidas'
                    )
                    total_count += count
        except Exception as e:
            logger.error(
                f'[Evidencias] Error en tenant {tenant.schema_name}: {e}'
            )

    return {
        'status': 'success',
        'evidencias_vencidas': total_count,
        'task_id': self.request.id,
    }
