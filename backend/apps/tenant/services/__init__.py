"""
TenantLifecycleService — Servicio centralizado para lifecycle de tenants.

Garantiza el invariante: Tenant row en public.tenant_tenant SIEMPRE
sincronizada con schema físico en PostgreSQL.

Uso:
    from apps.tenant.services import TenantLifecycleService

    # Verificar invariante para un tenant
    status = TenantLifecycleService.validate_invariant('tenant_demo')

    # Listar inconsistencias globales
    report = TenantLifecycleService.list_inconsistencies()

    # Crear tenant (Bloque 2)
    tenant = TenantLifecycleService.create_tenant(
        schema_name='tenant_nuevo',
        name='Empresa Nueva',
        domain_url='nuevo.localhost',
    )

    # Eliminar tenant (Bloque 3)
    TenantLifecycleService.delete_tenant_with_schema(
        schema_name='tenant_viejo',
        confirmation_token='DELETE-tenant_viejo-CONFIRMED',
    )
"""

from apps.tenant.services.tenant_lifecycle_service import TenantLifecycleService
from apps.tenant.services.exceptions import (
    TenantLifecycleError,
    TenantAlreadyExistsError,
    TenantNotFoundError,
    SchemaCreationFailedError,
    SchemaDropFailedError,
    TenantInvariantViolationError,
    TenantLifecycleConcurrencyError,
    InvalidConfirmationTokenError,
)
from apps.tenant.services.dataclasses import InvariantStatus, InvariantReport

__all__ = [
    "TenantLifecycleService",
    "TenantLifecycleError",
    "TenantAlreadyExistsError",
    "TenantNotFoundError",
    "SchemaCreationFailedError",
    "SchemaDropFailedError",
    "TenantInvariantViolationError",
    "TenantLifecycleConcurrencyError",
    "InvalidConfirmationTokenError",
    "InvariantStatus",
    "InvariantReport",
]
