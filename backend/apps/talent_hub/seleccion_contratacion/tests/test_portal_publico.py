"""
Tests para el portal publico de vacantes y branding.

Verifica:
- GET /api/talent-hub/seleccion/vacantes-publicas/ (AllowAny)
- GET /api/talent-hub/seleccion/vacantes-publicas/{id}/
- GET /api/talent-hub/seleccion/vacantes-publicas/empresa-info/
- POST /api/talent-hub/seleccion/vacantes-publicas/{id}/postular/ (rate limited)
- GET /api/tenant/public/branding/ (AllowAny)
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def anon_client():
    """Cliente API sin autenticacion (acceso anonimo)."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Usuario de prueba para autenticacion."""
    return User.objects.create_user(
        username='portal_test_user',
        email='portal@example.com',
        password='TestPass123!',
    )


@pytest.fixture
def auth_client(test_user):
    """Cliente API autenticado."""
    client = APIClient()
    client.force_authenticate(user=test_user)
    return client


@pytest.mark.django_db
class TestVacantesPublicasEndpoint:
    """Tests para GET /api/talent-hub/seleccion/vacantes-publicas/"""

    URL = '/api/talent-hub/seleccion/vacantes-publicas/'

    def test_vacantes_publicas_allows_anonymous_access(self, anon_client):
        """Vacantes publicas deben permitir acceso anonimo (AllowAny)."""
        response = anon_client.get(self.URL)
        # 200 OK (even if empty list)
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_returns_list(self, anon_client):
        """El endpoint debe retornar una lista (posiblemente vacia)."""
        response = anon_client.get(self.URL)
        data = response.data
        # Could be paginated (results key) or plain list
        if isinstance(data, dict) and 'results' in data:
            assert isinstance(data['results'], list)
        else:
            assert isinstance(data, list)

    def test_vacantes_publicas_empty_when_no_data(self, anon_client):
        """Sin vacantes publicadas, debe retornar lista vacia."""
        response = anon_client.get(self.URL)
        data = response.data
        results = data.get('results', data) if isinstance(data, dict) else data
        assert len(results) == 0

    def test_vacantes_publicas_accepts_search_param(self, anon_client):
        """El endpoint debe aceptar parametro de busqueda."""
        response = anon_client.get(self.URL, {'search': 'desarrollador'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_accepts_modalidad_filter(self, anon_client):
        """El endpoint debe aceptar filtro de modalidad."""
        response = anon_client.get(self.URL, {'modalidad': 'presencial'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_accepts_ubicacion_filter(self, anon_client):
        """El endpoint debe aceptar filtro de ubicacion."""
        response = anon_client.get(self.URL, {'ubicacion': 'Bogota'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_detail_returns_404_for_nonexistent(self, anon_client):
        """Detalle de vacante inexistente debe retornar 404."""
        response = anon_client.get(f'{self.URL}99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestEmpresaInfoEndpoint:
    """Tests para GET /api/talent-hub/seleccion/vacantes-publicas/empresa-info/"""

    URL = '/api/talent-hub/seleccion/vacantes-publicas/empresa-info/'

    def test_empresa_info_allows_anonymous(self, anon_client):
        """El endpoint de info empresa debe permitir acceso anonimo."""
        response = anon_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK

    def test_empresa_info_returns_nombre(self, anon_client):
        """La respuesta debe incluir el nombre de la empresa."""
        response = anon_client.get(self.URL)
        data = response.data
        assert 'nombre' in data

    def test_empresa_info_returns_logo_url(self, anon_client):
        """La respuesta debe incluir logo_url (puede ser null)."""
        response = anon_client.get(self.URL)
        data = response.data
        assert 'logo_url' in data


@pytest.mark.django_db
class TestPostulacionPublicaEndpoint:
    """Tests para POST /api/talent-hub/seleccion/vacantes-publicas/{id}/postular/"""

    def _get_url(self, vacante_id):
        return f'/api/talent-hub/seleccion/vacantes-publicas/{vacante_id}/postular/'

    def test_postulacion_requires_valid_vacante(self, anon_client):
        """Postulacion a vacante inexistente debe retornar error."""
        response = anon_client.post(
            self._get_url(99999),
            {
                'nombre_completo': 'Juan Perez',
                'numero_documento': '1234567890',
                'email': 'juan@example.com',
            },
            format='multipart',
        )
        # Should get 400 (invalid vacante) or 404
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_postulacion_rejects_get_method(self, anon_client):
        """El endpoint solo acepta POST, no GET."""
        response = anon_client.get(self._get_url(1))
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.django_db
class TestPublicBrandingEndpoint:
    """Tests para GET /api/tenant/public/branding/"""

    URL = '/api/tenant/public/branding/'

    def test_branding_allows_anonymous_access(self, anon_client):
        """Branding publico debe permitir acceso anonimo."""
        response = anon_client.get(self.URL)
        # 200 OK or 404 (no branding configured yet)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_branding_returns_json(self, anon_client):
        """El endpoint debe retornar JSON."""
        response = anon_client.get(self.URL)
        if response.status_code == 200:
            assert 'application/json' in response['Content-Type']

    def test_branding_rejects_post(self, anon_client):
        """El endpoint solo acepta GET."""
        response = anon_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
