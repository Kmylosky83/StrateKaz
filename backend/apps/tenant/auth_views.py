"""
Vistas de Autenticación Multi-Tenant

Este módulo maneja el login en un sistema multi-tenant donde:
- Los usuarios se autentican con TenantUser (schema público)
- Los tokens JWT incluyen información del usuario y tenants accesibles
- El frontend puede elegir a qué tenant conectarse

FLUJO DE LOGIN:
1. POST /api/auth/login/ con { email, password }
2. Verificar credenciales contra TenantUser
3. Si tiene 2FA habilitado, retornar requires_2fa: true
4. Retornar tokens JWT + lista de tenants accesibles
5. Frontend guarda tokens y muestra selector de tenant si hay múltiples
6. Requests subsiguientes incluyen X-Tenant-ID header
"""
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import TenantUser, TenantUserAccess, Tenant
from .serializers import TenantMinimalSerializer
from .authentication import TenantJWTAuthentication

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('security')


def create_tokens_for_tenant_user(user: TenantUser) -> dict:
    """
    Crea tokens JWT para un TenantUser sin usar for_user().

    SimpleJWT.for_user() requiere un modelo User de Django,
    así que generamos los tokens manualmente con claims personalizados.
    """
    # Crear un RefreshToken vacío
    refresh = RefreshToken()

    # Configurar los claims estándar
    refresh['user_id'] = user.id
    refresh['tenant_user_id'] = user.id  # Para identificar que es TenantUser
    refresh['email'] = user.email
    refresh['is_superadmin'] = user.is_superadmin

    # Token de acceso se genera desde el refresh
    access = refresh.access_token

    return {
        'access': str(access),
        'refresh': str(refresh),
    }


