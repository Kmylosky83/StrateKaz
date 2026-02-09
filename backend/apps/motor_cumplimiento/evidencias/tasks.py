"""
Celery tasks para Evidencias Centralizadas.
"""
import logging
from celery import shared_task
from typing import Dict, Any

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def verificar_evidencias_vencidas(self) -> Dict[str, Any]:
    """
    Tarea periódica: Marca como VENCIDA las evidencias cuya fecha_vigencia
    ha pasado. Se ejecuta diariamente a las 6 AM.

    Scope: Todas las empresas (cross-tenant).
    """
    try:
        from .services import EvidenciaService

        count = EvidenciaService.verificar_vigencias(empresa_id=None)

        logger.info(f"[Task {self.request.id}] Evidencias vencidas: {count}")
        return {
            'status': 'success',
            'evidencias_vencidas': count,
            'task_id': self.request.id,
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error verificando vigencias: {str(exc)}")
        raise self.retry(exc=exc)
