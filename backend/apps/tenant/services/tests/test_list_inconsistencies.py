"""
Tests de integración para TenantLifecycleService.list_inconsistencies().

Requiere PostgreSQL real (django-tenants + information_schema).
"""

import pytest
from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import TenantLifecycleService


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db
class TestListInconsistencies:
    """
    Valida el escaneo global de inconsistencias.

    NOTA: 'test' (conftest) está en RESERVED_SCHEMAS → excluido.
    La test DB (test_stratekaz) puede tener schemas distintos a la DB
    de desarrollo. Los assertions validan estructura, no contenido fijo.
    """

    def test_report_structure(self, tenant_test_schema):
        """Verifica que el reporte tiene la estructura correcta."""
        report = TenantLifecycleService.list_inconsistencies()
        assert isinstance(report.inconsistencies, list)
        assert isinstance(report.total_tenants, int)
        assert isinstance(report.total_schemas, int)
        assert report.total_tenants >= 1  # Al menos 'test'

    def test_detects_row_orphan(self, tenant_test_schema):
        """Simula row sin schema y verifica detección."""
        from django_tenants.utils import get_tenant_model

        Tenant = get_tenant_model()
        with schema_context("public"):
            tenant = Tenant.objects.create(
                schema_name="row_orphan_scan_test",
                code="row_orphan_scan_test",
                name="Row Orphan Scan Test",
            )
        try:
            report = TenantLifecycleService.list_inconsistencies()
            orphans = [
                s for s in report.inconsistencies
                if s.schema_name == "row_orphan_scan_test"
            ]
            assert len(orphans) == 1
            assert orphans[0].inconsistency_type == "row_orphan"
        finally:
            with schema_context("public"):
                tenant.delete()

    def test_detects_schema_orphan(self, tenant_test_schema):
        """Simula schema sin row y verifica detección."""
        schema_name = "schema_orphan_scan_test"
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

            report = TenantLifecycleService.list_inconsistencies()
            orphans = [
                s for s in report.inconsistencies
                if s.schema_name == schema_name
            ]
            assert len(orphans) == 1
            assert orphans[0].inconsistency_type == "schema_orphan"
        finally:
            with schema_context("public"):
                with connection.cursor() as cursor:
                    cursor.execute(
                        f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'
                    )

    def test_excludes_reserved_schemas(self, tenant_test_schema):
        """'public' y 'test' no aparecen como inconsistencias."""
        report = TenantLifecycleService.list_inconsistencies()
        reported_names = {s.schema_name for s in report.inconsistencies}
        assert "public" not in reported_names
        assert "test" not in reported_names
