"""
Tests de integración para TenantLifecycleService.provision_schema_for_pending_tenant().

Requiere PostgreSQL real (django-tenants + migraciones + seeds).
NOTA: Tests con provisión real son lentos (~10 min) por migrate_schemas.
"""

import pytest
from unittest.mock import patch, MagicMock

from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import (
    TenantLifecycleService,
    TenantLifecycleError,
    TenantNotFoundError,
)


def _cleanup_tenant(schema_name):
    """Helper para limpiar un tenant de test (raw, sin servicio)."""
    from django_tenants.utils import get_tenant_model
    from apps.tenant.models import Domain

    with schema_context("public"):
        Domain.objects.filter(tenant__schema_name=schema_name).delete()
        get_tenant_model().objects.filter(schema_name=schema_name).delete()
        with connection.cursor() as cursor:
            cursor.execute(
                f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
            )


def _create_pending_tenant(schema_name, code=None):
    """Helper: crea row Tenant + Domain con status='pending' (sin schema)."""
    from django_tenants.utils import get_tenant_model
    from apps.tenant.models import Domain

    Tenant = get_tenant_model()
    if code is None:
        code = schema_name.replace("tenant_", "") if schema_name.startswith("tenant_") else schema_name

    with schema_context("public"):
        tenant = Tenant.objects.create(
            schema_name=schema_name,
            code=code,
            name=f"Test {code}",
            schema_status="pending",
            is_active=True,
        )
        Domain.objects.create(
            domain=f"{code}.test.com",
            tenant=tenant,
            is_primary=True,
        )
    return tenant


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestProvisionSchemaForPendingTenant:

    def test_provision_success(self, tenant_test_schema):
        """Provisionar tenant pendiente: schema + tablas + ready."""
        schema_name = "tenant_provision_ok"
        tenant = _create_pending_tenant(schema_name)
        try:
            result_tenant, warnings = (
                TenantLifecycleService.provision_schema_for_pending_tenant(
                    tenant_id=tenant.id,
                )
            )

            assert result_tenant.schema_status == "ready"
            assert result_tenant.schema_error == ""

            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.is_consistent is True
            assert status.schema_has_tables is True

            assert isinstance(warnings, list)

        finally:
            _cleanup_tenant(schema_name)

    def test_provision_tenant_not_pending_raises(self, tenant_test_schema):
        """Tenant en status 'ready' no se puede reprovisionar."""
        schema_name = "tenant_provision_ready"
        try:
            # Crear un tenant completo (status='ready')
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Already Ready",
                domain_url="ready.test.com",
            )

            from django_tenants.utils import get_tenant_model
            Tenant = get_tenant_model()
            with schema_context("public"):
                tenant = Tenant.objects.get(schema_name=schema_name)

            with pytest.raises(TenantLifecycleError, match="se esperaba"):
                TenantLifecycleService.provision_schema_for_pending_tenant(
                    tenant_id=tenant.id,
                )

        finally:
            _cleanup_tenant(schema_name)

    def test_provision_nonexistent_raises(self, tenant_test_schema):
        """tenant_id inexistente levanta TenantNotFoundError."""
        with pytest.raises(TenantNotFoundError):
            TenantLifecycleService.provision_schema_for_pending_tenant(
                tenant_id=999999,
            )

    def test_provision_with_progress_callback(self, tenant_test_schema):
        """El callback de progreso se invoca en cada fase."""
        schema_name = "tenant_provision_cb"
        tenant = _create_pending_tenant(schema_name)
        callback = MagicMock()

        try:
            TenantLifecycleService.provision_schema_for_pending_tenant(
                tenant_id=tenant.id,
                progress_callback=callback,
            )

            # El callback debe haberse invocado múltiples veces
            assert callback.call_count >= 5

            # Verificar que los argumentos son (int, str, str)
            for call_args in callback.call_args_list:
                args = call_args[0]
                assert isinstance(args[0], int)   # pct
                assert isinstance(args[1], str)    # phase
                assert isinstance(args[2], str)    # message

            # Verificar fases clave
            phases_called = [call[0][1] for call in callback.call_args_list]
            assert "creating_schema" in phases_called
            assert "migrating" in phases_called
            assert "finalizing" in phases_called

        finally:
            _cleanup_tenant(schema_name)

    def test_provision_migration_failure_marks_failed(self, tenant_test_schema):
        """Si migrate_schemas falla, schema_status='failed' + schema dropeado."""
        schema_name = "tenant_provision_migfail"
        tenant = _create_pending_tenant(schema_name)

        try:
            with patch(
                "apps.tenant.services.tenant_lifecycle_service.call_command",
                side_effect=RuntimeError("Simulated migration failure"),
            ):
                with pytest.raises(RuntimeError, match="Simulated migration"):
                    TenantLifecycleService.provision_schema_for_pending_tenant(
                        tenant_id=tenant.id,
                    )

            # Row queda con status='failed'
            from django_tenants.utils import get_tenant_model
            Tenant = get_tenant_model()
            with schema_context("public"):
                updated = Tenant.objects.get(schema_name=schema_name)
                assert updated.schema_status == "failed"
                assert "Simulated migration failure" in updated.schema_error

            # Schema fue dropeado por cleanup
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.schema_exists is False

        finally:
            _cleanup_tenant(schema_name)


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestExecutePhaseBIdempotency:
    """Tests de idempotencia para redelivery de Celery (H22)."""

    def test_idempotent_on_existing_empty_schema(self, tenant_test_schema):
        """
        Redelivery scenario B: schema existe vacío (crash antes de migrate).
        provision debe migrar + seed + marcar ready.
        """
        schema_name = "tenant_h22_empty"
        tenant = _create_pending_tenant(schema_name)
        try:
            # Simular crash: crear schema vacío manualmente
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
                    )

            # Verificar pre-condición: schema existe, 0 tablas
            pre = TenantLifecycleService.validate_invariant(schema_name)
            assert pre.schema_exists is True
            assert pre.schema_has_tables is False

            # Provision debe completar exitosamente (idempotente)
            result_tenant, warnings = (
                TenantLifecycleService.provision_schema_for_pending_tenant(
                    tenant_id=tenant.id,
                )
            )

            assert result_tenant.schema_status == "ready"

            post = TenantLifecycleService.validate_invariant(schema_name)
            assert post.is_consistent is True
            assert post.schema_has_tables is True

        finally:
            _cleanup_tenant(schema_name)

    def test_idempotent_on_existing_full_schema(self, tenant_test_schema):
        """
        Redelivery scenario D: schema completo (crash entre migrate y ready).
        Replica EXACTAMENTE el escenario real del crash de Docker.
        provision debe re-migrar (no-op) + re-seed (idempotente) + marcar ready.
        """
        schema_name = "tenant_h22_full"
        try:
            # Crear tenant completo via servicio
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="H22 Full Test",
                domain_url="h22full.test.com",
            )

            # Simular crash: forzar schema_status='creating'
            from django_tenants.utils import get_tenant_model
            Tenant = get_tenant_model()
            with schema_context("public"):
                t = Tenant.objects.get(schema_name=schema_name)
                t.schema_status = "creating"
                t.save(update_fields=["schema_status"])

            # Redelivery: provision sobre tenant que ya tiene todo
            result_tenant, warnings = (
                TenantLifecycleService.provision_schema_for_pending_tenant(
                    tenant_id=t.id,
                )
            )

            assert result_tenant.schema_status == "ready"
            assert result_tenant.schema_error == ""

            post = TenantLifecycleService.validate_invariant(schema_name)
            assert post.is_consistent is True

        finally:
            _cleanup_tenant(schema_name)

    def test_preserves_pre_existing_schema_on_failure(self, tenant_test_schema):
        """
        Si falla durante Phase B en schema pre-existente, NO hacer DROP.
        Preservar recovery state del intento previo.
        """
        schema_name = "tenant_h22_preserve"
        tenant = _create_pending_tenant(schema_name)
        try:
            # Crear schema vacío pre-existente
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
                    )

            # Mock migrate_schemas para que falle
            with patch(
                "apps.tenant.services.tenant_lifecycle_service.call_command",
                side_effect=RuntimeError("Simulated failure on redelivery"),
            ):
                with pytest.raises(RuntimeError, match="Simulated failure"):
                    TenantLifecycleService.provision_schema_for_pending_tenant(
                        tenant_id=tenant.id,
                    )

            # Schema NO fue dropeado (preservado para recovery)
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.schema_exists is True

        finally:
            _cleanup_tenant(schema_name)
