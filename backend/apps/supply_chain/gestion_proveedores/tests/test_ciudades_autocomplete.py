"""
ME-002: Tests para el endpoint de autocompletado de ciudades
Sistema de Gestión StrateKaz
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Departamento, Ciudad


@pytest.fixture
def api_client():
    """Cliente API para tests."""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, django_user_model):
    """Cliente API autenticado."""
    user = django_user_model.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def departamento_antioquia(db):
    """Fixture: Departamento de Antioquia."""
    return Departamento.objects.create(
        codigo='ANTIOQUIA',
        nombre='Antioquia',
        codigo_dane='05',
        orden=1,
        is_active=True
    )


@pytest.fixture
def departamento_bogota(db):
    """Fixture: Departamento de Bogotá D.C."""
    return Departamento.objects.create(
        codigo='BOGOTA_DC',
        nombre='Bogotá D.C.',
        codigo_dane='11',
        orden=2,
        is_active=True
    )


@pytest.fixture
def ciudades_antioquia(db, departamento_antioquia):
    """Fixture: Ciudades de Antioquia."""
    ciudades = [
        Ciudad.objects.create(
            departamento=departamento_antioquia,
            codigo='MEDELLIN',
            nombre='Medellín',
            codigo_dane='05001',
            es_capital=True,
            is_active=True
        ),
        Ciudad.objects.create(
            departamento=departamento_antioquia,
            codigo='ENVIGADO',
            nombre='Envigado',
            codigo_dane='05266',
            es_capital=False,
            is_active=True
        ),
        Ciudad.objects.create(
            departamento=departamento_antioquia,
            codigo='BELLO',
            nombre='Bello',
            codigo_dane='05088',
            es_capital=False,
            is_active=True
        ),
    ]
    return ciudades


@pytest.fixture
def ciudad_bogota(db, departamento_bogota):
    """Fixture: Ciudad Bogotá."""
    return Ciudad.objects.create(
        departamento=departamento_bogota,
        codigo='BOGOTA',
        nombre='Bogotá',
        codigo_dane='11001',
        es_capital=True,
        is_active=True
    )


@pytest.mark.django_db
class TestCiudadesAutocomplete:
    """Tests para el endpoint de autocompletado de ciudades."""

    def test_autocomplete_requires_auth(self, api_client):
        """Test: endpoint requiere autenticación."""
        url = '/api/supply-chain/ciudades/autocomplete/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_autocomplete_empty_query(self, authenticated_client, ciudades_antioquia):
        """Test: query vacío retorna resultados (hasta el límite)."""
        url = '/api/supply-chain/ciudades/autocomplete/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'results' in data
        assert 'count' in data

    def test_autocomplete_search_by_name(self, authenticated_client, ciudades_antioquia):
        """Test: búsqueda por nombre de ciudad."""
        url = '/api/supply-chain/ciudades/autocomplete/?q=Med'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1

        # Verificar que Medellín está en los resultados
        nombres = [r['nombre'] for r in data['results']]
        assert 'Medellín' in nombres

    def test_autocomplete_filter_by_departamento(
        self,
        authenticated_client,
        ciudades_antioquia,
        ciudad_bogota
    ):
        """Test: filtrar por departamento."""
        dept_id = ciudades_antioquia[0].departamento_id
        url = f'/api/supply-chain/ciudades/autocomplete/?departamento_id={dept_id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Todas las ciudades deben ser del departamento filtrado
        for ciudad in data['results']:
            assert ciudad['departamento_id'] == dept_id

    def test_autocomplete_limit(self, authenticated_client, ciudades_antioquia):
        """Test: límite de resultados."""
        url = '/api/supply-chain/ciudades/autocomplete/?limit=2'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['results']) <= 2

    def test_autocomplete_max_limit(self, authenticated_client, ciudades_antioquia):
        """Test: límite máximo de 50."""
        url = '/api/supply-chain/ciudades/autocomplete/?limit=100'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # El límite debería ser 50 máximo
        data = response.json()
        assert data['count'] <= 50

    def test_autocomplete_capitals_first(
        self,
        authenticated_client,
        ciudades_antioquia,
        departamento_antioquia
    ):
        """Test: capitales aparecen primero."""
        url = f'/api/supply-chain/ciudades/autocomplete/?departamento_id={departamento_antioquia.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if data['count'] > 0:
            # La primera ciudad debería ser Medellín (capital)
            first_city = data['results'][0]
            assert first_city['es_capital'] is True
            assert first_city['nombre'] == 'Medellín'

    def test_autocomplete_response_format(self, authenticated_client, ciudades_antioquia):
        """Test: formato de respuesta correcto."""
        url = '/api/supply-chain/ciudades/autocomplete/?q=Med'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verificar estructura de respuesta
        assert 'results' in data
        assert 'count' in data
        assert 'query' in data

        if data['count'] > 0:
            ciudad = data['results'][0]
            assert 'id' in ciudad
            assert 'nombre' in ciudad
            assert 'departamento_id' in ciudad
            assert 'departamento_nombre' in ciudad
            assert 'es_capital' in ciudad
            assert 'label' in ciudad

            # Verificar formato del label
            assert ',' in ciudad['label']

    def test_autocomplete_min_query_length(self, authenticated_client, ciudades_antioquia):
        """Test: query muy corto no filtra."""
        # Con query de 1 caracter, no debería filtrar
        url = '/api/supply-chain/ciudades/autocomplete/?q=M'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Debería retornar todas las ciudades (sin filtrar por nombre)
        assert data['count'] == len(ciudades_antioquia)

    def test_autocomplete_search_by_codigo(self, authenticated_client, ciudades_antioquia):
        """Test: búsqueda por código de ciudad."""
        url = '/api/supply-chain/ciudades/autocomplete/?q=ENVIGADO'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1

    def test_autocomplete_inactive_cities_excluded(
        self,
        authenticated_client,
        departamento_antioquia,
        db
    ):
        """Test: ciudades inactivas no aparecen."""
        # Crear ciudad inactiva
        Ciudad.objects.create(
            departamento=departamento_antioquia,
            codigo='INACTIVA',
            nombre='Ciudad Inactiva',
            codigo_dane='99999',
            is_active=False
        )

        url = '/api/supply-chain/ciudades/autocomplete/?q=Inactiva'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] == 0
