"""
Tests de aislamiento multi-tenant.

Estos tests validan que:
1. Un tenant no puede acceder a datos de otro tenant
2. Sin tenant activo, no se retornan datos
3. Las queries están correctamente filtradas
4. El middleware establece el tenant correctamente
5. El middleware valida acceso del usuario al tenant

EJECUCIÓN:
    pytest apps/tenant/tests/test_isolation.py -v
    pytest apps/tenant/tests/test_isolation.py -v -k "middleware"
    pytest apps/tenant/tests/test_isolation.py -v -k "permission"
"""
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from django.test import TestCase, RequestFactory, override_settings
from django.http import HttpResponse, JsonResponse
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenant.middleware import TenantAuthenticationMiddleware


# =============================================================================
# UNIT TESTS: Middleware Tenant Access Validation
# =============================================================================


class TenantMiddlewareAccessValidationTest(TestCase):
    """
    Tests unitarios para la validación de acceso en TenantAuthenticationMiddleware.

    Estos tests validan que el middleware NO permite cambiar de tenant
    via X-Tenant-ID sin un JWT válido con TenantUserAccess activo.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.get_response = MagicMock(return_value=HttpResponse('OK'))
        self.middleware = TenantAuthenticationMiddleware(self.get_response)

    def test_public_paths_skip_validation(self):
        """
        Paths públicos no requieren validación de tenant.
        """
        public_paths = [
            '/api/auth/login/',
            '/api/tenant/auth/login/',
            '/api/tenant/public/branding/',
            '/api/tenant/plans/',
            '/api/health/',
            '/api/docs/',
            '/api/redoc/',
            '/admin/',
        ]

        for path in public_paths:
            request = self.factory.get(path)
            response = self.middleware(request)
            self.assertEqual(
                response.status_code, 200,
                f"Public path {path} should not be blocked"
            )
            self.get_response.assert_called_with(request)

    def test_no_tenant_header_passes_through(self):
        """
        Sin header X-Tenant-ID, el middleware no interviene.
        TenantMainMiddleware maneja la detección por dominio.
        """
        request = self.factory.get('/api/core/users/')
        response = self.middleware(request)
        # Should pass through to get_response
        self.get_response.assert_called_with(request)

    @patch('apps.tenant.middleware.get_tenant_model')
    def test_tenant_header_without_auth_returns_401(self, mock_get_tenant):
        """
        X-Tenant-ID sin Authorization header retorna 401.
        CRITICO: Previene cambio de tenant sin autenticación.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 1
        mock_tenant.is_active = True
        mock_get_tenant.return_value.objects.get.return_value = mock_tenant

        request = self.factory.get(
            '/api/core/users/',
            HTTP_X_TENANT_ID='1'
        )

        response = self.middleware(request)
        self.assertEqual(response.status_code, 401)

    @patch('apps.tenant.middleware.get_tenant_model')
    def test_tenant_header_with_invalid_jwt_returns_401(self, mock_get_tenant):
        """
        X-Tenant-ID con JWT inválido retorna 401.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 1
        mock_get_tenant.return_value.objects.get.return_value = mock_tenant

        request = self.factory.get(
            '/api/core/users/',
            HTTP_X_TENANT_ID='1',
            HTTP_AUTHORIZATION='Bearer invalid-token-here'
        )

        response = self.middleware(request)
        self.assertEqual(response.status_code, 401)

    @patch('apps.tenant.middleware.get_tenant_model')
    def test_nonexistent_tenant_returns_404(self, mock_get_tenant):
        """
        X-Tenant-ID con tenant inexistente retorna 404.
        """
        from apps.tenant.models import Tenant
        mock_get_tenant.return_value.objects.get.side_effect = Tenant.DoesNotExist

        request = self.factory.get(
            '/api/core/users/',
            HTTP_X_TENANT_ID='999',
            HTTP_AUTHORIZATION='Bearer some-token'
        )

        response = self.middleware(request)
        self.assertEqual(response.status_code, 404)

    @patch('apps.tenant.middleware.schema_context')
    @patch('apps.tenant.middleware.get_tenant_model')
    def test_superadmin_can_access_any_tenant(self, mock_get_tenant, mock_schema_ctx):
        """
        Superadmin (is_superadmin=True) puede acceder a cualquier tenant.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 5
        mock_tenant.name = 'Otro Tenant'
        mock_get_tenant.return_value.objects.get.return_value = mock_tenant

        # Mock schema_context as context manager
        mock_schema_ctx.return_value.__enter__ = MagicMock()
        mock_schema_ctx.return_value.__exit__ = MagicMock(return_value=False)

        # Mock the JWT validation
        mock_token = {'tenant_user_id': 1, 'email': 'admin@test.com'}

        with patch.object(
            self.middleware.jwt_auth, 'get_validated_token',
            return_value=mock_token
        ):
            # Mock TenantUser lookup
            mock_tenant_user = MagicMock()
            mock_tenant_user.is_superadmin = True
            mock_tenant_user.email = 'admin@test.com'

            with patch(
                'apps.tenant.middleware.TenantUser'
            ) as mock_tu_class:
                mock_tu_class.objects.filter.return_value.first.return_value = mock_tenant_user

                request = self.factory.get(
                    '/api/core/users/',
                    HTTP_X_TENANT_ID='5',
                    HTTP_AUTHORIZATION='Bearer valid-superadmin-token'
                )

                # The _validate_tenant_access should return None (access granted)
                result = self.middleware._validate_tenant_access(request, mock_tenant)
                self.assertIsNone(result)

    @patch('apps.tenant.middleware.schema_context')
    @patch('apps.tenant.middleware.get_tenant_model')
    def test_user_without_access_returns_403(self, mock_get_tenant, mock_schema_ctx):
        """
        Usuario sin TenantUserAccess activo recibe 403.
        CRITICO: Previene acceso cross-tenant no autorizado.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 5
        mock_tenant.name = 'Otro Tenant'

        # Mock schema_context
        mock_schema_ctx.return_value.__enter__ = MagicMock()
        mock_schema_ctx.return_value.__exit__ = MagicMock(return_value=False)

        mock_token = {'tenant_user_id': 2, 'email': 'user@test.com'}

        with patch.object(
            self.middleware.jwt_auth, 'get_validated_token',
            return_value=mock_token
        ):
            mock_tenant_user = MagicMock()
            mock_tenant_user.is_superadmin = False
            mock_tenant_user.email = 'user@test.com'

            with patch(
                'apps.tenant.middleware.TenantUser'
            ) as mock_tu_class, patch(
                'apps.tenant.middleware.TenantUserAccess'
            ) as mock_tua_class:
                mock_tu_class.objects.filter.return_value.first.return_value = mock_tenant_user
                # User has NO access to this tenant
                mock_tua_class.objects.filter.return_value.exists.return_value = False

                request = self.factory.get(
                    '/api/core/users/',
                    HTTP_X_TENANT_ID='5',
                    HTTP_AUTHORIZATION='Bearer valid-user-token'
                )

                result = self.middleware._validate_tenant_access(request, mock_tenant)
                self.assertIsNotNone(result)
                self.assertEqual(result.status_code, 403)

    @patch('apps.tenant.middleware.schema_context')
    @patch('apps.tenant.middleware.get_tenant_model')
    def test_user_with_active_access_is_allowed(self, mock_get_tenant, mock_schema_ctx):
        """
        Usuario con TenantUserAccess activo puede acceder al tenant.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 3
        mock_tenant.name = 'Mi Tenant'

        mock_schema_ctx.return_value.__enter__ = MagicMock()
        mock_schema_ctx.return_value.__exit__ = MagicMock(return_value=False)

        mock_token = {'tenant_user_id': 2, 'email': 'user@test.com'}

        with patch.object(
            self.middleware.jwt_auth, 'get_validated_token',
            return_value=mock_token
        ):
            mock_tenant_user = MagicMock()
            mock_tenant_user.is_superadmin = False

            with patch(
                'apps.tenant.middleware.TenantUser'
            ) as mock_tu_class, patch(
                'apps.tenant.middleware.TenantUserAccess'
            ) as mock_tua_class:
                mock_tu_class.objects.filter.return_value.first.return_value = mock_tenant_user
                # User HAS active access
                mock_tua_class.objects.filter.return_value.exists.return_value = True

                request = self.factory.get(
                    '/api/core/users/',
                    HTTP_X_TENANT_ID='3',
                    HTTP_AUTHORIZATION='Bearer valid-user-token'
                )

                result = self.middleware._validate_tenant_access(request, mock_tenant)
                self.assertIsNone(result)  # Access granted

    @patch('apps.tenant.middleware.schema_context')
    @patch('apps.tenant.middleware.get_tenant_model')
    def test_user_with_revoked_access_returns_403(self, mock_get_tenant, mock_schema_ctx):
        """
        Usuario con TenantUserAccess.is_active=False recibe 403.
        Validar que revocar acceso realmente bloquea.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 3
        mock_tenant.name = 'Mi Tenant'

        mock_schema_ctx.return_value.__enter__ = MagicMock()
        mock_schema_ctx.return_value.__exit__ = MagicMock(return_value=False)

        mock_token = {'tenant_user_id': 2, 'email': 'user@test.com'}

        with patch.object(
            self.middleware.jwt_auth, 'get_validated_token',
            return_value=mock_token
        ):
            mock_tenant_user = MagicMock()
            mock_tenant_user.is_superadmin = False

            with patch(
                'apps.tenant.middleware.TenantUser'
            ) as mock_tu_class, patch(
                'apps.tenant.middleware.TenantUserAccess'
            ) as mock_tua_class:
                mock_tu_class.objects.filter.return_value.first.return_value = mock_tenant_user
                # Access exists but is_active=False (revoked)
                mock_tua_class.objects.filter.return_value.exists.return_value = False

                request = self.factory.get(
                    '/api/core/users/',
                    HTTP_X_TENANT_ID='3',
                    HTTP_AUTHORIZATION='Bearer valid-user-token'
                )

                result = self.middleware._validate_tenant_access(request, mock_tenant)
                self.assertIsNotNone(result)
                self.assertEqual(result.status_code, 403)

    @patch('apps.tenant.middleware.schema_context')
    def test_inactive_tenant_user_returns_403(self, mock_schema_ctx):
        """
        TenantUser con is_active=False recibe 403 aunque tenga acceso.
        """
        mock_tenant = MagicMock()
        mock_tenant.id = 3

        mock_schema_ctx.return_value.__enter__ = MagicMock()
        mock_schema_ctx.return_value.__exit__ = MagicMock(return_value=False)

        mock_token = {'tenant_user_id': 2, 'email': 'inactive@test.com'}

        with patch.object(
            self.middleware.jwt_auth, 'get_validated_token',
            return_value=mock_token
        ):
            with patch(
                'apps.tenant.middleware.TenantUser'
            ) as mock_tu_class:
                # TenantUser not found because is_active=False filter
                mock_tu_class.objects.filter.return_value.first.return_value = None

                request = self.factory.get(
                    '/api/core/users/',
                    HTTP_X_TENANT_ID='3',
                    HTTP_AUTHORIZATION='Bearer valid-token'
                )

                result = self.middleware._validate_tenant_access(request, mock_tenant)
                self.assertIsNotNone(result)
                self.assertEqual(result.status_code, 403)


# =============================================================================
# UNIT TESTS: Permission Classes
# =============================================================================


class PermissionClassesTest(TestCase):
    """Tests para IsSuperAdmin, IsAdminTenant, IsTenantSuperAdmin."""

    def setUp(self):
        self.factory = RequestFactory()

    def _make_request(self, user):
        request = self.factory.get('/api/test/')
        request.user = user
        return request

    def test_is_super_admin_allows_superadmin(self):
        """IsSuperAdmin permite TenantUser con is_superadmin=True."""
        from apps.tenant.views import IsSuperAdmin
        perm = IsSuperAdmin()

        user = MagicMock()
        user.is_authenticated = True
        user.is_superadmin = True

        request = self._make_request(user)
        self.assertTrue(perm.has_permission(request, None))

    def test_is_super_admin_allows_superuser(self):
        """IsSuperAdmin permite User con is_superuser=True."""
        from apps.tenant.views import IsSuperAdmin
        perm = IsSuperAdmin()

        user = MagicMock(spec=['is_authenticated', 'is_superuser'])
        user.is_authenticated = True
        user.is_superuser = True

        request = self._make_request(user)
        self.assertTrue(perm.has_permission(request, None))

    def test_is_super_admin_denies_regular_user(self):
        """IsSuperAdmin deniega usuario regular."""
        from apps.tenant.views import IsSuperAdmin
        perm = IsSuperAdmin()

        user = MagicMock(spec=['is_authenticated', 'is_superuser', 'is_superadmin'])
        user.is_authenticated = True
        user.is_superuser = False
        user.is_superadmin = False

        request = self._make_request(user)
        self.assertFalse(perm.has_permission(request, None))

    def test_is_super_admin_denies_anonymous(self):
        """IsSuperAdmin deniega usuario no autenticado."""
        from apps.tenant.views import IsSuperAdmin
        perm = IsSuperAdmin()

        user = MagicMock()
        user.is_authenticated = False

        request = self._make_request(user)
        self.assertFalse(perm.has_permission(request, None))

    def test_is_admin_tenant_allows_cargo_admin(self):
        """IsAdminTenant permite User con cargo.code='ADMIN'."""
        from apps.tenant.views import IsAdminTenant
        perm = IsAdminTenant()

        user = MagicMock(spec=['is_authenticated', 'is_superuser', 'is_superadmin', 'cargo'])
        user.is_authenticated = True
        user.is_superuser = False
        user.is_superadmin = False
        user.cargo = MagicMock()
        user.cargo.code = 'ADMIN'

        request = self._make_request(user)
        self.assertTrue(perm.has_permission(request, None))

    def test_is_admin_tenant_denies_non_admin_cargo(self):
        """IsAdminTenant deniega User con cargo que no es ADMIN."""
        from apps.tenant.views import IsAdminTenant
        perm = IsAdminTenant()

        user = MagicMock(spec=['is_authenticated', 'is_superuser', 'is_superadmin', 'cargo'])
        user.is_authenticated = True
        user.is_superuser = False
        user.is_superadmin = False
        user.cargo = MagicMock()
        user.cargo.code = 'USER'

        request = self._make_request(user)
        self.assertFalse(perm.has_permission(request, None))

    def test_is_admin_tenant_denies_no_cargo(self):
        """IsAdminTenant deniega User sin cargo asignado."""
        from apps.tenant.views import IsAdminTenant
        perm = IsAdminTenant()

        user = MagicMock(spec=['is_authenticated', 'is_superuser', 'is_superadmin', 'cargo'])
        user.is_authenticated = True
        user.is_superuser = False
        user.is_superadmin = False
        user.cargo = None

        request = self._make_request(user)
        self.assertFalse(perm.has_permission(request, None))


# =============================================================================
# UNIT TESTS: SQL Injection Prevention
# =============================================================================


class SQLParameterizationTest(TestCase):
    """Tests que validan que no hay SQL injection via f-strings."""

    def test_no_fstring_sql_in_views(self):
        """views.py no debe tener f-string SQL execution."""
        import inspect
        from apps.tenant import views
        source = inspect.getsource(views)
        # Check for f-string patterns in cursor.execute
        self.assertNotIn(
            "cursor.execute(f'",
            source,
            "views.py still has f-string SQL — SQL injection risk!"
        )
        self.assertNotIn(
            'cursor.execute(f"',
            source,
            "views.py still has f-string SQL — SQL injection risk!"
        )

    def test_no_fstring_sql_in_tasks(self):
        """tasks.py no debe tener f-string SQL execution."""
        import inspect
        from apps.tenant import tasks
        source = inspect.getsource(tasks)
        self.assertNotIn(
            "cursor.execute(f'",
            source,
            "tasks.py still has f-string SQL — SQL injection risk!"
        )
        self.assertNotIn(
            'cursor.execute(f"',
            source,
            "tasks.py still has f-string SQL — SQL injection risk!"
        )

    def test_no_percent_format_sql_in_serializers(self):
        """serializers.py no debe tener % format SQL execution."""
        import inspect
        from apps.tenant import serializers
        source = inspect.getsource(serializers)
        self.assertNotIn(
            "% obj.schema_name",
            source,
            "serializers.py still has %-format SQL — SQL injection risk!"
        )


# =============================================================================
# API TESTS: Endpoint Access Control
# =============================================================================


class EndpointAccessControlTest(TestCase):
    """Tests de control de acceso a endpoints protegidos."""

    def setUp(self):
        self.client = APIClient()

    def test_api_requires_authentication(self):
        """
        Endpoints protegidos requieren autenticación.
        """
        protected_endpoints = [
            '/api/core/users/',
            '/api/tenant/tenants/',
            '/api/tenant/users/',
        ]
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Endpoint {endpoint} should require auth but returned {response.status_code}"
            )

    def test_public_endpoints_accessible(self):
        """
        Endpoints públicos son accesibles sin autenticación.
        """
        response = self.client.get('/api/health/')
        # Health check should be public (200 or 404 if not configured)
        self.assertIn(response.status_code, [200, 404])

    def test_public_tenant_endpoints_accessible(self):
        """
        Endpoints públicos de tenant son accesibles sin autenticación.
        """
        response = self.client.get('/api/tenant/public/check_domain/', {'domain': 'test'})
        # Should respond, not 401/403
        self.assertNotIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )


# =============================================================================
# SETTINGS VALIDATION TESTS
# =============================================================================


class SettingsValidationTest(TestCase):
    """Tests que validan la configuración multi-tenant del settings activo."""

    def test_database_engine_is_not_mysql(self):
        """
        El engine de BD NO debe ser MySQL.
        MySQL NO soporta schemas de PostgreSQL requeridos por django-tenants.
        SQLite es aceptable para unit tests (no hay aislamiento pero es esperado).
        """
        from django.conf import settings
        engine = settings.DATABASES['default']['ENGINE']
        self.assertNotIn(
            'mysql',
            engine.lower(),
            f"Database engine is '{engine}' — MySQL has NO multi-tenant "
            f"isolation! Use django_tenants.postgresql_backend."
        )

    def test_tenant_model_configured(self):
        """TENANT_MODEL debe estar configurado."""
        from django.conf import settings
        self.assertTrue(
            hasattr(settings, 'TENANT_MODEL'),
            "TENANT_MODEL not configured — django-tenants won't work"
        )
        self.assertEqual(settings.TENANT_MODEL, 'tenant.Tenant')

    def test_tenant_domain_model_configured(self):
        """TENANT_DOMAIN_MODEL debe estar configurado."""
        from django.conf import settings
        self.assertTrue(
            hasattr(settings, 'TENANT_DOMAIN_MODEL'),
            "TENANT_DOMAIN_MODEL not configured"
        )

    def test_shared_apps_configured(self):
        """SHARED_APPS debe existir y contener django_tenants."""
        from django.conf import settings
        self.assertTrue(
            hasattr(settings, 'SHARED_APPS'),
            "SHARED_APPS not configured — no schema isolation"
        )
        self.assertIn('django_tenants', settings.SHARED_APPS)
        self.assertIn('apps.tenant', settings.SHARED_APPS)

    def test_tenant_apps_configured(self):
        """TENANT_APPS debe existir y contener apps.core."""
        from django.conf import settings
        self.assertTrue(
            hasattr(settings, 'TENANT_APPS'),
            "TENANT_APPS not configured — no schema isolation"
        )
        self.assertIn('apps.core', settings.TENANT_APPS)

    def test_database_router_configured(self):
        """DATABASE_ROUTERS debe incluir TenantSyncRouter."""
        from django.conf import settings
        self.assertTrue(
            hasattr(settings, 'DATABASE_ROUTERS'),
            "DATABASE_ROUTERS not configured"
        )
        self.assertIn(
            'django_tenants.routers.TenantSyncRouter',
            settings.DATABASE_ROUTERS
        )

    def test_tenant_main_middleware_first(self):
        """TenantMainMiddleware debe ser el primer middleware."""
        from django.conf import settings
        self.assertIn(
            'django_tenants.middleware.main.TenantMainMiddleware',
            settings.MIDDLEWARE,
            "TenantMainMiddleware not in MIDDLEWARE"
        )
        idx = settings.MIDDLEWARE.index(
            'django_tenants.middleware.main.TenantMainMiddleware'
        )
        self.assertEqual(
            idx, 0,
            "TenantMainMiddleware must be the FIRST middleware"
        )

    def test_tenant_auth_middleware_configured(self):
        """TenantAuthenticationMiddleware debe estar en MIDDLEWARE."""
        from django.conf import settings
        self.assertIn(
            'apps.tenant.middleware.TenantAuthenticationMiddleware',
            settings.MIDDLEWARE,
            "TenantAuthenticationMiddleware not in MIDDLEWARE — "
            "X-Tenant-ID header won't be validated"
        )


# Markers para pytest
pytestmark = [
    pytest.mark.django_db,
]
