"""
Tareas Celery de Control de Tiempo - Talent Hub

Automatización de:
- Detección de ausencias no registradas
- Generación de consolidados mensuales
- Recordatorios de marcaje de salida pendiente
"""
from celery import shared_task
from django.utils import timezone
from django.apps import apps
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name='control_tiempo.detectar_ausencias_diarias')
def detectar_ausencias_diarias():
    """
    Detecta colaboradores sin registro de asistencia del día anterior.

    Ejecuta a las 23:00 diariamente. Para cada tenant activo:
    1. Obtiene todos los colaboradores activos con asignación de turno vigente
    2. Verifica si tienen RegistroAsistencia para ayer
    3. Si no tienen, crea uno con estado 'ausente'
    4. Notifica via NotificadorTH
    """
    from django_tenants.utils import get_tenant_model, schema_context

    Tenant = get_tenant_model()
    ayer = (timezone.now() - timedelta(days=1)).date()

    tenants = Tenant.objects.filter(schema_name__ne='public') if hasattr(Tenant, 'schema_name') else []

    try:
        tenants = Tenant.objects.exclude(schema_name='public')
    except Exception:
        logger.warning('control_tiempo.detectar_ausencias_diarias: No se pudo obtener tenants')
        return {'status': 'error', 'message': 'No se pudo obtener tenants'}

    total_ausencias = 0

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                total_ausencias += _detectar_ausencias_en_tenant(ayer)
        except Exception as e:
            logger.error(
                f'control_tiempo.detectar_ausencias_diarias: Error en tenant {tenant.schema_name}: {e}'
            )

    logger.info(f'control_tiempo.detectar_ausencias_diarias: {total_ausencias} ausencias detectadas para {ayer}')
    return {'status': 'ok', 'fecha': str(ayer), 'ausencias_creadas': total_ausencias}


def _detectar_ausencias_en_tenant(fecha):
    """Lógica de detección de ausencias para el tenant actual."""
    RegistroAsistencia = apps.get_model('control_tiempo', 'RegistroAsistencia')
    AsignacionTurno = apps.get_model('control_tiempo', 'AsignacionTurno')
    Colaborador = apps.get_model('colaboradores', 'Colaborador')

    from django.db.models import Q

    # Colaboradores con turno vigente en esa fecha
    asignaciones_activas = AsignacionTurno.objects.filter(
        is_active=True,
        fecha_inicio__lte=fecha,
    ).filter(
        Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=fecha)
    ).select_related('colaborador', 'turno')

    # Dia de la semana para filtrar por dias del turno
    dias_semana_map = {0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves',
                       4: 'viernes', 5: 'sabado', 6: 'domingo'}
    dia_nombre = dias_semana_map[fecha.weekday()]

    # Colaboradores que ya tienen registro ese día
    colaboradores_con_registro = set(
        RegistroAsistencia.objects.filter(
            fecha=fecha, is_active=True
        ).values_list('colaborador_id', flat=True)
    )

    ausencias_creadas = 0

    for asignacion in asignaciones_activas:
        # Verificar si el turno aplica en este día
        dias_turno = asignacion.turno.dias_semana or []
        if dia_nombre not in dias_turno:
            continue

        colaborador = asignacion.colaborador
        if not colaborador.is_active:
            continue

        if colaborador.id not in colaboradores_con_registro:
            try:
                RegistroAsistencia.objects.create(
                    empresa=colaborador.empresa,
                    colaborador=colaborador,
                    turno=asignacion.turno,
                    fecha=fecha,
                    estado='ausente',
                    observaciones='Ausencia detectada automáticamente por el sistema.',
                    registrado_por_id=None,  # Sistema automático
                )
                ausencias_creadas += 1
                colaboradores_con_registro.add(colaborador.id)

                # Notificar
                try:
                    from apps.talent_hub.services.notificador_th import NotificadorTH
                    NotificadorTH.notificar_ausencia_no_justificada(colaborador, fecha)
                except Exception:
                    pass  # Notificación es best-effort

            except Exception as e:
                logger.warning(
                    f'_detectar_ausencias_en_tenant: No se pudo crear ausencia para '
                    f'colaborador {colaborador.id} fecha {fecha}: {e}'
                )

    return ausencias_creadas


