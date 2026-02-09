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
from datetime import timedelta
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

        # TODO: Verificar 2FA si está habilitado
        # Por ahora, procedemos sin 2FA

        # Generar tokens JWT manualmente
        tokens = create_tokens_for_tenant_user(user)

        # Obtener tenants accesibles
        tenants_data = self._get_accessible_tenants(user)

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

    def _get_accessible_tenants(self, user):
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
                    'tenant': TenantMinimalSerializer(t).data,
                    'role': 'superadmin',
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
                'tenant': TenantMinimalSerializer(access.tenant).data,
                'role': access.role,
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
            'tenant': TenantMinimalSerializer(tenant).data,
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

            # Generar nuevo access token
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),  # Si ROTATE_REFRESH_TOKENS está activo
            })

        except TokenError as e:
            return Response(
                {'detail': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
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
                    'tenant': TenantMinimalSerializer(t).data,
                    'role': 'superadmin',
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
                    'tenant': TenantMinimalSerializer(access.tenant).data,
                    'role': access.role,
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
