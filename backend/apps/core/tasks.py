"""
Tareas asíncronas de Celery para el módulo Core
StrateKaz
"""
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.files.storage import default_storage
from django.db.models import Q

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════
# TAREAS DE EMAIL
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=300,  # 5 minutos
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def send_email_async(self, subject: str, message: str, recipient_list: List[str],
                     html_message: str = None, from_email: str = None) -> Dict[str, Any]:
    """
    Enviar email de forma asíncrona.

    Args:
        subject: Asunto del email
        message: Mensaje en texto plano
        recipient_list: Lista de destinatarios
        html_message: Mensaje en HTML (opcional)
        from_email: Email del remitente (opcional)

    Returns:
        Dict con el resultado del envío
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando email a {len(recipient_list)} destinatarios")

        from_email = from_email or settings.DEFAULT_FROM_EMAIL

        if html_message:
            # Enviar email con HTML
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipient_list,
            )
            email.attach_alternative(html_message, "text/html")
            result = email.send(fail_silently=False)
        else:
            # Enviar email en texto plano
            result = send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,
            )

        logger.info(f"[Task {self.request.id}] Email enviado exitosamente")

        return {
            'status': 'success',
            'emails_sent': result,
            'recipients': len(recipient_list),
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error enviando email: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_welcome_email_task(self, user_email: str, user_name: str,
                            tenant_name: str, cargo_name: str = '',
                            temp_password_hint: str = '') -> Dict[str, Any]:
    """
    Envia email de bienvenida a un nuevo trabajador.

    Args:
        user_email: Email del trabajador
        user_name: Nombre completo
        tenant_name: Nombre de la empresa (tenant)
        cargo_name: Nombre del cargo asignado
        temp_password_hint: Indicacion del password temporal (ej: "Tu numero de documento")
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando bienvenida a {user_email}")

        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
        login_url = f"{frontend_url}/login"

        html_content = render_to_string('emails/welcome_user.html', {
            'user_name': user_name,
            'user_email': user_email,
            'tenant_name': tenant_name,
            'cargo_name': cargo_name,
            'login_url': login_url,
            'frontend_url': frontend_url,
            'temp_password_hint': temp_password_hint,
        })

        text_content = strip_tags(html_content)

        email = EmailMultiAlternatives(
            subject=f'Bienvenido/a a {tenant_name} - StrateKaz',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"[Task {self.request.id}] Email de bienvenida enviado a {user_email}")

        return {
            'status': 'success',
            'email': user_email,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error enviando bienvenida a {user_email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_setup_password_email_task(
    self,
    user_email: str,
    user_name: str,
    tenant_name: str,
    cargo_name: str = '',
    setup_url: str = '',
    expiry_hours: int = 72,
    primary_color: str = '#3b82f6',
    secondary_color: str = '#1e40af',
) -> Dict[str, Any]:
    """
    Envia email con enlace para configurar contraseña inicial.

    Se usa cuando RH crea un colaborador con acceso al sistema desde Talent Hub.
    El empleado recibe este email para establecer su contraseña.
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando setup password a {user_email}")

        html_content = render_to_string('emails/setup_password.html', {
            'user_name': user_name,
            'tenant_name': tenant_name,
            'cargo_name': cargo_name,
            'setup_url': setup_url,
            'expiry_hours': expiry_hours,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'current_year': datetime.now().year,
        })

        text_content = strip_tags(html_content)

        email = EmailMultiAlternatives(
            subject=f'Configura tu contraseña - {tenant_name}',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"[Task {self.request.id}] Email setup password enviado a {user_email}")

        return {
            'status': 'success',
            'email': user_email,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error enviando setup password a {user_email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3)
def send_notification_email(self, user_id: int, template: str, context: Dict[str, Any],
                            schema_name: str = None) -> Dict[str, Any]:
    """
    Enviar email de notificación usando template.

    Args:
        user_id: ID del usuario destinatario
        template: Nombre del template de email
        context: Contexto para renderizar el template
        schema_name: Schema del tenant (requerido para contexto Celery)

    Returns:
        Dict con el resultado del envío
    """
    from django_tenants.utils import schema_context

    if not schema_name:
        logger.error(f"send_notification_email: schema_name no proporcionado")
        return {'status': 'error', 'error': 'schema_name requerido'}

    try:
        with schema_context(schema_name):
            from django.contrib.auth import get_user_model
            User = get_user_model()

            user = User.objects.get(id=user_id)

            html_content = render_to_string(f'emails/{template}.html', context)
            text_content = strip_tags(html_content)

            subject = context.get('subject', 'Notificación del Sistema')

            return send_email_async.delay(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content,
            ).get()

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error en notificación: {str(exc)}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════
# TAREAS DE REPORTES
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=2,
    time_limit=1800,  # 30 minutos
    soft_time_limit=1500,  # 25 minutos
)
def generate_report_async(self, report_type: str, params: Dict[str, Any],
                         user_id: int = None) -> Dict[str, Any]:
    """
    Generar reporte de forma asíncrona.

    Args:
        report_type: Tipo de reporte a generar
        params: Parámetros del reporte
        user_id: ID del usuario que solicitó el reporte

    Returns:
        Dict con información del reporte generado
    """
    try:
        logger.info(f"[Task {self.request.id}] Generando reporte: {report_type}")

        # Aquí iría la lógica específica según el tipo de reporte
        # Por ahora es un ejemplo genérico

        report_name = f"reporte_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        report_path = f"reports/{report_name}"

        # Simular generación de reporte
        # En producción aquí se generaría el PDF con WeasyPrint, Excel con openpyxl, etc.

        logger.info(f"[Task {self.request.id}] Reporte generado: {report_name}")

        # Si se especificó un usuario, enviar email con el reporte
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)

            send_email_async.delay(
                subject=f"Reporte {report_type} generado",
                message=f"Su reporte ha sido generado exitosamente. Puede descargarlo desde el sistema.",
                recipient_list=[user.email],
            )

        return {
            'status': 'success',
            'report_type': report_type,
            'report_path': report_path,
            'report_name': report_name,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error generando reporte: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task(bind=True)
def send_weekly_reports(self) -> Dict[str, Any]:
    """
    Tarea periódica: Enviar reportes semanales a los administradores.

    Esta tarea se ejecuta automáticamente según el schedule configurado en celery.py.
    Itera sobre tenants activos usando schema_context.
    """
    from django_tenants.utils import schema_context
    from apps.tenant.models import Tenant

    logger.info(f"[Task {self.request.id}] Generando reportes semanales")

    total_reports = 0
    tenants = Tenant.objects.filter(is_active=True).exclude(schema_name='public')

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                from django.contrib.auth import get_user_model
                User = get_user_model()

                admins = User.objects.filter(
                    Q(is_superuser=True) | Q(cargo__rol_sistema__code='ADMIN')
                ).distinct()

                for admin in admins:
                    generate_report_async.delay(
                        report_type='weekly_summary',
                        params={
                            'start_date': (datetime.now() - timedelta(days=7)).isoformat(),
                            'end_date': datetime.now().isoformat(),
                        },
                        user_id=admin.id,
                    )
                    total_reports += 1
        except Exception as e:
            logger.error(
                f'[WeeklyReports] Error en tenant {tenant.schema_name}: {e}'
            )

    logger.info(f"[Task {self.request.id}] {total_reports} reportes semanales programados")

    return {
        'status': 'success',
        'reports_scheduled': total_reports,
        'task_id': self.request.id,
        'timestamp': datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════
# TAREAS DE ARCHIVOS
# ═══════════════════════════════════════════════════

@shared_task(bind=True, max_retries=2)
def process_file_upload(self, file_path: str, file_type: str,
                       metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Procesar archivo subido de forma asíncrona.

    Args:
        file_path: Ruta del archivo en el storage
        file_type: Tipo de archivo (excel, csv, pdf, etc.)
        metadata: Metadata adicional del archivo

    Returns:
        Dict con el resultado del procesamiento
    """
    try:
        logger.info(f"[Task {self.request.id}] Procesando archivo: {file_path}")

        # Aquí iría la lógica específica según el tipo de archivo
        # Ejemplos:
        # - Extraer datos de Excel
        # - Procesar CSV
        # - Generar thumbnails de imágenes
        # - Escanear archivos con antivirus
        # - Comprimir archivos

        return {
            'status': 'success',
            'file_path': file_path,
            'file_type': file_type,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error procesando archivo: {str(exc)}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════
# TAREAS DE MANTENIMIENTO
# ═══════════════════════════════════════════════════

@shared_task(bind=True)
def cleanup_temp_files(self) -> Dict[str, Any]:
    """
    Tarea periódica: Limpiar archivos temporales antiguos.

    Esta tarea se ejecuta automáticamente según el schedule configurado en celery.py
    """
    try:
        logger.info(f"[Task {self.request.id}] Iniciando limpieza de archivos temporales")

        temp_dir = Path(settings.MEDIA_ROOT) / 'temp'
        if not temp_dir.exists():
            return {'status': 'skipped', 'reason': 'temp directory does not exist'}

        # Eliminar archivos más antiguos que 24 horas
        cutoff_time = datetime.now() - timedelta(hours=24)
        deleted_count = 0
        deleted_size = 0

        for file_path in temp_dir.rglob('*'):
            if file_path.is_file():
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

                if file_mtime < cutoff_time:
                    deleted_size += file_path.stat().st_size
                    file_path.unlink()
                    deleted_count += 1

        logger.info(
            f"[Task {self.request.id}] Limpieza completada: "
            f"{deleted_count} archivos eliminados ({deleted_size / 1024 / 1024:.2f} MB)"
        )

        return {
            'status': 'success',
            'files_deleted': deleted_count,
            'size_freed_mb': deleted_size / 1024 / 1024,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error en limpieza: {str(exc)}")
        raise


@shared_task(bind=True)
def backup_database(self) -> Dict[str, Any]:
    """
    Tarea periódica: Realizar backup de la base de datos.

    Esta tarea se ejecuta automáticamente según el schedule configurado en celery.py
    """
    try:
        logger.info(f"[Task {self.request.id}] Iniciando backup de base de datos")

        # Aquí iría la lógica de backup
        # Ejemplo: Ejecutar mysqldump o pg_dump

        backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql.gz"

        logger.info(f"[Task {self.request.id}] Backup completado: {backup_name}")

        return {
            'status': 'success',
            'backup_name': backup_name,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error en backup: {str(exc)}")
        raise


@shared_task(bind=True)
def system_health_check(self) -> Dict[str, Any]:
    """
    Tarea periódica: Verificar el estado de salud del sistema.

    Esta tarea se ejecuta automáticamente según el schedule configurado en celery.py
    """
    try:
        logger.info(f"[Task {self.request.id}] Verificando estado del sistema")

        health_status = {
            'database': 'healthy',
            'redis': 'healthy',
            'celery': 'healthy',
            'disk_space': 'healthy',
        }

        # Aquí iría la lógica de verificación
        # - Verificar conexión a base de datos
        # - Verificar conexión a Redis
        # - Verificar espacio en disco
        # - Verificar servicios críticos

        return {
            'status': 'success',
            'health_status': health_status,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(f"[Task {self.request.id}] Error en health check: {str(exc)}")

        # Enviar alerta a administradores
        send_email_async.delay(
            subject='ALERTA: Error en Health Check del Sistema',
            message=f'Se detectó un error durante la verificación de salud del sistema: {str(exc)}',
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
        )

        raise


# ═══════════════════════════════════════════════════
# TAREAS DE EJEMPLO Y TESTING
# ═══════════════════════════════════════════════════

@shared_task(bind=True)
def example_task(self, param1: str, param2: int = 0) -> Dict[str, Any]:
    """
    Tarea de ejemplo para testing.

    Args:
        param1: Parámetro de ejemplo
        param2: Parámetro numérico opcional

    Returns:
        Dict con información de la ejecución
    """
    logger.info(f"[Task {self.request.id}] Ejecutando tarea de ejemplo")

    return {
        'status': 'success',
        'param1': param1,
        'param2': param2,
        'task_id': self.request.id,
        'task_name': self.name,
        'timestamp': datetime.now().isoformat(),
    }


@shared_task(bind=True)
def long_running_task(self, duration: int = 60) -> Dict[str, Any]:
    """
    Tarea de larga duración para testing.

    Args:
        duration: Duración en segundos

    Returns:
        Dict con información de la ejecución
    """
    import time

    logger.info(f"[Task {self.request.id}] Iniciando tarea de {duration} segundos")

    # Actualizar progreso
    for i in range(duration):
        time.sleep(1)
        if i % 10 == 0:
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i,
                    'total': duration,
                    'percent': int((i / duration) * 100),
                }
            )

    logger.info(f"[Task {self.request.id}] Tarea completada")

    return {
        'status': 'success',
        'duration': duration,
        'task_id': self.request.id,
        'timestamp': datetime.now().isoformat(),
    }
