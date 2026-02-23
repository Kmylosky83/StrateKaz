"""
Tareas asíncronas de Celery para Motor de Cumplimiento
StrateKaz

Tareas principales:
1. scrape_legal_updates - Web scraping de normas legales colombianas (cada 15 días)
2. check_license_expirations - Verificar vencimientos de requisitos (diario)
3. send_expiration_notifications - Enviar notificaciones de vencimientos (diario)

NOTA: Tareas periódicas (Beat) iteran sobre tenants activos usando schema_context.
Tareas on-demand reciben schema_name como argumento.
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

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Retorna tenants activos (excluye public schema)."""
    from apps.tenant.models import Tenant
    return Tenant.objects.filter(is_active=True).exclude(schema_name='public')


# ═══════════════════════════════════════════════════
# TAREAS DE WEB SCRAPING - MATRIZ LEGAL
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=3600,
    time_limit=1800,
    soft_time_limit=1500,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=7200,
    retry_jitter=True,
)
def scrape_legal_updates(self, force_all: bool = False) -> Dict[str, Any]:
    """
    Web scraping de sitios oficiales colombianos para actualizar normas legales.

    Esta tarea se ejecuta automáticamente cada 15 días según el schedule en celery.py.
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

                stats['fuentes_procesadas'].append({
                    'nombre': source['nombre'],
                    'url': source['url'],
                    'timestamp': datetime.now().isoformat(),
                })

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

    TODO: Implementar lógica real de scraping usando:
    - requests o httpx para HTTP requests
    - BeautifulSoup4 o lxml para parsing HTML
    """
    return []


def _process_norma_data(norma_data: Dict[str, Any], source: Dict[str, Any]) -> tuple:
    """Procesa datos de norma scrapeada y crea/actualiza en BD."""
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
    default_retry_delay=1800,
)
def check_license_expirations(self) -> Dict[str, Any]:
    """
    Verificar requisitos legales próximos a vencer y crear alertas.

    Esta tarea se ejecuta automáticamente cada día según el schedule en celery.py.
    """
    from django_tenants.utils import schema_context

    logger.info(f"[Task {self.request.id}] Verificando vencimientos de requisitos legales")

    today = timezone.now().date()
    total_stats = {
        'requisitos_revisados': 0,
        'alertas_creadas': {
            'info': 0,
            'warning': 0,
            'urgent': 0,
            'critical': 0,
        },
        'empresas_afectadas': 0,
    }

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                stats = _check_expirations_in_tenant(today, self.request.id)
                total_stats['requisitos_revisados'] += stats['requisitos_revisados']
                for nivel in ['info', 'warning', 'urgent', 'critical']:
                    total_stats['alertas_creadas'][nivel] += stats['alertas_creadas'][nivel]
                total_stats['empresas_afectadas'] += stats['empresas_afectadas']
        except Exception as e:
            logger.error(
                f'[Cumplimiento] Error en tenant {tenant.schema_name}: {e}'
            )

    total_alertas = sum(total_stats['alertas_creadas'].values())
    logger.info(
        f"[Task {self.request.id}] Verificación completada: "
        f"{total_alertas} alertas creadas de {total_stats['requisitos_revisados']} requisitos"
    )

    return {
        'status': 'success',
        'task_id': self.request.id,
        'timestamp': datetime.now().isoformat(),
        **total_stats
    }


def _check_expirations_in_tenant(today, task_id):
    """Verifica vencimientos dentro de un schema tenant."""
    from apps.motor_cumplimiento.requisitos_legales.models import (
        EmpresaRequisito,
        AlertaVencimiento,
    )

    stats = {
        'requisitos_revisados': 0,
        'alertas_creadas': {
            'info': 0,
            'warning': 0,
            'urgent': 0,
            'critical': 0,
        },
        'empresas_afectadas': 0,
    }

    requisitos = EmpresaRequisito.objects.filter(
        is_active=True,
        estado__in=[
            EmpresaRequisito.Estado.VIGENTE,
            EmpresaRequisito.Estado.PROXIMO_VENCER,
        ],
        fecha_vencimiento__isnull=False,
    ).select_related('requisito', 'responsable')

    stats['requisitos_revisados'] = requisitos.count()
    empresas_set = set()

    for requisito in requisitos:
        dias_para_vencer = (requisito.fecha_vencimiento - today).days
        nivel = None

        if dias_para_vencer < 0:
            nivel = 'critical'
            dias_antes = 0
            if requisito.estado != EmpresaRequisito.Estado.VENCIDO:
                requisito.estado = EmpresaRequisito.Estado.VENCIDO
                requisito.save(update_fields=['estado'])

        elif dias_para_vencer <= 30:
            nivel = 'urgent'
            dias_antes = 30
            if requisito.estado != EmpresaRequisito.Estado.PROXIMO_VENCER:
                requisito.estado = EmpresaRequisito.Estado.PROXIMO_VENCER
                requisito.save(update_fields=['estado'])

        elif dias_para_vencer <= 60:
            nivel = 'warning'
            dias_antes = 60

        elif dias_para_vencer <= 90:
            nivel = 'info'
            dias_antes = 90

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
                empresas_set.add(requisito.empresa_id)

                logger.info(
                    f"[Task {task_id}] Alerta {nivel.upper()} creada: "
                    f"{requisito.requisito.nombre} vence en {dias_para_vencer} días"
                )

    stats['empresas_afectadas'] = len(empresas_set)
    return stats


