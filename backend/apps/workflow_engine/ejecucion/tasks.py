"""
Celery tasks para el motor de ejecucion de workflows.

Tasks:
- verificar_tareas_vencidas: Cada 5 min, chequea SLA y escala/notifica
- enviar_notificacion_workflow: On-demand, envia email para NotificacionFlujo
- ejecutar_evento_temporizador: Delayed, dispara evento timer
- actualizar_metricas_flujo: Diario, calcula MetricaFlujo agregadas

NOTA: Tareas periódicas (Beat) iteran sobre tenants activos usando schema_context.
Tareas on-demand reciben schema_name como argumento.
"""
import logging
from datetime import timedelta
from decimal import Decimal

from celery import shared_task
from django.utils import timezone
from django.db.models import Avg, Count, Q, F

logger = logging.getLogger('workflow')


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


@shared_task(
    bind=True,
    name='apps.workflow_engine.ejecucion.tasks.verificar_tareas_vencidas',
    max_retries=2,
    default_retry_delay=60,
    time_limit=5 * 60,
    soft_time_limit=4 * 60,
)
def verificar_tareas_vencidas(self):
    """
    Verifica tareas vencidas y aplica acciones SLA.

    Ejecuta cada 5 minutos via Celery Beat.
    Busca tareas activas cuya fecha_vencimiento ya paso,
    y aplica la accion definida en ReglaSLA (notificar/escalar/reasignar).
    """
    from django_tenants.utils import schema_context

    ahora = timezone.now()
    total_procesadas = 0
    total_escaladas = 0
    total_notificadas = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                p, e, n = _verificar_tareas_en_tenant(ahora)
                total_procesadas += p
                total_escaladas += e
                total_notificadas += n
        except Exception as ex:
            logger.error(
                f'[SLA Check] Error en tenant {tenant.schema_name}: {ex}'
            )

    result = {
        'procesadas': total_procesadas,
        'escaladas': total_escaladas,
        'notificadas': total_notificadas,
        'timestamp': ahora.isoformat(),
    }
    if total_procesadas > 0:
        logger.info(f"[SLA Check] {result}")

    return result


def _verificar_tareas_en_tenant(ahora):
    """Verifica tareas vencidas dentro de un schema tenant."""
    from apps.workflow_engine.ejecucion.models import TareaActiva, NotificacionFlujo
    from apps.workflow_engine.monitoreo.models import AlertaFlujo, ReglaSLA

    tareas_vencidas = TareaActiva.objects.filter(
        fecha_vencimiento__lt=ahora,
        estado__in=['PENDIENTE', 'EN_PROGRESO'],
    ).select_related('instancia', 'nodo', 'asignado_a')

    procesadas = 0
    escaladas = 0
    notificadas = 0

    for tarea in tareas_vencidas:
        alerta_existente = AlertaFlujo.objects.filter(
            tarea=tarea,
            tipo='vencimiento',
            estado='activa',
        ).exists()

        if alerta_existente:
            continue

        AlertaFlujo.objects.create(
            tipo='vencimiento',
            severidad='alta',
            instancia=tarea.instancia,
            tarea=tarea,
            titulo=f'Tarea vencida: {tarea.nombre_tarea}',
            descripcion=(
                f'La tarea "{tarea.nombre_tarea}" ({tarea.codigo_tarea}) '
                f'venció el {tarea.fecha_vencimiento:%Y-%m-%d %H:%M}. '
                f'Asignada a: {tarea.asignado_a or "Sin asignar"}.'
            ),
            empresa_id=tarea.empresa_id,
        )

        regla = ReglaSLA.objects.filter(
            Q(nodo=tarea.nodo) | Q(nodo__isnull=True),
            plantilla=tarea.instancia.plantilla,
            is_active=True,
        ).order_by('-nodo_id').first()

        if regla:
            if regla.accion_vencimiento == 'escalar':
                tarea.estado = 'ESCALADA'
                tarea.motivo_escalamiento = (
                    f'Escalada automaticamente por vencimiento de SLA. '
                    f'Regla: {regla.nombre}'
                )
                tarea.save()
                escaladas += 1

                if tarea.asignado_a:
                    NotificacionFlujo.objects.create(
                        instancia=tarea.instancia,
                        tarea=tarea,
                        destinatario=tarea.asignado_a,
                        tipo_notificacion='TAREA_ESCALADA',
                        titulo=f'Tarea escalada: {tarea.nombre_tarea}',
                        mensaje=(
                            f'La tarea "{tarea.nombre_tarea}" ha sido escalada '
                            f'por vencimiento de SLA.'
                        ),
                        prioridad='URGENTE',
                        empresa_id=tarea.empresa_id,
                    )

            elif regla.accion_vencimiento == 'notificar':
                if tarea.asignado_a:
                    NotificacionFlujo.objects.create(
                        instancia=tarea.instancia,
                        tarea=tarea,
                        destinatario=tarea.asignado_a,
                        tipo_notificacion='TAREA_VENCIDA',
                        titulo=f'Tarea vencida: {tarea.nombre_tarea}',
                        mensaje=(
                            f'La tarea "{tarea.nombre_tarea}" ha superado '
                            f'su fecha limite. Por favor completela.'
                        ),
                        prioridad='ALTA',
                        empresa_id=tarea.empresa_id,
                    )
                    notificadas += 1

        procesadas += 1

    return procesadas, escaladas, notificadas


