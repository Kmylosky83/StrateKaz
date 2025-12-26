"""
Tareas asíncronas de Celery para Motor de Cumplimiento
Grasas y Huesos del Norte S.A.S

Tareas principales:
1. scrape_legal_updates - Web scraping de normas legales colombianas (cada 15 días)
2. check_license_expirations - Verificar vencimientos de requisitos (diario)
3. send_expiration_notifications - Enviar notificaciones de vencimientos (diario)
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.db.models import Q, Count
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone

# Importar modelos
from apps.motor_cumplimiento.matriz_legal.models import NormaLegal, TipoNorma
from apps.motor_cumplimiento.requisitos_legales.models import (
    EmpresaRequisito,
    AlertaVencimiento,
    RequisitoLegal
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════
# TAREAS DE WEB SCRAPING - MATRIZ LEGAL
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=3600,  # 1 hora
    time_limit=1800,  # 30 minutos
    soft_time_limit=1500,  # 25 minutos
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=7200,  # 2 horas
    retry_jitter=True,
)
def scrape_legal_updates(self, force_all: bool = False) -> Dict[str, Any]:
    """
    Web scraping de sitios oficiales colombianos para actualizar normas legales.

    Esta tarea se ejecuta automáticamente cada 15 días según el schedule en celery.py.

    Fuentes a scrapear:
    - DIAN: https://www.dian.gov.co/normatividad/
    - Ministerio del Trabajo: https://www.mintrabajo.gov.co/normatividad
    - Ministerio de Ambiente: https://www.minambiente.gov.co/normativa/
    - Función Pública: https://www.funcionpublica.gov.co/eva/gestornormativo/
    - ICONTEC (normas técnicas - requiere suscripción)

    Args:
        force_all: Si es True, re-scrapea todas las normas, no solo las nuevas

    Returns:
        Dict con estadísticas del scraping

    Raises:
        Exception: Si falla el scraping (se reintenta automáticamente)
    """
    try:
        logger.info(f"[Task {self.request.id}] Iniciando scraping de normas legales colombianas")

        start_time = datetime.now()
        stats = {
            'normas_nuevas': 0,
            'normas_actualizadas': 0,
            'errores': [],
            'fuentes_procesadas': [],
        }

        # Fuentes de scraping
        sources = [
            {
                'nombre': 'DIAN',
                'url': 'https://www.dian.gov.co/normatividad/',
                'tipos': ['DEC', 'RES', 'LEY'],
                'aplica_calidad': True,
            },
            {
                'nombre': 'MinTrabajo',
                'url': 'https://www.mintrabajo.gov.co/normatividad',
                'tipos': ['DEC', 'RES', 'LEY', 'CIR'],
                'aplica_sst': True,
                'aplica_pesv': True,
            },
            {
                'nombre': 'MinAmbiente',
                'url': 'https://www.minambiente.gov.co/normativa/',
                'tipos': ['DEC', 'RES', 'LEY'],
                'aplica_ambiental': True,
            },
        ]

        for source in sources:
            try:
                logger.info(f"[Task {self.request.id}] Scrapeando: {source['nombre']}")

                # TODO: Implementar lógica de scraping específica por fuente
                # Por ahora es un placeholder que simula el scraping

                # Ejemplo de scraping (pseudocódigo):
                # normas_scraped = _scrape_source(source)
                # for norma_data in normas_scraped:
                #     norma, created = _process_norma_data(norma_data, source)
                #     if created:
                #         stats['normas_nuevas'] += 1
                #     else:
                #         stats['normas_actualizadas'] += 1

                stats['fuentes_procesadas'].append({
                    'nombre': source['nombre'],
                    'url': source['url'],
                    'timestamp': datetime.now().isoformat(),
                })

                # Actualizar fecha de scraping en normas procesadas
                # NormaLegal.objects.filter(
                #     entidad_emisora__icontains=source['nombre']
                # ).update(fecha_scraping=timezone.now())

            except Exception as exc:
                error_msg = f"Error scrapeando {source['nombre']}: {str(exc)}"
                logger.error(f"[Task {self.request.id}] {error_msg}")
                stats['errores'].append(error_msg)

        duration = (datetime.now() - start_time).total_seconds()

        logger.info(
            f"[Task {self.request.id}] Scraping completado: "
            f"{stats['normas_nuevas']} nuevas, "
            f"{stats['normas_actualizadas']} actualizadas en {duration:.2f}s"
        )

        # Enviar reporte a administradores si hay normas nuevas
        if stats['normas_nuevas'] > 0:
            _send_scraping_report(stats)

        return {
            'status': 'success',
            'duration_seconds': duration,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
            **stats
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error en scraping: {str(exc)}")
        raise self.retry(exc=exc)


def _scrape_source(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Scrapea una fuente específica de normas.

    Args:
        source: Diccionario con configuración de la fuente

    Returns:
        Lista de diccionarios con datos de normas scrapeadas

    TODO: Implementar lógica real de scraping usando:
    - requests o httpx para HTTP requests
    - BeautifulSoup4 o lxml para parsing HTML
    - scrapy para scraping avanzado (opcional)
    """
    # Placeholder - implementar lógica real
    return []


