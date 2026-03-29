"""
Signals del módulo Logs del Sistema - Audit System
Sistema de Gestión StrateKaz

Conecta señales de autenticación de Django con el modelo LogAcceso
para registrar automáticamente login, logout y login fallido.

NOTA: Para login/logout con JWT, el registro principal se hace
en auth_views.py (tiene acceso al request completo con IP y user-agent).
Estos signals capturan eventos de Django Admin y sesión estándar.
"""
import logging

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Obtiene la IP real del cliente, considerando proxies."""
    if request is None:
        return '0.0.0.0'
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _parse_device_info(request):
    """Extrae tipo de dispositivo y navegador del user-agent (sin dependencias externas)."""
    if request is None:
        return '', 'Desconocido'

    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ua = user_agent.lower()

    # Navegador
    if 'edg' in ua or 'edge' in ua:
        browser = 'Edge'
    elif 'chrome' in ua and 'chromium' not in ua:
        browser = 'Chrome'
    elif 'firefox' in ua:
        browser = 'Firefox'
    elif 'safari' in ua and 'chrome' not in ua:
        browser = 'Safari'
    elif 'opera' in ua or 'opr' in ua:
        browser = 'Opera'
    else:
        browser = 'Desconocido'

    # Tipo de dispositivo
    if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
        device_type = 'mobile'
    elif 'tablet' in ua or 'ipad' in ua:
        device_type = 'tablet'
    else:
        device_type = 'desktop'

    return device_type, browser


def _create_log_acceso(usuario, request, tipo_evento, fue_exitoso=True, mensaje_error=None):
    """
    Crea un registro en LogAcceso de forma segura.

    Usa importación lazy para evitar problemas de carga circular
    y falla silenciosamente si la app no está lista.
    """
    try:
        from apps.audit_system.logs_sistema.models import LogAcceso

        ip = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
        device_type, browser = _parse_device_info(request)

        LogAcceso.objects.create(
            usuario=usuario,
            tipo_evento=tipo_evento,
            ip_address=ip,
            user_agent=user_agent,
            dispositivo=device_type,
            navegador=browser,
            fue_exitoso=fue_exitoso,
            mensaje_error=mensaje_error,
        )
    except Exception as e:
        # Nunca bloquear login/logout por un fallo de auditoría
        logger.error(f"Error creando LogAcceso ({tipo_evento}): {e}")


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    """Registra login exitoso (Django sessions / admin)."""
    _create_log_acceso(user, request, 'login', fue_exitoso=True)


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    """Registra logout (Django sessions / admin)."""
    _create_log_acceso(user, request, 'logout', fue_exitoso=True)


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    """Registra intento de login fallido."""
    _create_log_acceso(
        usuario=None,
        request=request,
        tipo_evento='login_fallido',
        fue_exitoso=False,
        mensaje_error=f"Credenciales inválidas para: {credentials.get('username', 'desconocido')}",
    )
