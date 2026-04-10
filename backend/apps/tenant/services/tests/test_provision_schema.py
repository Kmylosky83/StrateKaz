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
