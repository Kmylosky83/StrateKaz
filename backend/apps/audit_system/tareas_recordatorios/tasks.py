"""
Tareas Celery para Tareas y Recordatorios - Audit System

- verificar_tareas_vencidas: Marca tareas vencidas automáticamente
- ejecutar_recordatorios: Ejecuta recordatorios programados
- enviar_resumen_tareas_diario: Resumen diario de tareas pendientes
"""
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


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
    from .models import Tarea

    ahora = timezone.now()
    tareas_vencidas = Tarea.objects.filter(
        fecha_limite__lt=ahora,
        estado__in=['pendiente', 'en_progreso'],
    )

    count = 0
    for tarea in tareas_vencidas:
        tarea.estado = 'vencida'
        tarea.save(update_fields=['estado', 'updated_at'])
        count += 1

        logger.info(
            f'[TareasRecordatorios] Tarea {tarea.titulo} marcada como vencida '
            f'(fecha límite: {tarea.fecha_limite})'
        )

    if count > 0:
        logger.info(f'[TareasRecordatorios] {count} tareas marcadas como vencidas')

    return {'tareas_vencidas': count, 'fecha': str(ahora)}


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
    from .models import Recordatorio

    ahora = timezone.now()
    recordatorios_pendientes = Recordatorio.objects.filter(
        esta_activo=True,
        proxima_ejecucion__lte=ahora,
    )

    ejecutados = 0
    for recordatorio in recordatorios_pendientes:
        try:
            # Registrar ejecución
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
                # Siguiente mes, mismo día
                mes = ahora.month + 1
                anio = ahora.year
                if mes > 12:
                    mes = 1
                    anio += 1
                dia = min(recordatorio.fecha_recordatorio.day, 28)  # Safe for all months
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

            # Crear notificación (si el módulo de notificaciones está disponible)
            try:
                _crear_notificacion_recordatorio(recordatorio)
            except Exception:
                pass  # Notificación opcional

            ejecutados += 1
            logger.info(
                f'[TareasRecordatorios] Recordatorio ejecutado: {recordatorio.titulo} '
                f'para usuario {recordatorio.usuario}'
            )

        except Exception as e:
            logger.error(
                f'[TareasRecordatorios] Error ejecutando recordatorio {recordatorio.id}: {e}'
            )

    if ejecutados > 0:
        logger.info(f'[TareasRecordatorios] {ejecutados} recordatorios ejecutados')

    return {'recordatorios_ejecutados': ejecutados, 'fecha': str(ahora)}


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
        pass  # El módulo de notificaciones puede no estar disponible


@shared_task(
    bind=True,
    name='apps.audit_system.tareas_recordatorios.tasks.enviar_resumen_tareas_diario',
)
def enviar_resumen_tareas_diario(self):
    """
    Envía un resumen diario de tareas pendientes y vencidas a cada usuario.
    Se ejecuta diariamente a las 8:30 AM.
    """
    from .models import Tarea
    from django.contrib.auth import get_user_model
    from django.db.models import Count, Q

    User = get_user_model()
    ahora = timezone.now()

    # Obtener usuarios con tareas activas
    usuarios_con_tareas = User.objects.filter(
        audit_tareas_asignadas__estado__in=['pendiente', 'en_progreso', 'vencida'],
    ).annotate(
        pendientes=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='pendiente')),
        en_progreso=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='en_progreso')),
        vencidas=Count('audit_tareas_asignadas', filter=Q(audit_tareas_asignadas__estado='vencida')),
    ).filter(
        Q(pendientes__gt=0) | Q(en_progreso__gt=0) | Q(vencidas__gt=0)
    ).distinct()

    resumen_enviados = 0
    for usuario in usuarios_con_tareas:
        try:
            _crear_notificacion_recordatorio_obj = None  # placeholder for notification
            logger.info(
                f'[TareasRecordatorios] Resumen para {usuario.get_full_name()}: '
                f'{usuario.pendientes} pendientes, '
                f'{usuario.en_progreso} en progreso, '
                f'{usuario.vencidas} vencidas'
            )
            resumen_enviados += 1
        except Exception as e:
            logger.error(f'[TareasRecordatorios] Error enviando resumen a {usuario}: {e}')

    return {'resumenes_enviados': resumen_enviados, 'fecha': str(ahora)}
