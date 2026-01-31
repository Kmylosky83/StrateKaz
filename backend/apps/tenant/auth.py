"""
Autenticación Multi-Tenant con JWT.

Permite autenticar usuarios globales (TenantUser) y generar tokens
que incluyen información del tenant seleccionado.
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from apps.tenant.models import Tenant, TenantUser, TenantUserAccess

security_logger = logging.getLogger('security')


class TenantTokenObtainView(APIView):
    """
    POST /api/tenant/auth/token/

    Autentica un TenantUser y retorna tokens JWT.

    Body:
    {
        "email": "user@example.com",
        "password": "password123"
    }

    Response (success):
    {
        "access": "eyJ...",
        "refresh": "eyJ...",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "first_name": "...",
            "last_name": "...",
            "is_superadmin": false
        },
        "tenants": [...],
        "requires_tenant_selection": true/false
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email y password son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar TenantUser
        try:
            tenant_user = TenantUser.objects.get(email=email)
        except TenantUser.DoesNotExist:
            security_logger.warning(
                f"Intento de login fallido - Email no existe: {email}"
            )
            return Response(
                {'detail': 'Credenciales incorrectas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar password
        if not tenant_user.check_password(password):
            security_logger.warning(
                f"Intento de login fallido - Password incorrecto: {email}"
            )
            return Response(
                {'detail': 'Credenciales incorrectas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar que el usuario esté activo
        if not tenant_user.is_active:
            return Response(
                {'detail': 'Esta cuenta está desactivada'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Obtener tenants accesibles
        accesses = TenantUserAccess.objects.filter(
            tenant_user=tenant_user,
            is_active=True,
            tenant__is_active=True
        ).select_related('tenant')

        tenants_data = []
        for access in accesses:
            t = access.tenant
            tenants_data.append({
                'id': t.id,
                'code': t.code,
                'name': t.name,
                'subdomain': t.subdomain,
                'logo_url': t.logo_url,
                'primary_color': t.primary_color,
                'role': access.role,
            })

        # Generar tokens JWT
        refresh = RefreshToken.for_user(tenant_user)

        # Agregar claims personalizados
        refresh['email'] = tenant_user.email
        refresh['is_superadmin'] = tenant_user.is_superadmin
        refresh['tenant_user_id'] = tenant_user.id

        # Actualizar último login
        tenant_user.last_login = timezone.now()
        tenant_user.save(update_fields=['last_login'])

        security_logger.info(f"Login exitoso TenantUser: {email}")

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': tenant_user.id,
                'email': tenant_user.email,
                'first_name': tenant_user.first_name,
                'last_name': tenant_user.last_name,
                'is_superadmin': tenant_user.is_superadmin,
            },
            'tenants': tenants_data,
            'last_tenant_id': tenant_user.last_tenant_id,
            'requires_tenant_selection': len(tenants_data) > 1 and not tenant_user.last_tenant_id,
        })


class TenantTokenRefreshView(APIView):
    """
    POST /api/tenant/auth/refresh/

    Refresca un token JWT de TenantUser.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
            })
        except Exception as e:
            return Response(
                {'detail': 'Token invalido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class TenantSelectView(APIView):
    """
    POST /api/tenant/auth/select/

    Selecciona un tenant y genera nuevos tokens con el tenant_id incluido.

    Body:
    {
        "tenant_id": 1
    }

    Requires: Token JWT de TenantUser.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant_id = request.data.get('tenant_id')
        if not tenant_id:
            return Response(
                {'detail': 'tenant_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener TenantUser desde el token
        # El request.user viene del token JWT
        tenant_user_id = getattr(request.auth, 'payload', {}).get('tenant_user_id')

        if not tenant_user_id:
            # Fallback: buscar por email si el token es del User de Django
            email = request.user.email
            try:
                tenant_user = TenantUser.objects.get(email=email)
            except TenantUser.DoesNotExist:
                return Response(
                    {'detail': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            try:
                tenant_user = TenantUser.objects.get(id=tenant_user_id)
            except TenantUser.DoesNotExist:
                return Response(
                    {'detail': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Verificar acceso al tenant
        try:
            access = TenantUserAccess.objects.select_related('tenant').get(
                tenant_user=tenant_user,
                tenant_id=tenant_id,
                is_active=True,
                tenant__is_active=True
            )
        except TenantUserAccess.DoesNotExist:
            return Response(
                {'detail': 'No tienes acceso a esta empresa'},
                status=status.HTTP_403_FORBIDDEN
            )

        tenant = access.tenant

        # Verificar suscripcion
        if not tenant.is_subscription_valid:
            return Response(
                {'detail': 'La suscripcion de esta empresa ha vencido'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generar nuevos tokens con tenant_id incluido
        refresh = RefreshToken.for_user(tenant_user)
        refresh['email'] = tenant_user.email
        refresh['is_superadmin'] = tenant_user.is_superadmin
        refresh['tenant_user_id'] = tenant_user.id
        refresh['tenant_id'] = tenant.id
        refresh['tenant_code'] = tenant.code
        refresh['tenant_db'] = tenant.db_name
        refresh['role'] = access.role

        # Actualizar ultimo tenant
        tenant_user.last_tenant = tenant
        tenant_user.last_login = timezone.now()
        tenant_user.save(update_fields=['last_tenant', 'last_login'])

        security_logger.info(
            f"Tenant seleccionado: {tenant.code} por {tenant_user.email}"
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'tenant': {
                'id': tenant.id,
                'code': tenant.code,
                'name': tenant.name,
                'subdomain': tenant.subdomain,
                'logo_url': tenant.logo_url,
                'primary_color': tenant.primary_color,
                'db_name': tenant.db_name,
            },
            'role': access.role,
        })
