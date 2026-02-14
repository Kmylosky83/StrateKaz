"""
Mixins y utilidades para modelos base - Sistema de Gestion StrateKaz

Funciones auxiliares para resolver EmpresaConfig en contexto multi-tenant.
"""


def get_tenant_empresa(auto_create=True):
    """
    Get the EmpresaConfig instance for the current tenant schema.

    In django-tenants, each schema has exactly one EmpresaConfig.
    This function provides a simple way to resolve it without
    needing request.user.empresa (which doesn't exist on core.User).

    Uses apps.get_model() to avoid circular imports.

    Args:
        auto_create: If True and no EmpresaConfig exists, creates one
                     with default values. This prevents 400 errors on
                     first use of a new tenant.

    Returns:
        EmpresaConfig instance or None if not found and auto_create=False.
    """
    from django.apps import apps
    EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
    instance = EmpresaConfig.objects.first()
    if instance is None and auto_create:
        instance, _ = EmpresaConfig.get_or_create_default()
    return instance
