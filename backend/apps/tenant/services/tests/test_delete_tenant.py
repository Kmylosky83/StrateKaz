"""
Tests de integración para TenantLifecycleService.delete_tenant_with_schema().

Requiere PostgreSQL real (django-tenants).
"""

import pytest
from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import (
    InvalidConfirmationTokenError,
    SchemaDropFailedError,
    TenantLifecycleService,
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


def _token(schema_name):
    """Helper: genera el token de confirmación correcto."""
    return f"DELETE-{schema_name}-CONFIRMED"


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestDeleteTenant:

    def test_delete_tenant_success(self, tenant_test_schema):
        """Delete exitoso: ni row ni schema ni domain persisten."""
        schema_name = "tenant_lifecycle_del_ok"
        try:
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Delete OK Test",
                domain_url="del-ok.test.com",
            )

            TenantLifecycleService.delete_tenant_with_schema(
                schema_name=schema_name,
                confirmation_token=_token(schema_name),
            )

            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.row_exists is False
            assert status.schema_exists is False
            assert status.is_consistent is True

            from apps.tenant.models import Domain
            with schema_context("public"):
                assert not Domain.objects.filter(
                    domain="del-ok.test.com"
                ).exists()

        finally:
            _cleanup_tenant(schema_name)

    def test_delete_invalid_token_raises(self, tenant_test_schema):
        """Token incorrecto no elimina nada."""
        schema_name = "tenant_lifecycle_del_badtok"
        try:
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Bad Token Test",
                domain_url="badtok.test.com",
            )

            with pytest.raises(InvalidConfirmationTokenError):
                TenantLifecycleService.delete_tenant_with_schema(
                    schema_name=schema_name,
                    confirmation_token="WRONG-TOKEN",
                )

            # Tenant sigue intacto
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.row_exists is True
            assert status.schema_exists is True
            assert status.is_consistent is True

        finally:
            _cleanup_tenant(schema_name)

    @pytest.mark.parametrize(
        "bad_token_fn",
        [
            lambda s: f"delete-{s}-confirmed",       # lowercase
            lambda s: f"DELETE-{s}-CONFIRM",          # missing D
            lambda s: "DELETE-wrong_schema-CONFIRMED", # wrong schema
        ],
        ids=["lowercase", "missing_D", "wrong_schema"],
    )
    def test_delete_token_near_miss(
        self, tenant_test_schema, bad_token_fn
    ):
        """Tokens 'casi correctos' son rechazados."""
        schema_name = "tenant_lifecycle_del_near"
        try:
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Near Miss Test",
                domain_url="near.test.com",
            )

            with pytest.raises(InvalidConfirmationTokenError):
                TenantLifecycleService.delete_tenant_with_schema(
                    schema_name=schema_name,
                    confirmation_token=bad_token_fn(schema_name),
                )

        finally:
            _cleanup_tenant(schema_name)

    def test_delete_not_found_raises(self, tenant_test_schema):
        """Delete de schema inexistente levanta TenantNotFoundError."""
        with pytest.raises(TenantNotFoundError):
            TenantLifecycleService.delete_tenant_with_schema(
                schema_name="nonexistent_del_test",
                confirmation_token=_token("nonexistent_del_test"),
            )

    def test_delete_row_orphan_case(self, tenant_test_schema):
        """
        Caso fast_test exacto: row sin schema.
        Delete acepta el estado inconsistente y limpia la row.
        """
        from django_tenants.utils import get_tenant_model
        from apps.tenant.models import Domain

        schema_name = "tenant_orphan_del_test"
        try:
            # Setup: row + domain, SIN schema
            with schema_context("public"):
                Tenant = get_tenant_model()
                tenant = Tenant.objects.create(
                    schema_name=schema_name,
                    code="orphan_del_test",
                    name="Orphan Delete Test",
                )
                Domain.objects.create(
                    domain="orphan-del.test.com",
                    tenant=tenant,
                    is_primary=True,
                )

            # Confirmar row_orphan
            pre_status = TenantLifecycleService.validate_invariant(schema_name)
            assert pre_status.row_exists is True
            assert pre_status.schema_exists is False
            assert pre_status.inconsistency_type == "row_orphan"

            # Delete acepta el estado inconsistente
            TenantLifecycleService.delete_tenant_with_schema(
                schema_name=schema_name,
                confirmation_token=_token(schema_name),
            )

            # Todo limpio
            post_status = TenantLifecycleService.validate_invariant(schema_name)
            assert post_status.row_exists is False
            assert post_status.schema_exists is False
            assert post_status.is_consistent is True

            with schema_context("public"):
                assert not Domain.objects.filter(
                    domain="orphan-del.test.com"
                ).exists()

        finally:
            _cleanup_tenant(schema_name)

    def test_delete_schema_orphan_case(self, tenant_test_schema):
        """Schema sin row: delete acepta y dropea el schema."""
        schema_name = "schema_orphan_del_test"
        try:
            # Setup: schema físico con tabla dummy, SIN row Tenant
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
                    )
                    cursor.execute(
                        f'CREATE TABLE "{schema_name}"."dummy" '
                        "(id serial PRIMARY KEY)"
                    )

            pre_status = TenantLifecycleService.validate_invariant(schema_name)
            assert pre_status.schema_exists is True
            assert pre_status.row_exists is False
            assert pre_status.inconsistency_type == "schema_orphan"

            TenantLifecycleService.delete_tenant_with_schema(
                schema_name=schema_name,
                confirmation_token=_token(schema_name),
            )

            post_status = TenantLifecycleService.validate_invariant(schema_name)
            assert post_status.schema_exists is False
            assert post_status.is_consistent is True

        finally:
            # Safety cleanup
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
                    )

    def test_delete_drop_failure_rollbacks(self, tenant_test_schema):
        """Si DROP SCHEMA falla, el rollback preserva row + schema."""
        schema_name = "tenant_lifecycle_del_dropfail"
        try:
            TenantLifecycleService.create_tenant(
                schema_name=schema_name,
                name="Drop Fail Test",
                domain_url="dropfail.test.com",
            )

            # Mock selectivo: solo falla cuando el SQL contiene DROP SCHEMA
            original_execute = connection.cursor().__class__.execute

            def mock_execute(self_cursor, sql_query, params=None):
                sql_str = str(sql_query)
                if "DROP SCHEMA" in sql_str:
                    raise RuntimeError("Simulated DROP SCHEMA failure")
                return original_execute(self_cursor, sql_query, params)

            from unittest.mock import patch
            with patch.object(
                connection.cursor().__class__,
                "execute",
                mock_execute,
            ):
                with pytest.raises(SchemaDropFailedError):
                    TenantLifecycleService.delete_tenant_with_schema(
                        schema_name=schema_name,
                        confirmation_token=_token(schema_name),
                    )

            # Rollback: tenant sigue existiendo
            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.row_exists is True
            assert status.schema_exists is True
            assert status.is_consistent is True

        finally:
            _cleanup_tenant(schema_name)
