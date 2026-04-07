"""
Smoke test para verificar que BaseTenantTestCase funciona correctamente.
Si este test pasa, la infraestructura de testing multi-tenant está operativa.
"""

from django.db import connection

from apps.core.tests.base import BaseTenantTestCase


class TestBaseWorks(BaseTenantTestCase):
    def test_tenant_schema_exists(self):
        """El test corre dentro del schema del tenant, no en public."""
        self.assertEqual(connection.schema_name, self.tenant.schema_name)
        self.assertNotEqual(connection.schema_name, 'public')
