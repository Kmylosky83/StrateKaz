"""
Tests unitarios para InvariantStatus y InvariantReport.

Cero acceso a DB — solo lógica de las dataclasses.
"""

import pytest

from apps.tenant.services.dataclasses import InvariantReport, InvariantStatus


@pytest.mark.tenant_lifecycle
class TestInvariantStatusConsistency:
    """Todas las combinaciones de los 3 flags booleanos."""

    def test_consistent_all_present(self):
        """row + schema + tablas = tenant operativo."""
        status = InvariantStatus("t", row_exists=True, schema_exists=True, schema_has_tables=True)
        assert status.is_consistent is True
        assert status.inconsistency_type is None

    def test_consistent_all_absent(self):
        """nada existe = tenant no creado."""
        status = InvariantStatus("t", row_exists=False, schema_exists=False, schema_has_tables=False)
        assert status.is_consistent is True
        assert status.inconsistency_type is None

    def test_row_orphan(self):
        """row sin schema = desync por schema dropeado."""
        status = InvariantStatus("t", row_exists=True, schema_exists=False, schema_has_tables=False)
        assert status.is_consistent is False
        assert status.inconsistency_type == "row_orphan"

    def test_schema_orphan(self):
        """schema sin row = desync por row eliminada."""
        status = InvariantStatus("t", row_exists=False, schema_exists=True, schema_has_tables=True)
        assert status.is_consistent is False
        assert status.inconsistency_type == "schema_orphan"

    def test_schema_orphan_empty(self):
        """schema vacío sin row = desync."""
        status = InvariantStatus("t", row_exists=False, schema_exists=True, schema_has_tables=False)
        assert status.is_consistent is False
        assert status.inconsistency_type == "schema_orphan"

    def test_empty_schema(self):
        """row + schema pero 0 tablas = migraciones no corrieron."""
        status = InvariantStatus("t", row_exists=True, schema_exists=True, schema_has_tables=False)
        assert status.is_consistent is False
        assert status.inconsistency_type == "empty_schema"

    def test_row_only_with_tables_flag_true(self):
        """row sin schema pero has_tables=True = estado imposible, row_orphan."""
        status = InvariantStatus("t", row_exists=True, schema_exists=False, schema_has_tables=True)
        assert status.is_consistent is False
        assert status.inconsistency_type == "row_orphan"

    def test_nothing_but_tables(self):
        """nada pero has_tables=True = estado imposible, consistente por ausencia."""
        status = InvariantStatus("t", row_exists=False, schema_exists=False, schema_has_tables=True)
        assert status.is_consistent is True
        assert status.inconsistency_type is None

    def test_frozen_dataclass(self):
        """InvariantStatus es inmutable."""
        status = InvariantStatus("t", row_exists=True, schema_exists=True, schema_has_tables=True)
        with pytest.raises(AttributeError):
            status.row_exists = False


@pytest.mark.tenant_lifecycle
class TestInvariantReport:

    def test_no_inconsistencies(self):
        report = InvariantReport(inconsistencies=[], total_tenants=2, total_schemas=2)
        assert report.has_inconsistencies is False

    def test_with_inconsistencies(self):
        orphan = InvariantStatus("bad", row_exists=True, schema_exists=False, schema_has_tables=False)
        report = InvariantReport(inconsistencies=[orphan], total_tenants=3, total_schemas=2)
        assert report.has_inconsistencies is True
        assert len(report.inconsistencies) == 1
        assert report.inconsistencies[0].inconsistency_type == "row_orphan"

    def test_frozen_dataclass(self):
        report = InvariantReport(inconsistencies=[], total_tenants=0, total_schemas=0)
        with pytest.raises(AttributeError):
            report.total_tenants = 5
