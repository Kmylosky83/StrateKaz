"""
Tests para los endpoints de IA.

Verifica el control de acceso, validación de request bodies,
y respuestas de los endpoints de ayuda contextual y asistencia de texto.

Endpoints probados:
    GET  /api/ia/status/          — Estado de disponibilidad de IA
    GET  /api/ia/usage-stats/     — Estadísticas de uso de IA
    POST /api/ia/context-help/    — Ayuda contextual
    POST /api/ia/text-assist/     — Asistente de texto
"""
import json
import pytest
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def authenticated_client(django_user_model):
    """
    Fixture que retorna un Client autenticado con JWT Bearer token.
    Crea un usuario de prueba y genera tokens JWT válidos.
    """
    user = django_user_model.objects.create_user(
        email='ia_test@example.com',
        username='ia_test_user',
        password='TestPass123!',
    )
    client = Client()
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    return client, user


@pytest.mark.django_db
class TestIAStatusEndpoint:
    """Tests para GET /api/ia/status/"""

    def setup_method(self):
        self.client = Client()
        self.url = '/api/ia/status/'

    def test_status_requires_authentication(self):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = self.client.get(self.url)
        assert response.status_code == 401

    def test_status_returns_json(self, authenticated_client):
        """El endpoint debe retornar JSON válido cuando autenticado."""
        client, _ = authenticated_client
        response = client.get(self.url)
        assert response.status_code == 200
        assert 'application/json' in response['Content-Type']

    def test_status_response_has_available_field(self, authenticated_client):
        """La respuesta debe contener el campo 'available'."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()
        assert 'available' in data
        assert isinstance(data['available'], bool)

    def test_status_response_has_message_field(self, authenticated_client):
        """La respuesta debe contener el campo 'message'."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()
        assert 'message' in data
        assert isinstance(data['message'], str)

    def test_status_rejects_post_method(self, authenticated_client):
        """El endpoint solo acepta GET, no POST."""
        client, _ = authenticated_client
        response = client.post(self.url, data=json.dumps({}), content_type='application/json')
        assert response.status_code == 405


@pytest.mark.django_db
class TestIAUsageStatsEndpoint:
    """Tests para GET /api/ia/usage-stats/"""

    def setup_method(self):
        self.client = Client()
        self.url = '/api/ia/usage-stats/'

    def test_usage_stats_requires_authentication(self):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = self.client.get(self.url)
        assert response.status_code == 401

    def test_usage_stats_returns_200_when_authenticated(self, authenticated_client):
        """El endpoint debe retornar 200 cuando el usuario está autenticado."""
        client, _ = authenticated_client
        response = client.get(self.url)
        assert response.status_code == 200

    def test_usage_stats_response_structure(self, authenticated_client):
        """La respuesta debe tener la estructura correcta con today, month, by_action."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()

        assert 'today' in data
        assert 'month' in data
        assert 'by_action' in data
        assert 'by_provider' in data
        assert 'recent' in data

    def test_usage_stats_today_has_calls_and_limit(self, authenticated_client):
        """La sección 'today' debe tener 'calls', 'limit' y 'remaining'."""
        client, _ = authenticated_client
        response = client.get(self.url)
        today = response.json()['today']

        assert 'calls' in today
        assert 'limit' in today
        assert 'remaining' in today

    def test_usage_stats_new_user_has_zero_calls(self, authenticated_client):
        """Usuario nuevo debe tener 0 llamadas registradas."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()

        assert data['today']['calls'] == 0
        assert data['month']['calls'] == 0

    def test_usage_stats_recent_is_list(self, authenticated_client):
        """El campo 'recent' debe ser una lista."""
        client, _ = authenticated_client
        response = client.get(self.url)
        assert isinstance(response.json()['recent'], list)


@pytest.mark.django_db
class TestIAContextHelpEndpoint:
    """Tests para POST /api/ia/context-help/"""

    def setup_method(self):
        self.client = Client()
        self.url = '/api/ia/context-help/'

    def test_context_help_requires_authentication(self):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = self.client.post(
            self.url,
            data=json.dumps({'module_code': 'planeacion_estrategica'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_context_help_requires_module_code(self, authenticated_client):
        """El endpoint debe validar que module_code esté presente."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_context_help_with_valid_module_returns_200_or_429(self, authenticated_client):
        """Con módulo válido, debe retornar 200 o 429 si cuota excedida."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({'module_code': 'planeacion_estrategica'}),
            content_type='application/json',
        )
        # 200 OK (IA available or static fallback), 429 quota exceeded
        assert response.status_code in [200, 429]

    def test_context_help_rejects_get_method(self):
        """El endpoint solo acepta POST."""
        response = self.client.get(self.url)
        assert response.status_code in [401, 405]


@pytest.mark.django_db
class TestIATextAssistEndpoint:
    """Tests para POST /api/ia/text-assist/"""

    def setup_method(self):
        self.client = Client()
        self.url = '/api/ia/text-assist/'

    def test_text_assist_requires_authentication(self):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = self.client.post(
            self.url,
            data=json.dumps({'text': 'Mejorar este texto', 'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_text_assist_requires_text_field(self, authenticated_client):
        """El endpoint debe validar que 'text' esté presente."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_text_assist_with_valid_payload(self, authenticated_client):
        """Con payload válido debe retornar 200 o 429 (cuota)."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'text': 'Este es el texto que quiero mejorar.',
                'action': 'improve',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_text_assist_rejects_get_method(self):
        """El endpoint solo acepta POST."""
        response = self.client.get(self.url)
        assert response.status_code in [401, 405]

    def test_text_assist_with_empty_text_returns_400(self, authenticated_client):
        """Texto vacío debe retornar error de validación."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({'text': '', 'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 400
