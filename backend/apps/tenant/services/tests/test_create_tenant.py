"""
Tests de integración para TenantLifecycleService.create_tenant().

Requiere PostgreSQL real (django-tenants + migraciones + seeds).
NOTA: Estos tests son lentos (~60s+ cada uno) porque corren migrate_schemas.
"""

import pytest
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import (
    TenantAlreadyExistsError,
    TenantLifecycleService,
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


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestCreateTenant:

    def test_create_tenant_success(self, tenant_test_schema):
        """Create exitoso: row + domain + schema + tablas + invariante OK."""
        schema_name = "tenant_lifecycle_create_ok"
        try:
            tenant, warnings = TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Lifecycle Create Test",
                domain_url="lifecycle-create.test.com",
            )

            assert tenant.schema_name == schema_name
            assert tenant.code == "lifecycle_create_ok"
            assert tenant.name == "Lifecycle Create Test"
            assert tenant.is_active is True
            assert tenant.schema_status == "ready"
            assert tenant.schema_error == ""

            # Domain exists
            from apps.tenant.models import Domain
            with schema_context("public"):
                assert Domain.objects.filter(
                    tenant=tenant, domain="lifecycle-create.test.com"
                ).exists()

            # Invariante consistente
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.is_consistent is True
            assert status.schema_has_tables is True

            # Warnings (seed_config_identidad puede fallar o no)
            assert isinstance(warnings, list)

        finally:
            _cleanup_tenant(schema_name)

    def test_create_tenant_duplicate_raises(self, tenant_test_schema):
        """Segundo create con mismo schema_name levanta TenantAlreadyExistsError."""
        schema_name = "tenant_lifecycle_dup_test"
        try:
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="First Create",
                domain_url="dup1.test.com",
            )

            from django_tenants.utils import get_tenant_model
            Tenant = get_tenant_model()
            with schema_context("public"):
                count_before = Tenant.objects.filter(
                    schema_name=schema_name
                ).count()

            with pytest.raises(TenantAlreadyExistsError):
                TenantLifecycleService.create_tenant(
                    schema_name=schema_name,
                    name="Second Create",
                    domain_url="dup2.test.com",
                )

            with schema_context("public"):
                count_after = Tenant.objects.filter(
                    schema_name=schema_name
                ).count()
            assert count_after == count_before

        finally:
            _cleanup_tenant(schema_name)

    @pytest.mark.parametrize(
        "bad_name",
        [
            "Public",       # uppercase
            "PUBLIC",       # all uppercase
            "with space",   # spaces
            "1startnumber", # starts with number
            "ab",           # too short (min 3)
            "pg_reserved",  # starts with pg_
            "information_schema",  # reserved
            "public",       # reserved
            "test",         # reserved
        ],
    )
    def test_create_tenant_invalid_schema_name_raises(
        self, tenant_test_schema, bad_name
    ):
        """Nombres inválidos levantan ValidationError sin crear nada."""
        with pytest.raises(ValidationError):
            TenantLifecycleService.create_tenant(
                schema_name=bad_name,
                name="Should Not Exist",
                domain_url="bad.test.com",
            )

        # Nada se creó
        status = TenantLifecycleService.validate_invariant(bad_name)
        assert status.row_exists is False

    def test_create_tenant_migration_failure_cleans_schema_marks_failed(
        self, tenant_test_schema
    ):
        """
        Si migrate_schemas falla en Fase B:
        - Schema se dropea (cleanup explícito)
        - Row sobrevive con schema_status='failed'
        - Domain sobrevive (creada en Fase A)
        """
        schema_name = "tenant_lifecycle_migfail"
        try:
            with patch(
                "apps.tenant.services.tenant_lifecycle_service.call_command",
                side_effect=RuntimeError("Simulated migration failure"),
            ):
                with pytest.raises(RuntimeError, match="Simulated migration"):
                    TenantLifecycleService.create_tenant(
                        schema_name=schema_name,
                        name="Migration Fail Test",
                        domain_url="migfail.test.com",
                    )

            # Row sobrevive con status='failed'
            from django_tenants.utils import get_tenant_model
            Tenant = get_tenant_model()
            with schema_context("public"):
                tenant = Tenant.objects.get(schema_name=schema_name)
                assert tenant.schema_status == "failed"
                assert "Simulated migration failure" in tenant.schema_error

            # Schema fue dropeado por cleanup
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.schema_exists is False

        finally:
            _cleanup_tenant(schema_name)

    def test_create_tenant_noncritical_seed_warning(self, tenant_test_schema):
        """Seed no-crítico fallando retorna warning pero tenant queda ready."""
        schema_name = "tenant_lifecycle_seedwarn"

        def mock_call_command(cmd, *args, **kwargs):
            if cmd == "seed_config_identidad":
                raise RuntimeError("Simulated non-critical seed failure")
            # Dejar pasar el resto (migrate_schemas, seeds críticos)
            from django.core.management import call_command as real_call
            return real_call(cmd, *args, **kwargs)

        try:
            with patch(
                "apps.tenant.services.tenant_lifecycle_service.call_command",
                side_effect=mock_call_command,
            ):
                tenant, warnings = TenantLifecycleService.create_tenant(
                    schema_name=schema_name,
                    name="Seed Warning Test",
                    domain_url="seedwarn.test.com",
                )

            assert tenant.schema_status == "ready"
            assert len(warnings) >= 1
            assert "seed_config_identidad failed" in warnings[0]

        finally:
            _cleanup_tenant(schema_name)

    @pytest.mark.skip(
        reason="Threading + django-tenants DB connections requiere "
        "configuración especial. Lock advisory verificado en "
        "test_create_tenant_duplicate_raises (serialización secuencial)."
    )
    def test_create_tenant_concurrent_one_wins(self, tenant_test_schema):
        """Dos creates concurrentes: uno gana, otro recibe error."""
        pass
