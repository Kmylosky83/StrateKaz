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
6. Este middleware valida acceso Y cambia al schema del tenant

SEGURIDAD:
- El header X-Tenant-ID requiere JWT válido con TenantUserAccess activo
- Superadmins (is_superadmin=True) pueden acceder a cualquier tenant
- Sin validación, un usuario podría enviar X-Tenant-ID de otro tenant
  y acceder a datos ajenos (especialmente con HybridJWTAuthentication
  que auto-crea User en el schema destino)
"""
import logging
from django.conf import settings
from django.http import JsonResponse
from django_tenants.utils import get_tenant_model, get_public_schema_name, schema_context
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

    SEGURIDAD: Cuando se usa X-Tenant-ID, se valida que el JWT bearer
    tenga TenantUserAccess activo para el tenant solicitado.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

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
                Tenant = get_tenant_model()
                tenant = Tenant.objects.get(id=tenant_id, is_active=True)

                # SEGURIDAD: Validar que el usuario tiene acceso a este tenant
                denial = self._validate_tenant_access(request, tenant)
                if denial is not None:
                    return denial

                # Cambiar al schema del tenant
                from django.db import connection
                connection.set_tenant(tenant)

                # Guardar el tenant en el request para uso posterior
                request.tenant = tenant
                request.tenant_id = tenant.id

            except Tenant.DoesNotExist:
                return JsonResponse(
                    {'detail': 'Empresa no encontrada o inactiva'},
                    status=404
                )
            except Exception as e:
                logger.error(f"Error al cambiar de tenant: {e}")

        response = self.get_response(request)
        return response

    def _validate_tenant_access(self, request, tenant):
        """
        Validate that the JWT bearer has access to the given tenant.

        Returns None if access is allowed, or a JsonResponse if denied.
        This prevents unauthorized tenant switching via X-Tenant-ID header.
        """
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            # No auth token — reject X-Tenant-ID override without authentication.
            # Domain-based routing (TenantMainMiddleware) still works for public endpoints.
            return JsonResponse(
                {'detail': 'Se requiere autenticación para acceder a esta empresa'},
                status=401
            )

        try:
            raw_token = auth_header.split(' ')[1]
            validated_token = self.jwt_auth.get_validated_token(raw_token)

            # Get TenantUser identifiers from JWT claims
            tenant_user_id = validated_token.get('tenant_user_id')
            email = validated_token.get('email')

            if not tenant_user_id and not email:
                return JsonResponse(
                    {'detail': 'Token no contiene información de usuario'},
                    status=403
                )

            from apps.tenant.models import TenantUser, TenantUserAccess

            with schema_context('public'):
                # Find TenantUser by ID first, then by email
                tenant_user = None
                if tenant_user_id:
                    tenant_user = TenantUser.objects.filter(
                        id=tenant_user_id, is_active=True
                    ).first()
                if not tenant_user and email:
                    tenant_user = TenantUser.objects.filter(
                        email=email, is_active=True
                    ).first()

                if not tenant_user:
                    return JsonResponse(
                        {'detail': 'Usuario global no encontrado'},
                        status=403
                    )

                # Superadmins can access any tenant
                if tenant_user.is_superadmin:
                    return None  # Access granted

                # Verify TenantUserAccess exists and is active
                has_access = TenantUserAccess.objects.filter(
                    tenant_user=tenant_user,
                    tenant=tenant,
                    is_active=True
                ).exists()

                if not has_access:
                    logger.warning(
                        f"Tenant access denied: user={tenant_user.email} "
                        f"tenant={tenant.name} (id={tenant.id})"
                    )
                    return JsonResponse(
                        {'detail': 'No tiene acceso a esta empresa'},
                        status=403
                    )

            return None  # Access granted

        except (InvalidToken, TokenError):
            return JsonResponse(
                {'detail': 'Token de autenticación inválido'},
                status=401
            )
        except Exception as e:
            logger.error(f"Error validating tenant access: {e}")
            return JsonResponse(
                {'detail': 'Error al validar acceso al tenant'},
                status=500
            )


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