@shared_task(name='control_tiempo.generar_consolidados_mensuales')
def generar_consolidados_mensuales():
    """
    Auto-genera consolidados del mes anterior el día 1 de cada mes a las 2:00 AM.

    Para cada tenant activo, para cada colaborador activo con registros en el mes:
    1. Crea o actualiza ConsolidadoAsistencia
    2. Llama calcular_estadisticas()
    """
    from django_tenants.utils import get_tenant_model, schema_context

    hoy = timezone.now().date()

    # Solo ejecutar el día 1 del mes
    if hoy.day != 1:
        return {'status': 'skipped', 'reason': 'Solo ejecuta el día 1 de cada mes'}

    # Mes anterior
    if hoy.month == 1:
        mes_anterior = 12
        anio_anterior = hoy.year - 1
    else:
        mes_anterior = hoy.month - 1
        anio_anterior = hoy.year

    try:
        Tenant = get_tenant_model()
        tenants = Tenant.objects.exclude(schema_name='public')
    except Exception:
        logger.warning('control_tiempo.generar_consolidados_mensuales: No se pudo obtener tenants')
        return {'status': 'error'}

    total_consolidados = 0

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                total_consolidados += _generar_consolidados_en_tenant(mes_anterior, anio_anterior)
        except Exception as e:
            logger.error(
                f'control_tiempo.generar_consolidados_mensuales: Error en tenant {tenant.schema_name}: {e}'
            )

    logger.info(
        f'control_tiempo.generar_consolidados_mensuales: {total_consolidados} consolidados '
        f'generados para {mes_anterior}/{anio_anterior}'
    )
    return {
        'status': 'ok',
        'mes': mes_anterior,
        'anio': anio_anterior,
        'consolidados_generados': total_consolidados
    }


def _generar_consolidados_en_tenant(mes, anio):
    """Lógica de generación de consolidados para el tenant actual."""
    ConsolidadoAsistencia = apps.get_model('control_tiempo', 'ConsolidadoAsistencia')
    RegistroAsistencia = apps.get_model('control_tiempo', 'RegistroAsistencia')
    Colaborador = apps.get_model('colaboradores', 'Colaborador')

    # Colaboradores con registros en el período
    colaboradores_ids = RegistroAsistencia.objects.filter(
        fecha__year=anio,
        fecha__month=mes,
        is_active=True
    ).values_list('colaborador_id', flat=True).distinct()

    generados = 0

    for colaborador_id in colaboradores_ids:
        try:
            colaborador = Colaborador.objects.get(id=colaborador_id, is_active=True)

            consolidado, created = ConsolidadoAsistencia.objects.get_or_create(
                colaborador=colaborador,
                anio=anio,
                mes=mes,
                defaults={
                    'empresa': colaborador.empresa,
                }
            )

            # Solo calcular si no está cerrado
            if not consolidado.cerrado:
                consolidado.calcular_estadisticas()
                generados += 1

        except Colaborador.DoesNotExist:
            pass
        except Exception as e:
            logger.warning(
                f'_generar_consolidados_en_tenant: Error con colaborador {colaborador_id}: {e}'
            )

    return generados


@shared_task(name='control_tiempo.recordar_marcaje_pendiente')
def recordar_marcaje_pendiente():
    """
    Recuerda a colaboradores que no han registrado salida.

    Ejecuta cada 30 minutos durante horario laboral (7 AM - 7 PM).
    Busca registros con hora_entrada pero sin hora_salida donde:
    - El turno ya terminó (hora actual > hora_fin del turno + 30 min)
    """
    from django_tenants.utils import get_tenant_model, schema_context

    ahora = timezone.now()
    hora_actual = ahora.time()

    # Solo ejecutar entre 7 AM y 7 PM
    from datetime import time
    if hora_actual < time(7, 0) or hora_actual > time(19, 0):
        return {'status': 'skipped', 'reason': 'Fuera del horario laboral (7AM-7PM)'}

    try:
        Tenant = get_tenant_model()
        tenants = Tenant.objects.exclude(schema_name='public')
    except Exception:
        return {'status': 'error'}

    total_recordatorios = 0

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                total_recordatorios += _recordar_marcajes_en_tenant(ahora)
        except Exception as e:
            logger.error(
                f'control_tiempo.recordar_marcaje_pendiente: Error en tenant {tenant.schema_name}: {e}'
            )

    return {'status': 'ok', 'recordatorios_enviados': total_recordatorios}


def _recordar_marcajes_en_tenant(ahora):
    """Lógica de recordatorios de marcaje para el tenant actual."""
    RegistroAsistencia = apps.get_model('control_tiempo', 'RegistroAsistencia')
    from datetime import timedelta, time as time_type, datetime as datetime_type

    fecha_hoy = ahora.date()
    hora_actual = ahora.time()

    # Registros de hoy con entrada pero sin salida
    registros_pendientes = RegistroAsistencia.objects.filter(
        fecha=fecha_hoy,
        is_active=True,
        estado__in=['presente', 'tardanza'],
        hora_entrada__isnull=False,
        hora_salida__isnull=True,
    ).select_related('colaborador', 'turno')

    recordatorios = 0

    for registro in registros_pendientes:
        turno = registro.turno
        # Verificar si ya pasó la hora de fin del turno + 30 min
        hora_fin_turno = turno.hora_fin
        hora_limite = (
            datetime_type.combine(fecha_hoy, hora_fin_turno) + timedelta(minutes=30)
        ).time()

        if hora_actual > hora_limite:
            try:
                from apps.talent_hub.services.notificador_th import NotificadorTH
                if hasattr(NotificadorTH, 'notificar_marcaje_salida_pendiente'):
                    NotificadorTH.notificar_marcaje_salida_pendiente(
                        registro.colaborador, turno, fecha_hoy
                    )
                recordatorios += 1
            except Exception as e:
                logger.debug(f'_recordar_marcajes_en_tenant: Error notificando: {e}')

    return recordatorios
