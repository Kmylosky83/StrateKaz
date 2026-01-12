"""
Tareas periódicas (Celery) para el sistema de Workflow de Firmas y Revisión

CONFIGURACIÓN EN celery_app.py:
from celery.schedules import crontab

app.conf.beat_schedule = {
    'verificar-firmas-vencidas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_firmas_vencidas',
        'schedule': crontab(hour=8, minute=0),  # Diariamente a las 8:00 AM
    },
    'verificar-revisiones-pendientes': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_revisiones_pendientes',
        'schedule': crontab(hour=9, minute=0),  # Diariamente a las 9:00 AM
    },
    'enviar-alertas-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.enviar_alertas_revision',
        'schedule': crontab(hour=10, minute=0),  # Diariamente a las 10:00 AM
    },
    'actualizar-estados-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.actualizar_estados_revision',
        'schedule': crontab(hour=0, minute=30),  # Diariamente a las 00:30 AM
    },
}
"""

from celery import shared_task
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
import logging

from .models_workflow import (
    FirmaDigital,
    ConfiguracionRevision,
    HistorialVersion,
)

logger = logging.getLogger(__name__)


# =============================================================================
# TAREAS - FIRMAS DIGITALES
# =============================================================================

@shared_task(name='verificar_firmas_vencidas')
def verificar_firmas_vencidas():
    """
    Tarea diaria: Marca firmas como vencidas y notifica.

    Ejecuta:
    - Busca firmas PENDIENTES con fecha_vencimiento pasada
    - Cambia estado a VENCIDO
    - Notifica al firmante y al creador del documento
    - Notifica a supervisor si es firma crítica

    Programar: Diariamente a las 8:00 AM
    """
    logger.info("[WORKFLOW] Iniciando verificación de firmas vencidas")

    hoy = timezone.now()

    # Buscar firmas vencidas
    firmas_vencidas = FirmaDigital.objects.filter(
        status='PENDIENTE',
        fecha_vencimiento__lt=hoy,
        is_active=True
    ).select_related('firmante', 'content_type')

    total_vencidas = firmas_vencidas.count()

    if total_vencidas == 0:
        logger.info("[WORKFLOW] No hay firmas vencidas")
        return {
            'status': 'success',
            'firmas_vencidas': 0
        }

    # Procesar cada firma vencida
    for firma in firmas_vencidas:
        try:
            # Marcar como vencida
            firma.status = 'VENCIDO'
            firma.save(update_fields=['status', 'updated_at'])

            # Notificar al firmante
            notificar_firma_vencida(firma)

            # Si es firma crítica (APROBO), escalar
            if firma.rol_firma == 'APROBO':
                escalar_firma_vencida(firma)

            logger.info(f"[WORKFLOW] Firma {firma.id} marcada como vencida")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error procesando firma {firma.id}: {str(e)}")

    logger.info(f"[WORKFLOW] Verificación completada. {total_vencidas} firmas vencidas")

    return {
        'status': 'success',
        'firmas_vencidas': total_vencidas
    }


@shared_task(name='recordar_firmas_pendientes')
def recordar_firmas_pendientes():
    """
    Tarea: Envía recordatorios de firmas pendientes próximas a vencer.

    Ejecuta:
    - Busca firmas PENDIENTES que vencen en 1-2 días
    - Envía recordatorio al firmante
    - Solo envía si es su turno (firmas secuenciales)

    Programar: Diariamente a las 15:00 PM
    """
    logger.info("[WORKFLOW] Iniciando recordatorios de firmas pendientes")

    hoy = timezone.now()
    fecha_limite = hoy + timedelta(days=2)

    # Buscar firmas próximas a vencer
    firmas_pendientes = FirmaDigital.objects.filter(
        status='PENDIENTE',
        fecha_vencimiento__gte=hoy,
        fecha_vencimiento__lte=fecha_limite,
        is_active=True
    ).select_related('firmante', 'content_type')

    total_recordatorios = 0

    for firma in firmas_pendientes:
        try:
            # Solo recordar si es su turno
            if firma.es_mi_turno():
                enviar_recordatorio_firma(firma)
                total_recordatorios += 1
                logger.info(f"[WORKFLOW] Recordatorio enviado para firma {firma.id}")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error enviando recordatorio firma {firma.id}: {str(e)}")

    logger.info(f"[WORKFLOW] {total_recordatorios} recordatorios enviados")

    return {
        'status': 'success',
        'recordatorios_enviados': total_recordatorios
    }


# =============================================================================
# TAREAS - REVISIÓN PERIÓDICA
# =============================================================================