@shared_task(
    bind=True,
    name='apps.workflow_engine.ejecucion.tasks.enviar_notificacion_workflow',
    max_retries=3,
    default_retry_delay=30,
    time_limit=2 * 60,
    soft_time_limit=90,
)
def enviar_notificacion_workflow(self, notificacion_id: int, schema_name: str = None):
    """
    Envia notificacion por email para un evento de workflow.

    Llamada asincronamente al crear una NotificacionFlujo.
    Requiere schema_name para ejecutar en el contexto correcto del tenant.
    """
    from django_tenants.utils import schema_context
    from apps.workflow_engine.ejecucion.models import NotificacionFlujo

    if not schema_name:
        logger.error(
            f"Notificacion {notificacion_id}: schema_name no proporcionado"
        )
        return {'status': 'no_schema'}

    try:
        with schema_context(schema_name):
            try:
                notificacion = NotificacionFlujo.objects.select_related(
                    'destinatario', 'instancia'
                ).get(id=notificacion_id)
            except NotificacionFlujo.DoesNotExist:
                logger.error(f"Notificacion {notificacion_id} no encontrada")
                return {'status': 'not_found'}

            if notificacion.enviada_email:
                return {'status': 'already_sent'}

            destinatario = notificacion.destinatario
            if not destinatario or not destinatario.email:
                logger.warning(
                    f"Notificacion {notificacion_id}: destinatario sin email"
                )
                return {'status': 'no_email'}

            try:
                from apps.core.tasks import send_email_async

                send_email_async.delay(
                    subject=notificacion.titulo,
                    message=notificacion.mensaje,
                    recipient_list=[destinatario.email],
                    html_message=None,
                )

                notificacion.enviada_email = True
                notificacion.fecha_envio_email = timezone.now()
                notificacion.email_enviado_exitoso = True
                notificacion.save(update_fields=[
                    'enviada_email', 'fecha_envio_email', 'email_enviado_exitoso'
                ])

                return {'status': 'sent', 'to': destinatario.email}

            except Exception as e:
                logger.error(
                    f"Error enviando email para notificacion {notificacion_id}: {e}"
                )
                notificacion.email_enviado_exitoso = False
                notificacion.save(update_fields=['email_enviado_exitoso'])
                raise self.retry(exc=e)

    except Exception as e:
        if not isinstance(e, self.MaxRetriesExceededError):
            logger.error(
                f"Error en notificacion {notificacion_id} ({schema_name}): {e}"
            )
        raise


@shared_task(
    bind=True,
    name='apps.workflow_engine.ejecucion.tasks.ejecutar_evento_temporizador',
    max_retries=2,
    default_retry_delay=120,
    time_limit=5 * 60,
    soft_time_limit=4 * 60,
)
def ejecutar_evento_temporizador(self, instancia_id: int, nodo_evento_id: int, schema_name: str = None):
    """
    Dispara un evento temporizador (timer) y avanza el flujo.

    Programada por EventoNodeHandler con countdown.
    Requiere schema_name para ejecutar en el contexto correcto del tenant.
    """
    from django_tenants.utils import schema_context

    if not schema_name:
        logger.error(
            f"Timer instancia={instancia_id}, nodo={nodo_evento_id}: "
            f"schema_name no proporcionado"
        )
        return {'status': 'no_schema'}

    with schema_context(schema_name):
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo
        from apps.workflow_engine.disenador_flujos.models import NodoFlujo, TransicionFlujo

        try:
            instancia = InstanciaFlujo.objects.get(id=instancia_id)
        except InstanciaFlujo.DoesNotExist:
            logger.error(f"InstanciaFlujo {instancia_id} no encontrada para timer")
            return {'status': 'instance_not_found'}

        if instancia.estado in ('COMPLETADO', 'CANCELADO'):
            logger.info(
                f"[WF:{instancia.codigo_instancia}] Timer ignorado: "
                f"instancia ya {instancia.estado}"
            )
            return {'status': 'instance_finished'}

        try:
            nodo = NodoFlujo.objects.get(id=nodo_evento_id)
        except NodoFlujo.DoesNotExist:
            logger.error(f"NodoFlujo {nodo_evento_id} no encontrado para timer")
            return {'status': 'node_not_found'}

        from apps.workflow_engine.ejecucion.services import WorkflowExecutionService

        transiciones = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino')

        if transiciones.exists():
            datos_contexto = instancia.data_contexto or {}
            WorkflowExecutionService._avanzar_desde_nodo(
                instancia=instancia,
                nodo_actual=nodo,
                usuario=None,
                datos_contexto=datos_contexto,
                depth=0,
            )
            logger.info(
                f"[WF:{instancia.codigo_instancia}] Timer disparado "
                f"para nodo '{nodo.codigo}'"
            )
            return {'status': 'advanced'}

        return {'status': 'no_transitions'}


