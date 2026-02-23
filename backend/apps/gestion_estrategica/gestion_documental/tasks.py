"""
Tareas Celery para Gestión Documental.
- Verificar revisiones programadas vencidas
- Notificar documentos por vencer

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def verificar_documentos_revision_programada(self):
    """
    Diario 7AM: Detecta documentos PUBLICADOS cuya fecha_revision_programada < hoy.
    Genera log para futura integración con centro de notificaciones.
    """
    from django_tenants.utils import schema_context

    total_vencidos = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import DocumentoService

                docs_vencidos = DocumentoService.verificar_revisiones_programadas()
                if docs_vencidos:
                    logger.info(
                        f'{tenant.schema_name}: Documentos con revisión vencida: {len(docs_vencidos)}'
                    )
                    for doc_id, codigo, titulo, empresa_id, elaborado_por_id in docs_vencidos:
                        logger.warning(
                            f'[{tenant.schema_name}] Documento {codigo} "{titulo}" '
                            f'tiene revisión programada vencida. Responsable: usuario {elaborado_por_id}'
                        )
                    total_vencidos += len(docs_vencidos)
        except Exception as e:
            logger.error(
                f'Error verificando revisiones en tenant {tenant.schema_name}: {e}'
            )

    return {
        'status': 'ok',
        'documentos_vencidos': total_vencidos,
    }


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def notificar_documentos_por_vencer(self):
    """
    Diario 8AM: Avisa 15 días antes de que venza la revisión programada.
    """
    from django_tenants.utils import schema_context

    total_por_vencer = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import DocumentoService

                docs_por_vencer = DocumentoService.documentos_por_vencer(dias=15)
                if docs_por_vencer:
                    logger.info(
                        f'{tenant.schema_name}: Documentos por vencer revisión (15 días): '
                        f'{len(docs_por_vencer)}'
                    )
                    for doc_id, codigo, titulo, empresa_id, elaborado_por_id, fecha_rev in docs_por_vencer:
                        logger.info(
                            f'[{tenant.schema_name}] Documento {codigo} "{titulo}" '
                            f'vence revisión el {fecha_rev}. Responsable: usuario {elaborado_por_id}'
                        )
                    total_por_vencer += len(docs_por_vencer)
        except Exception as e:
            logger.error(
                f'Error notificando documentos en tenant {tenant.schema_name}: {e}'
            )

    return {
        'status': 'ok',
        'documentos_por_vencer': total_por_vencer,
    }