@shared_task(name='verificar_revisiones_pendientes')
def verificar_revisiones_pendientes():
    """
    Tarea diaria: Verifica revisiones pendientes y actualiza estados.

    Ejecuta:
    - Busca configuraciones con proxima_revision <= hoy
    - Cambia estado a VENCIDA
    - Notifica a responsables
    - Escala si es política crítica

    Programar: Diariamente a las 9:00 AM
    """
    logger.info("[WORKFLOW] Iniciando verificación de revisiones pendientes")

    hoy = timezone.now().date()

    # Buscar revisiones vencidas
    revisiones_vencidas = ConfiguracionRevision.objects.filter(
        habilitado=True,
        proxima_revision__lte=hoy,
        estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO'],
        is_active=True
    ).select_related('responsable_revision', 'cargo_responsable')

    total_vencidas = revisiones_vencidas.count()

    if total_vencidas == 0:
        logger.info("[WORKFLOW] No hay revisiones vencidas")
        return {
            'status': 'success',
            'revisiones_vencidas': 0
        }

    # Procesar cada revisión vencida
    for config in revisiones_vencidas:
        try:
            # Actualizar estado
            config.estado = 'VENCIDA'
            config.save(update_fields=['estado', 'updated_at'])

            # Notificar
            notificar_revision_vencida(config)

            # Escalar si es política crítica
            if es_politica_critica(config):
                escalar_revision_vencida(config)

            logger.info(f"[WORKFLOW] Revisión {config.id} marcada como vencida")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error procesando revisión {config.id}: {str(e)}")

    logger.info(f"[WORKFLOW] Verificación completada. {total_vencidas} revisiones vencidas")

    return {
        'status': 'success',
        'revisiones_vencidas': total_vencidas
    }


@shared_task(name='enviar_alertas_revision')
def enviar_alertas_revision():
    """
    Tarea diaria: Envía alertas de revisión según días configurados.

    Ejecuta:
    - Busca configuraciones habilitadas
    - Verifica si debe enviar alerta hoy (según alertas_dias_previos)
    - Envía alertas a responsables y destinatarios

    Programar: Diariamente a las 10:00 AM
    """
    logger.info("[WORKFLOW] Iniciando envío de alertas de revisión")

    # Buscar configuraciones activas
    configuraciones = ConfiguracionRevision.objects.filter(
        habilitado=True,
        estado__in=['VIGENTE', 'PROXIMO_VENCIMIENTO'],
        is_active=True
    ).select_related('responsable_revision', 'cargo_responsable').prefetch_related('destinatarios_adicionales')

    total_alertas = 0

    for config in configuraciones:
        try:
            # Verificar si debe enviar alerta hoy
            if config.debe_enviar_alerta():
                config.enviar_alerta_revision()
                total_alertas += 1
                logger.info(f"[WORKFLOW] Alerta enviada para revisión {config.id}")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error enviando alerta revisión {config.id}: {str(e)}")

    logger.info(f"[WORKFLOW] {total_alertas} alertas de revisión enviadas")

    return {
        'status': 'success',
        'alertas_enviadas': total_alertas
    }


@shared_task(name='actualizar_estados_revision')
def actualizar_estados_revision():
    """
    Tarea diaria: Actualiza estados de todas las configuraciones de revisión.

    Ejecuta:
    - Recorre todas las configuraciones activas
    - Actualiza estado según fecha de revisión
    - Estados: VIGENTE, PROXIMO_VENCIMIENTO, VENCIDA

    Programar: Diariamente a las 00:30 AM
    """
    logger.info("[WORKFLOW] Iniciando actualización de estados de revisión")

    configuraciones = ConfiguracionRevision.objects.filter(
        habilitado=True,
        is_active=True
    )

    total_actualizadas = 0

    for config in configuraciones:
        try:
            estado_anterior = config.estado
            config.verificar_estado()

            if config.estado != estado_anterior:
                total_actualizadas += 1
                logger.info(f"[WORKFLOW] Estado revisión {config.id} actualizado: {estado_anterior} -> {config.estado}")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error actualizando estado revisión {config.id}: {str(e)}")

    logger.info(f"[WORKFLOW] {total_actualizadas} estados actualizados")

    return {
        'status': 'success',
        'estados_actualizados': total_actualizadas
    }


