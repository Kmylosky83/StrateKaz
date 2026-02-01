"""
Tenant Middleware - StrateKaz Multi-Tenant System

Este middleware detecta el tenant basándose en:
1. Subdominio (constructora-abc.stratekaz.com)
2. Dominio personalizado (erp.constructora.com)
3. Header X-Tenant-ID (para testing/API)

Una vez identificado el tenant, configura la conexión a su BD.
"""
import threading
from django.http import HttpResponseNotFound, HttpResponseForbidden
from django.conf import settings
from django.core.cache import cache

# Thread-local storage para el tenant actual
_thread_locals = threading.local()


def get_current_tenant():
    """Obtiene el tenant del thread actual"""
    return getattr(_thread_locals, 'tenant', None)


def set_current_tenant(tenant):
    """Establece el tenant para el thread actual"""
    _thread_locals.tenant = tenant


def clear_current_tenant():
    """Limpia el tenant del thread actual"""
    if hasattr(_thread_locals, 'tenant'):
        del _thread_locals.tenant


class TenantMiddleware:
    """
    Middleware que identifica el tenant por subdominio/dominio
    y configura la conexión a la BD correspondiente.
    """

    # Subdominios que no son tenants (acceso a BD master)
    EXCLUDED_SUBDOMAINS = [
        'www',
        'admin',
        'api',
        'erp',
        'app',
        'localhost',
        '127',
    ]

    # Paths que no requieren tenant (acceso a BD master)
    PUBLIC_PATHS = [
        '/admin/',
        '/api/tenant/',
        '/api/health/',
        '/api/auth/',
        '/api/docs/',
        '/api/schema/',
        '/api/redoc/',
        '/api/core/',  # Core siempre disponible (RBAC, branding, system-modules)
        '/api/audit/',  # Audit system (logs, notificaciones)
        '/health/',
        '/static/',
        '/media/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Limpiar tenant anterior
        clear_current_tenant()

        # Verificar si es un path público
        if self._is_public_path(request.path):
            return self.get_response(request)

        # Intentar identificar tenant
        tenant = self._identify_tenant(request)

        if tenant:
            # Validar que el tenant esté activo y con suscripción válida
            if not tenant.is_active:
                return HttpResponseForbidden(
                    "Esta cuenta está desactivada. "
                    "Por favor contacte a soporte."
                )

            if not tenant.is_subscription_valid:
                return HttpResponseForbidden(
                    "La suscripción ha vencido. "
                    "Por favor renueve su plan para continuar."
                )

            # Establecer tenant en thread local
            set_current_tenant(tenant)

            # Agregar tenant al request para acceso fácil
            request.tenant = tenant

        elif not self._is_optional_tenant_path(request.path):
            # Si se requiere tenant y no se encontró
            return HttpResponseNotFound(
                "Empresa no encontrada. "
                "Verifique la URL e intente nuevamente."
            )

        response = self.get_response(request)

        # Limpiar tenant después de la respuesta
        clear_current_tenant()

        return response

    def _identify_tenant(self, request):
        """
        Identifica el tenant basándose en:
        1. Header X-Tenant-ID (para testing/API)
        2. Dominio personalizado
        3. Subdominio
        """
        from apps.tenant.models import Tenant, TenantDomain

        # 1. Verificar header (útil para testing y API calls)
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id:
            return self._get_tenant_by_id(tenant_id)

        # Obtener host
        host = request.get_host().split(':')[0].lower()

        # 2. Verificar dominio personalizado
        tenant = self._get_tenant_by_custom_domain(host)
        if tenant:
            return tenant

        # 3. Verificar subdominio
        return self._get_tenant_by_subdomain(host)

    def _get_tenant_by_id(self, tenant_id):
        """Obtiene tenant por ID (para testing)"""
        from apps.tenant.models import Tenant

        cache_key = f"tenant:id:{tenant_id}"
        tenant = cache.get(cache_key)

        if tenant is None:
            try:
                tenant = Tenant.objects.select_related('plan').get(
                    pk=tenant_id,
                    is_active=True
                )
                cache.set(cache_key, tenant, timeout=300)  # 5 minutos
            except Tenant.DoesNotExist:
                return None

        return tenant

    def _get_tenant_by_custom_domain(self, host):
        """Obtiene tenant por dominio personalizado"""
        from apps.tenant.models import Tenant, TenantDomain

        # Verificar en Tenant.custom_domain
        cache_key = f"tenant:domain:{host}"
        tenant = cache.get(cache_key)

        if tenant is None:
            # Buscar en custom_domain del Tenant
            tenant = Tenant.objects.select_related('plan').filter(
                custom_domain=host,
                is_active=True
            ).first()

            # Si no, buscar en TenantDomain
            if not tenant:
                domain_obj = TenantDomain.objects.select_related(
                    'tenant', 'tenant__plan'
                ).filter(
                    domain=host,
                    is_active=True,
                    tenant__is_active=True
                ).first()

                if domain_obj:
                    tenant = domain_obj.tenant

            if tenant:
                cache.set(cache_key, tenant, timeout=300)

        return tenant

    def _get_tenant_by_subdomain(self, host):
        """Obtiene tenant por subdominio"""
        from apps.tenant.models import Tenant

        # Extraer subdominio
        parts = host.split('.')

        # Necesitamos al menos 3 partes (subdomain.domain.tld)
        # o 2 partes en desarrollo (subdomain.localhost)
        if len(parts) < 2:
            return None

        subdomain = parts[0]

        # Verificar si es un subdominio excluido
        if subdomain in self.EXCLUDED_SUBDOMAINS:
            return None

        # Buscar tenant por subdominio
        cache_key = f"tenant:subdomain:{subdomain}"
        tenant = cache.get(cache_key)

        if tenant is None:
            tenant = Tenant.objects.select_related('plan').filter(
                subdomain=subdomain,
                is_active=True
            ).first()

            if tenant:
                cache.set(cache_key, tenant, timeout=300)

        return tenant

    def _is_public_path(self, path):
        """Verifica si el path es público (no requiere tenant)"""
        return any(path.startswith(p) for p in self.PUBLIC_PATHS)

    def _is_optional_tenant_path(self, path):
        """
        Paths donde el tenant es opcional.
        Por ejemplo, el login genérico en erp.stratekaz.com
        """
        optional_paths = [
            '/api/auth/login/',
            '/api/core/branding/active/',
            '/api/core/branding/manifest/',
        ]
        return any(path.startswith(p) for p in optional_paths)


class TenantDatabaseMiddleware:
    """
    Middleware adicional para configurar la conexión a BD del tenant.

    Debe ejecutarse DESPUÉS de TenantMiddleware.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant = get_current_tenant()

        if tenant:
            # Configurar la conexión a la BD del tenant
            self._setup_tenant_database(tenant)

        return self.get_response(request)

    def _setup_tenant_database(self, tenant):
        """
        Configura la conexión dinámica a la BD del tenant.
        """
        from django.db import connections

        db_alias = f"tenant_{tenant.id}"

        # Si la conexión no existe, crearla
        if db_alias not in connections.databases:
            connections.databases[db_alias] = tenant.get_database_config()
