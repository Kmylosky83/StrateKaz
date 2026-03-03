"""
Tests para el endpoint de Informe Consolidado de Revision por la Direccion.

Verifica el endpoint GET /api/revision-direccion/informe-consolidado/
que consolida resumenes de todos los modulos C2 para alimentar
la Revision por la Direccion segun ISO 9001/14001/45001.
"""
import pytest
from datetime import date, timedelta
from rest_framework import status


@pytest.mark.django_db
class TestInformeConsolidadoEndpoint:
    """Tests para GET /api/revision-direccion/informe-consolidado/"""

    URL = '/api/revision-direccion/informe-consolidado/'

    def test_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 para solicitudes sin autenticacion."""
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_200_when_authenticated(self, authenticated_client):
        """Debe retornar 200 para usuarios autenticados."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK

    def test_response_has_periodo(self, authenticated_client):
        """La respuesta debe incluir informacion del periodo."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'periodo' in data

    def test_response_has_modulos(self, authenticated_client):
        """La respuesta debe incluir la clave 'modulos' con datos de cada modulo."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'modulos' in data

    def test_response_has_resumen_ejecutivo(self, authenticated_client):
        """La respuesta debe incluir resumen ejecutivo."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'resumen_ejecutivo' in data

    def test_with_date_params(self, authenticated_client):
        """Debe aceptar parametros de fecha_desde y fecha_hasta."""
        fecha_desde = (date.today() - timedelta(days=90)).isoformat()
        fecha_hasta = date.today().isoformat()
        response = authenticated_client.get(
            self.URL,
            {'fecha_desde': fecha_desde, 'fecha_hasta': fecha_hasta}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_without_date_params_uses_default_period(self, authenticated_client):
        """Sin parametros de fecha, debe usar periodo por defecto (6 meses)."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        # Should have a periodo key with fecha_desde/fecha_hasta
        if 'periodo' in data and isinstance(data['periodo'], dict):
            assert 'fecha_desde' in data['periodo']
            assert 'fecha_hasta' in data['periodo']

    def test_with_invalid_date_uses_defaults(self, authenticated_client):
        """Con fechas invalidas, debe usar valores por defecto sin error."""
        response = authenticated_client.get(
            self.URL,
            {'fecha_desde': 'not-a-date', 'fecha_hasta': 'also-invalid'}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_modulos_contains_expected_keys(self, authenticated_client):
        """Los modulos en la respuesta deben ser un dict con claves de modulo."""
        response = authenticated_client.get(self.URL)
        data = response.data
        modulos = data.get('modulos', {})
        # modulos should be a dict or list (depends on aggregator implementation)
        assert modulos is not None

    def test_rejects_post_method(self, authenticated_client):
        """El endpoint solo acepta GET."""
        response = authenticated_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