@shared_task(name='auto_renovar_politicas')
def auto_renovar_politicas():
    """
    Tarea semanal: Auto-renueva políticas que tienen auto_renovar=True.

    Ejecuta:
    - Busca configuraciones con auto_renovar=True y estado VENCIDA
    - Verifica que no haya cambios pendientes en la política
    - Renueva automáticamente (mantiene versión, actualiza vigencia)
    - Crea historial de renovación automática

    Programar: Semanalmente, lunes a las 8:00 AM
    """
    logger.info("[WORKFLOW] Iniciando auto-renovación de políticas")

    # Buscar configuraciones para auto-renovar
    configuraciones_renovar = ConfiguracionRevision.objects.filter(
        habilitado=True,
        auto_renovar=True,
        estado='VENCIDA',
        tipo_revision='RENOVACION',
        is_active=True
    ).select_related('content_type')

    total_renovadas = 0

    for config in configuraciones_renovar:
        try:
            # Obtener documento
            documento = config.content_object
            if not documento:
                continue

            # Verificar que no haya cambios pendientes (firmas pendientes, etc.)
            if tiene_cambios_pendientes(documento):
                logger.info(f"[WORKFLOW] Documento {documento.id} tiene cambios pendientes, no se auto-renueva")
                continue

            # Renovar
            if hasattr(documento, 'effective_date'):
                documento.effective_date = timezone.now().date()

            if hasattr(documento, 'review_date'):
                documento.review_date = config.calcular_proxima_revision()

            documento.save()

            # Actualizar configuración
            config.actualizar_proxima_revision()

            # Crear historial
            HistorialVersion.crear_version(
                documento=documento,
                tipo_cambio='RENOVACION_AUTOMATICA',
                usuario=None,  # Sistema
                descripcion=f'Renovación automática - {config.get_frecuencia_display()}'
            )

            total_renovadas += 1
            logger.info(f"[WORKFLOW] Documento {documento.id} auto-renovado exitosamente")

        except Exception as e:
            logger.error(f"[WORKFLOW] Error auto-renovando documento {config.id}: {str(e)}")

    logger.info(f"[WORKFLOW] {total_renovadas} políticas auto-renovadas")

    return {
        'status': 'success',
        'politicas_renovadas': total_renovadas
    }


# =============================================================================
# FUNCIONES AUXILIARES DE NOTIFICACIÓN
# =============================================================================

def notificar_firma_vencida(firma):
    """Notifica al firmante que su firma venció"""
    try:
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion

        documento = firma.content_object
        dias_vencida = (timezone.now() - firma.fecha_vencimiento).days

        enviar_notificacion(
            destinatario=firma.firmante,
            tipo='FIRMA_VENCIDA',
            asunto=f'Firma vencida: {firma.get_rol_firma_display()}',
            mensaje=f'Su firma como {firma.get_rol_firma_display()} para el documento "{documento}" venció hace {dias_vencida} días. Por favor, contacte al administrador.',
            link=f'/gestion-estrategica/identidad/politicas/{firma.object_id}',
            prioridad='CRITICA'
        )

    except Exception as e:
        logger.error(f"Error notificando firma vencida {firma.id}: {str(e)}")


def escalar_firma_vencida(firma):
    """Escala firma vencida crítica a supervisor"""
    try:
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Buscar supervisor (usuarios staff o con rol de gestión)
        supervisores = User.objects.filter(
            Q(is_staff=True) | Q(cargo__is_jefatura=True),
            is_active=True
        ).distinct()

        documento = firma.content_object

        for supervisor in supervisores[:3]:  # Limitar a 3 supervisores
            enviar_notificacion(
                destinatario=supervisor,
                tipo='FIRMA_VENCIDA_ESCALADA',
                asunto=f'ESCALADO: Firma crítica vencida',
                mensaje=f'La firma de {firma.firmante.get_full_name()} como {firma.get_rol_firma_display()} para "{documento}" está vencida. Se requiere acción inmediata.',
                link=f'/gestion-estrategica/identidad/politicas/{firma.object_id}',
                prioridad='CRITICA'
            )

    except Exception as e:
        logger.error(f"Error escalando firma vencida {firma.id}: {str(e)}")


def enviar_recordatorio_firma(firma):
    """Envía recordatorio de firma pendiente"""
    try:
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion

        documento = firma.content_object
        dias_restantes = (firma.fecha_vencimiento - timezone.now()).days

        enviar_notificacion(
            destinatario=firma.firmante,
            tipo='RECORDATORIO_FIRMA',
            asunto=f'Recordatorio: Firma pendiente',
            mensaje=f'Recuerde que tiene una firma pendiente como {firma.get_rol_firma_display()} para el documento "{documento}". Vence en {dias_restantes} días.',
            link=f'/gestion-estrategica/identidad/politicas/{firma.object_id}',
            prioridad='ALTA'
        )

    except Exception as e:
        logger.error(f"Error enviando recordatorio firma {firma.id}: {str(e)}")


