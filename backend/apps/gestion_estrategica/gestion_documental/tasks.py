"""
Tareas Celery para Gestión Documental.
- Verificar revisiones programadas vencidas
- Notificar documentos por vencer

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.

Registradas en config/celery.py → beat_schedule
"""
import logging
from celery import shared_task

from django_tenants.utils import schema_context
from apps.tenant.models import Tenant

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Obtiene todos los tenants activos (excluye public)."""
    return Tenant.objects.exclude(
        schema_name='public'
    ).filter(
        is_active=True
    )


@shared_task(
    name='documental.verificar_revisiones_programadas',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def verificar_documentos_revision_programada():
    """
    Diario 7:15AM: Detecta documentos PUBLICADOS cuya fecha_revision_programada < hoy.
    Envía notificación al elaborador del documento.

    Frecuencia recomendada: Diaria a las 7:15 AM
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    total_vencidos = 0
    total_notificados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import DocumentoService

                docs_vencidos = DocumentoService.verificar_revisiones_programadas()
                if docs_vencidos:
                    logger.info(
                        f'{tenant.schema_name}: Documentos con revisión vencida: '
                        f'{len(docs_vencidos)}'
                    )
                    for doc_id, codigo, titulo, empresa_id, elaborado_por_id in docs_vencidos:
                        logger.warning(
                            f'[{tenant.schema_name}] Documento {codigo} "{titulo}" '
                            f'tiene revisión programada vencida. '
                            f'Responsable: usuario {elaborado_por_id}'
                        )

                        # Notificar al elaborador
                        if elaborado_por_id:
                            try:
                                usuario = User.objects.get(id=elaborado_por_id)
                                _send_notification(
                                    tipo_codigo='DOCUMENTO_REVISION_VENCIDA',
                                    usuario=usuario,
                                    titulo=f'Documento con revisión vencida: {codigo}',
                                    mensaje=(
                                        f'El documento "{titulo}" ({codigo}) tiene su '
                                        f'revisión programada vencida. Por favor programe '
                                        f'la revisión correspondiente.'
                                    ),
                                    url='/sistema-gestion/gestion-documental',
                                    datos_extra={
                                        'documento_id': doc_id,
                                        'codigo': codigo,
                                        'titulo': titulo,
                                    },
                                    prioridad='alta',
                                )
                                total_notificados += 1
                            except User.DoesNotExist:
                                logger.warning(
                                    f'Usuario {elaborado_por_id} no encontrado '
                                    f'para notificación de documento {codigo}'
                                )

                    total_vencidos += len(docs_vencidos)
        except Exception as e:
            logger.error(
                f'[documental] Error verificando revisiones en tenant '
                f'{tenant.schema_name}: {e}'
            )

    logger.info(
        f'[documental] verificar_revisiones_programadas: '
        f'{total_vencidos} vencidos, {total_notificados} notificados'
    )
    return {
        'status': 'ok',
        'documentos_vencidos': total_vencidos,
        'notificados': total_notificados,
    }


@shared_task(
    name='documental.notificar_documentos_por_vencer',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def notificar_documentos_por_vencer():
    """
    Diario 8AM: Avisa 15 días antes de que venza la revisión programada.
    Envía notificación al elaborador del documento.

    Frecuencia recomendada: Diaria a las 8:00 AM
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    total_por_vencer = 0
    total_notificados = 0

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
                            f'vence revisión el {fecha_rev}. '
                            f'Responsable: usuario {elaborado_por_id}'
                        )

                        # Notificar al elaborador
                        if elaborado_por_id:
                            try:
                                usuario = User.objects.get(id=elaborado_por_id)
                                from django.utils import timezone

                                hoy = timezone.now().date()
                                dias_restantes = (fecha_rev - hoy).days

                                _send_notification(
                                    tipo_codigo='DOCUMENTO_PROXIMO_REVISION',
                                    usuario=usuario,
                                    titulo=f'Documento próximo a revisión: {codigo}',
                                    mensaje=(
                                        f'El documento "{titulo}" ({codigo}) tiene '
                                        f'revisión programada para el '
                                        f'{fecha_rev.strftime("%d/%m/%Y")} '
                                        f'({dias_restantes} días restantes). '
                                        f'Planifique la revisión con anticipación.'
                                    ),
                                    url='/sistema-gestion/gestion-documental',
                                    datos_extra={
                                        'documento_id': doc_id,
                                        'codigo': codigo,
                                        'titulo': titulo,
                                        'fecha_revision': fecha_rev.isoformat(),
                                        'dias_restantes': dias_restantes,
                                    },
                                )
                                total_notificados += 1
                            except User.DoesNotExist:
                                logger.warning(
                                    f'Usuario {elaborado_por_id} no encontrado '
                                    f'para notificación de documento {codigo}'
                                )

                    total_por_vencer += len(docs_por_vencer)
        except Exception as e:
            logger.error(
                f'[documental] Error notificando documentos en tenant '
                f'{tenant.schema_name}: {e}'
            )

    logger.info(
        f'[documental] notificar_documentos_por_vencer: '
        f'{total_por_vencer} por vencer, {total_notificados} notificados'
    )
    return {
        'status': 'ok',
        'documentos_por_vencer': total_por_vencer,
        'notificados': total_notificados,
    }


# =============================================================================
# HELPER: Envío seguro de notificaciones
# =============================================================================

def _send_notification(tipo_codigo, usuario, titulo, mensaje, url, datos_extra=None,
                       prioridad='normal'):
    """
    Envía notificación de forma segura (no falla si el servicio no está disponible).
    """
    try:
        from apps.audit_system.centro_notificaciones.services import NotificationService

        NotificationService.send_notification(
            tipo_codigo=tipo_codigo,
            usuario=usuario,
            titulo=titulo,
            mensaje=mensaje,
            url=url,
            datos_extra=datos_extra or {},
            prioridad=prioridad,
        )
    except Exception as e:
        logger.warning(f'[documental] No se pudo enviar notificación: {e}')
