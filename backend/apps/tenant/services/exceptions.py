"""
Excepciones del TenantLifecycleService.

Jerarquía:
    TenantLifecycleError (base)
    ├── TenantAlreadyExistsError
    ├── TenantNotFoundError
    ├── SchemaCreationFailedError
    ├── SchemaDropFailedError
    ├── TenantInvariantViolationError
    ├── TenantLifecycleConcurrencyError
    └── InvalidConfirmationTokenError
"""


class TenantLifecycleError(Exception):
    """Base de todos los errores del lifecycle de tenant."""


class TenantAlreadyExistsError(TenantLifecycleError):
    """schema_name ya existe como row o como schema físico."""


class TenantNotFoundError(TenantLifecycleError):
    """Operación sobre Tenant inexistente (ni row ni schema)."""


class SchemaCreationFailedError(TenantLifecycleError):
    """CREATE SCHEMA falló o no quedó persistido."""


class SchemaDropFailedError(TenantLifecycleError):
    """DROP SCHEMA falló o el schema sigue existiendo."""


class TenantInvariantViolationError(TenantLifecycleError):
    """Post-validación detectó desync row ↔ schema."""


class TenantLifecycleConcurrencyError(TenantLifecycleError):
    """Operación concurrente bloqueada por advisory lock."""


class InvalidConfirmationTokenError(TenantLifecycleError):
    """Token de confirmación incorrecto en delete."""
