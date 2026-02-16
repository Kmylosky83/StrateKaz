"""
Middleware de Autenticación Multi-Tenant

Este middleware maneja la autenticación JWT en un contexto multi-tenant:
1. El login usa TenantUser (schema público)
2. Una vez autenticado, las requests van al schema del tenant seleccionado
3. El header X-Tenant-ID indica qué tenant usar

FLUJO:
1. Usuario hace login con email/password
2. Backend verifica TenantUser en schema público
3. Backend retorna tokens JWT + lista de tenants accesibles
4. Frontend guarda tenant_id seleccionado
5. Requests subsiguientes incluyen X-Tenant-ID header
6. Este middleware cambia al schema del tenant correspondiente
"""
import logging
from django.conf import settings
from django.http import JsonResponse
from django_tenants.utils import get_tenant_model, get_public_schema_name
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


class TenantAuthenticationMiddleware:
    """
    Middleware que maneja la autenticación multi-tenant.

    Funciona en conjunto con TenantMainMiddleware de django-tenants.

    Orden de prioridad para determinar el tenant:
    1. Dominio (ya manejado por TenantMainMiddleware)
    2. Header X-Tenant-ID (para desarrollo y apps móviles)
    3. Claim tenant_id en el JWT token
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Rutas que siempre van al schema público
        public_paths = [
            '/api/auth/',
            '/api/tenant/auth/',  # Auth endpoints multi-tenant
            '/api/tenant/public/',
            '/api/tenant/plans/',
            '/api/encuestas-dofa/lookup/',  # Lookup cross-tenant de encuestas
            '/api/health/',
            '/api/schema/',
            '/api/docs/',
            '/api/redoc/',
            '/admin/',
        ]

        # Si es una ruta pública, no hacer nada especial
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)

        # Verificar si hay un X-Tenant-ID header
        tenant_id = request.headers.get('X-Tenant-ID')

        if tenant_id:
            try:
                # Validar que el usuario tiene acceso a este tenant
                # Esto se hace en las views/permissions, no aquí
                # Solo verificamos que el tenant existe y está activo
                Tenant = get_tenant_model()
                tenant = Tenant.objects.get(id=tenant_id, is_active=True)

                # Cambiar al schema del tenant
                from django.db import connection
                connection.set_tenant(tenant)

                # Guardar el tenant en el request para uso posterior
                request.tenant = tenant
                request.tenant_id = tenant.id

            except Tenant.DoesNotExist:
                # Tenant no existe o no está activo
                # El TenantMainMiddleware ya habrá establecido un tenant por dominio
                pass
            except Exception as e:
                logger.error(f"Error al cambiar de tenant: {e}")

        response = self.get_response(request)
        return response


class TenantJWTAuthenticationMiddleware:
    """
    Middleware opcional que extrae el tenant_id del JWT y lo establece.

    Útil cuando el token JWT incluye el tenant_id en sus claims.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # Solo procesar si hay un header Authorization
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            try:
                # Extraer y validar el token
                raw_token = auth_header.split(' ')[1]
                validated_token = self.jwt_auth.get_validated_token(raw_token)

                # Verificar si el token tiene tenant_id
                tenant_id = validated_token.get('tenant_id')

                if tenant_id and not request.headers.get('X-Tenant-ID'):
                    # Si no hay X-Tenant-ID pero sí tenant_id en el token,
                    # usar el del token
                    request.META['HTTP_X_TENANT_ID'] = str(tenant_id)

            except (InvalidToken, TokenError):
                # Token inválido, dejar que DRF maneje el error
                pass
            except Exception as e:
                logger.debug(f"Error procesando JWT para tenant: {e}")

        return self.get_response(request)
