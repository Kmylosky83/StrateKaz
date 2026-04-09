"""
Tests de integración para TenantLifecycleService.validate_invariant().

Requiere PostgreSQL real (django-tenants + information_schema).
"""

import pytest
from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import TenantLifecycleService


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db
class TestValidateInvariant:
    """
    Valida el método validate_invariant contra la DB real.

    El fixture tenant_test_schema (session scope, conftest.py raíz)
    crea un tenant con schema_name='test'. Usamos eso como caso base.

    NOTA: Tenant es un SHARED model → las operaciones sobre Tenant
    requieren schema_context("public").
    """

    def test_consistent_tenant(self, tenant_test_schema):
        """Tenant 'test' creado por conftest = consistente."""
        status = TenantLifecycleService.validate_invariant("test")
        assert status.row_exists is True
        assert status.schema_exists is True
        assert status.schema_has_tables is True
        assert status.is_consistent is True
        assert status.inconsistency_type is None

    def test_row_orphan(self, tenant_test_schema):
        """Row sin schema = row_orphan (caso fast_test real)."""
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()
        with schema_context("public"):
            tenant = Tenant.objects.create(
                schema_name="orphan_row_test",
                code="orphan_row_test",
                name="Orphan Row Test",
            )
        try:
            status = TenantLifecycleService.validate_invariant("orphan_row_test")
            assert status.row_exists is True
            assert status.schema_exists is False
            assert status.schema_has_tables is False
            assert status.is_consistent is False
            assert status.inconsistency_type == "row_orphan"
        finally:
            with schema_context("public"):
                tenant.delete()

    def test_schema_orphan(self, tenant_test_schema):
        """Schema sin row = schema_orphan."""
        schema_name = "orphan_schema_test"
        try:
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        'CREATE SCHEMA IF NOT EXISTS "orphan_schema_test"'
                    )
                    cursor.execute(
                        'CREATE TABLE "orphan_schema_test"."dummy" '
                        "(id serial PRIMARY KEY)"
                    )

            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.row_exists is False
            assert status.schema_exists is True
            assert status.schema_has_tables is True
            assert status.is_consistent is False
            assert status.inconsistency_type == "schema_orphan"
        finally:
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        'DROP SCHEMA IF EXISTS "orphan_schema_test" CASCADE'
                    )

    def test_empty_schema(self, tenant_test_schema):
        """Row + schema pero 0 tablas = empty_schema."""
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()
        schema_name = "empty_schema_test"
        tenant = None
        try:
            with schema_context("public"):
                tenant = Tenant.objects.create(
                    schema_name=schema_name,
                    code="empty_schema_test",
                    name="Empty Schema Test",
                )
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
                    )

            status = TenantLifecycleService.validate_invariant(schema_name)
            assert status.row_exists is True
            assert status.schema_exists is True
            assert status.schema_has_tables is False
            assert status.is_consistent is False
            assert status.inconsistency_type == "empty_schema"
        finally:
            with schema_context("public"):
                if tenant:
                    tenant.delete()
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
                    )

    def test_both_absent(self, tenant_test_schema):
        """Ni row ni schema = consistente (no existe todavía)."""
        status = TenantLifecycleService.validate_invariant("nonexistent_abc")
        assert status.row_exists is False
        assert status.schema_exists is False
        assert status.is_consistent is True
        assert status.inconsistency_type is None