def _generar_mensaje_alerta(requisito, dias: int, nivel: str) -> str:
    """Genera mensaje personalizado para alerta de vencimiento."""
    if dias < 0:
        return (
            f"VENCIDO: El requisito '{requisito.requisito.nombre}' "
            f"venció hace {abs(dias)} días. Acción inmediata requerida."
        )
    elif dias == 0:
        return (
            f"VENCE HOY: El requisito '{requisito.requisito.nombre}' "
            f"vence hoy. Renovación urgente."
        )
    else:
        return (
            f"El requisito '{requisito.requisito.nombre}' vence en {dias} días "
            f"({requisito.fecha_vencimiento.strftime('%d/%m/%Y')}). "
            f"Por favor iniciar proceso de renovación."
        )


# ═══════════════════════════════════════════════════
# TAREAS DE NOTIFICACIONES
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=600,
)
def send_expiration_notifications(self) -> Dict[str, Any]:
    """
    Enviar notificaciones de vencimientos por email y sistema.

    Esta tarea se ejecuta automáticamente cada día según el schedule en celery.py.
    Agrupa alertas por empresa para enviar un solo email consolidado.
    """
    from django_tenants.utils import schema_context

    logger.info(f"[Task {self.request.id}] Enviando notificaciones de vencimientos")

    total_stats = {
        'emails_enviados': 0,
        'notificaciones_sistema': 0,
        'empresas_notificadas': 0,
        'alertas_procesadas': 0,
        'errores': [],
    }

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                stats = _send_notifications_in_tenant(self.request.id)
                total_stats['emails_enviados'] += stats['emails_enviados']
                total_stats['notificaciones_sistema'] += stats['notificaciones_sistema']
                total_stats['empresas_notificadas'] += stats['empresas_notificadas']
                total_stats['alertas_procesadas'] += stats['alertas_procesadas']
                total_stats['errores'].extend(stats['errores'])
        except Exception as e:
            logger.error(
                f'[Cumplimiento] Error en tenant {tenant.schema_name}: {e}'
            )

    logger.info(
        f"[Task {self.request.id}] Notificaciones completadas: "
        f"{total_stats['emails_enviados']} emails, "
        f"{total_stats['notificaciones_sistema']} notificaciones sistema"
    )

    return {
        'status': 'success',
        'task_id': self.request.id,
        'timestamp': datetime.now().isoformat(),
        **total_stats
    }


def _send_notifications_in_tenant(task_id):
    """Envía notificaciones dentro de un schema tenant."""
    from apps.motor_cumplimiento.requisitos_legales.models import AlertaVencimiento

    today = timezone.now().date()
    stats = {
        'emails_enviados': 0,
        'notificaciones_sistema': 0,
        'empresas_notificadas': 0,
        'alertas_procesadas': 0,
        'errores': [],
    }

    alertas_pendientes = AlertaVencimiento.objects.filter(
        enviada=False,
        fecha_programada__lte=today,
    ).select_related(
        'empresa_requisito',
        'empresa_requisito__requisito',
        'empresa_requisito__responsable',
    ).order_by('empresa_requisito__empresa_id')

    alertas_por_empresa = {}
    for alerta in alertas_pendientes:
        empresa_id = alerta.empresa_requisito.empresa_id
        if empresa_id not in alertas_por_empresa:
            alertas_por_empresa[empresa_id] = []
        alertas_por_empresa[empresa_id].append(alerta)

    for empresa_id, alertas in alertas_por_empresa.items():
        try:
            resultado = _send_company_expiration_email(empresa_id, alertas)

            if resultado['success']:
                stats['emails_enviados'] += resultado.get('emails_sent', 0)
                stats['empresas_notificadas'] += 1

                for alerta in alertas:
                    alerta.enviada = True
                    alerta.fecha_envio = timezone.now()
                    alerta.save(update_fields=['enviada', 'fecha_envio'])
                    stats['alertas_procesadas'] += 1

                    _create_system_notification(alerta)
                    stats['notificaciones_sistema'] += 1
            else:
                error_msg = f"Error enviando email a empresa {empresa_id}: {resultado.get('error')}"
                logger.error(f"[Task {task_id}] {error_msg}")
                stats['errores'].append(error_msg)

        except Exception as exc:
            error_msg = f"Error procesando empresa {empresa_id}: {str(exc)}"
            logger.error(f"[Task {task_id}] {error_msg}")
            stats['errores'].append(error_msg)

    return stats