def notificar_revision_vencida(config):
    """Notifica revisión vencida a responsables"""
    try:
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion

        documento = config.content_object
        dias_vencida = (timezone.now().date() - config.proxima_revision).days

        destinatarios = []

        if config.alertar_responsable and config.responsable_revision:
            destinatarios.append(config.responsable_revision)

        if config.alertar_creador and hasattr(documento, 'created_by') and documento.created_by:
            destinatarios.append(documento.created_by)

        destinatarios.extend(config.destinatarios_adicionales.all())

        for destinatario in set(destinatarios):
            enviar_notificacion(
                destinatario=destinatario,
                tipo='REVISION_VENCIDA',
                asunto=f'Revisión vencida: {documento}',
                mensaje=f'La revisión {config.get_frecuencia_display()} del documento "{documento}" está vencida desde hace {dias_vencida} días. Se requiere acción inmediata.',
                link=f'/gestion-estrategica/identidad/politicas/{config.object_id}',
                prioridad='CRITICA'
            )

    except Exception as e:
        logger.error(f"Error notificando revisión vencida {config.id}: {str(e)}")


def escalar_revision_vencida(config):
    """Escala revisión vencida de política crítica"""
    try:
        from apps.audit_system.centro_notificaciones.utils import enviar_notificacion
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Buscar directivos
        directivos = User.objects.filter(
            Q(is_staff=True) | Q(cargo__nivel_jerarquico='ESTRATEGICO'),
            is_active=True
        ).distinct()

        documento = config.content_object

        for directivo in directivos[:3]:
            enviar_notificacion(
                destinatario=directivo,
                tipo='REVISION_VENCIDA_ESCALADA',
                asunto=f'ESCALADO: Revisión de política crítica vencida',
                mensaje=f'La revisión {config.get_frecuencia_display()} de la política crítica "{documento}" está vencida. Se requiere revisión urgente según normativa ISO/Decreto 1072.',
                link=f'/gestion-estrategica/identidad/politicas/{config.object_id}',
                prioridad='CRITICA'
            )

    except Exception as e:
        logger.error(f"Error escalando revisión vencida {config.id}: {str(e)}")


def es_politica_critica(config):
    """Determina si una política es crítica (SST, Integral, etc.)"""
    try:
        documento = config.content_object
        model_name = documento._meta.model_name

        # Políticas integrales son críticas
        if model_name == 'politicaintegral':
            return True

        # Políticas específicas SST son críticas
        if model_name == 'politicaespecifica':
            if hasattr(documento, 'norma_iso'):
                norma = documento.norma_iso
                if norma and norma.code in ['ISO45001', 'DECRETO1072']:
                    return True

        return False

    except Exception:
        return False


def tiene_cambios_pendientes(documento):
    """Verifica si un documento tiene cambios pendientes (firmas, etc.)"""
    try:
        from django.contrib.contenttypes.models import ContentType

        content_type = ContentType.objects.get_for_model(documento)

        # Verificar firmas pendientes
        firmas_pendientes = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=documento.id,
            status__in=['PENDIENTE', 'DELEGADO'],
            is_active=True
        ).exists()

        if firmas_pendientes:
            return True

        # Verificar estado del documento
        if hasattr(documento, 'status'):
            if documento.status in ['BORRADOR', 'EN_REVISION']:
                return True

        return False

    except Exception:
        return False


# =============================================================================
# TAREAS BAJO DEMANDA
# =============================================================================

@shared_task(name='generar_reporte_firmas')
def generar_reporte_firmas(fecha_desde=None, fecha_hasta=None, formato='PDF'):
    """
    Tarea bajo demanda: Genera reporte de firmas digitales.

    Args:
        fecha_desde: Fecha inicio (YYYY-MM-DD)
        fecha_hasta: Fecha fin (YYYY-MM-DD)
        formato: PDF, EXCEL, CSV

    Returns:
        dict: Ruta del archivo generado
    """
    logger.info(f"[WORKFLOW] Generando reporte de firmas {formato}")

    # TODO: Implementar generación de reporte
    # - Consultar firmas en rango de fechas
    # - Generar archivo según formato
    # - Guardar en storage
    # - Retornar URL de descarga

    return {
        'status': 'success',
        'formato': formato,
        'archivo_url': '/media/reportes/firmas_2024_01.pdf'
    }


@shared_task(name='generar_reporte_revisiones')
def generar_reporte_revisiones(formato='PDF'):
    """
    Tarea bajo demanda: Genera reporte de revisiones periódicas.

    Args:
        formato: PDF, EXCEL, CSV

    Returns:
        dict: Ruta del archivo generado
    """
    logger.info(f"[WORKFLOW] Generando reporte de revisiones {formato}")

    # TODO: Implementar generación de reporte
    # - Consultar configuraciones de revisión
    # - Generar estadísticas
    # - Generar archivo según formato
    # - Retornar URL de descarga

    return {
        'status': 'success',
        'formato': formato,
        'archivo_url': '/media/reportes/revisiones_2024_01.pdf'
    }
