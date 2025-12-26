"""
Tests para views de partes_interesadas

Coverage:
- TipoParteInteresadaViewSet: CRUD basico
- ParteInteresadaViewSet: CRUD, matriz_poder_interes
- RequisitoParteInteresadaViewSet: CRUD basico
- MatrizComunicacionViewSet: CRUD basico
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestTipoParteInteresadaViewSet:
    """Tests para TipoParteInteresadaViewSet."""

    def test_listar_tipos(self, authenticated_client, tipo_parte_interesada):
        """Test: Listar tipos de parte interesada."""
        response = authenticated_client.get('/api/cumplimiento/partes-interesadas/tipos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, authenticated_client):
        """Test: Crear tipo de parte interesada."""
        data = {
            'codigo': 'CLIENTES',
            'nombre': 'Clientes',
            'categoria': 'externa',
            'orden': 3,
            'is_active': True
        }
        response = authenticated_client.post(
            '/api/cumplimiento/partes-interesadas/tipos/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestParteInteresadaViewSet:
    """Tests para ParteInteresadaViewSet."""

    def test_listar_partes_interesadas(self, authenticated_client, parte_interesada):
        """Test: Listar partes interesadas."""
        response = authenticated_client.get('/api/cumplimiento/partes-interesadas/partes/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_parte_interesada(self, authenticated_client, empresa, tipo_parte_interesada):
        """Test: Crear parte interesada."""
        data = {
            'empresa_id': empresa.id,
            'tipo': tipo_parte_interesada.id,
            'nombre': 'COPASST',
            'nivel_influencia': 'alta',
            'nivel_interes': 'alto',
            'relacionado_sst': True
        }
        response = authenticated_client.post(
            '/api/cumplimiento/partes-interesadas/partes/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_matriz_poder_interes(self, authenticated_client, empresa, parte_interesada):
        """Test: Obtener matriz poder-interes."""
        response = authenticated_client.get(
            f'/api/cumplimiento/partes-interesadas/partes/matriz_poder_interes/?empresa={empresa.id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'gestionar_cerca' in response.data
        assert 'mantener_satisfecho' in response.data
        assert 'mantener_informado' in response.data
        assert 'monitorear' in response.data


@pytest.mark.django_db
class TestRequisitoParteInteresadaViewSet:
    """Tests para RequisitoParteInteresadaViewSet."""

    def test_listar_requisitos(self, authenticated_client, requisito_parte_interesada):
        """Test: Listar requisitos de partes interesadas."""
        response = authenticated_client.get('/api/cumplimiento/partes-interesadas/requisitos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestMatrizComunicacionViewSet:
    """Tests para MatrizComunicacionViewSet."""

    def test_listar_comunicaciones(self, authenticated_client, matriz_comunicacion):
        """Test: Listar matriz de comunicaciones."""
        response = authenticated_client.get('/api/cumplimiento/partes-interesadas/comunicaciones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_comunicacion(self, authenticated_client, empresa, parte_interesada, responsable_user):
        """Test: Crear entrada en matriz de comunicacion."""
        data = {
            'empresa_id': empresa.id,
            'parte_interesada': parte_interesada.id,
            'que_comunicar': 'Indicadores mensuales',
            'cuando_comunicar': 'mensual',
            'como_comunicar': 'email',
            'responsable': responsable_user.id,
            'aplica_sst': True
        }
        response = authenticated_client.post(
            '/api/cumplimiento/partes-interesadas/comunicaciones/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED
