"""
TenantLifecycleService — Servicio centralizado para lifecycle de tenants.

Implementa 6 mejores prácticas enterprise:
1. Servicio único centralizado para todo lifecycle de tenant
2. Operaciones en 2 fases: ORM transaccional + DDL secuencial
3. Lock pesimista (pg_advisory_xact_lock) sobre schema_name
4. Detección periódica de desyncs como última línea de defensa
5. Auditoría explícita de cada operación de lifecycle
6. Idempotencia en reintentos

NOTA ARQUITECTÓNICA sobre create_tenant:
    migrate_schemas y seeds abren sus propias conexiones y transacciones
    internas. PostgreSQL puede cerrar conexiones por timeout durante
    migraciones largas (10+ min). Por esto, create_tenant NO envuelve
    TODO en un solo transaction.atomic(). En vez:

    Fase A (transaccional): Lock advisory + pre-validación + crear rows
            (Tenant + Domain). Si falla → rollback limpio, cero residuos.
    Fase B (secuencial): CREATE SCHEMA + migrate + seeds + post-validación
            + marcar ready. Si falla → cleanup explícito (DROP SCHEMA +
            marcar row como 'failed').

    Esto replica el patrón probado de create_tenant_schema_task (que lleva
    meses corriendo en producción) pero con invariante pre/post validado.
"""

from __future__ import annotations

import logging
import re
from datetime import timedelta
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import close_old_connections, connection, transaction
from django.utils import timezone
from django_tenants.utils import schema_context
from psycopg2 import sql

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

# Regex para validación de schema_name: letras minúsculas, números, guión bajo.
# Mínimo 3 caracteres, máximo 63 (límite de PostgreSQL).
_SCHEMA_NAME_RE = re.compile(r"^[a-z][a-z0-9_]{2,62}$")

# Nombres de schema reservados por PostgreSQL o por el proyecto.
_RESERVED_NAMES = frozenset({
    "public",
    "information_schema",
    "test",
    "tenant_template",
}) | frozenset(f"pg_{suffix}" for suffix in [
    "catalog", "toast", "temp", "default", "global",
])

# Seeds críticos: si cualquiera falla, la creación aborta.
_CRITICAL_SEEDS = (
    "seed_estructura_final",
    "seed_permisos_rbac",
)

# Seeds no-críticos: fallo se registra como warning, no aborta.
_NON_CRITICAL_SEEDS = (
    "seed_config_identidad",
)


