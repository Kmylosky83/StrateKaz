"""
TenantLifecycleService — Servicio centralizado para lifecycle de tenants.

Implementa 6 mejores prácticas enterprise:
1. Servicio único centralizado para todo lifecycle de tenant
2. Operaciones transaccionales con validación pre/post de invariante
3. Lock pesimista (pg_advisory_xact_lock) sobre schema_name
4. Detección periódica de desyncs como última línea de defensa
5. Auditoría explícita de cada operación de lifecycle
6. Idempotencia en reintentos
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services.dataclasses import InvariantReport, InvariantStatus
from apps.tenant.services.exceptions import (
    InvalidConfirmationTokenError,
    SchemaCreationFailedError,
    SchemaDropFailedError,
    TenantAlreadyExistsError,
    TenantInvariantViolationError,
    TenantLifecycleConcurrencyError,
    TenantNotFoundError,
)

if TYPE_CHECKING:
    from apps.tenant.models import Tenant

logger = logging.getLogger("tenant.lifecycle")

# Schemas que no representan tenants y deben excluirse del escaneo.
RESERVED_SCHEMAS = frozenset({
    "public",
    "test",
    "pg_catalog",
    "pg_toast",
    "information_schema",
})


class TenantLifecycleService:
    """
    Servicio único para lifecycle de tenants en StrateKaz.

    Garantiza el invariante: Tenant row en public.tenant_tenant
    SIEMPRE existe sincronizada con schema físico en PostgreSQL.

    Toda operación es transaccional con validación pre/post.
    Si la post-validación falla, rollback automático.
    """

    CONFIRMATION_TOKEN_TEMPLATE = "DELETE-{schema_name}-CONFIRMED"

    # ------------------------------------------------------------------
    # Operaciones de lifecycle (Bloques 2 y 3)
    # ------------------------------------------------------------------

    @classmethod
    def create_tenant(
        cls,
        *,
        schema_name: str,
        name: str,
        domain_url: str,
        plan_code: str = "basico",
        is_trial: bool = True,
        trial_days: int = 30,
        created_by_user_id: int | None = None,
    ) -> Tenant:
        """Crear tenant con schema. Implementación en Bloque 2."""
        raise NotImplementedError("Bloque 2")

    @classmethod
    def archive_tenant(
        cls,
        *,
        schema_name: str,
        archived_by_user_id: int | None = None,
        reason: str = "",
    ) -> Tenant:
        """Desactivar tenant sin eliminar schema. Implementación en Bloque 2."""
        raise NotImplementedError("Bloque 2")

    @classmethod
    def restore_tenant(cls, *, schema_name: str) -> Tenant:
        """Reactivar tenant desactivado. Implementación en Bloque 2."""
        raise NotImplementedError("Bloque 2")

    @classmethod
    def delete_tenant_with_schema(
        cls,
        *,
        schema_name: str,
        confirmation_token: str,
        deleted_by_user_id: int | None = None,
    ) -> None:
        """Eliminar tenant + schema. Implementación en Bloque 3."""
        raise NotImplementedError("Bloque 3")

    # ------------------------------------------------------------------
    # Validación de invariante (implementadas — Bloque 1)
    # ------------------------------------------------------------------

    @classmethod
    def validate_invariant(cls, schema_name: str) -> InvariantStatus:
        """
        Verifica el invariante para un tenant específico.

        Solo lectura. Seguro de ejecutar contra cualquier entorno.

        Returns:
            InvariantStatus con el estado actual del schema_name.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        # Tenant es un SHARED model (vive en public schema).
        # Forzar schema_context("public") para que la query funcione
        # independientemente del schema_context activo del caller.
        with schema_context("public"):
            row_exists = Tenant.objects.filter(
                schema_name=schema_name,
            ).exists()

        # information_schema es visible desde cualquier search_path,
        # pero usamos public para consistencia.
        schema_exists = False
        schema_has_tables = False

        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM information_schema.schemata "
                    "WHERE schema_name = %s",
                    [schema_name],
                )
                schema_exists = cursor.fetchone() is not None

            if schema_exists:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT COUNT(*) FROM information_schema.tables "
                        "WHERE table_schema = %s "
                        "AND table_type = 'BASE TABLE'",
                        [schema_name],
                    )
                    table_count = cursor.fetchone()[0]
                    schema_has_tables = table_count > 0

        return InvariantStatus(
            schema_name=schema_name,
            row_exists=row_exists,
            schema_exists=schema_exists,
            schema_has_tables=schema_has_tables,
        )

    @classmethod
    def list_inconsistencies(cls) -> InvariantReport:
        """
        Escanea todos los Tenants y schemas físicos.

        Retorna InvariantReport con desyncs encontrados.
        Solo lectura.

        Returns:
            InvariantReport con inconsistencias y totales.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        # Tenant es SHARED → query desde public.
        with schema_context("public"):
            tenant_schemas = set(
                Tenant.objects.values_list("schema_name", flat=True)
            )

        # information_schema desde public por consistencia.
        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT schema_name FROM information_schema.schemata "
                    "WHERE schema_name NOT LIKE 'pg_%%'"
                )
                all_physical = {row[0] for row in cursor.fetchall()}

        physical_schemas = all_physical - RESERVED_SCHEMAS

        # 3. Unión de ambos conjuntos
        all_schema_names = tenant_schemas | physical_schemas

        # 4. Validar cada uno
        inconsistencies = []
        for schema_name in sorted(all_schema_names):
            status = cls.validate_invariant(schema_name)
            if not status.is_consistent:
                inconsistencies.append(status)

        return InvariantReport(
            inconsistencies=inconsistencies,
            total_tenants=len(tenant_schemas),
            total_schemas=len(physical_schemas),
        )

    # ------------------------------------------------------------------
    # Helpers privados
    # ------------------------------------------------------------------

    @classmethod
    def _audit_log(
        cls,
        *,
        action: str,
        schema_name: str,
        user_id: int | None = None,
        result: str = "success",
        details: str = "",
    ) -> None:
        """Log estructurado de operaciones de lifecycle."""
        logger.info(
            "TenantLifecycle: action=%s schema=%s user=%s result=%s %s",
            action,
            schema_name,
            user_id,
            result,
            details,
        )
