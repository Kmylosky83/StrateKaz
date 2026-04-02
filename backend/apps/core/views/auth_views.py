"""
Vistas de autenticación con rate limiting y logging de seguridad.

Estas vistas envuelven las vistas JWT de SimpleJWT para agregar:
- Protección contra ataques de fuerza bruta (rate limiting)
- Logging de intentos de login fallidos (P1-14)
- MS-002-A: Registro de sesiones de usuario
- Registro en LogAcceso para trazabilidad en Centro de Control
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework import status

from apps.core.decorators import login_rate_limit, api_rate_limit
from apps.core.models import UserSession, User, TwoFactorAuth

# Logger de seguridad para auditoría
security_logger = logging.getLogger('security')


def _log_acceso(usuario, request, tipo_evento, fue_exitoso=True, mensaje_error=None):
    """Registra evento de acceso en audit_system.LogAcceso (fail-safe)."""
    try:
        from apps.audit_system.logs_sistema.signals import _create_log_acceso
        _create_log_acceso(usuario, request, tipo_evento, fue_exitoso, mensaje_error)
    except Exception as e:
        security_logger.error(f"Error registrando LogAcceso: {e}")


@method_decorator(login_rate_limit, name='post')
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login con rate limiting y logging de seguridad.

    Límite: 5 intentos por minuto por IP.
    Esto protege contra ataques de fuerza bruta.

    P1-14: Logging de intentos fallidos para detección de ataques.
    """

    def post(self, request, *args, **kwargs):
        # Capturar información para logging
        username = request.data.get('username', 'unknown')
        ip_address = self._get_client_ip(request)

        try:
            response = super().post(request, *args, **kwargs)

            # Login exitoso
            if response.status_code == 200:
                # Verificar si el usuario tiene 2FA habilitado
                user = self._get_user_by_username(username)
                if user:
                    requires_2fa = self._check_2fa_required(user)

                    if requires_2fa:
                        # Usuario requiere 2FA - NO retornar tokens aún
                        security_logger.info(
                            f"Login parcial (requiere 2FA) - User: {username} - IP: {ip_address}"
                        )
                        return Response({
                            'requires_2fa': True,
                            'message': 'Se requiere verificación de dos factores',
                            'username': username
                        }, status=status.HTTP_200_OK)

                # Login completo (sin 2FA o ya verificado)
                security_logger.info(
                    f"Login exitoso - User: {username} - IP: {ip_address}"
                )

                # MS-002-A: Crear sesión de usuario
                self._create_user_session(request, response, username)

                # Registrar en LogAcceso
                user = self._get_user_by_username(username)
                _log_acceso(user, request, 'login', fue_exitoso=True)

                # Inyectar flag de lecturas obligatorias pendientes
                if user:
                    response.data['lecturas_pendientes'] = (
                        self._contar_lecturas_pendientes(user)
                    )

            return response

        except Exception as e:
            # Login fallido - loggear para detección de ataques
            security_logger.warning(
                f"Login fallido - User: {username} - IP: {ip_address} - "
                f"Error: {type(e).__name__}"
            )

            # Registrar intento fallido en LogAcceso
            _log_acceso(
                usuario=None,
                request=request,
                tipo_evento='login_fallido',
                fue_exitoso=False,
                mensaje_error=f"Credenciales inválidas: {username} ({type(e).__name__})",
            )
            raise

    def _create_user_session(self, request, response, username):
        """
        MS-002-A: Crea una sesión de usuario tras login exitoso.
        """
        try:
            # Obtener el refresh token de la respuesta
            refresh_token = response.data.get('refresh')
            if not refresh_token:
                return

            # Obtener el usuario
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # Intentar por email
                user = User.objects.filter(email=username).first()
                if not user:
                    security_logger.warning(
                        f"MS-002-A: No se pudo encontrar usuario {username} para crear sesión"
                    )
                    return

            # Calcular expiración (usar settings o default 7 días)
            refresh_lifetime = getattr(
                settings, 'SIMPLE_JWT', {}
            ).get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))
            expires_at = timezone.now() + refresh_lifetime

            # Crear la sesión
            session = UserSession.create_session(
                user=user,
                refresh_token=refresh_token,
                request=request,
                expires_at=expires_at
            )

            security_logger.info(
                f"MS-002-A: Sesión creada para {username} - "
                f"Device: {session.device_browser}/{session.device_os} - "
                f"IP: {session.ip_address}"
            )

        except Exception as e:
            # No fallar el login si hay error en la sesión
            security_logger.error(
                f"MS-002-A: Error creando sesión para {username}: {e}"
            )

    def _get_user_by_username(self, username):
        """Obtiene el usuario por username o email"""
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return User.objects.filter(email=username).first()

    def _check_2fa_required(self, user):
        """Verifica si el usuario requiere 2FA"""
        try:
            two_factor = user.two_factor
            return two_factor.is_enabled
        except TwoFactorAuth.DoesNotExist:
            return False

    def _contar_lecturas_pendientes(self, user):
        """Cuenta lecturas obligatorias pendientes (fail-safe)."""
        try:
            from django.apps import apps as django_apps
            if not django_apps.is_installed(
                'apps.gestion_estrategica.gestion_documental'
            ):
                return 0
            from apps.gestion_estrategica.gestion_documental.services import (
                DocumentoService,
            )
            return DocumentoService.contar_lecturas_pendientes_obligatorias(user)
        except Exception:
            return 0

    def _get_client_ip(self, request):
        """Obtiene la IP real del cliente, considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


@method_decorator(api_rate_limit, name='post')
class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    Vista de refresh token con rate limiting.

    Límite: 100 requests por minuto por IP.
    Más permisivo ya que el refresh es una operación legítima frecuente.
    """
    pass
