"""
TenantLifecycleService — Servicio centralizado para lifecycle de tenants.

Implementa 6 mejores prácticas enterprise:
1. Servicio único centralizado para todo lifecycle de tenant
2. Operaciones en 2 fases: ORM transaccional + DDL secuencial
3. Lock pesimista (pg_advisory_xact_lock) sobre schema_name
4. Detección periódica de desyncs como última línea de defensa
5. Auditoría explícita de cada operación de lifecycle
6. Idempotencia en reintentos

NOTA ARQUITECTÓNICA:
    Fase A (transaccional): Lock advisory + pre-validación + crear rows
            (Tenant + Domain). Si falla → rollback limpio, cero residuos.
    Fase B (secuencial): CREATE SCHEMA + migrate + seeds + post-validación
            + marcar ready. Si falla → cleanup explícito (DROP SCHEMA +
            marcar row como 'failed').

    Fase B acepta un progress_callback opcional para que el caller
    (ej: Celery task) publique progreso sin acoplar el servicio a Redis.

DOS FLUJOS DE CREACIÓN:
    1. create_tenant(): Monolítico (Fase A + B). Usado por management
       commands (bootstrap_production) y tests directos.
    2. provision_schema_for_pending_tenant(): Solo Fase B. Usado por la
       Celery task cuando el serializer ya creó la row en 'pending'.
"""

from __future__ import annotations

import logging
import re
from datetime import timedelta
from typing import TYPE_CHECKING, Callable

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
    TenantLifecycleError,
    TenantNotFoundError,
)

if TYPE_CHECKING:
    from apps.tenant.models import Tenant

logger = logging.getLogger("tenant.lifecycle")

# Type alias para el callback de progreso.
# Args: (progress_pct: int, phase_name: str, message: str)
ProgressCallback = Callable[[int, str, str], None]

# Schemas que no representan tenants y deben excluirse del escaneo.
RESERVED_SCHEMAS = frozenset({
    "public",
    "test",
    "pg_catalog",
    "pg_toast",
    "information_schema",
})

_SCHEMA_NAME_RE = re.compile(r"^[a-z][a-z0-9_]{2,62}$")

_RESERVED_NAMES = frozenset({
    "public",
    "information_schema",
    "test",
    "tenant_template",
}) | frozenset(f"pg_{suffix}" for suffix in [
    "catalog", "toast", "temp", "default", "global",
])

_CRITICAL_SEEDS = (
    "seed_estructura_final",
    "seed_permisos_rbac",
)