class TenantLifecycleService:
    """
    Servicio único para lifecycle de tenants en StrateKaz.

    Garantiza el invariante: Tenant row en public.tenant_tenant
    SIEMPRE existe sincronizada con schema físico en PostgreSQL.
    """

    CONFIRMATION_TOKEN_TEMPLATE = "DELETE-{schema_name}-CONFIRMED"

    # ------------------------------------------------------------------
    # Operaciones de lifecycle
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
    ) -> tuple[Tenant, list[str]]:
        """
        Crea Tenant + Domain + schema físico + migraciones + seeds.

        Fase A (transaccional): lock + pre-validación + crear rows.
        Fase B (secuencial): DDL + migrate + seeds + post-validación.

        Returns:
            Tuple de (Tenant, non_critical_warnings).

        Raises:
            ValidationError: schema_name inválido.
            TenantAlreadyExistsError: row o schema ya existen.
            TenantInvariantViolationError: post-validación falló.
            SchemaCreationFailedError: DDL, migraciones o seeds fallaron.
        """
        from django_tenants.utils import get_tenant_model
        from apps.tenant.models import Domain

        Tenant = get_tenant_model()

        cls._validate_schema_name(schema_name)
        code = cls._derive_code(schema_name)
        non_critical_warnings: list[str] = []

        # ==============================================================
        # FASE A — Transaccional: lock + pre-validación + crear rows
        # ==============================================================
        with schema_context("public"):
            with transaction.atomic():
                # Lock advisory — serializa creates concurrentes
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [schema_name],
                    )

                # Pre-validación: nada debe existir
                pre_status = cls.validate_invariant(schema_name)
                if pre_status.row_exists or pre_status.schema_exists:
                    raise TenantAlreadyExistsError(
                        f"Tenant {schema_name} already exists "
                        f"(row_exists={pre_status.row_exists}, "
                        f"schema_exists={pre_status.schema_exists})"
                    )

                # Resolver plan
                plan = cls._resolve_plan(plan_code)

                # Crear row Tenant con schema_status='creating'
                tenant = Tenant(
                    schema_name=schema_name,
                    code=code,
                    name=name,
                    plan=plan,
                    is_trial=is_trial,
                    trial_ends_at=(
                        cls._compute_trial_end(trial_days) if is_trial else None
                    ),
                    is_active=True,
                    schema_status="creating",
                )
                tenant.save()

                # Crear Domain
                Domain.objects.create(
                    domain=domain_url,
                    tenant=tenant,
                    is_primary=True,
                )

        # Fase A completada: row + domain existen en DB con status='creating'.
        # Si algo falla a partir de acá, la row ya existe y se marca 'failed'.

        # ==============================================================
        # FASE B — Secuencial: DDL + migrate + seeds + post-validación
        # ==============================================================
        schema_created = False
        try:
            # B1. Crear schema físico
            close_old_connections()
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute(
                    sql.SQL("CREATE SCHEMA {}").format(
                        sql.Identifier(schema_name)
                    )
                )
            schema_created = True
            logger.info(
                "TenantLifecycle: action=create_schema schema=%s result=success",
                schema_name,
            )

            # B2. Migraciones (puede durar 10+ min)
            call_command(
                "migrate_schemas",
                schema_name=schema_name,
                interactive=False,
                verbosity=0,
            )
            logger.info(
                "TenantLifecycle: action=migrate schema=%s result=success",
                schema_name,
            )

            # B3. Seeds (reconectar post-migraciones)
            close_old_connections()
            connection.ensure_connection()

            with schema_context(schema_name):
                # Críticos: fallo aborta
                for seed_cmd in _CRITICAL_SEEDS:
                    close_old_connections()
                    connection.ensure_connection()
                    call_command(seed_cmd, verbosity=0)
                    logger.info(
                        "TenantLifecycle: seed=%s schema=%s result=success",
                        seed_cmd,
                        schema_name,
                    )

                # No-críticos: fallo se acumula como warning
                for seed_cmd in _NON_CRITICAL_SEEDS:
                    try:
                        close_old_connections()
                        connection.ensure_connection()
                        call_command(seed_cmd, verbosity=0)
                        logger.info(
                            "TenantLifecycle: seed=%s schema=%s result=success",
                            seed_cmd,
                            schema_name,
                        )
                    except Exception as seed_err:
                        warning_msg = (
                            f"{seed_cmd} failed: {str(seed_err)[:500]}"
                        )
                        non_critical_warnings.append(warning_msg)
                        logger.warning(
                            "TenantLifecycle: seed=%s schema=%s result=warning error=%s",
                            seed_cmd,
                            schema_name,
                            str(seed_err)[:200],
                        )

            # B4. Post-validación del invariante
            close_old_connections()
            connection.ensure_connection()
            post_status = cls.validate_invariant(schema_name)
            if not post_status.is_consistent:
                raise TenantInvariantViolationError(
                    f"Post-create invariant failed for {schema_name}: "
                    f"row_exists={post_status.row_exists}, "
                    f"schema_exists={post_status.schema_exists}, "
                    f"schema_has_tables={post_status.schema_has_tables}"
                )

            # B5. Marcar como ready
            with schema_context("public"):
                close_old_connections()
                connection.ensure_connection()
                tenant.refresh_from_db()
                tenant.schema_status = "ready"
                tenant.schema_error = ""
                tenant.save(update_fields=["schema_status", "schema_error"])

            cls._audit_log(
                action="create",
                schema_name=schema_name,
                user_id=created_by_user_id,
                result="success",
            )

            return tenant, non_critical_warnings

        except Exception as original_error:
            # Cleanup Fase B: DROP schema si fue creado
            if schema_created:
                try:
                    close_old_connections()
                    connection.ensure_connection()
                    with connection.cursor() as cursor:
                        cursor.execute(
                            sql.SQL(
                                "DROP SCHEMA IF EXISTS {} CASCADE"
                            ).format(sql.Identifier(schema_name))
                        )
                    logger.info(
                        "TenantLifecycle: action=create_rollback "
                        "schema=%s result=schema_dropped",
                        schema_name,
                    )
                except Exception as drop_err:
                    logger.error(
                        "TenantLifecycle: action=create_rollback "
                        "schema=%s result=drop_failed error=%s",
                        schema_name,
                        str(drop_err)[:200],
                    )

            # Marcar row como 'failed' (row sobrevivió Fase A)
            try:
                close_old_connections()
                connection.ensure_connection()
                with schema_context("public"):
                    with transaction.atomic():
                        Tenant.objects.filter(
                            schema_name=schema_name,
                        ).update(
                            schema_status="failed",
                            schema_error=str(original_error)[:5000],
                        )
            except Exception as status_err:
                logger.error(
                    "TenantLifecycle: action=record_failure schema=%s "
                    "result=update_failed error=%s",
                    schema_name,
                    str(status_err)[:200],
                )

            raise original_error from None

    @classmethod
    def archive_tenant(
        cls,
        *,
        schema_name: str,
        archived_by_user_id: int | None = None,
        reason: str = "",
    ) -> Tenant:
        """
        Desactiva un tenant (is_active=False) sin eliminar su schema.

        El schema y sus datos se preservan para posible restauración.

        Raises:
            TenantNotFoundError: No existe tenant con ese schema_name.
            TenantInvariantViolationError: Post-validación detectó desync.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        with schema_context("public"):
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [schema_name],
                    )

                pre_status = cls.validate_invariant(schema_name)
                if not pre_status.row_exists:
                    raise TenantNotFoundError(
                        f"Cannot archive: tenant {schema_name} does not exist"
                    )

                tenant = Tenant.objects.get(schema_name=schema_name)
                tenant.is_active = False
                tenant.save(update_fields=["is_active"])

                post_status = cls.validate_invariant(schema_name)
                if not post_status.is_consistent:
                    raise TenantInvariantViolationError(
                        f"Post-archive invariant failed for {schema_name}: "
                        f"type={post_status.inconsistency_type}"
                    )

                cls._audit_log(
                    action="archive",
                    schema_name=schema_name,
                    user_id=archived_by_user_id,
                    result="success",
                    details=f"reason={reason}" if reason else "",
                )

                return tenant

    @classmethod
    def restore_tenant(cls, *, schema_name: str) -> Tenant:
        """
        Reactiva un tenant desactivado (is_active=True).

        Raises:
            TenantNotFoundError: No existe tenant con ese schema_name.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        with schema_context("public"):
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [schema_name],
                    )

                tenant = Tenant.objects.filter(
                    schema_name=schema_name,
                ).first()
                if tenant is None:
                    raise TenantNotFoundError(
                        f"Cannot restore: tenant {schema_name} does not exist"
                    )

                tenant.is_active = True
                tenant.save(update_fields=["is_active"])

                cls._audit_log(
                    action="restore",
                    schema_name=schema_name,
                    user_id=None,
                    result="success",
                )

                return tenant

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
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        with schema_context("public"):
            row_exists = Tenant.objects.filter(
                schema_name=schema_name,
            ).exists()

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
        Retorna InvariantReport con desyncs encontrados. Solo lectura.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        with schema_context("public"):
            tenant_schemas = set(
                Tenant.objects.values_list("schema_name", flat=True)
            )

        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT schema_name FROM information_schema.schemata "
                    "WHERE schema_name NOT LIKE 'pg_%%'"
                )
                all_physical = {row[0] for row in cursor.fetchall()}

        physical_schemas = all_physical - RESERVED_SCHEMAS
        all_schema_names = tenant_schemas | physical_schemas

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
    def _validate_schema_name(cls, schema_name: str) -> None:
        """
        Valida formato y reservados del schema_name.
        Defensa en profundidad: incluso con sql.Identifier, validamos
        el formato para detectar errores lógicos tempranamente.
        """
        if not _SCHEMA_NAME_RE.match(schema_name):
            raise ValidationError(
                f"schema_name '{schema_name}' inválido. "
                "Debe ser 3-63 caracteres, solo minúsculas, números y "
                "guión bajo, comenzando con letra."
            )
        if schema_name in _RESERVED_NAMES:
            raise ValidationError(
                f"schema_name '{schema_name}' es un nombre reservado."
            )
        if schema_name.startswith("pg_"):
            raise ValidationError(
                f"schema_name '{schema_name}' no puede empezar con 'pg_'."
            )

    @classmethod
    def _derive_code(cls, schema_name: str) -> str:
        """
        Deriva `code` del Tenant a partir del schema_name.
        Convención del modelo: schema_name = f"tenant_{code}".
        """
        if schema_name.startswith("tenant_"):
            return schema_name[7:]
        return schema_name

    @classmethod
    def _compute_trial_end(cls, trial_days: int):
        """Calcula la fecha de fin del período de prueba."""
        return timezone.now() + timedelta(days=trial_days)

    @classmethod
    def _resolve_plan(cls, plan_code: str):
        """Resuelve un Plan por código. Retorna None si no existe."""
        from apps.tenant.models import Plan

        with schema_context("public"):
            return Plan.objects.filter(code=plan_code).first()

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
