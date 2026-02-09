"""
Tareas Celery para Gestión Documental.
- Verificar revisiones programadas vencidas
- Notificar documentos por vencer
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def verificar_documentos_revision_programada(self):
    """
    Diario 7AM: Detecta documentos PUBLICADOS cuya fecha_revision_programada < hoy.
    Genera log para futura integración con centro de notificaciones.
    """
    try:
        from .services import DocumentoService

        docs_vencidos = DocumentoService.verificar_revisiones_programadas()
        if docs_vencidos:
            logger.info(
                f'Documentos con revisión vencida: {len(docs_vencidos)}'
            )
            for doc_id, codigo, titulo, empresa_id, elaborado_por_id in docs_vencidos:
                logger.warning(
                    f'[Empresa {empresa_id}] Documento {codigo} "{titulo}" '
                    f'tiene revisión programada vencida. Responsable: usuario {elaborado_por_id}'
                )
        else:
            logger.info('No hay documentos con revisión programada vencida')

        return {
            'status': 'ok',
            'documentos_vencidos': len(docs_vencidos),
        }

    except Exception as exc:
        logger.error(f'Error verificando revisiones: {exc}')
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def notificar_documentos_por_vencer(self):
    """
    Diario 8AM: Avisa 15 días antes de que venza la revisión programada.
    """
    try:
        from .services import DocumentoService

        docs_por_vencer = DocumentoService.documentos_por_vencer(dias=15)
        if docs_por_vencer:
            logger.info(
                f'Documentos por vencer revisión (15 días): {len(docs_por_vencer)}'
            )
            for doc_id, codigo, titulo, empresa_id, elaborado_por_id, fecha_rev in docs_por_vencer:
                logger.info(
                    f'[Empresa {empresa_id}] Documento {codigo} "{titulo}" '
                    f'vence revisión el {fecha_rev}. Responsable: usuario {elaborado_por_id}'
                )
        else:
            logger.info('No hay documentos próximos a vencer revisión')

        return {
            'status': 'ok',
            'documentos_por_vencer': len(docs_por_vencer),
        }

    except Exception as exc:
        logger.error(f'Error notificando documentos por vencer: {exc}')
        raise self.retry(exc=exc)
