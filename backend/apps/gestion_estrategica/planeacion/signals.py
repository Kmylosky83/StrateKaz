"""
Signals para el módulo de Planeación Estratégica.

Disparan notificaciones automáticas cuando ocurren eventos clave:
- Cambio de estado en GestionCambio (transition_status)
- Asignación de responsable en StrategicObjective
- Nueva medición de KPI con semáforo rojo
"""
import logging

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(pre_save, sender='planeacion.GestionCambio')
def gestion_cambio_status_changed(sender, instance, **kwargs):
    """
    Detecta cambios de estado en GestionCambio y notifica al responsable.

    Se ejecuta ANTES de guardar para comparar old_status vs new_status.
    """
    if not instance.pk:
        return  # Nuevo registro, no hay estado anterior

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    if old.status != instance.status and instance.responsible:
        _send_notification_safe(
            tipo_codigo='NUEVA_TAREA',
            usuario=instance.responsible,
            titulo=f'Cambio de estado: {instance.code}',
            mensaje=(
                f'El cambio "{instance.title}" pasó de '
                f'"{old.get_status_display()}" a "{instance.get_status_display()}".'
            ),
            url='/planeacion-estrategica/planeacion',
            datos_extra={
                'cambio_id': instance.pk,
                'cambio_code': instance.code,
                'old_status': old.status,
                'new_status': instance.status,
            },
        )


@receiver(pre_save, sender='planeacion.StrategicObjective')
def objective_responsible_assigned(sender, instance, **kwargs):
    """
    Notifica cuando se asigna un nuevo responsable a un objetivo estratégico.
    """
    if not instance.pk:
        return

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    # Responsable cambió y el nuevo es diferente de null
    if (
        old.responsible_id != instance.responsible_id
        and instance.responsible
        and instance.responsible_id != (old.responsible_id or 0)
    ):
        _send_notification_safe(
            tipo_codigo='NUEVA_TAREA',
            usuario=instance.responsible,
            titulo=f'Objetivo asignado: {instance.code}',
            mensaje=(
                f'Se te ha asignado el objetivo estratégico "{instance.name}" '
                f'({instance.get_bsc_perspective_display()}). '
                f'Fecha límite: {instance.due_date.strftime("%d/%m/%Y") if instance.due_date else "Sin definir"}.'
            ),
            url='/planeacion-estrategica/planeacion',
            datos_extra={
                'objetivo_id': instance.pk,
                'objetivo_code': instance.code,
                'perspectiva': instance.bsc_perspective,
            },
        )


@receiver(post_save, sender='planeacion.MedicionKPI')
def kpi_measurement_alert(sender, instance, created, **kwargs):
    """
    Evalúa el semáforo del KPI tras una nueva medición.
    Si el KPI está en rojo, notifica al responsable.
    """
    if not created:
        return

    kpi = instance.kpi
    if kpi.status_semaforo == 'ROJO' and kpi.responsible:
        _send_notification_safe(
            tipo_codigo='TAREA_VENCIDA',
            usuario=kpi.responsible,
            titulo=f'KPI en alerta: {kpi.name}',
            mensaje=(
                f'El KPI "{kpi.name}" ({kpi.objective.code}) está en semáforo ROJO. '
                f'Valor actual: {instance.value}{kpi.unit}. '
                f'Meta: {kpi.target_value}{kpi.unit}.'
            ),
            url='/planeacion-estrategica/planeacion',
            datos_extra={
                'kpi_id': kpi.pk,
                'kpi_name': kpi.name,
                'valor_actual': str(instance.value),
                'valor_meta': str(kpi.target_value),
                'semaforo': 'ROJO',
            },
        )


def _send_notification_safe(tipo_codigo, usuario, titulo, mensaje, url, datos_extra=None):
    """
    Envío seguro — nunca rompe el flujo principal si la notificación falla.
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
        )
    except Exception as e:
        logger.warning(f'[planeacion.signals] No se pudo enviar notificación: {e}')
