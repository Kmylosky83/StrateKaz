"""
Tests para el ResumenRevisionMixin aplicado a RiesgoProcesoViewSet.

Verifica el endpoint GET /api/riesgos/riesgos-procesos/riesgos/resumen-revision/
que retorna un resumen de riesgos para la Revision por la Direccion.

Tambien prueba el patron general del mixin: estructura de respuesta,
filtrado por fecha, y respuesta cuando no hay datos.
"""
import pytest
from datetime import date, timedelta
from rest_framework import status


@pytest.mark.django_db
class TestResumenRevisionMixinOnRiesgos:
    """Tests para GET /api/riesgos/riesgos-procesos/riesgos/resumen-revision/"""

    URL = '/api/riesgos/riesgos-procesos/riesgos/resumen-revision/'

    def test_requires_authentication(self, api_client):
        """El endpoint debe retornar 401 sin autenticacion."""
        response = api_client.get(self.URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_200_when_authenticated(self, authenticated_client):
        """Debe retornar 200 cuando el usuario esta autenticado."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK

    def test_response_has_disponible_field(self, authenticated_client):
        """La respuesta debe incluir campo 'disponible' (bool)."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'disponible' in data
        assert isinstance(data['disponible'], bool)

    def test_response_has_modulo_field(self, authenticated_client):
        """La respuesta debe incluir campo 'modulo' (string)."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'modulo' in data
        assert isinstance(data['modulo'], str)
        assert data['modulo'] == 'riesgos_procesos'

    def test_response_has_periodo_field(self, authenticated_client):
        """La respuesta debe incluir campo 'periodo' con fecha_desde y fecha_hasta."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'periodo' in data
        assert 'fecha_desde' in data['periodo']
        assert 'fecha_hasta' in data['periodo']

    def test_response_has_data_field(self, authenticated_client):
        """La respuesta debe incluir campo 'data' con datos del resumen."""
        response = authenticated_client.get(self.URL)
        data = response.data
        assert 'data' in data

    def test_date_filtering_custom_period(self, authenticated_client):
        """Debe aceptar parametros de fecha personalizados."""
        fecha_desde = (date.today() - timedelta(days=30)).isoformat()
        fecha_hasta = date.today().isoformat()
        response = authenticated_client.get(
            self.URL,
            {'fecha_desde': fecha_desde, 'fecha_hasta': fecha_hasta}
        )
        assert response.status_code == status.HTTP_200_OK
        periodo = response.data.get('periodo', {})
        assert periodo.get('fecha_desde') == fecha_desde
        assert periodo.get('fecha_hasta') == fecha_hasta

    def test_default_period_is_6_months(self, authenticated_client):
        """Sin parametros de fecha, el periodo por defecto debe ser ~180 dias."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        periodo = response.data.get('periodo', {})
        fecha_desde = periodo.get('fecha_desde', '')
        fecha_hasta = periodo.get('fecha_hasta', '')
        # fecha_hasta should be today
        assert fecha_hasta == str(date.today())
        # fecha_desde should be ~180 days ago
        expected_desde = str(date.today() - timedelta(days=180))
        assert fecha_desde == expected_desde

    def test_invalid_dates_use_defaults(self, authenticated_client):
        """Con fechas invalidas, debe usar valores por defecto."""
        response = authenticated_client.get(
            self.URL,
            {'fecha_desde': 'bad-date', 'fecha_hasta': 'invalid'}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_with_riesgo_data(self, authenticated_client, riesgo_proceso):
        """Con riesgos existentes, debe retornar datos no vacios."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data['disponible'] is True

    def test_without_data_still_returns_valid_response(self, authenticated_client):
        """Sin datos de riesgos, debe retornar estructura valida."""
        response = authenticated_client.get(self.URL)
        assert response.status_code == status.HTTP_200_OK
        assert 'disponible' in response.data
        assert 'data' in response.data

    def test_rejects_post_method(self, authenticated_client):
        """El endpoint solo acepta GET."""
        response = authenticated_client.post(self.URL, {}, format='json')
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
