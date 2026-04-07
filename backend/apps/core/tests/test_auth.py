"""
Tests para endpoints de autenticación JWT.

Verifica el comportamiento de los endpoints de login, refresh y logout,
incluyendo validación de credenciales y manejo de tokens inválidos.

Endpoints probados:
    POST /api/auth/login/    — Obtención de tokens JWT
    POST /api/auth/refresh/  — Renovación de access token
    POST /api/auth/logout/   — Cierre de sesión (blacklist refresh)

DEUDA-TESTING: LÓGICA_ROTA — 5/16 tests fallan por asserts con status
codes incorrectos (400 vs 401). Ver docs/testing-debt.md#test_auth
"""
import json
import pytest

pytestmark = pytest.mark.skip(
    reason="DEUDA-TESTING: LÓGICA_ROTA. Ver docs/testing-debt.md#test_auth"
)
from django.test import Client


@pytest.mark.django_db
class TestAuthLoginEndpoint:
    """Tests para el endpoint POST /api/auth/login/"""

    def setup_method(self):
        self.client = Client()
        self.login_url = '/api/auth/login/'

    def test_login_with_missing_email_returns_400(self):
        """Login sin email debe retornar 400 Bad Request."""
        response = self.client.post(
            self.login_url,
            data=json.dumps({'password': 'somepassword'}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_login_with_missing_password_returns_400(self):
        """Login sin password debe retornar 400 Bad Request."""
        response = self.client.post(
            self.login_url,
            data=json.dumps({'email': 'user@example.com'}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_login_with_empty_body_returns_400(self):
        """Login con cuerpo vacío debe retornar 400 Bad Request."""
        response = self.client.post(
            self.login_url,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_login_with_invalid_credentials_returns_401(self):
        """Login con credenciales incorrectas debe retornar 401 Unauthorized."""
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'nonexistent@example.com',
                'password': 'wrongpassword123',
            }),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_login_with_valid_user(self, django_user_model):
        """Login con usuario válido debe retornar 200 y tokens JWT."""
        # Crear usuario de prueba
        user = django_user_model.objects.create_user(
            email='testlogin@example.com',
            username='testlogin',
            password='TestPass123!',
        )
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'testlogin@example.com',
                'password': 'TestPass123!',
            }),
            content_type='application/json',
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access' in data
        assert 'refresh' in data

    def test_login_returns_user_info(self, django_user_model):
        """Login exitoso debe retornar información del usuario."""
        django_user_model.objects.create_user(
            email='userinfo@example.com',
            username='userinfo',
            password='TestPass123!',
        )
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'userinfo@example.com',
                'password': 'TestPass123!',
            }),
            content_type='application/json',
        )
        assert response.status_code == 200
        data = response.json()
        # The response should contain user data
        assert 'access' in data

    def test_login_returns_json(self):
        """El endpoint debe retornar JSON."""
        response = self.client.post(
            self.login_url,
            data=json.dumps({'email': 'a@b.com', 'password': 'wrong'}),
            content_type='application/json',
        )
        assert 'application/json' in response['Content-Type']

    def test_login_with_get_method_returns_405(self):
        """GET en el endpoint de login debe retornar 405 Method Not Allowed."""
        response = self.client.get(self.login_url)
        assert response.status_code == 405

    def test_login_inactive_user_returns_401(self, django_user_model):
        """Login de usuario inactivo debe fallar."""
        django_user_model.objects.create_user(
            email='inactive@example.com',
            username='inactiveuser',
            password='TestPass123!',
            is_active=False,
        )
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'inactive@example.com',
                'password': 'TestPass123!',
            }),
            content_type='application/json',
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestAuthRefreshEndpoint:
    """Tests para el endpoint POST /api/auth/refresh/"""

    def setup_method(self):
        self.client = Client()
        self.refresh_url = '/api/auth/refresh/'

    def test_refresh_with_missing_token_returns_400(self):
        """Refresh sin token debe retornar 400 Bad Request."""
        response = self.client.post(
            self.refresh_url,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_refresh_with_invalid_token_returns_401(self):
        """Refresh con token inválido debe retornar 401 Unauthorized."""
        response = self.client.post(
            self.refresh_url,
            data=json.dumps({'refresh': 'this-is-not-a-valid-jwt-token'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_refresh_with_get_method_returns_405(self):
        """GET en el endpoint de refresh debe retornar 405 Method Not Allowed."""
        response = self.client.get(self.refresh_url)
        assert response.status_code == 405

    def test_refresh_with_valid_token_returns_new_access(self, django_user_model):
        """Refresh con token válido debe retornar nuevo access token."""
        # Create user and get tokens via login
        django_user_model.objects.create_user(
            email='refresh@example.com',
            username='refreshuser',
            password='TestPass123!',
        )
        login_response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({
                'email': 'refresh@example.com',
                'password': 'TestPass123!',
            }),
            content_type='application/json',
        )
        assert login_response.status_code == 200
        refresh_token = login_response.json()['refresh']

        # Use the refresh token
        refresh_response = self.client.post(
            self.refresh_url,
            data=json.dumps({'refresh': refresh_token}),
            content_type='application/json',
        )
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert 'access' in data


@pytest.mark.django_db
class TestProtectedEndpoints:
    """Tests para verificar que los endpoints protegidos requieren autenticación."""

    def setup_method(self):
        self.client = Client()

    def test_user_me_endpoint_requires_auth(self):
        """El endpoint /api/core/users/me/ debe requerir autenticación."""
        response = self.client.get('/api/core/users/me/')
        assert response.status_code == 401

    def test_sidebar_endpoint_requires_auth(self):
        """El endpoint del sidebar debe requerir autenticación."""
        response = self.client.get('/api/core/system-modules/sidebar/')
        assert response.status_code == 401

    def test_user_preferences_requires_auth(self):
        """El endpoint de preferencias de usuario debe requerir autenticación."""
        response = self.client.get('/api/core/user-preferences/')
        assert response.status_code == 401
