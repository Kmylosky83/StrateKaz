"""
Mixins y utilidades para modelos base - Sistema de Gestion StrateKaz

Funciones auxiliares para resolver EmpresaConfig en contexto multi-tenant.
"""


def get_tenant_empresa():
    """
    Get the EmpresaConfig instance for the current tenant schema.

    In django-tenants, each schema has exactly one EmpresaConfig.
    This function provides a simple way to resolve it without
    needing request.user.empresa (which doesn't exist on core.User).

    Uses apps.get_model() to avoid circular imports.

    Returns:
        EmpresaConfig instance or None if not found.
    """
    from django.apps import apps
    EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
    return EmpresaConfig.objects.first()