@shared_task(
    bind=True,
    name='apps.workflow_engine.ejecucion.tasks.actualizar_metricas_flujo',
    max_retries=1,
    time_limit=10 * 60,
    soft_time_limit=8 * 60,
)
def actualizar_metricas_flujo(self):
    """
    Actualiza las metricas agregadas de flujos de trabajo.

    Ejecuta diariamente a la 1 AM via Celery Beat.
    Calcula metricas del mes en curso por cada plantilla activa.
    """
    from django_tenants.utils import schema_context

    ahora = timezone.now()
    inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total_actualizadas = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                count = _actualizar_metricas_en_tenant(ahora, inicio_mes)
                total_actualizadas += count
        except Exception as e:
            logger.error(
                f'[Metricas] Error en tenant {tenant.schema_name}: {e}'
            )

    result = {
        'plantillas_procesadas': total_actualizadas,
        'periodo': inicio_mes.date().isoformat(),
        'timestamp': ahora.isoformat(),
    }
    if total_actualizadas > 0:
        logger.info(f"[Metricas] {result}")

    return result


def _actualizar_metricas_en_tenant(ahora, inicio_mes):
    """Actualiza métricas de workflows dentro de un schema tenant."""
    from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
    from apps.workflow_engine.ejecucion.models import InstanciaFlujo, TareaActiva
    from apps.workflow_engine.monitoreo.models import MetricaFlujo

    plantillas = PlantillaFlujo.objects.filter(estado='ACTIVO')
    actualizadas = 0

    for plantilla in plantillas:
        instancias = InstanciaFlujo.objects.filter(
            plantilla=plantilla,
            fecha_inicio__gte=inicio_mes,
        )

        total = instancias.count()
        if total == 0:
            continue

        completadas = instancias.filter(estado='COMPLETADO').count()
        canceladas = instancias.filter(estado='CANCELADO').count()

        tiempo_promedio = instancias.filter(
            estado='COMPLETADO',
            tiempo_total_horas__isnull=False,
        ).aggregate(
            promedio=Avg('tiempo_total_horas')
        )['promedio']

        if tiempo_promedio:
            tiempo_promedio_dias = Decimal(str(tiempo_promedio)) / Decimal('24')
        else:
            tiempo_promedio_dias = None

        tareas = TareaActiva.objects.filter(instancia__in=instancias)
        tareas_totales = tareas.count()
        tareas_completadas = tareas.filter(estado='COMPLETADA').count()
        tareas_rechazadas = tareas.filter(estado='RECHAZADA').count()

        cuellos = list(
            tareas.filter(
                estado='COMPLETADA',
                tiempo_ejecucion_horas__isnull=False,
            ).values('nodo__codigo', 'nodo__nombre').annotate(
                tiempo_promedio=Avg('tiempo_ejecucion_horas'),
                total=Count('id'),
            ).order_by('-tiempo_promedio')[:5]
        )
        for cuello in cuellos:
            if cuello.get('tiempo_promedio'):
                cuello['tiempo_promedio'] = float(cuello['tiempo_promedio'])

        MetricaFlujo.objects.update_or_create(
            plantilla=plantilla,
            periodo='mensual',
            fecha_inicio=inicio_mes.date(),
            empresa_id=plantilla.empresa_id,
            defaults={
                'fecha_fin': ahora.date(),
                'total_instancias': total,
                'instancias_completadas': completadas,
                'instancias_canceladas': canceladas,
                'tiempo_promedio_dias': tiempo_promedio_dias,
                'tareas_totales': tareas_totales,
                'tareas_completadas': tareas_completadas,
                'tareas_rechazadas': tareas_rechazadas,
                'cuellos_botella': cuellos,
            },
        )
        actualizadas += 1

    return actualizadas
