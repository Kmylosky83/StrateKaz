"""
Tests de integración para archive_tenant y restore_tenant.

Requiere PostgreSQL real (django-tenants).
"""

import pytest
from django.db import connection
from django_tenants.utils import schema_context

from apps.tenant.services import (
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


@pytest.mark.tenant_lifecycle
@pytest.mark.django_db(transaction=True)
class TestArchiveRestore:

    @pytest.fixture(autouse=True)
    def _setup_tenant(self, tenant_test_schema):
        """Crea un tenant de test para archive/restore."""
        self.schema_name = "tenant_lifecycle_archive"
        tenant, _ = TenantLifecycleService.create_tenant(
            schema_name=self.schema_name,
            name="Archive Test Tenant",
            domain_url="archive.test.com",
        )
        self.tenant = tenant
        yield
        _cleanup_tenant(self.schema_name)

    def test_archive_marks_inactive(self):
        """Archive pone is_active=False."""
        tenant = TenantLifecycleService.archive_tenant(
            schema_name=self.schema_name,
        )
        assert tenant.is_active is False

    def test_archive_not_found_raises(self):
        """Archive de tenant inexistente levanta TenantNotFoundError."""
        with pytest.raises(TenantNotFoundError):
            TenantLifecycleService.archive_tenant(
                schema_name="nonexistent_archive_test",
            )

    def test_restore_marks_active(self):
        """Restore pone is_active=True."""
        TenantLifecycleService.archive_tenant(
            schema_name=self.schema_name,
        )
        tenant = TenantLifecycleService.restore_tenant(
            schema_name=self.schema_name,
        )
        assert tenant.is_active is True

    def test_archive_restore_roundtrip(self):
        """Create → archive → restore preserva invariante."""
        assert self.tenant.is_active is True

        archived = TenantLifecycleService.archive_tenant(
            schema_name=self.schema_name,
        )
        assert archived.is_active is False

        restored = TenantLifecycleService.restore_tenant(
            schema_name=self.schema_name,
        )
        assert restored.is_active is True

        status = TenantLifecycleService.validate_invariant(self.schema_name)
        assert status.is_consistent is True

    def test_archive_does_not_touch_schema(self):
        """Archive desactiva la row pero el schema y sus tablas siguen."""
        TenantLifecycleService.archive_tenant(
            schema_name=self.schema_name,
        )
        status = TenantLifecycleService.validate_invariant(self.schema_name)
        assert status.schema_exists is True
        assert status.schema_has_tables is True
        assert status.is_consistent is True
