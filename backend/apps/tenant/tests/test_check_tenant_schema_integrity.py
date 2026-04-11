"""
Tests para la tarea periódica check_tenant_schema_integrity.

Verifica que la tarea detecta inconsistencias y reporta correctamente
sin auto-reparar.
"""

import pytest
from unittest.mock import patch
from django.db import connection
from django_tenants.utils import schema_context


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestCheckTenantSchemaIntegrity:

    def test_consistent_environment(self, tenant_test_schema):
        """Ambiente limpio retorna status='ok' sin inconsistencias."""
        from apps.tenant.tasks import check_tenant_schema_integrity

        result = check_tenant_schema_integrity()

        assert result['status'] == 'ok'
        assert result['inconsistencies_found'] == 0
        assert result['total_tenants'] >= 1

    def test_detects_row_orphan(self, tenant_test_schema):
        """Row sin schema detectada como inconsistencia."""
        from django_tenants.utils import get_tenant_model
        from apps.tenant.tasks import check_tenant_schema_integrity

        Tenant = get_tenant_model()
        with schema_context("public"):
            tenant = Tenant.objects.create(
                schema_name="integrity_row_orphan",
                code="integrity_row_orphan",
                name="Integrity Row Orphan",
            )
        try:
            result = check_tenant_schema_integrity()

            assert result['status'] == 'inconsistencies_found'
            assert result['inconsistencies_found'] >= 1

            orphans = [
                i for i in result['inconsistencies']
                if i['schema_name'] == 'integrity_row_orphan'
            ]
            assert len(orphans) == 1
            assert orphans[0]['type'] == 'row_orphan'
        finally:
            with schema_context("public"):
                tenant.delete()

    def test_detects_schema_orphan(self, tenant_test_schema):
        """Schema sin row detectado como inconsistencia."""
        from apps.tenant.tasks import check_tenant_schema_integrity

        schema_name = "integrity_schema_orphan"
        try:
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'
                    )
                    cursor.execute(
                        f'CREATE TABLE "{schema_name}"."dummy" '
                        "(id serial PRIMARY KEY)"
                    )

            result = check_tenant_schema_integrity()

            assert result['status'] == 'inconsistencies_found'
            orphans = [
                i for i in result['inconsistencies']
                if i['schema_name'] == schema_name
            ]
            assert len(orphans) == 1
            assert orphans[0]['type'] == 'schema_orphan'
        finally:
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
                    )

    def test_handles_service_failure(self, tenant_test_schema):
        """Si list_inconsistencies() falla, retorna status='error'."""
        from apps.tenant.tasks import check_tenant_schema_integrity

        with patch(
            "apps.tenant.services.tenant_lifecycle_service.TenantLifecycleService.list_inconsistencies",
            side_effect=RuntimeError("Simulated service failure"),
        ):
            result = check_tenant_schema_integrity()

        assert result['status'] == 'error'
        assert 'Simulated service failure' in result['error']
        assert result['inconsistencies_found'] == 0
