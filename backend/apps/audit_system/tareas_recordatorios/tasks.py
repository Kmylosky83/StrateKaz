"""
Tareas Celery para Tareas y Recordatorios - Audit System

- verificar_tareas_vencidas: Marca tareas vencidas automáticamente
- ejecutar_recordatorios: Ejecuta recordatorios programados
- enviar_resumen_tareas_diario: Resumen diario de tareas pendientes

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


@shared_task(
    bind=True,
    name='apps.audit_system.tareas_recordatorios.tasks.verificar_tareas_vencidas',
    max_retries=3,
    default_retry_delay=300,
)
def verificar_tareas_vencidas(self):
    """
    Verifica y marca tareas vencidas automáticamente.
    Una tarea se considera vencida si:
    - fecha_limite < ahora
    - estado en ('pendiente', 'en_progreso')

    Se ejecuta cada 30 minutos.
    """
    from django_tenants.utils import schema_context
    from .models import Tarea

    ahora = timezone.now()
    total_count = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                tareas_vencidas = Tarea.objects.filter(
                    fecha_limite__lt=ahora,
                    estado__in=['pendiente', 'en_progreso'],
                )

                count = 0
                for tarea in tareas_vencidas:
                    tarea.estado = 'vencida'
                    tarea.save(update_fields=['estado', 'updated_at'])
                    count += 1

                if count > 0:
                    logger.info(
                        f'[TareasRecordatorios] {tenant.schema_name}: '
                        f'{count} tareas marcadas como vencidas'
                    )
                    total_count += count
        except Exception as e:
            logger.error(
                f'[TareasRecordatorios] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'tareas_vencidas': total_count, 'fecha': str(ahora)}


@shared_task(
    bind=True,
    name='apps.audit_system.tareas_recordatorios.tasks.ejecutar_recordatorios',
    max_retries=3,
    default_retry_delay=60,
)
def ejecutar_recordatorios(self):
    """
    Ejecuta recordatorios programados que están pendientes.

    Lógica:
    1. Busca recordatorios activos con proxima_ejecucion <= ahora
    2. Para recordatorios 'una_vez': los desactiva
    3. Para recurrentes: calcula la próxima ejecución
    4. Crea notificación para el usuario

    Se ejecuta cada 15 minutos.
    """
    from django_tenants.utils import schema_context
    from .models import Recordatorio

    ahora = timezone.now()
    total_ejecutados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                recordatorios_pendientes = Recordatorio.objects.filter(
                    esta_activo=True,
                    proxima_ejecucion__lte=ahora,
                )

                for recordatorio in recordatorios_pendientes:
                    try:
                        recordatorio.ultima_ejecucion = ahora

                        if recordatorio.repetir == 'una_vez':
                            recordatorio.esta_activo = False
                            recordatorio.proxima_ejecucion = None
                        elif recordatorio.repetir == 'diario':
                            recordatorio.proxima_ejecucion = ahora + timedelta(days=1)
                            if recordatorio.hora_repeticion:
                                recordatorio.proxima_ejecucion = recordatorio.proxima_ejecucion.replace(
                                    hour=recordatorio.hora_repeticion.hour,
                                    minute=recordatorio.hora_repeticion.minute,
                                    second=0,
                                )
                        elif recordatorio.repetir == 'semanal':
                            recordatorio.proxima_ejecucion = ahora + timedelta(weeks=1)
                            if recordatorio.hora_repeticion:
                                recordatorio.proxima_ejecucion = recordatorio.proxima_ejecucion.replace(
                                    hour=recordatorio.hora_repeticion.hour,
                                    minute=recordatorio.hora_repeticion.minute,
                                    second=0,
                                )
                        elif recordatorio.repetir == 'mensual':
                            mes = ahora.month + 1
                            anio = ahora.year
                            if mes > 12:
                                mes = 1
                                anio += 1
                            dia = min(recordatorio.fecha_recordatorio.day, 28)
                            recordatorio.proxima_ejecucion = ahora.replace(
                                year=anio, month=mes, day=dia,
                            )
                            if recordatorio.hora_repeticion:
                                recordatorio.proxima_ejecucion = recordatorio.proxima_ejecucion.replace(
                                    hour=recordatorio.hora_repeticion.hour,
                                    minute=recordatorio.hora_repeticion.minute,
                                    second=0,
                                )

                        recordatorio.save(update_fields=[
                            'ultima_ejecucion', 'proxima_ejecucion', 'esta_activo', 'updated_at',
                        ])

                        try:
                            _crear_notificacion_recordatorio(recordatorio)
                        except Exception:
                            pass

                        total_ejecutados += 1
                        logger.info(
                            f'[TareasRecordatorios] {tenant.schema_name}: '
                            f'Recordatorio ejecutado: {recordatorio.titulo}'
                        )

                    except Exception as e:
                        logger.error(
                            f'[TareasRecordatorios] Error ejecutando recordatorio '
                            f'{recordatorio.id} en {tenant.schema_name}: {e}'
                        )
        except Exception as e:
            logger.error(
                f'[TareasRecordatorios] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'recordatorios_ejecutados': total_ejecutados, 'fecha': str(ahora)}


def _crear_notificacion_recordatorio(recordatorio):
    """Crea una notificación in-app para el recordatorio ejecutado."""
    try:
        from apps.audit_system.centro_notificaciones.models import Notificacion
        Notificacion.objects.create(
            usuario=recordatorio.usuario,
            titulo=f'Recordatorio: {recordatorio.titulo}',
            mensaje=recordatorio.mensaje,
            tipo='recordatorio',
            prioridad='normal',
        )
    except Exception:
        pass


@shared_task(
    bind=True,
    name='apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario',
)
def enviar_resumen_tareas_diario(self):
    """
    Envía un resumen diario de tareas pendientes y vencidas a cada usuario.
    Se ejecuta diariamente a las 8:30 AM.
    """
    from django_tenants.utils import schema_context
    from .models import Tarea
    from django.contrib.auth import get_user_model
    from django.db.models import Count, Q

    User = get_user_model()
    ahora = timezone.now()
    total_resumen = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                usuarios_con_tareas = User.objects.filter(
                    audit_tareas_asignadas__estado__in=['pendiente', 'en_progreso', 'vencida'],
                ).annotate(
                    pendientes=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='pendiente')),
                    en_progreso=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='en_progreso')),
                    vencidas=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='vencida')),
                ).filter(
                    Q(pendientes__gt=0) | Q(en_progreso__gt=0) | Q(vencidas__gt=0)
                ).distinct()

                for usuario in usuarios_con_tareas:
                    try:
                        logger.info(
                            f'[TareasRecordatorios] {tenant.schema_name}: '
                            f'Resumen para {usuario.get_full_name()}: '
                            f'{usuario.pendientes} pendientes, '
                            f'{usuario.en_progreso} en progreso, '
                            f'{usuario.vencidas} vencidas'
                        )
                        total_resumen += 1
                    except Exception as e:
                        logger.error(
                            f'[TareasRecordatorios] Error enviando resumen a {usuario}: {e}'
                        )
        except Exception as e:
            logger.error(
                f'[TareasRecordatorios] Error en tenant {tenant.schema_name}: {e}'
            )

    return {'resumenes_enviados': total_resumen, 'fecha': str(ahora)}