def _process_norma_data(norma_data: Dict[str, Any], source: Dict[str, Any]) -> tuple:
    """
    Procesa datos de norma scrapeada y crea/actualiza en BD.

    Args:
        norma_data: Datos de la norma scrapeada
        source: Fuente de la norma

    Returns:
        Tupla (norma, created)
    """
    # Placeholder - implementar lógica real
    pass


def _send_scraping_report(stats: Dict[str, Any]) -> None:
    """Envía reporte de scraping a administradores"""
    from apps.core.tasks import send_email_async

    subject = f"Actualización de Normas Legales - {stats['normas_nuevas']} nuevas"
    message = f"""
    Se han detectado {stats['normas_nuevas']} nuevas normas legales.
    Normas actualizadas: {stats['normas_actualizadas']}
    Fuentes procesadas: {len(stats['fuentes_procesadas'])}

    Ingrese al sistema para revisar las nuevas normas.
    """

    # TODO: Obtener emails de administradores de cumplimiento
    recipient_list = [settings.DEFAULT_FROM_EMAIL]

    send_email_async.delay(
        subject=subject,
        message=message,
        recipient_list=recipient_list,
    )


# ═══════════════════════════════════════════════════
# TAREAS DE VERIFICACIÓN DE VENCIMIENTOS
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=1800,  # 30 minutos
)
def check_license_expirations(self) -> Dict[str, Any]:
    """
    Verificar requisitos legales próximos a vencer y crear alertas.

    Esta tarea se ejecuta automáticamente cada día según el schedule en celery.py.

    Niveles de alerta según días hasta vencimiento:
    - 90 días: Nivel INFO (informativo)
    - 60 días: Nivel WARNING (advertencia)
    - 30 días: Nivel URGENT (urgente)
    - Vencido: Nivel CRITICAL (crítico)

    Returns:
        Dict con estadísticas de verificación y alertas creadas
    """
    try:
        logger.info(f"[Task {self.request.id}] Verificando vencimientos de requisitos legales")

        today = timezone.now().date()
        stats = {
            'requisitos_revisados': 0,
            'alertas_creadas': {
                'info': 0,      # 90 días
                'warning': 0,   # 60 días
                'urgent': 0,    # 30 días
                'critical': 0,  # Vencido
            },
            'empresas_afectadas': set(),
        }

        # Obtener requisitos vigentes con fecha de vencimiento
        requisitos = EmpresaRequisito.objects.filter(
            is_active=True,
            estado__in=[
                EmpresaRequisito.Estado.VIGENTE,
                EmpresaRequisito.Estado.PROXIMO_VENCER,
            ],
            fecha_vencimiento__isnull=False,
        ).select_related('requisito', 'responsable')

        stats['requisitos_revisados'] = requisitos.count()

        for requisito in requisitos:
            dias_para_vencer = (requisito.fecha_vencimiento - today).days
            alerta_creada = False
            nivel = None

            # Determinar nivel de alerta según días restantes
            if dias_para_vencer < 0:
                # Vencido - CRITICAL
                nivel = 'critical'
                dias_antes = 0
                # Actualizar estado a VENCIDO
                if requisito.estado != EmpresaRequisito.Estado.VENCIDO:
                    requisito.estado = EmpresaRequisito.Estado.VENCIDO
                    requisito.save(update_fields=['estado'])

            elif dias_para_vencer <= 30:
                # Urgente - 30 días o menos
                nivel = 'urgent'
                dias_antes = 30
                # Actualizar estado a PROXIMO_VENCER
                if requisito.estado != EmpresaRequisito.Estado.PROXIMO_VENCER:
                    requisito.estado = EmpresaRequisito.Estado.PROXIMO_VENCER
                    requisito.save(update_fields=['estado'])

            elif dias_para_vencer <= 60:
                # Advertencia - 60 días o menos
                nivel = 'warning'
                dias_antes = 60

            elif dias_para_vencer <= 90:
                # Informativo - 90 días o menos
                nivel = 'info'
                dias_antes = 90

            # Crear alerta si corresponde
            if nivel:
                alerta, created = AlertaVencimiento.objects.get_or_create(
                    empresa_requisito=requisito,
                    dias_antes=dias_antes,
                    defaults={
                        'tipo_alerta': AlertaVencimiento.TipoAlerta.SISTEMA,
                        'fecha_programada': today,
                        'enviada': False,
                        'mensaje_personalizado': _generar_mensaje_alerta(
                            requisito, dias_para_vencer, nivel
                        ),
                    }
                )

                if created:
                    stats['alertas_creadas'][nivel] += 1
                    stats['empresas_afectadas'].add(requisito.empresa_id)
                    alerta_creada = True

                    logger.info(
                        f"[Task {self.request.id}] Alerta {nivel.upper()} creada: "
                        f"{requisito.requisito.nombre} vence en {dias_para_vencer} días "
                        f"(Empresa: {requisito.empresa_id})"
                    )

        # Convertir set a count para serialización
        stats['empresas_afectadas'] = len(stats['empresas_afectadas'])

        total_alertas = sum(stats['alertas_creadas'].values())

        logger.info(
            f"[Task {self.request.id}] Verificación completada: "
            f"{total_alertas} alertas creadas de {stats['requisitos_revisados']} requisitos"
        )

        return {
            'status': 'success',
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
            **stats
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error verificando vencimientos: {str(exc)}")
        raise self.retry(exc=exc)


def _generar_mensaje_alerta(requisito: EmpresaRequisito, dias: int, nivel: str) -> str:
    """
    Genera mensaje personalizado para alerta de vencimiento.

    Args:
        requisito: Instancia de EmpresaRequisito
        dias: Días hasta vencimiento (negativo si ya venció)
        nivel: Nivel de alerta (info, warning, urgent, critical)

    Returns:
        Mensaje formateado
    """
    if dias < 0:
        return (
            f"⚠️ VENCIDO: El requisito '{requisito.requisito.nombre}' "
            f"venció hace {abs(dias)} días. Acción inmediata requerida."
        )
    elif dias == 0:
        return (
            f"⚠️ VENCE HOY: El requisito '{requisito.requisito.nombre}' "
            f"vence hoy. Renovación urgente."
        )
    else:
        return (
            f"📅 El requisito '{requisito.requisito.nombre}' vence en {dias} días "
            f"({requisito.fecha_vencimiento.strftime('%d/%m/%Y')}). "
            f"Por favor iniciar proceso de renovación."
        )


# ═══════════════════════════════════════════════════
# TAREAS DE NOTIFICACIONES
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=600,  # 10 minutos
)
def send_expiration_notifications(self) -> Dict[str, Any]:
    """
    Enviar notificaciones de vencimientos por email y sistema.

    Esta tarea se ejecuta automáticamente cada día según el schedule en celery.py.
    Agrupa alertas por empresa para enviar un solo email consolidado.

    Returns:
        Dict con estadísticas de notificaciones enviadas
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando notificaciones de vencimientos")

        today = timezone.now().date()
        stats = {
            'emails_enviados': 0,
            'notificaciones_sistema': 0,
            'empresas_notificadas': 0,
            'alertas_procesadas': 0,
            'errores': [],
        }

        # Obtener alertas pendientes de envío
        alertas_pendientes = AlertaVencimiento.objects.filter(
            enviada=False,
            fecha_programada__lte=today,
        ).select_related(
            'empresa_requisito',
            'empresa_requisito__requisito',
            'empresa_requisito__responsable',
        ).order_by('empresa_requisito__empresa_id')

        # Agrupar alertas por empresa
        alertas_por_empresa = {}
        for alerta in alertas_pendientes:
            empresa_id = alerta.empresa_requisito.empresa_id
            if empresa_id not in alertas_por_empresa:
                alertas_por_empresa[empresa_id] = []
            alertas_por_empresa[empresa_id].append(alerta)

        # Procesar alertas por empresa
        for empresa_id, alertas in alertas_por_empresa.items():
            try:
                # Enviar notificación consolidada
                resultado = _send_company_expiration_email(empresa_id, alertas)

                if resultado['success']:
                    stats['emails_enviados'] += resultado.get('emails_sent', 0)
                    stats['empresas_notificadas'] += 1

                    # Marcar alertas como enviadas
                    for alerta in alertas:
                        alerta.enviada = True
                        alerta.fecha_envio = timezone.now()
                        alerta.save(update_fields=['enviada', 'fecha_envio'])
                        stats['alertas_procesadas'] += 1

                        # Crear notificación en sistema
                        _create_system_notification(alerta)
                        stats['notificaciones_sistema'] += 1
                else:
                    error_msg = f"Error enviando email a empresa {empresa_id}: {resultado.get('error')}"
                    logger.error(f"[Task {self.request.id}] {error_msg}")
                    stats['errores'].append(error_msg)

            except Exception as exc:
                error_msg = f"Error procesando empresa {empresa_id}: {str(exc)}"
                logger.error(f"[Task {self.request.id}] {error_msg}")
                stats['errores'].append(error_msg)

        logger.info(
            f"[Task {self.request.id}] Notificaciones completadas: "
            f"{stats['emails_enviados']} emails, "
            f"{stats['notificaciones_sistema']} notificaciones sistema"
        )

        return {
            'status': 'success',
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
            **stats
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error enviando notificaciones: {str(exc)}")
        raise self.retry(exc=exc)


def _send_company_expiration_email(empresa_id: int, alertas: List[AlertaVencimiento]) -> Dict[str, Any]:
    """
    Envía email consolidado de vencimientos a una empresa.

    Args:
        empresa_id: ID de la empresa
        alertas: Lista de alertas a notificar

    Returns:
        Dict con resultado del envío
    """
    from apps.core.tasks import send_email_async

    try:
        # Obtener responsables únicos
        responsables = set()
        for alerta in alertas:
            if alerta.empresa_requisito.responsable:
                responsables.add(alerta.empresa_requisito.responsable.email)

            # Agregar destinatarios adicionales de la alerta
            if alerta.destinatarios:
                for email in alerta.destinatarios.split(','):
                    responsables.add(email.strip())

        if not responsables:
            # Si no hay responsables, enviar a admin
            responsables.add(settings.DEFAULT_FROM_EMAIL)

        # Agrupar alertas por nivel de urgencia
        alertas_por_nivel = {
            'critical': [],
            'urgent': [],
            'warning': [],
            'info': [],
        }

        for alerta in alertas:
            requisito = alerta.empresa_requisito
            dias = requisito.dias_para_vencer

            if dias is None:
                continue

            if dias < 0:
                nivel = 'critical'
            elif dias <= 30:
                nivel = 'urgent'
            elif dias <= 60:
                nivel = 'warning'
            else:
                nivel = 'info'

            alertas_por_nivel[nivel].append({
                'requisito': requisito.requisito.nombre,
                'numero_documento': requisito.numero_documento,
                'fecha_vencimiento': requisito.fecha_vencimiento,
                'dias_para_vencer': dias,
                'responsable': requisito.responsable.get_full_name() if requisito.responsable else 'No asignado',
            })

        # Preparar contexto para template
        context = {
            'empresa_id': empresa_id,
            'total_alertas': len(alertas),
            'alertas_critical': alertas_por_nivel['critical'],
            'alertas_urgent': alertas_por_nivel['urgent'],
            'alertas_warning': alertas_por_nivel['warning'],
            'alertas_info': alertas_por_nivel['info'],
            'fecha': timezone.now().date(),
        }

        # Renderizar email (por ahora texto simple, luego usar template HTML)
        subject = f"Alertas de Vencimiento de Requisitos - {len(alertas)} requisitos"

        message_parts = [
            f"Se detectaron {len(alertas)} requisitos legales que requieren atención:\n",
        ]

        if alertas_por_nivel['critical']:
            message_parts.append(f"\n⚠️ VENCIDOS ({len(alertas_por_nivel['critical'])}):")
            for item in alertas_por_nivel['critical']:
                message_parts.append(
                    f"  - {item['requisito']}: Venció hace {abs(item['dias_para_vencer'])} días"
                )

        if alertas_por_nivel['urgent']:
            message_parts.append(f"\n🔴 URGENTES - Vencen en 30 días o menos ({len(alertas_por_nivel['urgent'])}):")
            for item in alertas_por_nivel['urgent']:
                message_parts.append(
                    f"  - {item['requisito']}: Vence en {item['dias_para_vencer']} días "
                    f"({item['fecha_vencimiento'].strftime('%d/%m/%Y')})"
                )

        if alertas_por_nivel['warning']:
            message_parts.append(f"\n🟡 ADVERTENCIA - Vencen en 60 días o menos ({len(alertas_por_nivel['warning'])}):")
            for item in alertas_por_nivel['warning']:
                message_parts.append(
                    f"  - {item['requisito']}: Vence en {item['dias_para_vencer']} días "
                    f"({item['fecha_vencimiento'].strftime('%d/%m/%Y')})"
                )

        message_parts.append("\n\nPor favor ingrese al sistema para gestionar estos requisitos.")

        message = '\n'.join(message_parts)

        # Enviar email
        result = send_email_async.delay(
            subject=subject,
            message=message,
            recipient_list=list(responsables),
        )

        return {
            'success': True,
            'emails_sent': len(responsables),
            'task_id': result.id,
        }

    except Exception as exc:
        logger.error(f"Error enviando email a empresa {empresa_id}: {str(exc)}")
        return {
            'success': False,
            'error': str(exc),
        }


def _create_system_notification(alerta: AlertaVencimiento) -> None:
    """
    Crea notificación en el sistema para la alerta.

    Args:
        alerta: Instancia de AlertaVencimiento

    TODO: Implementar cuando se tenga el modelo de Notificaciones del sistema
    """
    # Placeholder - implementar cuando exista modelo de notificaciones
    logger.debug(f"Notificación de sistema creada para alerta {alerta.id}")
    pass


# ═══════════════════════════════════════════════════
# TAREAS AUXILIARES Y UTILIDADES
# ═══════════════════════════════════════════════════

@shared_task(bind=True)
def generate_compliance_report(self, empresa_id: int,
                               periodo_inicio: str,
                               periodo_fin: str) -> Dict[str, Any]:
    """
    Genera reporte de cumplimiento legal para una empresa.

    Args:
        empresa_id: ID de la empresa
        periodo_inicio: Fecha de inicio (formato ISO: YYYY-MM-DD)
        periodo_fin: Fecha de fin (formato ISO: YYYY-MM-DD)

    Returns:
        Dict con información del reporte generado
    """
    try:
        logger.info(
            f"[Task {self.request.id}] Generando reporte de cumplimiento "
            f"para empresa {empresa_id}"
        )

        # Convertir fechas
        fecha_inicio = datetime.fromisoformat(periodo_inicio).date()
        fecha_fin = datetime.fromisoformat(periodo_fin).date()

        # Obtener estadísticas
        requisitos = EmpresaRequisito.objects.filter(
            empresa_id=empresa_id,
            is_active=True,
        )

        stats = {
            'total_requisitos': requisitos.count(),
            'vigentes': requisitos.filter(estado=EmpresaRequisito.Estado.VIGENTE).count(),
            'proximos_vencer': requisitos.filter(estado=EmpresaRequisito.Estado.PROXIMO_VENCER).count(),
            'vencidos': requisitos.filter(estado=EmpresaRequisito.Estado.VENCIDO).count(),
            'en_tramite': requisitos.filter(estado=EmpresaRequisito.Estado.EN_TRAMITE).count(),
            'porcentaje_cumplimiento': 0,
        }

        if stats['total_requisitos'] > 0:
            stats['porcentaje_cumplimiento'] = round(
                (stats['vigentes'] / stats['total_requisitos']) * 100, 2
            )

        logger.info(f"[Task {self.request.id}] Reporte generado exitosamente")

        return {
            'status': 'success',
            'empresa_id': empresa_id,
            'periodo': {
                'inicio': periodo_inicio,
                'fin': periodo_fin,
            },
            'estadisticas': stats,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error generando reporte: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task(bind=True)
def update_requisito_status(self, requisito_id: int) -> Dict[str, Any]:
    """
    Actualiza el estado de un requisito basado en su fecha de vencimiento.

    Args:
        requisito_id: ID del EmpresaRequisito

    Returns:
        Dict con el resultado de la actualización
    """
    try:
        requisito = EmpresaRequisito.objects.get(id=requisito_id)

        old_status = requisito.estado
        dias = requisito.dias_para_vencer

        if dias is None:
            new_status = EmpresaRequisito.Estado.EN_TRAMITE
        elif dias < 0:
            new_status = EmpresaRequisito.Estado.VENCIDO
        elif dias <= 30:
            new_status = EmpresaRequisito.Estado.PROXIMO_VENCER
        else:
            new_status = EmpresaRequisito.Estado.VIGENTE

        if old_status != new_status:
            requisito.estado = new_status
            requisito.save(update_fields=['estado'])

            logger.info(
                f"[Task {self.request.id}] Estado actualizado: "
                f"Requisito {requisito_id} de {old_status} a {new_status}"
            )

        return {
            'status': 'success',
            'requisito_id': requisito_id,
            'old_status': old_status,
            'new_status': new_status,
            'dias_para_vencer': dias,
            'task_id': self.request.id,
        }

    except EmpresaRequisito.DoesNotExist:
        logger.error(f"[Task {self.request.id}] Requisito {requisito_id} no encontrado")
        return {
            'status': 'error',
            'error': 'Requisito no encontrado',
        }
    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error actualizando estado: {str(exc)}")
        raise self.retry(exc=exc)
