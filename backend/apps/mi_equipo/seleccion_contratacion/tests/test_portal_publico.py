"""
Tests para el portal publico de vacantes y branding.

Verifica:
- GET /api/mi-equipo/seleccion/vacantes-publicas/ (AllowAny)
- GET /api/mi-equipo/seleccion/vacantes-publicas/{id}/
- GET /api/mi-equipo/seleccion/vacantes-publicas/empresa-info/
- POST /api/mi-equipo/seleccion/vacantes-publicas/{id}/postular/ (rate limited)
- GET /api/tenant/public/branding/ (AllowAny)

Fixtures heredadas del root conftest.py:
    - api_client: APIClient sin auth + HTTP_HOST tenant (resuelve schema)
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestVacantesPublicasEndpoint:
    """Tests para GET /api/mi-equipo/seleccion/vacantes-publicas/"""

    URL = '/api/mi-equipo/seleccion/vacantes-publicas/'

    def test_vacantes_publicas_allows_anonymous_access(self, api_client):
        """Vacantes publicas deben permitir acceso anonimo (AllowAny)."""
        response = api_client.get(self.URL)
        # 200 OK (even if empty list)
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_returns_list(self, api_client):
        """El endpoint debe retornar una lista (posiblemente vacia)."""
        response = api_client.get(self.URL)
        data = response.data
        # Could be paginated (results key) or plain list
        if isinstance(data, dict) and 'results' in data:
            assert isinstance(data['results'], list)
        else:
            assert isinstance(data, list)

    def test_vacantes_publicas_empty_when_no_data(self, api_client):
        """Sin vacantes publicadas, debe retornar lista vacia."""
        response = api_client.get(self.URL)
        data = response.data
        results = data.get('results', data) if isinstance(data, dict) else data
        assert len(results) == 0

    def test_vacantes_publicas_accepts_search_param(self, api_client):
        """El endpoint debe aceptar parametro de busqueda."""
        response = api_client.get(self.URL, {'search': 'desarrollador'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_accepts_modalidad_filter(self, api_client):
        """El endpoint debe aceptar filtro de modalidad."""
        response = api_client.get(self.URL, {'modalidad': 'presencial'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_publicas_accepts_ubicacion_filter(self, api_client):
        """El endpoint debe aceptar filtro de ubicacion."""
        response = api_client.get(self.URL, {'ubicacion': 'Bogota'})
        assert response.status_code == status.HTTP_200_OK

    def test_vacantes_detail_returns_404_for_nonexistent(self, api_client):
        """Detalle de vacante inexistente debe retornar 404."""
        response = api_client.get(f'{self.URL}99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestEmpresaInfoEndpoint:
    """Tests para GET /api/mi-equipo/seleccion/vacantes-publicas/empresa-info/"""

    URL = '/api/mi-equipo/seleccion/vacantes-publicas/empresa-info/'

    def test_empresa_info_allows_anonymous(self, api_client):
        """El endpoint de info empresa debe permitir acceso anonimo."""
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK

    def test_empresa_info_returns_nombre(self, api_client):
        """La respuesta debe incluir el nombre de la empresa."""
        response = api_client.get(self.URL)
        data = response.data
        assert 'nombre' in data

    def test_empresa_info_returns_logo_url(self, api_client):
        """La respuesta debe incluir logo_url (puede ser null)."""
        response = api_client.get(self.URL)
        data = response.data
        assert 'logo_url' in data


@pytest.mark.django_db
class TestPostulacionPublicaEndpoint:
    """Tests para POST /api/mi-equipo/seleccion/vacantes-publicas/{id}/postular/"""

    def _get_url(self, vacante_id):
        return f'/api/mi-equipo/seleccion/vacantes-publicas/{vacante_id}/postular/'

    def test_postulacion_requires_valid_vacante(self, api_client):
        """Postulacion a vacante inexistente debe retornar error."""
        response = api_client.post(
            self._get_url(99999),
            {
                'nombre_completo': 'Juan Perez',
                'numero_documento': '1234567890',
                'email': 'juan@example.com',
            },
            format='multipart',
        )
        # 400 (invalid vacante), 404 (not found), or 429 (rate limited by PostulacionThrottle)
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_429_TOO_MANY_REQUESTS,
        ]

    def test_postulacion_rejects_get_method(self, api_client):
        """El endpoint solo acepta POST, no GET."""
        response = api_client.get(self._get_url(1))
        # 405 (method not allowed) or 429 (throttle responds first)
        assert response.status_code in [
            status.HTTP_405_METHOD_NOT_ALLOWED,
            status.HTTP_429_TOO_MANY_REQUESTS,
        ]


@pytest.mark.django_db
class TestPublicBrandingEndpoint:
    """Tests para GET /api/tenant/public/branding/"""

    URL = '/api/tenant/public/branding/'

    def test_branding_allows_anonymous_access(self, api_client):
        """Branding publico debe permitir acceso anonimo."""
        response = api_client.get(self.URL)
        # 200 OK, 400 (missing tenant config), or 404 (no branding configured)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_branding_returns_json(self, api_client):
        """El endpoint debe retornar JSON."""
        response = api_client.get(self.URL)
        if response.status_code == 200:
            assert 'application/json' in response['Content-Type']

    def test_branding_rejects_post(self, api_client):
        """El endpoint solo acepta GET."""
        response = api_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
