"""
Tareas Celery para el módulo de Planeación Estratégica.

Tareas periódicas que verifican vencimientos de objetivos, cambios y KPIs,
y envían notificaciones a los responsables a través del Centro de Notificaciones.

Registradas en config/celery.py → beat_schedule
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone
from django.db.models import Q

from django_tenants.utils import schema_context, tenant_context
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
    name='planeacion.check_objectives_overdue',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def check_objectives_overdue():
    """
    Verifica objetivos estratégicos vencidos o próximos a vencer.

    - Marca como RETRASADO los objetivos que superaron due_date
    - Envía notificación OBJETIVO_PROXIMO_VENCER (7 días antes)
    - Envía notificación cuando un objetivo se marca como RETRASADO

    Frecuencia recomendada: Diaria a las 7:00 AM
    """
    from apps.gestion_estrategica.planeacion.models import StrategicObjective

    today = timezone.now().date()
    warn_date = today + timedelta(days=7)
    total_overdue = 0
    total_warned = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                # 1. Marcar como RETRASADO los objetivos vencidos
                overdue_qs = StrategicObjective.objects.filter(
                    is_active=True,
                    due_date__lt=today,
                    status__in=['PENDIENTE', 'EN_PROGRESO'],
                )
                for obj in overdue_qs:
                    obj.status = 'RETRASADO'
                    obj.save(update_fields=['status', 'updated_at'])
                    total_overdue += 1

                    # Notificar al responsable
                    if obj.responsible:
                        _send_notification(
                            tipo_codigo='TAREA_VENCIDA',
                            usuario=obj.responsible,
                            titulo=f'Objetivo vencido: {obj.code}',
                            mensaje=(
                                f'El objetivo "{obj.name}" venció el {obj.due_date.strftime("%d/%m/%Y")}. '
                                f'Por favor actualiza su estado.'
                            ),
                            url=f'/planeacion-estrategica/planeacion',
                            datos_extra={
                                'objetivo_id': obj.id,
                                'objetivo_code': obj.code,
                                'fecha_vencimiento': obj.due_date.isoformat(),
                            },
                        )

                # 2. Avisar objetivos próximos a vencer (7 días)
                upcoming_qs = StrategicObjective.objects.filter(
                    is_active=True,
                    due_date__gt=today,
                    due_date__lte=warn_date,
                    status__in=['PENDIENTE', 'EN_PROGRESO'],
                )
                for obj in upcoming_qs:
                    days_left = (obj.due_date - today).days
                    total_warned += 1

                    if obj.responsible:
                        _send_notification(
                            tipo_codigo='OBJETIVO_PROXIMO_VENCER',
                            usuario=obj.responsible,
                            titulo=f'Objetivo próximo a vencer: {obj.code}',
                            mensaje=(
                                f'El objetivo "{obj.name}" vence en {days_left} día(s). '
                                f'Avance actual: {obj.progress}%.'
                            ),
                            url=f'/planeacion-estrategica/planeacion',
                            datos_extra={
                                'objetivo_id': obj.id,
                                'objetivo_code': obj.code,
                                'dias_restantes': days_left,
                                'porcentaje_avance': obj.progress,
                            },
                        )

        except Exception as e:
            logger.error(f'[planeacion] Error en tenant {tenant.schema_name}: {e}')

    logger.info(
        f'[planeacion] check_objectives_overdue: '
        f'{total_overdue} vencidos, {total_warned} advertidos'
    )
    return {'overdue': total_overdue, 'warned': total_warned}


@shared_task(
    name='planeacion.check_changes_overdue',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def check_changes_overdue():
    """
    Verifica cambios organizacionales (GestionCambio) vencidos o próximos a vencer.

    Frecuencia recomendada: Diaria a las 7:15 AM
    """
    from apps.gestion_estrategica.planeacion.models import GestionCambio

    today = timezone.now().date()
    warn_date = today + timedelta(days=7)
    total_overdue = 0
    total_warned = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                # Cambios vencidos
                overdue_qs = GestionCambio.objects.filter(
                    is_active=True,
                    due_date__lt=today,
                    status__in=['IDENTIFICADO', 'ANALISIS', 'PLANIFICADO', 'EN_EJECUCION'],
                )
                for cambio in overdue_qs:
                    total_overdue += 1
                    if cambio.responsible:
                        _send_notification(
                            tipo_codigo='TAREA_VENCIDA',
                            usuario=cambio.responsible,
                            titulo=f'Cambio vencido: {cambio.code}',
                            mensaje=(
                                f'El cambio "{cambio.title}" venció el {cambio.due_date.strftime("%d/%m/%Y")}. '
                                f'Estado actual: {cambio.get_status_display()}.'
                            ),
                            url=f'/planeacion-estrategica/planeacion',
                            datos_extra={
                                'cambio_id': cambio.id,
                                'cambio_code': cambio.code,
                                'fecha_vencimiento': cambio.due_date.isoformat(),
                            },
                        )

                # Cambios próximos a vencer
                upcoming_qs = GestionCambio.objects.filter(
                    is_active=True,
                    due_date__gt=today,
                    due_date__lte=warn_date,
                    status__in=['IDENTIFICADO', 'ANALISIS', 'PLANIFICADO', 'EN_EJECUCION'],
                )
                for cambio in upcoming_qs:
                    days_left = (cambio.due_date - today).days
                    total_warned += 1
                    if cambio.responsible:
                        _send_notification(
                            tipo_codigo='OBJETIVO_PROXIMO_VENCER',
                            usuario=cambio.responsible,
                            titulo=f'Cambio próximo a vencer: {cambio.code}',
                            mensaje=(
                                f'El cambio "{cambio.title}" vence en {days_left} día(s). '
                                f'Estado: {cambio.get_status_display()}.'
                            ),
                            url=f'/planeacion-estrategica/planeacion',
                            datos_extra={
                                'cambio_id': cambio.id,
                                'cambio_code': cambio.code,
                                'dias_restantes': days_left,
                            },
                        )

        except Exception as e:
            logger.error(f'[planeacion] Error cambios tenant {tenant.schema_name}: {e}')

    logger.info(
        f'[planeacion] check_changes_overdue: '
        f'{total_overdue} vencidos, {total_warned} advertidos'
    )
    return {'overdue': total_overdue, 'warned': total_warned}


@shared_task(
    name='planeacion.check_kpi_measurements_due',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def check_kpi_measurements_due():
    """
    Verifica KPIs que necesitan medición según su frecuencia.

    Lógica: Si la última medición fue hace más tiempo del que permite
    la frecuencia, notifica al responsable.

    Frecuencia recomendada: Diaria a las 8:00 AM
    """
    from apps.gestion_estrategica.planeacion.models import KPIObjetivo

    today = timezone.now().date()
    total_due = 0

    # Mapeo frecuencia → días máximos sin medición
    freq_days = {
        'DIARIO': 1,
        'SEMANAL': 7,
        'QUINCENAL': 15,
        'MENSUAL': 35,
        'BIMESTRAL': 65,
        'TRIMESTRAL': 100,
        'SEMESTRAL': 190,
        'ANUAL': 380,
    }

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                kpis = KPIObjetivo.objects.filter(
                    is_active=True,
                    objective__is_active=True,
                ).select_related('objective', 'responsible')

                for kpi in kpis:
                    max_days = freq_days.get(kpi.frequency, 35)
                    last_date = kpi.last_measurement_date

                    if last_date is None:
                        # Nunca se ha medido — usar created_at como referencia
                        days_since = (today - kpi.created_at.date()).days
                    else:
                        days_since = (today - last_date).days

                    if days_since >= max_days:
                        total_due += 1
                        if kpi.responsible:
                            _send_notification(
                                tipo_codigo='NUEVA_TAREA',
                                usuario=kpi.responsible,
                                titulo=f'Medición pendiente: {kpi.name}',
                                mensaje=(
                                    f'El KPI "{kpi.name}" ({kpi.get_frequency_display()}) '
                                    f'lleva {days_since} días sin medición. '
                                    f'Objetivo: {kpi.objective.code}.'
                                ),
                                url=f'/planeacion-estrategica/planeacion',
                                datos_extra={
                                    'kpi_id': kpi.id,
                                    'kpi_name': kpi.name,
                                    'objetivo_code': kpi.objective.code,
                                    'dias_sin_medicion': days_since,
                                },
                            )

        except Exception as e:
            logger.error(f'[planeacion] Error KPIs tenant {tenant.schema_name}: {e}')

    logger.info(f'[planeacion] check_kpi_measurements_due: {total_due} pendientes')
    return {'due': total_due}


@shared_task(
    name='planeacion.check_plan_expiration',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def check_plan_expiration():
    """
    Verifica planes estratégicos próximos a vencer (30 días).

    Frecuencia recomendada: Semanal (lunes 8:00 AM)
    """
    from apps.gestion_estrategica.planeacion.models import StrategicPlan

    today = timezone.now().date()
    warn_date = today + timedelta(days=30)
    total = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                plans = StrategicPlan.objects.filter(
                    is_active=True,
                    status='VIGENTE',
                    end_date__gt=today,
                    end_date__lte=warn_date,
                )
                for plan in plans:
                    days_left = (plan.end_date - today).days
                    total += 1
                    if plan.approved_by:
                        _send_notification(
                            tipo_codigo='OBJETIVO_PROXIMO_VENCER',
                            usuario=plan.approved_by,
                            titulo=f'Plan próximo a vencer: {plan.name}',
                            mensaje=(
                                f'El plan estratégico "{plan.name}" finaliza en {days_left} días '
                                f'({plan.end_date.strftime("%d/%m/%Y")}). '
                                f'Considere planificar la renovación.'
                            ),
                            url=f'/planeacion-estrategica/planeacion',
                            datos_extra={
                                'plan_id': plan.id,
                                'plan_name': plan.name,
                                'dias_restantes': days_left,
                            },
                        )

        except Exception as e:
            logger.error(f'[planeacion] Error plan tenant {tenant.schema_name}: {e}')

    logger.info(f'[planeacion] check_plan_expiration: {total} planes por vencer')
    return {'expiring': total}


# =============================================================================
# HELPER: Envío seguro de notificaciones
# =============================================================================

def _send_notification(tipo_codigo, usuario, titulo, mensaje, url, datos_extra=None):
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
            prioridad='normal',
        )
    except Exception as e:
        logger.warning(f'[planeacion] No se pudo enviar notificación: {e}')