class TenantLoginView(APIView):
    """
    Vista de login para sistema multi-tenant.

    POST /api/tenant/auth/login/
    {
        "email": "usuario@ejemplo.com",
        "password": "contraseña"
    }

    Respuestas:
    - 200: Login exitoso
    - 200 con requires_2fa: Necesita verificación 2FA
    - 401: Credenciales inválidas
    - 403: Usuario inactivo
    """
    authentication_classes = []  # No auth needed for login
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        ip_address = self._get_client_ip(request)

        # Validar datos requeridos
        if not email or not password:
            return Response(
                {'detail': 'Email y contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Buscar usuario por email
            user = TenantUser.objects.get(email=email)
        except TenantUser.DoesNotExist:
            security_logger.warning(
                f"Login fallido - Usuario no existe: {email} - IP: {ip_address}"
            )
            return Response(
                {'detail': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar contraseña
        if not user.check_password(password):
            security_logger.warning(
                f"Login fallido - Contraseña incorrecta: {email} - IP: {ip_address}"
            )
            return Response(
                {'detail': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar que el usuario esté activo
        if not user.is_active:
            security_logger.warning(
                f"Login fallido - Usuario inactivo: {email} - IP: {ip_address}"
            )
            return Response(
                {'detail': 'Usuario inactivo. Contacte al administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verificar 2FA si está habilitado
        if user.has_2fa_enabled:
            security_logger.info(
                f"Login parcial (requiere 2FA) - User: {email} - IP: {ip_address}"
            )
            return Response({
                'requires_2fa': True,
                'message': 'Se requiere verificación de dos factores',
                'email': email,
            }, status=status.HTTP_200_OK)

        # Generar tokens JWT manualmente
        tokens = create_tokens_for_tenant_user(user)

        # Obtener tenants accesibles
        tenants_data = self._get_accessible_tenants(user, request)

        # Actualizar último login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        security_logger.info(
            f"Login exitoso - User: {email} - IP: {ip_address} - "
            f"Tenants: {len(tenants_data)}"
        )

        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'is_superadmin': user.is_superadmin,
            },
            'tenants': tenants_data,
            'last_tenant_id': user.last_tenant_id,
        })

    def _get_accessible_tenants(self, user, request=None):
        """Obtiene la lista de tenants a los que el usuario tiene acceso."""
        if user.is_superadmin:
            # Superadmin tiene acceso a todos los tenants activos
            # EXCEPTO el schema 'public' que es administrativo
            tenants = Tenant.objects.filter(
                is_active=True
            ).exclude(
                schema_name='public'
            )
            return [
                {
                    'tenant': TenantMinimalSerializer(t, context={'request': request}).data,
                }
                for t in tenants
            ]

        # Usuario normal: obtener accesos activos
        accesses = TenantUserAccess.objects.filter(
            tenant_user=user,
            is_active=True,
            tenant__is_active=True
        ).select_related('tenant')

        return [
            {
                'tenant': TenantMinimalSerializer(access.tenant, context={'request': request}).data,
            }
            for access in accesses
        ]

    def _get_client_ip(self, request):
        """Obtiene la IP real del cliente."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class TenantSelectView(APIView):
    """
    Vista para seleccionar/cambiar de tenant.

    POST /api/tenant/auth/select-tenant/
    {
        "tenant_id": 1
    }

    Registra el tenant seleccionado y retorna información del tenant.
    """
    authentication_classes = [TenantJWTAuthentication]  # Usa TenantUser, no User
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant_id = request.data.get('tenant_id')

        if not tenant_id:
            return Response(
                {'detail': 'tenant_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # El user_id viene del token JWT
        user_id = getattr(request, 'tenant_user_id', None) or request.user.id

        try:
            # Buscar el TenantUser
            tenant_user = TenantUser.objects.get(id=user_id)
        except TenantUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado en sistema de tenants'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar acceso al tenant
        if not tenant_user.is_superadmin:
            has_access = TenantUserAccess.objects.filter(
                tenant_user=tenant_user,
                tenant_id=tenant_id,
                is_active=True,
                tenant__is_active=True
            ).exists()

            if not has_access:
                return Response(
                    {'detail': 'No tienes acceso a este tenant'},
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            tenant = Tenant.objects.get(id=tenant_id, is_active=True)
        except Tenant.DoesNotExist:
            return Response(
                {'detail': 'Tenant no encontrado o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Actualizar último tenant accedido
        tenant_user.last_tenant = tenant
        tenant_user.save(update_fields=['last_tenant'])

        return Response({
            'status': 'ok',
            'tenant': TenantMinimalSerializer(tenant, context={'request': request}).data,
            'message': f'Conectado a {tenant.name}',
        })


class TenantRefreshView(APIView):
    """
    Refresh de token JWT.

    POST /api/tenant/auth/refresh/
    {
        "refresh": "token_refresh_aquí"
    }
    """
    authentication_classes = []  # No auth needed for refresh
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'detail': 'Token de refresh requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)

            # Generar nuevo access token.
            # ROTATE_REFRESH_TOKENS=False → se devuelve el mismo refresh token.
            # NO llamar refresh.blacklist() aquí: blacklistear el token actual
            # con ROTATE=False lo invalida permanentemente (mismo token se devuelve),
            # causando que el siguiente refresh falle con 401 → logout diario.
            # Blacklist solo en logout explícito (TenantLogoutView).
            new_access = str(refresh.access_token)
            new_refresh = str(refresh)

            return Response({
                'access': new_access,
                'refresh': new_refresh,
            })

        except TokenError as e:
            return Response(
                {'detail': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            # Catch-all para cualquier error inesperado (DB, schema, etc.)
            logger.error(f"Token refresh error: {type(e).__name__}: {e}", exc_info=True)
            return Response(
                {'detail': f'Error al refrescar token: {type(e).__name__}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TenantLogoutView(APIView):
    """
    Logout - Invalida el refresh token.

    POST /api/tenant/auth/logout/
    {
        "refresh": "token_refresh_aquí"
    }
    """
    authentication_classes = []  # No auth needed for logout
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # Token ya inválido, ignorar
                pass
            except Exception:
                # Si token_blacklist no está configurado, ignorar
                pass

        return Response({'status': 'logged out'})


class TenantMeView(APIView):
    """
    Obtener información del usuario actual y sus tenants.

    GET /api/tenant/auth/me/

    Nota: Este endpoint requiere autenticación y extrae el user_id del token.
    Usamos authentication_classes=[] para evitar que DRF intente autenticar
    usando el modelo User de Django (que no existe en schema público).
    """
    authentication_classes = []  # No usar JWTAuthentication default
    permission_classes = [AllowAny]  # Manejamos auth manualmente

    def get(self, request):
        # Obtener token del header
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return Response(
                {'detail': 'Token de autenticación requerido'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token_str = auth_header.split(' ')[1]
            # Decodificar el token para obtener el user_id
            from rest_framework_simplejwt.tokens import UntypedToken
            token = UntypedToken(token_str)
            user_id = token.get('user_id') or token.get('tenant_user_id')

            if not user_id:
                return Response(
                    {'detail': 'Token inválido'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            tenant_user = TenantUser.objects.get(id=user_id)

            # Verificar que el TenantUser esté activo
            if not tenant_user.is_active:
                return Response(
                    {'detail': 'Tu cuenta ha sido desactivada. Contacta al administrador.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        except TenantUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error decodificando token: {e}")
            return Response(
                {'detail': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Obtener tenants accesibles
        if tenant_user.is_superadmin:
            tenants = Tenant.objects.filter(is_active=True)
            tenants_data = [
                {
                    'tenant': TenantMinimalSerializer(t, context={'request': request}).data,
                }
                for t in tenants
            ]
        else:
            accesses = TenantUserAccess.objects.filter(
                tenant_user=tenant_user,
                is_active=True,
                tenant__is_active=True
            ).select_related('tenant')

            tenants_data = [
                {
                    'tenant': TenantMinimalSerializer(access.tenant, context={'request': request}).data,
                }
                for access in accesses
            ]

        return Response({
            'id': tenant_user.id,
            'email': tenant_user.email,
            'first_name': tenant_user.first_name,
            'last_name': tenant_user.last_name,
            'full_name': tenant_user.full_name,
            'is_superadmin': tenant_user.is_superadmin,
            'last_tenant_id': tenant_user.last_tenant_id,
            'tenants': tenants_data,
        })


class ForgotPasswordView(APIView):
    """
    Solicitar restablecimiento de contrasena.

    POST /api/tenant/auth/forgot-password/
    {
        "email": "usuario@ejemplo.com"
    }

    Siempre retorna 200 para no revelar si el email existe.
    Si el email existe, envia un correo con link de reset.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        requested_tenant_id = request.data.get('tenant_id')  # MB-TENANT: opcional
        ip_address = self._get_client_ip(request)

        if not email:
            return Response(
                {'detail': 'El email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Siempre retornar el mismo mensaje (no revelar si email existe)
        success_message = (
            'Si el email esta registrado, recibiras un enlace '
            'para restablecer tu contrasena.'
        )

        try:
            user = TenantUser.objects.get(email=email, is_active=True)
        except TenantUser.DoesNotExist:
            security_logger.info(
                f"Password reset solicitado para email no existente: {email} - IP: {ip_address}"
            )
            return Response({'message': success_message})

        # Generar token hasheado (raw para email, hash en BD)
        raw_token = user.set_password_reset_token()
        user.save(
            update_fields=[
                'password_reset_token',
                'password_reset_expires',
            ]
        )

        # Enviar email con tenant_id si fue proporcionado
        self._send_reset_email(
            user, raw_token,
            requested_tenant_id=requested_tenant_id,
        )

        security_logger.info(
            f"Password reset enviado a {email} - IP: {ip_address}"
        )

        return Response({'message': success_message})

    def _send_reset_email(self, user, token, *, requested_tenant_id=None):
        """Envia email de restablecimiento de contraseña con branding del tenant."""
        try:
            from apps.audit_system.centro_notificaciones.email_service import EmailService

            # MB-TENANT: Resolver tenant específico si se proporcionó tenant_id
            tenant_name = 'StrateKaz'
            primary_color = '#ec268f'
            secondary_color = '#000000'
            resolved_tenant_id = ''
            tenant_domain = ''
            try:
                if requested_tenant_id:
                    # Preferir el tenant solicitado si el usuario tiene acceso
                    tenant_access = user.tenant_accesses.filter(
                        is_active=True, tenant_id=requested_tenant_id
                    ).select_related('tenant').first()
                else:
                    tenant_access = user.tenant_accesses.filter(
                        is_active=True
                    ).select_related('tenant').first()

                if tenant_access and tenant_access.tenant:
                    tenant = tenant_access.tenant
                    resolved_tenant_id = tenant.id
                    tenant_name = tenant.company_name or tenant.name or 'StrateKaz'
                    primary_color = tenant.primary_color or '#ec268f'
                    secondary_color = tenant.secondary_color or '#000000'
                    tenant_domain = tenant.primary_domain
            except Exception:
                pass

            # Resolver URL del frontend por dominio del tenant
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3010')
            if tenant_domain and 'localhost' not in frontend_url:
                frontend_url = f"https://{tenant_domain}"

            # Incluir tenant_id en la URL para que la página muestre branding correcto
            reset_url = (
                f"{frontend_url}/reset-password?token={token}"
                f"&email={user.email}"
                f"&tenant_id={resolved_tenant_id}"
            )

            EmailService.send_email(
                to_email=user.email,
                subject=f'Restablecer contraseña — {tenant_name}',
                template_name='password_reset',
                context={
                    'user_name': user.full_name,
                    'reset_url': reset_url,
                    'expiry_hours': 1,
                    'tenant_name': tenant_name,
                    'primary_color': primary_color,
                    'secondary_color': secondary_color,
                }
            )
        except Exception as e:
            logger.error(f"Error enviando email de reset a {user.email}: {e}")
            # Fallback: enviar email simple con Django
            try:
                from django.core.mail import send_mail
                fallback_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3010')
                if tenant_domain and 'localhost' not in fallback_url:
                    fallback_url = f"https://{tenant_domain}"
                reset_url = (
                    f"{fallback_url}/reset-password?token={token}"
                    f"&email={user.email}"
                )
                send_mail(
                    subject='Restablecer contraseña — StrateKaz',
                    message=(
                        f'Hola {user.full_name},\n\n'
                        f'Recibimos una solicitud para restablecer tu contraseña.\n\n'
                        f'Haz clic en el siguiente enlace:\n{reset_url}\n\n'
                        f'Este enlace expira en 1 hora.\n\n'
                        f'Si no solicitaste esto, ignora este correo.\n\n'
                        f'Equipo StrateKaz'
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@stratekaz.com'),
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e2:
                logger.error(f"Fallback email tambien fallo: {e2}")

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class TenantTwoFactorVerifyView(APIView):
    """
    Verificar código 2FA durante login multi-tenant.

    POST /api/tenant/auth/2fa-verify/
    {
        "email": "usuario@ejemplo.com",
        "token": "123456",
        "use_backup_code": false
    }

    Si el código es válido, retorna tokens JWT + tenants (misma respuesta que login).
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        token = request.data.get('token', '').strip()
        use_backup_code = request.data.get('use_backup_code', False)
        use_email_otp = request.data.get('use_email_otp', False)
        ip_address = self._get_client_ip(request)

        if not email or not token:
            return Response(
                {'error': 'Email y código son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar TenantUser
        try:
            tenant_user = TenantUser.objects.get(email=email, is_active=True)
        except TenantUser.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Buscar TwoFactorAuth en los schemas del tenant
        # Necesitamos verificar TOTP contra core.User en alguno de los schemas
        from django_tenants.utils import schema_context
        from django.apps import apps

        verified = False
        backup_codes_remaining = None

        # Obtener tenants accesibles
        accessible_tenants = tenant_user.get_accessible_tenants()

        for tenant_obj in accessible_tenants:
            try:
                with schema_context(tenant_obj.schema_name):
                    User = apps.get_model('core', 'User')
                    user_in_tenant = User.objects.filter(
                        email=email, is_active=True
                    ).first()

                    if not user_in_tenant:
                        continue

                    try:
                        two_factor = user_in_tenant.two_factor
                    except Exception:
                        continue

                    if not two_factor.is_enabled:
                        continue

                    if use_email_otp:
                        # Verificar OTP por email
                        EmailOTP = apps.get_model('core', 'EmailOTP')
                        pending_otp = EmailOTP.objects.filter(
                            user=user_in_tenant,
                            purpose='LOGIN',
                            is_used=False,
                        ).order_by('-created_at').first()

                        if pending_otp and pending_otp.verify(token):
                            verified = True
                            break
                    elif use_backup_code:
                        if two_factor.verify_backup_code(token):
                            verified = True
                            backup_codes_remaining = two_factor.get_remaining_backup_codes_count()
                            break
                    else:
                        if two_factor.verify_token(token):
                            verified = True
                            break
            except Exception as e:
                logger.warning(f"Error verificando 2FA en schema {tenant_obj.schema_name}: {e}")
                continue

        if not verified:
            security_logger.warning(
                f"2FA verificación fallida - User: {email} - IP: {ip_address}"
            )
            return Response(
                {'error': 'Código de verificación inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2FA verificado — generar tokens
        tokens = create_tokens_for_tenant_user(tenant_user)

        # Obtener tenants accesibles para la respuesta
        tenants_data = self._get_accessible_tenants(tenant_user, request)

        # Actualizar último login
        tenant_user.last_login = timezone.now()
        tenant_user.save(update_fields=['last_login'])

        security_logger.info(
            f"Login 2FA exitoso - User: {email} - IP: {ip_address} - "
            f"Método: {'email_otp' if use_email_otp else 'backup' if use_backup_code else 'totp'}"
        )

        response_data = {
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': {
                'id': tenant_user.id,
                'email': tenant_user.email,
                'first_name': tenant_user.first_name,
                'last_name': tenant_user.last_name,
                'full_name': tenant_user.full_name,
                'is_superadmin': tenant_user.is_superadmin,
            },
            'tenants': tenants_data,
            'last_tenant_id': tenant_user.last_tenant_id,
        }

        if backup_codes_remaining is not None:
            response_data['backup_codes_remaining'] = backup_codes_remaining

        return Response(response_data)

    def _get_accessible_tenants(self, user, request=None):
        """Obtiene la lista de tenants accesibles (duplicado de TenantLoginView)."""
        if user.is_superadmin:
            tenants = Tenant.objects.filter(is_active=True).exclude(schema_name='public')
            return [
                {'tenant': TenantMinimalSerializer(t, context={'request': request}).data}
                for t in tenants
            ]
        accesses = TenantUserAccess.objects.filter(
            tenant_user=user, is_active=True, tenant__is_active=True
        ).select_related('tenant')
        return [
            {'tenant': TenantMinimalSerializer(a.tenant, context={'request': request}).data}
            for a in accesses
        ]

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class ResetPasswordView(APIView):
    """
    Restablecer contrasena con token.

    POST /api/tenant/auth/reset-password/
    {
        "email": "usuario@ejemplo.com",
        "token": "abc123...",
        "new_password": "NuevaContrasena123"
    }
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')
        ip_address = self._get_client_ip(request)

        # Validar datos requeridos
        if not email or not token or not new_password:
            return Response(
                {'detail': 'Email, token y nueva contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar contraseña con validadores de Django
        from django.contrib.auth.password_validation import (
            validate_password,
        )
        from django.core.exceptions import (
            ValidationError as DjangoValidationError,
        )

        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            return Response(
                {'detail': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar usuario por email y verificar token hasheado
        user = TenantUser.objects.filter(
            email=email, is_active=True
        ).first()

        if not user or not user.verify_password_reset_token(token):
            security_logger.warning(
                "Reset password fallido — token inválido "
                "para %s — IP: %s",
                email, ip_address
            )
            return Response(
                {
                    'detail': (
                        'Enlace inválido o expirado. '
                        'Solicita uno nuevo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar expiración
        if (
            not user.password_reset_expires
            or user.password_reset_expires < timezone.now()
        ):
            user.password_reset_token = None
            user.password_reset_expires = None
            user.save(
                update_fields=[
                    'password_reset_token',
                    'password_reset_expires',
                ]
            )

            security_logger.warning(
                "Reset password fallido — token expirado "
                "para %s — IP: %s",
                email, ip_address
            )
            return Response(
                {
                    'detail': (
                        'El enlace ha expirado. '
                        'Solicita uno nuevo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar contraseña en TenantUser y limpiar token
        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save(
            update_fields=[
                'password',
                'password_reset_token',
                'password_reset_expires',
            ]
        )

        # Sincronizar contraseña a User en schemas de tenant
        self._sync_password_to_tenant_schemas(user, new_password)

        security_logger.info(
            "Password restablecido exitosamente para %s — IP: %s",
            email, ip_address
        )

        return Response({
            'message': (
                'Contraseña restablecida exitosamente. '
                'Ya puedes iniciar sesión.'
            )
        })

    def _sync_password_to_tenant_schemas(
        self, tenant_user, new_password
    ):
        """
        Sincroniza la contraseña al User (core_user) en cada
        schema de tenant al que el usuario tenga acceso.
        """
        from django_tenants.utils import schema_context
        from django.apps import apps

        accessible_tenants = tenant_user.get_accessible_tenants()
        for tenant_obj in accessible_tenants:
            try:
                with schema_context(tenant_obj.schema_name):
                    UserModel = apps.get_model('core', 'User')
                    tenant_schema_user = UserModel.objects.filter(
                        email=tenant_user.email, is_active=True
                    ).first()
                    if tenant_schema_user:
                        tenant_schema_user.set_password(new_password)
                        tenant_schema_user.save(
                            update_fields=['password']
                        )
            except Exception as e:
                logger.error(
                    "Error sincronizando password a schema "
                    "%s para %s: %s",
                    tenant_obj.schema_name,
                    tenant_user.email,
                    e,
                    exc_info=True,
                )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
