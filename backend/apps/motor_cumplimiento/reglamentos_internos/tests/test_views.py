"""
Tests para views de reglamentos_internos

Coverage:
- TipoReglamentoViewSet: CRUD basico
- ReglamentoViewSet: CRUD basico
- VersionReglamentoViewSet: CRUD basico
- PublicacionReglamentoViewSet: CRUD basico
- SocializacionReglamentoViewSet: CRUD basico
"""
import pytest
from datetime import date
from decimal import Decimal
from rest_framework import status


@pytest.mark.django_db
class TestTipoReglamentoViewSet:
    """Tests para TipoReglamentoViewSet."""

    def test_listar_tipos(self, authenticated_client, tipo_reglamento):
        """Test: Listar tipos de reglamento."""
        response = authenticated_client.get('/api/cumplimiento/reglamentos-internos/tipos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, authenticated_client):
        """Test: Crear tipo de reglamento."""
        data = {
            'codigo': 'POL-SST',
            'nombre': 'Politica de SST',
            'requiere_aprobacion_legal': False,
            'vigencia_anios': 1,
            'orden': 3,
            'is_active': True
        }
        response = authenticated_client.post(
            '/api/cumplimiento/reglamentos-internos/tipos/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestReglamentoViewSet:
    """Tests para ReglamentoViewSet."""

    def test_listar_reglamentos(self, authenticated_client, reglamento):
        """Test: Listar reglamentos."""
        response = authenticated_client.get('/api/cumplimiento/reglamentos-internos/reglamentos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_reglamento(self, authenticated_client, empresa, tipo_reglamento):
        """Test: Crear reglamento."""
        data = {
            'empresa_id': empresa.id,
            'tipo': tipo_reglamento.id,
            'codigo': 'RITH-2027',
            'nombre': 'Reglamento 2027',
            'estado': 'borrador',
            'version_actual': '0.1',
            'orden': 2
        }
        response = authenticated_client.post(
            '/api/cumplimiento/reglamentos-internos/reglamentos/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_estado(self, authenticated_client, reglamento):
        """Test: Filtrar reglamentos por estado."""
        response = authenticated_client.get(
            f'/api/cumplimiento/reglamentos-internos/reglamentos/?estado={reglamento.estado}'
        )
        assert response.status_code == status.HTTP_200_OK
        for reg in response.data['results']:
            assert reg['estado'] == reglamento.estado


@pytest.mark.django_db
class TestVersionReglamentoViewSet:
    """Tests para VersionReglamentoViewSet."""

    def test_listar_versiones(self, authenticated_client, version_reglamento):
        """Test: Listar versiones de reglamentos."""
        response = authenticated_client.get('/api/cumplimiento/reglamentos-internos/versiones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_version(self, authenticated_client, empresa, reglamento):
        """Test: Crear version de reglamento."""
        data = {
            'empresa_id': empresa.id,
            'reglamento': reglamento.id,
            'numero_version': '2.0',
            'fecha_version': str(date.today()),
            'cambios_realizados': 'Actualizacion mayor',
            'motivo_cambio': 'Cambio normativo'
        }
        response = authenticated_client.post(
            '/api/cumplimiento/reglamentos-internos/versiones/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestPublicacionReglamentoViewSet:
    """Tests para PublicacionReglamentoViewSet."""

    def test_listar_publicaciones(self, authenticated_client, publicacion_reglamento):
        """Test: Listar publicaciones."""
        response = authenticated_client.get('/api/cumplimiento/reglamentos-internos/publicaciones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_publicacion(self, authenticated_client, empresa, reglamento):
        """Test: Crear publicacion de reglamento."""
        data = {
            'empresa_id': empresa.id,
            'reglamento': reglamento.id,
            'version_publicada': '1.0',
            'fecha_publicacion': str(date.today()),
            'medio': 'email',
            'ubicacion': 'Correo corporativo'
        }
        response = authenticated_client.post(
            '/api/cumplimiento/reglamentos-internos/publicaciones/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestSocializacionReglamentoViewSet:
    """Tests para SocializacionReglamentoViewSet."""

    def test_listar_socializaciones(self, authenticated_client, socializacion_reglamento):
        """Test: Listar socializaciones."""
        response = authenticated_client.get('/api/cumplimiento/reglamentos-internos/socializaciones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_socializacion(self, authenticated_client, empresa, reglamento, responsable_user):
        """Test: Crear socializacion de reglamento."""
        data = {
            'empresa_id': empresa.id,
            'reglamento': reglamento.id,
            'tipo': 'capacitacion',
            'fecha': str(date.today()),
            'duracion_horas': '2.5',
            'facilitador': responsable_user.id,
            'numero_asistentes': 30,
            'temas_tratados': 'Introduccion general'
        }
        response = authenticated_client.post(
            '/api/cumplimiento/reglamentos-internos/socializaciones/',
            data=data
        )
        assert response.status_code == status.HTTP_201_CREATED