def _send_company_expiration_email(empresa_id: int, alertas) -> Dict[str, Any]:
    """Envía email consolidado de vencimientos a una empresa."""
    from apps.core.tasks import send_email_async

    try:
        responsables = set()
        for alerta in alertas:
            if alerta.empresa_requisito.responsable:
                responsables.add(alerta.empresa_requisito.responsable.email)

            if alerta.destinatarios:
                for email in alerta.destinatarios.split(','):
                    responsables.add(email.strip())

        if not responsables:
            responsables.add(settings.DEFAULT_FROM_EMAIL)

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

        subject = f"Alertas de Vencimiento de Requisitos - {len(alertas)} requisitos"

        message_parts = [
            f"Se detectaron {len(alertas)} requisitos legales que requieren atención:\n",
        ]

        if alertas_por_nivel['critical']:
            message_parts.append(f"\nVENCIDOS ({len(alertas_por_nivel['critical'])}):")
            for item in alertas_por_nivel['critical']:
                message_parts.append(
                    f"  - {item['requisito']}: Venció hace {abs(item['dias_para_vencer'])} días"
                )

        if alertas_por_nivel['urgent']:
            message_parts.append(f"\nURGENTES - Vencen en 30 días o menos ({len(alertas_por_nivel['urgent'])}):")
            for item in alertas_por_nivel['urgent']:
                message_parts.append(
                    f"  - {item['requisito']}: Vence en {item['dias_para_vencer']} días "
                    f"({item['fecha_vencimiento'].strftime('%d/%m/%Y')})"
                )

        if alertas_por_nivel['warning']:
            message_parts.append(f"\nADVERTENCIA - Vencen en 60 días o menos ({len(alertas_por_nivel['warning'])}):")
            for item in alertas_por_nivel['warning']:
                message_parts.append(
                    f"  - {item['requisito']}: Vence en {item['dias_para_vencer']} días "
                    f"({item['fecha_vencimiento'].strftime('%d/%m/%Y')})"
                )

        message_parts.append("\n\nPor favor ingrese al sistema para gestionar estos requisitos.")

        message = '\n'.join(message_parts)

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


def _create_system_notification(alerta) -> None:
    """Crea notificación en el sistema para la alerta."""
    logger.debug(f"Notificación de sistema creada para alerta {alerta.id}")


# ═══════════════════════════════════════════════════
# TAREAS AUXILIARES Y UTILIDADES
# ═══════════════════════════════════════════════════

@shared_task(bind=True)
def generate_compliance_report(self, empresa_id: int,
                               periodo_inicio: str,
                               periodo_fin: str,
                               schema_name: str = None) -> Dict[str, Any]:
    """
    Genera reporte de cumplimiento legal para una empresa.
    Requiere schema_name para ejecutar en el contexto correcto del tenant.
    """
    from django_tenants.utils import schema_context

    if not schema_name:
        logger.error(f"generate_compliance_report: schema_name no proporcionado")
        return {'status': 'error', 'error': 'schema_name requerido'}

    with schema_context(schema_name):
        from apps.motor_cumplimiento.requisitos_legales.models import EmpresaRequisito

        try:
            logger.info(
                f"[Task {self.request.id}] Generando reporte de cumplimiento "
                f"para empresa {empresa_id}"
            )

            fecha_inicio = datetime.fromisoformat(periodo_inicio).date()
            fecha_fin = datetime.fromisoformat(periodo_fin).date()

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
def update_requisito_status(self, requisito_id: int, schema_name: str = None) -> Dict[str, Any]:
    """
    Actualiza el estado de un requisito basado en su fecha de vencimiento.
    Requiere schema_name para ejecutar en el contexto correcto del tenant.
    """
    from django_tenants.utils import schema_context

    if not schema_name:
        logger.error(f"update_requisito_status: schema_name no proporcionado")
        return {'status': 'error', 'error': 'schema_name requerido'}

    with schema_context(schema_name):
        from apps.motor_cumplimiento.requisitos_legales.models import EmpresaRequisito

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
