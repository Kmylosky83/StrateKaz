"""
Branding centralizado para emails transaccionales.

Best practice SaaS multi-tenant:
- Logo del TENANT en header (no del SaaS)
- Colores del TENANT en CTA y acentos
- "Powered by StrateKaz" en footer
- Fallback elegante si tenant no tiene branding configurado
"""
import logging
from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)

# Defaults de la plataforma (solo si el tenant no tiene configuración propia)
PLATFORM_DEFAULTS = {
    'platform_name': 'StrateKaz',
    'platform_tagline': 'Sistema de Gestión Integral',
    'default_primary_color': '#ec268f',
    'default_secondary_color': '#1f2937',
}


def get_email_branding_context(tenant=None, schema_name=None) -> dict:
    """
    Build complete branding context for email templates.

    Priority: explicit tenant > connection.tenant > platform defaults

    Usage in Celery tasks:
        from apps.core.utils.email_branding import get_email_branding_context
        context = get_email_branding_context(tenant=tenant)
        # or within schema_context:
        context = get_email_branding_context()  # auto-detect from connection
    """
    resolved_tenant = _resolve_tenant(tenant, schema_name)

    if resolved_tenant:
        return _build_tenant_context(resolved_tenant)

    return _build_platform_fallback_context()


def _resolve_tenant(tenant=None, schema_name=None):
    """Resolve tenant from explicit param, schema_name, or connection."""
    if tenant:
        return tenant

    if schema_name:
        from apps.tenant.models import Tenant
        try:
            return Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            logger.warning('Tenant not found for schema: %s', schema_name)
            return None

    # Auto-detect from connection
    current_tenant = getattr(connection, 'tenant', None)
    if current_tenant and getattr(current_tenant, 'schema_name', 'public') != 'public':
        return current_tenant

    return None


def _build_tenant_context(tenant) -> dict:
    """Build branding from real tenant data."""
    logo_url = None
    if hasattr(tenant, 'logo_white') and tenant.logo_white:
        try:
            logo_url = tenant.logo_white.url
        except Exception:
            pass
    if not logo_url and hasattr(tenant, 'logo') and tenant.logo:
        try:
            logo_url = tenant.logo.url
        except Exception:
            pass

    return {
        # Tenant identity
        'tenant_name': tenant.name,
        'tenant_slogan': getattr(tenant, 'company_slogan', '') or '',

        # Colors from tenant (NEVER hardcoded)
        'primary_color': tenant.primary_color or PLATFORM_DEFAULTS['default_primary_color'],
        'secondary_color': tenant.secondary_color or PLATFORM_DEFAULTS['default_secondary_color'],

        # Logo
        'logo_url': logo_url,
        'has_logo': bool(logo_url),

        # Platform
        'platform_name': PLATFORM_DEFAULTS['platform_name'],
        'platform_tagline': PLATFORM_DEFAULTS['platform_tagline'],

        # Utilities
        'current_year': timezone.now().year,
        'frontend_url': getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com'),
    }


def _build_platform_fallback_context() -> dict:
    """Fallback when no tenant is available (e.g., password reset from public)."""
    return {
        'tenant_name': PLATFORM_DEFAULTS['platform_name'],
        'tenant_slogan': PLATFORM_DEFAULTS['platform_tagline'],
        'primary_color': PLATFORM_DEFAULTS['default_primary_color'],
        'secondary_color': PLATFORM_DEFAULTS['default_secondary_color'],
        'logo_url': None,
        'has_logo': False,
        'platform_name': PLATFORM_DEFAULTS['platform_name'],
        'platform_tagline': PLATFORM_DEFAULTS['platform_tagline'],
        'current_year': timezone.now().year,
        'frontend_url': getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com'),
    }
