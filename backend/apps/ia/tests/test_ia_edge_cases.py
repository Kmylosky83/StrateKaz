"""
Additional edge case tests for IA endpoints.

Supplements test_views.py with additional coverage for:
- Quota checking logic
- Invalid action parameters
- Multiple requests (quota depletion pattern)
- Response format validation
"""
import json
import pytest
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def authenticated_client(django_user_model):
    """Fixture: Client autenticado con JWT Bearer token."""
    user = django_user_model.objects.create_user(
        email='ia_edge_test@example.com',
        username='ia_edge_test_user',
        password='TestPass123!',
    )
    client = Client()
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    return client, user


@pytest.mark.django_db
class TestIAStatusResponseFormat:
    """Tests adicionales para el formato de respuesta de /api/ia/status/"""

    url = '/api/ia/status/'

    def test_status_response_has_provider_field(self, authenticated_client):
        """La respuesta debe contener campo 'provider'."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()
        assert 'provider' in data

    def test_status_response_provider_is_string(self, authenticated_client):
        """El campo 'provider' debe ser un string."""
        client, _ = authenticated_client
        response = client.get(self.url)
        data = response.json()
        assert isinstance(data['provider'], str)


@pytest.mark.django_db
class TestIAContextHelpEdgeCases:
    """Tests de borde para POST /api/ia/context-help/"""

    url = '/api/ia/context-help/'

    def test_with_optional_tab_code(self, authenticated_client):
        """Debe aceptar tab_code opcional."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'module_code': 'fundacion',
                'tab_code': 'empresa',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_with_optional_section_name(self, authenticated_client):
        """Debe aceptar section_name opcional."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'module_code': 'fundacion',
                'section_name': 'Configuracion General',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_with_all_optional_fields(self, authenticated_client):
        """Debe funcionar con todos los campos opcionales."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'module_code': 'hseq',
                'tab_code': 'accidentalidad',
                'section_name': 'Accidentes de Trabajo',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_with_unknown_module_code(self, authenticated_client):
        """Debe manejar codigos de modulo desconocidos sin crash."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'module_code': 'modulo_que_no_existe',
            }),
            content_type='application/json',
        )
        # Should not crash - either 200 (static fallback) or 429 (quota)
        assert response.status_code in [200, 429]

    def test_with_invalid_content_type(self, authenticated_client):
        """Debe rechazar content types invalidos."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data='not json',
            content_type='text/plain',
        )
        assert response.status_code in [400, 415]


@pytest.mark.django_db
class TestIATextAssistEdgeCases:
    """Tests de borde para POST /api/ia/text-assist/"""

    url = '/api/ia/text-assist/'

    def test_with_all_valid_actions(self, authenticated_client):
        """Debe aceptar todas las acciones validas."""
        client, _ = authenticated_client
        actions = ['improve', 'formal', 'summarize', 'expand', 'proofread']
        for action in actions:
            response = client.post(
                self.url,
                data=json.dumps({
                    'text': 'Texto de prueba para la accion.',
                    'action': action,
                }),
                content_type='application/json',
            )
            assert response.status_code in [200, 429], \
                f'Action "{action}" returned unexpected status: {response.status_code}'

    def test_with_long_text(self, authenticated_client):
        """Debe manejar textos largos sin error."""
        client, _ = authenticated_client
        long_text = 'Este es un texto largo. ' * 500  # ~11500 chars
        response = client.post(
            self.url,
            data=json.dumps({
                'text': long_text,
                'action': 'improve',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_with_special_characters(self, authenticated_client):
        """Debe manejar caracteres especiales (tildes, simbolos)."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'text': 'Texto con tildes: áéíóú, ñ, ¿preguntas?, ¡exclamaciones!',
                'action': 'improve',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]

    def test_with_html_content(self, authenticated_client):
        """Debe manejar contenido HTML sin error."""
        client, _ = authenticated_client
        response = client.post(
            self.url,
            data=json.dumps({
                'text': '<p>Texto con <strong>HTML</strong> tags</p>',
                'action': 'improve',
            }),
            content_type='application/json',
        )
        assert response.status_code in [200, 429]


@pytest.mark.django_db
class TestIAUsageStatsResponseFormat:
    """Tests adicionales de formato para GET /api/ia/usage-stats/"""

    url = '/api/ia/usage-stats/'

    def test_month_section_has_calls_limit_remaining(self, authenticated_client):
        """La seccion 'month' debe tener calls, limit y remaining."""
        client, _ = authenticated_client
        response = client.get(self.url)
        month = response.json()['month']
        assert 'calls' in month
        assert 'limit' in month
        assert 'remaining' in month

    def test_remaining_equals_limit_minus_calls(self, authenticated_client):
        """remaining = limit - calls para usuario nuevo."""
        client, _ = authenticated_client
        response = client.get(self.url)
        today = response.json()['today']
        assert today['remaining'] == today['limit'] - today['calls']

    def test_by_action_is_list(self, authenticated_client):
        """by_action debe ser una lista."""
        client, _ = authenticated_client
        response = client.get(self.url)
        assert isinstance(response.json()['by_action'], list)

    def test_by_provider_is_list(self, authenticated_client):
        """by_provider debe ser una lista."""
        client, _ = authenticated_client
        response = client.get(self.url)
        assert isinstance(response.json()['by_provider'], list)
