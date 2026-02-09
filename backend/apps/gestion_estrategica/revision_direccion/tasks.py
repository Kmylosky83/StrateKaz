"""
Tareas Celery para Revision por la Direccion

- verificar_compromisos_vencidos: Marca compromisos vencidos automaticamente
- enviar_recordatorio_revision: Recordatorio si revision en proximos 3 dias
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='apps.gestion_estrategica.revision_direccion.tasks.verificar_compromisos_vencidos')
def verificar_compromisos_vencidos(self):
    """
    Verifica compromisos vencidos y actualiza su estado.
    Se ejecuta diariamente a las 7 AM.
    """
    from apps.gestion_estrategica.revision_direccion.models import CompromisoRevision

    hoy = timezone.now().date()
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
        logger.info(f'[RevisionDireccion] {count} compromisos marcados como vencidos')

    return {'compromisos_vencidos': count, 'fecha': str(hoy)}


@shared_task(bind=True, name='apps.gestion_estrategica.revision_direccion.tasks.enviar_recordatorio_revision')
def enviar_recordatorio_revision(self):
    """
    Envia recordatorio de revisiones programadas en los proximos 3 dias.
    Se ejecuta diariamente a las 8 AM.
    """
    from apps.gestion_estrategica.revision_direccion.models import ProgramaRevision

    hoy = timezone.now().date()
    limite = hoy + timedelta(days=3)

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
                f'[RevisionDireccion] Recordatorio para revision {programacion.codigo} '
                f'programada el {programacion.fecha_programada}'
            )

    return {'recordatorios_enviados': count, 'fecha': str(hoy)}
