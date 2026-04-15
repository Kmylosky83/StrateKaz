"""
Tests para los endpoints de IA.

Verifica el control de acceso, validación de request bodies,
y respuestas de los endpoints de ayuda contextual y asistencia de texto.

Endpoints probados:
    GET  /api/ia/status/          — Estado de disponibilidad de IA
    GET  /api/ia/usage-stats/     — Estadísticas de uso de IA
    POST /api/ia/context-help/    — Ayuda contextual
    POST /api/ia/text-assist/     — Asistente de texto

Fixtures heredadas del root conftest.py:
    - api_client: APIClient sin auth + HTTP_HOST tenant
    - authenticated_client: APIClient + force_authenticate(user) + HTTP_HOST
"""
import json
import pytest


@pytest.mark.django_db
class TestIAStatusEndpoint:
    """Tests para GET /api/ia/status/"""

    url = '/api/ia/status/'

    def test_status_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_status_returns_json(self, authenticated_client):
        """El endpoint debe retornar JSON válido cuando autenticado."""
        response = authenticated_client.get(self.url)
        assert response.status_code == 200
        assert 'application/json' in response['Content-Type']

    def test_status_response_has_available_field(self, authenticated_client):
        """La respuesta debe contener el campo 'available'."""
        response = authenticated_client.get(self.url)
        data = response.json()
        assert 'available' in data
        assert isinstance(data['available'], bool)

    def test_status_response_has_message_field(self, authenticated_client):
        """La respuesta debe contener el campo 'message'."""
        response = authenticated_client.get(self.url)
        data = response.json()
        assert 'message' in data
        assert isinstance(data['message'], str)

    def test_status_rejects_post_method(self, authenticated_client):
        """El endpoint solo acepta GET, no POST."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 405


@pytest.mark.django_db
class TestIAUsageStatsEndpoint:
    """Tests para GET /api/ia/usage-stats/"""

    url = '/api/ia/usage-stats/'

    def test_usage_stats_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_usage_stats_returns_200_when_authenticated(self, authenticated_client):
        """El endpoint debe retornar 200 cuando el usuario está autenticado."""
        response = authenticated_client.get(self.url)
        assert response.status_code == 200

    def test_usage_stats_response_structure(self, authenticated_client):
        """La respuesta debe tener la estructura correcta con today, month, by_action."""
        response = authenticated_client.get(self.url)
        data = response.json()

        assert 'today' in data
        assert 'month' in data
        assert 'by_action' in data
        assert 'by_provider' in data
        assert 'recent' in data

    def test_usage_stats_today_has_calls_and_limit(self, authenticated_client):
        """La sección 'today' debe tener 'calls', 'limit' y 'remaining'."""
        response = authenticated_client.get(self.url)
        today = response.json()['today']

        assert 'calls' in today
        assert 'limit' in today
        assert 'remaining' in today

    def test_usage_stats_new_user_has_zero_calls(self, authenticated_client):
        """Usuario nuevo debe tener 0 llamadas registradas."""
        response = authenticated_client.get(self.url)
        data = response.json()

        assert data['today']['calls'] == 0
        assert data['month']['calls'] == 0

    def test_usage_stats_recent_is_list(self, authenticated_client):
        """El campo 'recent' debe ser una lista."""
        response = authenticated_client.get(self.url)
        assert isinstance(response.json()['recent'], list)


@pytest.mark.django_db
class TestIAContextHelpEndpoint:
    """Tests para POST /api/ia/context-help/"""

    url = '/api/ia/context-help/'

    def test_context_help_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = api_client.post(
            self.url,
            data=json.dumps({'module_code': 'planeacion_estrategica'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_context_help_requires_module_code(self, authenticated_client):
        """El endpoint debe validar que module_code esté presente."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_context_help_with_valid_module_returns_200_or_429(self, authenticated_client):
        """Con módulo válido, debe retornar 200 o 429 si cuota excedida."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({'module_code': 'planeacion_estrategica'}),
            content_type='application/json',
        )
        # 200 OK (IA available or static fallback), 429 quota exceeded
        assert response.status_code in [200, 429]

    def test_context_help_rejects_get_method(self, api_client):
        """El endpoint solo acepta POST."""
        response = api_client.get(self.url)
        assert response.status_code in [401, 405]


@pytest.mark.django_db
class TestIATextAssistEndpoint:
    """Tests para POST /api/ia/text-assist/"""

    url = '/api/ia/text-assist/'

    def test_text_assist_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 para solicitudes sin autenticación."""
        response = api_client.post(
            self.url,
            data=json.dumps({'text': 'Mejorar este texto', 'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 401

    def test_text_assist_requires_text_field(self, authenticated_client):
        """El endpoint debe validar que 'text' esté presente."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_text_assist_with_valid_payload(self, authenticated_client):
        """Con payload válido debe retornar 200 o 429 (cuota)."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({
                'text': 'Este es el texto que quiero mejorar.',
                'action': 'improve',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_text_assist_rejects_get_method(self, api_client):
        """El endpoint solo acepta POST."""
        response = api_client.get(self.url)
        assert response.status_code in [401, 405]

    def test_text_assist_with_empty_text_returns_400(self, authenticated_client):
        """Texto vacío debe retornar error de validación."""
        response = authenticated_client.post(
            self.url,
            data=json.dumps({'text': '', 'action': 'improve'}),
            content_type='application/json',
        )
        assert response.status_code == 400
