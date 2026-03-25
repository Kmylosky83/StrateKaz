"""
Tareas asíncronas de Celery para el módulo Core
StrateKaz
"""
import logging
import os
import shutil
import subprocess
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
from django.utils import timezone

logger = logging.getLogger(__name__)


def _log_email_failure_if_final(task, email_type, user_email, tenant, exc):
    """
    Si este es el último reintento, loguear como CRITICAL (dead letter).

    Esto permite que herramientas de monitoreo (Sentry, CloudWatch, etc.)
    detecten emails que nunca se pudieron enviar después de todos los
    reintentos, sin necesidad de un modelo FailedEmailTask.
    """
    retries = getattr(task.request, 'retries', 0)
    max_retries = getattr(task, 'max_retries', 3)

    if retries >= max_retries:
        logger.critical(
            '[DEAD-LETTER] Email de %s FALLIDO definitivamente '
            'después de %d reintentos. '
            'Destinatario: %s | Tenant: %s | Task ID: %s | Error: %s',
            email_type,
            retries,
            user_email,
            tenant,
            task.request.id,
            exc,
        )
    else:
        logger.error(
            '[Task %s] Error enviando email de %s a %s '
            '(intento %d/%d): %s',
            task.request.id,
            email_type,
            user_email,
            retries + 1,
            max_retries,
            exc,
        )


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
                            temp_password_hint: str = '',
                            primary_color: str = '#ec268f',
                            secondary_color: str = '#000000',
                            current_year: int = None) -> Dict[str, Any]:
    """
    Envia email de bienvenida a un nuevo trabajador.

    Args:
        user_email: Email del trabajador
        user_name: Nombre completo
        tenant_name: Nombre de la empresa (tenant)
        cargo_name: Nombre del cargo asignado
        temp_password_hint: Indicacion del password temporal (ej: "Tu numero de documento")
        primary_color: Color primario del tenant para branding (#ec268f por defecto)
        secondary_color: Color secundario del tenant para branding (#000000 por defecto)
        current_year: Año para el footer (se calcula automáticamente si no se pasa)
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando bienvenida a {user_email}")

        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
        login_url = f"{frontend_url}/login"
        year = current_year or datetime.now().year

        html_content = render_to_string('emails/welcome_user.html', {
            'user_name': user_name,
            'user_email': user_email,
            'tenant_name': tenant_name,
            'cargo_name': cargo_name,
            'login_url': login_url,
            'frontend_url': frontend_url,
            'temp_password_hint': temp_password_hint,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'current_year': year,
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
        _log_email_failure_if_final(
            self, 'bienvenida', user_email, tenant_name, exc
        )
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
    expiry_hours: int = 168,
    primary_color: str = '#ec268f',
    secondary_color: str = '#000000',
    invited_by_name: str = '',
) -> Dict[str, Any]:
    """
    Envia email con enlace para configurar contraseña inicial.

    Se usa cuando RH crea un colaborador con acceso al sistema desde Talent Hub.
    El empleado recibe este email para establecer su contraseña.
    invited_by_name: nombre del admin que creó la cuenta (personaliza el email).
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando setup password a {user_email}")

        html_content = render_to_string('emails/setup_password.html', {
            'user_name': user_name,
            'tenant_name': tenant_name,
            'cargo_name': cargo_name,
            'setup_url': setup_url,
            'expiry_hours': expiry_hours,
            'expiry_days': max(1, expiry_hours // 24),
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'invited_by_name': invited_by_name,
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
        _log_email_failure_if_final(
            self, 'setup password', user_email, tenant_name, exc
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_new_access_email_task(
    self,
    user_email: str,
    user_name: str,
    tenant_name: str,
    cargo_name: str = '',
    login_url: str = '',
    primary_color: str = '#ec268f',
    secondary_color: str = '#000000',
) -> Dict[str, Any]:
    """
    Envía email de nuevo acceso concedido a un usuario que ya tiene password.

    Se usa cuando un proveedor/cliente ya existe en otro tenant y se le crea
    acceso en un tenant adicional. No necesita configurar contraseña.
    """
    try:
        logger.info(f"[Task {self.request.id}] Enviando nuevo acceso a {user_email}")

        html_content = render_to_string('emails/new_access_granted.html', {
            'user_name': user_name,
            'tenant_name': tenant_name,
            'cargo_name': cargo_name,
            'login_url': login_url,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'current_year': datetime.now().year,
        })

        text_content = strip_tags(html_content)

        email = EmailMultiAlternatives(
            subject=f'Nuevo acceso concedido — {tenant_name}',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(f"[Task {self.request.id}] Email nuevo acceso enviado a {user_email}")

        return {
            'status': 'success',
            'email': user_email,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        _log_email_failure_if_final(
            self, 'nuevo acceso', user_email, tenant_name, exc
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def notify_admin_password_sync_failure(
    self,
    user_id: int,
    user_email: str,
) -> Dict[str, Any]:
    """
    C11: Notifica al admin del tenant que la sincronización de password falló.

    Se dispara cuando sync_password_to_tenant_user() falla después de 3 intentos.
    El admin debe intervenir manualmente para que el usuario pueda hacer login.
    """
    security_logger = logging.getLogger('security')

    try:
        security_logger.error(
            'C11: Notificando admin sobre fallo de sync de password '
            'para User %s (%s)',
            user_id, user_email,
        )

        subject = (
            '[StrateKaz ALERTA] Fallo de sincronización de contraseña'
        )
        message = (
            f'La sincronización de contraseña falló para el usuario '
            f'{user_email} (ID: {user_id}) después de 3 intentos.\n\n'
            f'El usuario configuró su contraseña localmente pero NO se '
            f'sincronizó con TenantUser (schema public). Esto significa '
            f'que el usuario NO podrá hacer login.\n\n'
            f'Acción requerida: Verificar manualmente la sincronización '
            f'o solicitar al usuario que restablezca su contraseña.'
        )

        # Enviar al email de alerta configurado o al DEFAULT_FROM_EMAIL como fallback
        alert_email = getattr(
            settings, 'ALERT_EMAIL', settings.DEFAULT_FROM_EMAIL
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[alert_email],
            fail_silently=False,
        )

        logger.info(
            'C11: Notificación de fallo de sync enviada a %s',
            alert_email,
        )

        return {
            'status': 'success',
            'user_id': user_id,
            'user_email': user_email,
            'task_id': self.request.id,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.error(
            'C11: Error enviando notificación de fallo de sync '
            'para User %s: %s',
            user_id, exc,
        )
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


@shared_task(bind=True, time_limit=1800, soft_time_limit=1500)
def backup_database(self) -> Dict[str, Any]:
    """
    Tarea periódica: Realizar backup de la base de datos con pg_dump.

    Crea un backup en formato custom (comprimido) de PostgreSQL.
    Limpia backups antiguos (>7 días) generados por esta tarea.
    Se ejecuta cada 6 horas via Celery Beat.
    """
    logger.info(f"[Task {self.request.id}] Iniciando backup de base de datos")

    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')

    # Determinar directorio de backups según entorno
    if os.path.exists('/opt/stratekaz'):
        # Producción (VPS)
        backup_dir = '/var/backups/stratekaz/celery'
    elif os.path.exists('/app'):
        # Docker
        backup_dir = '/app/backups'
    else:
        # Desarrollo local / fallback
        backup_dir = str(Path(settings.BASE_DIR) / 'backups')

    try:
        os.makedirs(backup_dir, exist_ok=True)
    except OSError as e:
        logger.error(f"[Task {self.request.id}] No se pudo crear directorio de backups: {e}")
        _send_backup_alert(f'No se pudo crear directorio {backup_dir}: {e}')
        return {'status': 'error', 'error': f'No se pudo crear directorio: {e}'}

    backup_file = os.path.join(backup_dir, f'backup_{timestamp}.dump')

    db = settings.DATABASES['default']

    # Verificar que pg_dump está disponible
    try:
        subprocess.run(
            ['pg_dump', '--version'],
            capture_output=True, text=True, timeout=10,
        )
    except FileNotFoundError:
        error_msg = 'pg_dump no encontrado en el PATH del sistema'
        logger.error(f"[Task {self.request.id}] {error_msg}")
        _send_backup_alert(error_msg)
        return {'status': 'error', 'error': error_msg}

    cmd = [
        'pg_dump',
        '-h', db.get('HOST', 'localhost'),
        '-p', str(db.get('PORT', 5432)),
        '-U', db['USER'],
        '-d', db['NAME'],
        '-Fc',  # Custom format (comprimido)
        '-f', backup_file,
    ]

    env = os.environ.copy()
    env['PGPASSWORD'] = db['PASSWORD']

    try:
        result = subprocess.run(
            cmd, env=env, capture_output=True, text=True, timeout=1500,
        )
    except subprocess.TimeoutExpired:
        error_msg = 'pg_dump excedió el tiempo límite de 25 minutos'
        logger.error(f"[Task {self.request.id}] {error_msg}")
        _send_backup_alert(error_msg)
        # Limpiar archivo parcial si existe
        if os.path.exists(backup_file):
            os.remove(backup_file)
        return {'status': 'error', 'error': error_msg}

    if result.returncode != 0:
        error_msg = result.stderr.strip() or f'pg_dump retornó código {result.returncode}'
        logger.error(f"[Task {self.request.id}] Backup falló: {error_msg}")
        _send_backup_alert(error_msg)
        # Limpiar archivo fallido si existe
        if os.path.exists(backup_file):
            os.remove(backup_file)
        return {'status': 'error', 'error': error_msg}

    # Verificar que el archivo se creó y tiene contenido
    if not os.path.exists(backup_file) or os.path.getsize(backup_file) == 0:
        error_msg = 'Backup completó pero el archivo está vacío o no existe'
        logger.error(f"[Task {self.request.id}] {error_msg}")
        _send_backup_alert(error_msg)
        return {'status': 'error', 'error': error_msg}

    size_bytes = os.path.getsize(backup_file)
    size_mb = size_bytes / (1024 * 1024)

    # Limpiar backups antiguos (>7 días) generados por Celery
    cleaned = _cleanup_old_backups(backup_dir, days=7)

    logger.info(
        f"[Task {self.request.id}] Backup creado exitosamente: "
        f"{backup_file} ({size_mb:.1f} MB). "
        f"Backups antiguos eliminados: {cleaned}"
    )

    return {
        'status': 'success',
        'file': backup_file,
        'size_mb': round(size_mb, 2),
        'old_backups_cleaned': cleaned,
        'task_id': self.request.id,
        'timestamp': timezone.now().isoformat(),
    }


@shared_task(bind=True, time_limit=120, soft_time_limit=90)
def system_health_check(self) -> Dict[str, Any]:
    """
    Tarea periódica: Verificar el estado de salud del sistema.

    Ejecuta chequeos reales de base de datos, Redis, espacio en disco
    y Celery. Envía alerta por email si detecta errores.
    Se ejecuta cada 15 minutos via Celery Beat.
    """
    logger.info(f"[Task {self.request.id}] Iniciando health check del sistema")
    results = {}

    # 1. Database check
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        results['database'] = 'healthy'
    except Exception as e:
        results['database'] = f'error: {str(e)}'

    # 2. Redis check
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        redis_conn.ping()
        results['redis'] = 'healthy'
    except Exception as e:
        results['redis'] = f'error: {str(e)}'

    # 3. Disk space check
    try:
        disk_path = '/' if os.name != 'nt' else 'C:\\'
        total, used, free = shutil.disk_usage(disk_path)
        disk_pct = (used / total) * 100
        if disk_pct >= 95:
            results['disk_space'] = f'critical: {disk_pct:.1f}% used'
        elif disk_pct >= 90:
            results['disk_space'] = f'warning: {disk_pct:.1f}% used'
        else:
            results['disk_space'] = f'healthy ({disk_pct:.1f}% used)'
    except Exception as e:
        results['disk_space'] = f'error: {str(e)}'

    # 4. Celery worker check — si esta tarea se ejecuta, Celery funciona
    results['celery'] = 'healthy'

    # 5. Tenant schemas check (cantidad de tenants activos)
    try:
        from apps.tenant.models import Tenant
        active_tenants = Tenant.objects.filter(is_active=True).count()
        results['active_tenants'] = active_tenants
    except Exception as e:
        results['active_tenants'] = f'error: {str(e)}'

    # 6. Detectar errores y enviar alerta si hay problemas
    errors = {k: v for k, v in results.items() if isinstance(v, str) and 'error' in v}
    warnings = {k: v for k, v in results.items() if isinstance(v, str) and 'warning' in v}
    criticals = {k: v for k, v in results.items() if isinstance(v, str) and 'critical' in v}

    if errors or criticals:
        _send_health_alert(errors={**errors, **criticals}, warnings=warnings)

    overall = 'error' if errors or criticals else ('warning' if warnings else 'healthy')
    logger.info(
        f"[Task {self.request.id}] Health check completado: {overall} — {results}"
    )

    return {
        'status': overall,
        'health_status': results,
        'task_id': self.request.id,
        'timestamp': timezone.now().isoformat(),
    }


# ═══════════════════════════════════════════════════
# HELPERS INTERNOS — ALERTAS Y LIMPIEZA
# ═══════════════════════════════════════════════════

def _get_alert_recipients() -> List[str]:
    """
    Obtener lista de destinatarios para alertas del sistema.
    Prioridad: ALERT_EMAIL > ADMINS > DEFAULT_FROM_EMAIL (fallback).
    """
    alert_email = getattr(settings, 'ALERT_EMAIL', None)
    if alert_email:
        if isinstance(alert_email, str):
            return [alert_email]
        return list(alert_email)

    admins = getattr(settings, 'ADMINS', [])
    if admins:
        return [email for _, email in admins]

    return [settings.DEFAULT_FROM_EMAIL]


def _send_health_alert(errors: Dict[str, str], warnings: Dict[str, str] = None):
    """
    Enviar alerta por email cuando el health check detecta problemas.
    """
    try:
        recipients = _get_alert_recipients()

        error_lines = '\n'.join(f'  - {k}: {v}' for k, v in errors.items())
        warning_lines = ''
        if warnings:
            warning_lines = '\nAdvertencias:\n' + '\n'.join(
                f'  - {k}: {v}' for k, v in warnings.items()
            )

        subject = '[StrateKaz] ALERTA: Health Check del Sistema'
        message = (
            f'Se detectaron problemas en el health check del sistema.\n\n'
            f'Errores críticos:\n{error_lines}'
            f'{warning_lines}\n\n'
            f'Timestamp: {timezone.now().isoformat()}\n'
            f'Servidor: {os.uname().nodename if hasattr(os, "uname") else "unknown"}\n\n'
            f'Verificar el estado de los servicios lo antes posible.'
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )
        logger.info(f"Alerta de health check enviada a {recipients}")
    except Exception as e:
        logger.error(f"No se pudo enviar alerta de health check: {e}")


def _send_backup_alert(error_msg: str):
    """
    Enviar alerta por email cuando el backup de BD falla.
    """
    try:
        recipients = _get_alert_recipients()

        subject = '[StrateKaz] ALERTA: Fallo en Backup de Base de Datos'
        message = (
            f'El backup automático de la base de datos ha fallado.\n\n'
            f'Error: {error_msg}\n\n'
            f'Timestamp: {timezone.now().isoformat()}\n'
            f'Base de datos: {settings.DATABASES["default"]["NAME"]}\n\n'
            f'Se requiere intervención manual para verificar el estado '
            f'de los backups y la base de datos.'
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )
        logger.info(f"Alerta de backup enviada a {recipients}")
    except Exception as e:
        logger.error(f"No se pudo enviar alerta de backup: {e}")


def _cleanup_old_backups(directory: str, days: int = 7) -> int:
    """
    Eliminar archivos de backup más antiguos que `days` días.
    Solo elimina archivos con patrón backup_*.dump para no tocar
    otros archivos en el directorio.

    Returns:
        Cantidad de archivos eliminados.
    """
    deleted = 0
    cutoff = timezone.now().timestamp() - (days * 86400)

    try:
        for entry in os.scandir(directory):
            if (
                entry.is_file()
                and entry.name.startswith('backup_')
                and entry.name.endswith('.dump')
                and entry.stat().st_mtime < cutoff
            ):
                try:
                    os.remove(entry.path)
                    deleted += 1
                    logger.debug(f"Backup antiguo eliminado: {entry.name}")
                except OSError as e:
                    logger.warning(f"No se pudo eliminar backup {entry.name}: {e}")
    except OSError as e:
        logger.warning(f"Error al limpiar backups en {directory}: {e}")

    return deleted


# ═══════════════════════════════════════════════════
# TAREAS DE ONBOARDING — RECORDATORIOS AUTOMÁTICOS
# ═══════════════════════════════════════════════════

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def check_pending_activations(self) -> Dict[str, Any]:
    """
    Tarea periódica: Recordar a usuarios que no han activado su cuenta.

    Lógica:
    - Usuarios con last_login=None, is_active=True, creados hace >48h y con
      password_setup_token no vacío.
    - Si el último recordatorio fue hace >48h (o nunca se envió):
      - days_remaining > 2  → email recordatorio normal
      - 0 < days_remaining <= 2 → email recordatorio urgente
      - days_remaining <= 0  → notificación in-app para admin/jefe
    - Itera sobre todos los tenants con schema_status='ready' e is_active=True.

    Se ejecuta cada 12 horas vía Celery Beat.
    """
    from django_tenants.utils import schema_context
    from apps.core.utils.email_branding import get_email_branding_context

    try:
        from apps.tenant.models import Tenant
    except ImportError:
        logger.error('[check_pending_activations] No se pudo importar Tenant')
        return {'status': 'error', 'error': 'Tenant no disponible'}

    logger.info('[Task %s] Iniciando check_pending_activations', self.request.id)

    checked = 0
    reminders_sent = 0
    urgent_sent = 0
    expired_notified = 0
    admin_notified = 0

    tenants = Tenant.objects.filter(
        schema_status='ready',
        is_active=True,
    ).exclude(schema_name='public')

    now = timezone.now()
    cutoff_created = now - timedelta(hours=48)
    cutoff_reminder = now - timedelta(hours=48)

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                from django.contrib.auth import get_user_model
                from apps.core.models import UserOnboarding

                User = get_user_model()

                pending_users = User.objects.filter(
                    last_login__isnull=True,
                    is_active=True,
                    password_setup_token__isnull=False,  # Solo con token real (excluye legacy sin token)
                    date_joined__lt=cutoff_created,
                ).exclude(
                    password_setup_token=''
                ).exclude(
                    is_superuser=True  # Superadmins no pasan por setup-password
                )

                # Recopilar usuarios con token activo para notificación
                # agregada al admin
                active_token_users = []

                for user in pending_users:
                    checked += 1
                    try:
                        onboarding, _ = UserOnboarding.objects.get_or_create(user=user)

                        # Verificar si hay que enviar recordatorio
                        if (
                            onboarding.last_reminder_sent is not None
                            and onboarding.last_reminder_sent >= cutoff_reminder
                        ):
                            # Aunque no enviemos recordatorio, si el token
                            # sigue activo lo incluimos para la notif admin
                            if user.password_setup_expires and user.password_setup_expires > now:
                                active_token_users.append(user)
                            continue

                        # Calcular días restantes hasta expiración del token
                        days_remaining = 0
                        if user.password_setup_expires:
                            delta = user.password_setup_expires - now
                            days_remaining = delta.days + (1 if delta.seconds > 0 else 0)

                        if days_remaining > 0:
                            is_urgent = days_remaining <= 2
                            branding = get_email_branding_context(tenant=tenant)
                            frontend_url = branding.get(
                                'frontend_url',
                                getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com'),
                            )

                            html_content = render_to_string(
                                'emails/recordatorio_activacion.html',
                                {
                                    **branding,
                                    'user_name': user.get_full_name() or user.email,
                                    'user_email': user.email,
                                    'days_remaining': days_remaining,
                                    'is_urgent': is_urgent,
                                    'login_url': f'{frontend_url}/setup-password',
                                },
                            )
                            text_content = strip_tags(html_content)

                            subject = (
                                f'⚠️ Último aviso: activa tu cuenta en {branding["tenant_name"]}'
                                if is_urgent
                                else f'Recordatorio: activa tu cuenta en {branding["tenant_name"]}'
                            )

                            email = EmailMultiAlternatives(
                                subject=subject,
                                body=text_content,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                to=[user.email],
                            )
                            email.attach_alternative(html_content, 'text/html')
                            email.send(fail_silently=False)

                            if is_urgent:
                                urgent_sent += 1
                            else:
                                reminders_sent += 1

                            active_token_users.append(user)

                        else:
                            # Token expirado — notificación in-app para admin/jefe
                            _create_expired_activation_notification(user, tenant)
                            expired_notified += 1

                        # Actualizar timestamp de último recordatorio
                        onboarding.last_reminder_sent = now
                        onboarding.save(update_fields=['last_reminder_sent', 'updated_at'])

                    except Exception as exc:
                        logger.error(
                            '[check_pending_activations] Error procesando usuario %s '
                            '(tenant %s): %s',
                            user.pk,
                            tenant.schema_name,
                            exc,
                        )

                # F2/C10: Notificación agregada in-app para admins sobre
                # empleados que aún no han configurado su contraseña
                if active_token_users:
                    notified = _create_pending_activations_admin_notification(
                        active_token_users, tenant,
                    )
                    admin_notified += notified

        except Exception as exc:
            logger.error(
                '[check_pending_activations] Error en tenant %s: %s',
                tenant.schema_name,
                exc,
            )

    summary = {
        'status': 'success',
        'checked': checked,
        'reminders_sent': reminders_sent,
        'urgent_sent': urgent_sent,
        'expired_notified': expired_notified,
        'admin_notified': admin_notified,
        'task_id': self.request.id,
        'timestamp': timezone.now().isoformat(),
    }
    logger.info(
        '[Task %s] check_pending_activations completado: %s',
        self.request.id,
        summary,
    )
    return summary


def _create_expired_activation_notification(user, tenant) -> None:
    """
    Crea una notificación in-app para admin/jefe cuando el token de activación
    de un usuario ha expirado.
    """
    try:
        from django.contrib.auth import get_user_model
        from apps.audit_system.centro_notificaciones.models import (
            Notificacion,
            TipoNotificacion,
        )

        User = get_user_model()
        admins = User.objects.filter(
            is_active=True,
        ).filter(
            Q(is_superuser=True)
            | Q(cargo__is_jefatura=True)
        ).distinct()

        tipo_notif = None
        try:
            tipo_notif = TipoNotificacion.objects.filter(
                codigo='ACTIVACION_PENDIENTE',
                is_active=True,
            ).first()
        except Exception:
            pass

        user_name = user.first_name or user.email

        for admin in admins:
            try:
                Notificacion.objects.create(
                    usuario=admin,
                    tipo=tipo_notif,
                    titulo='Cuenta sin activar',
                    mensaje=(
                        f'{user_name} no activó su cuenta. '
                        f'El enlace de configuración ha expirado.'
                    ),
                    url=None,
                    prioridad='alta',
                    datos_extra={
                        'user_id': user.pk,
                        'user_email': user.email,
                        'tenant_schema': tenant.schema_name,
                    },
                    esta_leida=False,
                    esta_archivada=False,
                )
            except Exception as exc:
                logger.warning(
                    '_create_expired_activation_notification: error creando '
                    'notificación para admin %s: %s',
                    admin.pk,
                    exc,
                )
    except ImportError:
        logger.warning(
            '_create_expired_activation_notification: centro_notificaciones '
            'no disponible en tenant %s',
            getattr(tenant, 'schema_name', '?'),
        )
    except Exception as exc:
        logger.error(
            '_create_expired_activation_notification: error inesperado '
            'en tenant %s: %s',
            getattr(tenant, 'schema_name', '?'),
            exc,
        )


def _create_pending_activations_admin_notification(
    pending_users: list, tenant
) -> int:
    """
    F2/C10: Crea una notificación in-app agregada para admins informando
    sobre empleados que aún no han configurado su contraseña.

    Idempotente: no crea notificación si ya existe una no leída del mismo
    tipo para el admin en las últimas 24 horas.

    Returns:
        Cantidad de notificaciones creadas.
    """
    if not pending_users:
        return 0

    created_count = 0

    try:
        from django.contrib.auth import get_user_model
        from apps.audit_system.centro_notificaciones.models import (
            Notificacion,
            TipoNotificacion,
        )

        User = get_user_model()
        admins = User.objects.filter(
            is_active=True,
            is_superuser=True,
        ).distinct()

        if not admins.exists():
            return 0

        tipo_notif = None
        try:
            tipo_notif = TipoNotificacion.objects.filter(
                codigo='EMPLEADOS_SIN_ACTIVAR',
                is_active=True,
            ).first()
        except Exception:
            pass

        count = len(pending_users)
        names = ', '.join(
            u.get_full_name() or u.email for u in pending_users[:5]
        )
        if count > 5:
            names += f' y {count - 5} más'

        titulo = (
            f'Tienes {count} empleado{"s" if count != 1 else ""} '
            f'pendiente{"s" if count != 1 else ""} de activación'
        )
        mensaje = (
            f'Los siguientes empleados no han configurado su contraseña: '
            f'{names}. Puedes reenviar la invitación desde el panel de '
            f'usuarios.'
        )

        cutoff_24h = timezone.now() - timedelta(hours=24)

        for admin in admins:
            try:
                # Idempotencia: no crear si ya hay una no leída reciente
                already_exists = Notificacion.objects.filter(
                    usuario=admin,
                    esta_leida=False,
                    created_at__gte=cutoff_24h,
                )
                if tipo_notif:
                    already_exists = already_exists.filter(tipo=tipo_notif)
                else:
                    already_exists = already_exists.filter(
                        titulo__startswith='Tienes',
                        titulo__contains='pendiente',
                    )

                if already_exists.exists():
                    continue

                Notificacion.objects.create(
                    usuario=admin,
                    tipo=tipo_notif,
                    titulo=titulo,
                    mensaje=mensaje,
                    url='/configuracion/usuarios',
                    prioridad='normal',
                    datos_extra={
                        'pending_count': count,
                        'pending_user_ids': [u.pk for u in pending_users],
                        'tenant_schema': tenant.schema_name,
                    },
                    esta_leida=False,
                    esta_archivada=False,
                )
                created_count += 1
            except Exception as exc:
                logger.warning(
                    '_create_pending_activations_admin_notification: '
                    'error creando notificación para admin %s: %s',
                    admin.pk,
                    exc,
                )
    except ImportError:
        logger.warning(
            '_create_pending_activations_admin_notification: '
            'centro_notificaciones no disponible en tenant %s',
            getattr(tenant, 'schema_name', '?'),
        )
    except Exception as exc:
        logger.error(
            '_create_pending_activations_admin_notification: '
            'error inesperado en tenant %s: %s',
            getattr(tenant, 'schema_name', '?'),
            exc,
        )

    return created_count


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def check_incomplete_profiles(self) -> Dict[str, Any]:
    """
    Tarea periódica: Recordar a usuarios con perfiles incompletos.

    Lógica:
    - Usuarios que ya hicieron login (last_login IS NOT NULL), is_active=True
      y cuyo primer login fue hace más de 3 días.
    - Si onboarding.profile_percentage < 80 y el último recordatorio fue
      hace >7 días (o nunca):
      - Llama a OnboardingService.compute() para refrescar datos.
      - Envía email 'perfil_incompleto' con el porcentaje y pasos faltantes.
      - Actualiza last_reminder_sent.
    - Itera sobre todos los tenants con schema_status='ready' e is_active=True.

    Se ejecuta diariamente a las 10:00 AM hora Bogotá vía Celery Beat.
    """
    from django_tenants.utils import schema_context
    from apps.core.utils.email_branding import get_email_branding_context
    from apps.core.services.onboarding_service import OnboardingService

    try:
        from apps.tenant.models import Tenant
    except ImportError:
        logger.error('[check_incomplete_profiles] No se pudo importar Tenant')
        return {'status': 'error', 'error': 'Tenant no disponible'}

    logger.info('[Task %s] Iniciando check_incomplete_profiles', self.request.id)

    checked = 0
    reminders_sent = 0

    tenants = Tenant.objects.filter(
        schema_status='ready',
        is_active=True,
    ).exclude(schema_name='public')

    now = timezone.now()
    cutoff_first_login = now - timedelta(days=3)
    cutoff_reminder = now - timedelta(days=7)

    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                from django.contrib.auth import get_user_model
                from apps.core.models import UserOnboarding

                User = get_user_model()

                active_users = User.objects.filter(
                    last_login__isnull=False,
                    last_login__lt=cutoff_first_login,
                    is_active=True,
                )

                for user in active_users:
                    checked += 1
                    try:
                        onboarding, _ = UserOnboarding.objects.get_or_create(user=user)

                        if onboarding.profile_percentage >= 80:
                            continue

                        # Verificar si hay que enviar recordatorio
                        if (
                            onboarding.last_reminder_sent is not None
                            and onboarding.last_reminder_sent >= cutoff_reminder
                        ):
                            continue

                        # Refrescar datos de onboarding
                        try:
                            onboarding = OnboardingService.compute(user)
                        except Exception as exc:
                            logger.warning(
                                '[check_incomplete_profiles] OnboardingService.compute '
                                'falló para user %s: %s',
                                user.pk,
                                exc,
                            )

                        # Volver a verificar tras refresco
                        if onboarding.profile_percentage >= 80:
                            continue

                        # Construir lista de pasos faltantes
                        steps = onboarding.steps_completed or {}
                        missing_items = [
                            key for key, done in steps.items() if not done
                        ]

                        branding = get_email_branding_context(tenant=tenant)
                        frontend_url = branding.get(
                            'frontend_url',
                            getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com'),
                        )

                        html_content = render_to_string(
                            'emails/perfil_incompleto.html',
                            {
                                **branding,
                                'user_name': user.get_full_name() or user.email,
                                'user_email': user.email,
                                'profile_percentage': onboarding.profile_percentage,
                                'missing_items': missing_items,
                                'profile_url': f'{frontend_url}/mi-portal/perfil',
                            },
                        )
                        text_content = strip_tags(html_content)

                        email = EmailMultiAlternatives(
                            subject=(
                                f'Completa tu perfil en {branding["tenant_name"]} '
                                f'({onboarding.profile_percentage}% completado)'
                            ),
                            body=text_content,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[user.email],
                        )
                        email.attach_alternative(html_content, 'text/html')
                        email.send(fail_silently=False)

                        reminders_sent += 1

                        # Actualizar timestamp (sin pisar el update_fields de compute)
                        UserOnboarding.objects.filter(pk=onboarding.pk).update(
                            last_reminder_sent=now,
                        )

                    except Exception as exc:
                        logger.error(
                            '[check_incomplete_profiles] Error procesando usuario %s '
                            '(tenant %s): %s',
                            user.pk,
                            tenant.schema_name,
                            exc,
                        )

        except Exception as exc:
            logger.error(
                '[check_incomplete_profiles] Error en tenant %s: %s',
                tenant.schema_name,
                exc,
            )

    summary = {
        'status': 'success',
        'checked': checked,
        'reminders_sent': reminders_sent,
        'task_id': self.request.id,
        'timestamp': timezone.now().isoformat(),
    }
    logger.info(
        '[Task %s] check_incomplete_profiles completado: %s',
        self.request.id,
        summary,
    )
    return summary


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
