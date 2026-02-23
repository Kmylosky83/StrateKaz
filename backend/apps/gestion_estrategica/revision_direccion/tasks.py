"""
Tareas Celery para Revision por la Direccion

- verificar_compromisos_vencidos: Marca compromisos vencidos automaticamente
- enviar_recordatorio_revision: Recordatorio si revision en proximos 3 dias

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(bind=True, name='apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos')
def verificar_compromisos_vencidos(self):
    """
    Verifica compromisos vencidos y actualiza su estado.
    Se ejecuta diariamente a las 7 AM.
    """
    from django_tenants.utils import schema_context
    from apps.gestion_estrategica.revision_direccion.models import CompromisoRevision

    hoy = timezone.now().date()
    total_count = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                compromisos_vencidos = CompromisoRevision.objects.filter(
                    fecha_compromiso__lt=hoy,
                    estado__in=['pendiente', 'en_progreso'],
                    is_active=True,
                )

                count = 0
                for compromiso in compromisos_vencidos:
                    compromiso.estado = 'vencido'
                    compromiso.save(update_fields=['estado', 'updated_at'])
                    count += 1

                if count > 0:
                    logger.info(
                        f'[RevisionDireccion] {tenant.schema_name}: '
                        f'{count} compromisos marcados como vencidos'
                    )
                    total_count += count
        except Exception as e:
            logger.error(
                f'[RevisionDireccion] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'compromisos_vencidos': total_count, 'fecha': str(hoy)}


@shared_task(bind=True, name='apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision')
def enviar_recordatorio_revision(self):
    """
    Envia recordatorio de revisiones programadas en los proximos 3 dias.
    Se ejecuta diariamente a las 8 AM.
    """
    from django_tenants.utils import schema_context
    from apps.gestion_estrategica.revision_direccion.models import ProgramaRevision

    hoy = timezone.now().date()
    limite = hoy + timedelta(days=3)
    total_count = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                proximas = ProgramaRevision.objects.filter(
                    fecha_programada__gte=hoy,
                    fecha_programada__lte=limite,
                    estado='programada',
                    is_active=True,
                )

                count = 0
                for programacion in proximas:
                    if not programacion.recordatorio_enviado:
                        programacion.recordatorio_enviado = True
                        programacion.save(update_fields=['recordatorio_enviado', 'updated_at'])
                        count += 1
                        logger.info(
                            f'[RevisionDireccion] {tenant.schema_name}: '
                            f'Recordatorio para revision {programacion.codigo} '
                            f'programada el {programacion.fecha_programada}'
                        )

                total_count += count
        except Exception as e:
            logger.error(
                f'[RevisionDireccion] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'recordatorios_enviados': total_count, 'fecha': str(hoy)}