# Seeds no-críticos. Cualquier fallo se loguea como warning pero el tenant
# queda como `ready`. Orden importa porque algunos dependen de otros:
#   - seed_tipos_documento_sgi: 12 TipoDocumento base SGI (ISO 9001/14001/45001)
#   - seed_plantillas_sgi: distribuye plantillas maestras → requiere tipos
#   - seed_trd: 33 reglas TRD → requiere tipos + Areas (de seed_estructura_final)
#   - seed_politica_habeas_data: plantilla POL → requiere tipos
#   - seed_config_identidad: identidad corporativa (último, es independiente)
_NON_CRITICAL_SEEDS = (
    "seed_tipos_documento_sgi",
    "seed_plantillas_sgi",
    "seed_trd",
    "seed_politica_habeas_data",
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
    # Creación: flujo monolítico (Fase A + B)
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
        progress_callback: ProgressCallback | None = None,
    ) -> tuple[Tenant, list[str]]:
        """
        Crea Tenant + Domain + schema físico + migraciones + seeds.

        Flujo monolítico: Fase A (rows) + Fase B (DDL + migrate + seeds).
        Usado por management commands y tests directos.

        Para el flujo asíncrono (serializer crea row → task crea schema),
        usar provision_schema_for_pending_tenant().

        Returns:
            Tuple de (Tenant, non_critical_warnings).
        """
        from django_tenants.utils import get_tenant_model
        from apps.tenant.models import Domain

        Tenant = get_tenant_model()

        cls._validate_schema_name(schema_name)
        code = cls._derive_code(schema_name)

        # ==============================================================
        # FASE A — Transaccional: lock + pre-validación + crear rows
        # ==============================================================
        with schema_context("public"):
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [schema_name],
                    )

                pre_status = cls.validate_invariant(schema_name)
                if pre_status.row_exists or pre_status.schema_exists:
                    raise TenantAlreadyExistsError(
                        f"Tenant {schema_name} already exists "
                        f"(row_exists={pre_status.row_exists}, "
                        f"schema_exists={pre_status.schema_exists})"
                    )

                plan = cls._resolve_plan(plan_code)

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

                Domain.objects.create(
                    domain=domain_url,
                    tenant=tenant,
                    is_primary=True,
                )

        # ==============================================================
        # FASE B — Secuencial: DDL + migrate + seeds + ready
        # ==============================================================
        try:
            warnings = cls._execute_phase_b(
                tenant=tenant,
                progress_callback=progress_callback,
            )

            cls._audit_log(
                action="create",
                schema_name=schema_name,
                user_id=created_by_user_id,
                result="success",
            )

            return tenant, warnings

        except (TenantAlreadyExistsError, ValidationError):
            raise
        except Exception as original_error:
            # Marcar row como 'failed' si sobrevivió Fase A
            cls._mark_failed_safe(schema_name, original_error)
            raise original_error from None

    # ------------------------------------------------------------------
    # Creación: flujo asíncrono (solo Fase B, row ya existe)
    # ------------------------------------------------------------------

    @classmethod
    def provision_schema_for_pending_tenant(
        cls,
        *,
        tenant_id: int,
        progress_callback: ProgressCallback | None = None,
    ) -> tuple[Tenant, list[str]]:
        """
        Ejecuta Fase B para un tenant cuya row ya existe en pending/creating.

        Usado por create_tenant_schema_task (Celery) cuando el serializer
        ya creó la row Tenant + Domain con schema_status='pending'.

        Args:
            tenant_id: ID del Tenant existente.
            progress_callback: Callback opcional (progress_pct, phase, msg).

        Returns:
            Tuple de (Tenant, non_critical_warnings).

        Raises:
            TenantNotFoundError: tenant_id no existe.
            TenantLifecycleError: tenant no está en pending/creating.
            TenantInvariantViolationError: post-validación falló.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()

        # Obtener y validar el tenant
        with schema_context("public"):
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                raise TenantNotFoundError(
                    f"Tenant con ID {tenant_id} no existe"
                )

            allowed_statuses = ("pending", "creating")
            if tenant.schema_status not in allowed_statuses:
                raise TenantLifecycleError(
                    f"Tenant {tenant.schema_name} tiene schema_status="
                    f"'{tenant.schema_status}', se esperaba uno de "
                    f"{allowed_statuses}. No se puede reprovisionar."
                )

            # Marcar como creating si estaba en pending
            if tenant.schema_status == "pending":
                tenant.schema_status = "creating"
                tenant.save(update_fields=["schema_status"])

        schema_name = tenant.schema_name

        try:
            warnings = cls._execute_phase_b(
                tenant=tenant,
                progress_callback=progress_callback,
            )

            cls._audit_log(
                action="provision",
                schema_name=schema_name,
                user_id=None,
                result="success",
            )

            return tenant, warnings

        except Exception as original_error:
            cls._mark_failed_safe(schema_name, original_error)
            raise original_error from None

    # ------------------------------------------------------------------
    # Fase B compartida (privada)
    # ------------------------------------------------------------------

    @classmethod
    def _execute_phase_b(
        cls,
        *,
        tenant: Tenant,
        progress_callback: ProgressCallback | None = None,
    ) -> list[str]:
        """
        Fase B: CREATE SCHEMA + migrate + seeds + post-validate + ready.

        Compartida entre create_tenant() y provision_schema_for_pending_tenant().
        Si falla, hace cleanup del schema (DROP IF EXISTS) y re-raise.

        Args:
            tenant: Tenant row existente (ya commiteada en DB).
            progress_callback: Opcional. (pct, phase, msg) → None.

        Returns:
            Lista de warnings no-críticos (strings).
        """
        schema_name = tenant.schema_name
        non_critical_warnings: list[str] = []

        def _progress(pct: int, phase: str, msg: str) -> None:
            if progress_callback is not None:
                try:
                    progress_callback(pct, phase, msg)
                except Exception:
                    pass  # Nunca interrumpir por fallo de callback

        schema_was_pre_existing = False
        schema_created = False
        try:
            # B1. Crear schema físico (idempotente para redelivery — H22)
            _progress(5, "creating_schema", "Creando schema PostgreSQL")
            close_old_connections()
            connection.ensure_connection()

            pre_schema = cls.validate_invariant(schema_name)
            if pre_schema.schema_exists:
                # Redelivery detectado: schema ya existe de un intento
                # previo (crash del worker entre CREATE y ready).
                # Saltamos CREATE y continuamos con migrate (idempotente)
                # + seeds (idempotentes con get_or_create).
                schema_was_pre_existing = True
                schema_created = True  # para tracking, no para cleanup
                logger.info(
                    "TenantLifecycle: action=create_schema schema=%s "
                    "result=redelivery_detected has_tables=%s",
                    schema_name,
                    pre_schema.schema_has_tables,
                )
            else:
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

            # B2. Migraciones
            _progress(10, "migrating", "Corriendo migraciones")
            call_command(
                "migrate_schemas",
                schema_name=schema_name,
                interactive=False,
                verbosity=0,
            )
            _progress(85, "migrations_complete", "Migraciones completadas")
            logger.info(
                "TenantLifecycle: action=migrate schema=%s result=success",
                schema_name,
            )

            # B3. Seeds (reconectar post-migraciones)
            close_old_connections()
            connection.ensure_connection()

            with schema_context(schema_name):
                # Críticos
                for i, seed_cmd in enumerate(_CRITICAL_SEEDS):
                    pct = 90 + i * 3  # 90, 93
                    phase = f"seeding_{seed_cmd.replace('seed_', '')}"
                    _progress(pct, phase, f"Sembrando {seed_cmd}")
                    close_old_connections()
                    connection.ensure_connection()
                    call_command(seed_cmd, verbosity=0)
                    logger.info(
                        "TenantLifecycle: seed=%s schema=%s result=success",
                        seed_cmd,
                        schema_name,
                    )

                # No-críticos
                for seed_cmd in _NON_CRITICAL_SEEDS:
                    _progress(95, "seeding_identity", "Configurando identidad")
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

                # B3.5 — Bootstrap del certificado X.509 (H-GD-A3)
                # No-crítico: si falla, el tenant queda ready pero el
                # primer sellado de PDF caerá al fallback graceful y
                # el operador podrá generar el cert manualmente.
                _progress(96, "generating_x509", "Generando certificado X.509")
                try:
                    from apps.gestion_estrategica.gestion_documental.services import (
                        CertificateService,
                    )

                    cert_result = CertificateService.ensure_certificate_for_current_tenant()
                    logger.info(
                        "TenantLifecycle: action=ensure_x509 schema=%s "
                        "result=%s",
                        schema_name,
                        "generated" if cert_result.created else "already_exists",
                    )
                except Exception as cert_err:
                    warning_msg = (
                        f"x509 cert bootstrap failed: {str(cert_err)[:500]}"
                    )
                    non_critical_warnings.append(warning_msg)
                    logger.warning(
                        "TenantLifecycle: action=ensure_x509 schema=%s "
                        "result=warning error=%s",
                        schema_name,
                        str(cert_err)[:200],
                    )

            # B4. Post-validación
            _progress(98, "finalizing", "Finalizando")
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

            return non_critical_warnings

        except Exception:
            # Cleanup: DROP schema solo si NOSOTROS lo creamos.
            # Si era pre-existente (redelivery), NO dropear — preservar
            # recovery state del intento previo (H22).
            if schema_created and not schema_was_pre_existing:
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
                        "TenantLifecycle: action=phase_b_rollback "
                        "schema=%s result=schema_dropped",
                        schema_name,
                    )
                except Exception as drop_err:
                    logger.error(
                        "TenantLifecycle: action=phase_b_rollback "
                        "schema=%s result=drop_failed error=%s",
                        schema_name,
                        str(drop_err)[:200],
                    )
            elif schema_was_pre_existing:
                logger.warning(
                    "TenantLifecycle: action=phase_b_failed "
                    "schema=%s result=preserved_pre_existing "
                    "detail=Schema NOT dropped to preserve recovery "
                    "state from previous attempt",
                    schema_name,
                )
            raise

    # ------------------------------------------------------------------
    # Archive / Restore
    # ------------------------------------------------------------------

    @classmethod
    def archive_tenant(
        cls,
        *,
        schema_name: str,
        archived_by_user_id: int | None = None,
        reason: str = "",
    ) -> Tenant:
        """Desactiva un tenant (is_active=False) sin eliminar su schema."""
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
        """Reactiva un tenant desactivado (is_active=True)."""
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

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    @classmethod
    def delete_tenant_with_schema(
        cls,
        *,
        schema_name: str,
        confirmation_token: str,
        deleted_by_user_id: int | None = None,
    ) -> None:
        """
        Elimina Tenant + Domain + schema físico.
        Acepta estados inconsistentes como input.
        """
        from django_tenants.utils import get_tenant_model
        from apps.tenant.models import Domain

        Tenant = get_tenant_model()

        expected_token = cls.CONFIRMATION_TOKEN_TEMPLATE.format(
            schema_name=schema_name,
        )
        if confirmation_token != expected_token:
            raise InvalidConfirmationTokenError(
                f"Token incorrecto para {schema_name}. "
                f"Formato esperado: DELETE-{{schema_name}}-CONFIRMED"
            )

        with schema_context("public"):
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [schema_name],
                    )

                pre_status = cls.validate_invariant(schema_name)
                if not pre_status.row_exists and not pre_status.schema_exists:
                    raise TenantNotFoundError(
                        f"Cannot delete: tenant {schema_name} does not "
                        f"exist (neither row nor schema)"
                    )

                if pre_status.row_exists:
                    Domain.objects.filter(
                        tenant__schema_name=schema_name,
                    ).delete()
                    Tenant.objects.filter(
                        schema_name=schema_name,
                    ).delete()

                if pre_status.schema_exists:
                    try:
                        with connection.cursor() as cursor:
                            cursor.execute(
                                sql.SQL("DROP SCHEMA {} CASCADE").format(
                                    sql.Identifier(schema_name)
                                )
                            )
                    except Exception as drop_error:
                        raise SchemaDropFailedError(
                            f"Failed to drop schema {schema_name}: "
                            f"{drop_error}"
                        ) from drop_error

                post_status = cls.validate_invariant(schema_name)
                if post_status.row_exists or post_status.schema_exists:
                    raise TenantInvariantViolationError(
                        f"Post-delete invariant failed for {schema_name}: "
                        f"row_exists={post_status.row_exists}, "
                        f"schema_exists={post_status.schema_exists}"
                    )

                cls._audit_log(
                    action="delete",
                    schema_name=schema_name,
                    user_id=deleted_by_user_id,
                    result="success",
                )

    # ------------------------------------------------------------------
    # Validación de invariante
    # ------------------------------------------------------------------

    @classmethod
    def validate_invariant(cls, schema_name: str) -> InvariantStatus:
        """Verifica el invariante para un tenant específico. Solo lectura."""
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
        """Escanea todos los Tenants y schemas físicos. Solo lectura."""
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

    @classmethod
    def count_schema_tables(cls, schema_name: str) -> int:
        """Retorna el número de BASE TABLEs en el schema. 0 si no existe."""
        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = %s AND table_type = 'BASE TABLE'",
                    [schema_name],
                )
                return cursor.fetchone()[0]

    # ------------------------------------------------------------------
    # Helpers privados
    # ------------------------------------------------------------------

    @classmethod
    def _validate_schema_name(cls, schema_name: str) -> None:
        """Valida formato y reservados del schema_name."""
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
        """Deriva `code` del Tenant a partir del schema_name."""
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
    def _mark_failed_safe(cls, schema_name: str, error: Exception) -> None:
        """
        Intenta marcar la row del tenant como 'failed'.
        Si la row no existe (fue revertida), no hace nada.
        Nunca levanta excepciones — solo loguea.
        """
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()
        try:
            close_old_connections()
            connection.ensure_connection()
            with schema_context("public"):
                with transaction.atomic():
                    Tenant.objects.filter(
                        schema_name=schema_name,
                    ).update(
                        schema_status="failed",
                        schema_error=str(error)[:5000],
                    )
        except Exception as status_err:
            logger.error(
                "TenantLifecycle: action=mark_failed schema=%s "
                "result=update_failed error=%s",
                schema_name,
                str(status_err)[:200],
            )

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
