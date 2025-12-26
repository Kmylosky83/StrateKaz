"""
Tests para views de Revision por la Direccion
"""
import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestProgramaRevisionViewSet:
    """Tests para ProgramaRevisionViewSet"""

    def test_list_programas(self, authenticated_client, programa_revision):
        """Test listar programas de revision"""
        response = authenticated_client.get('/api/revision-direccion/programas/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_create_programa(self, authenticated_client, empresa, user):
        """Test crear programa de revision"""
        data = {
            'empresa': empresa.id,
            'anio': 2025,
            'periodo': 'Segundo Semestre 2025',
            'frecuencia': 'semestral',
            'fecha_programada': (date.today() + timedelta(days=180)).isoformat(),
            'lugar': 'Sala Principal',
            'incluye_calidad': True,
            'incluye_sst': True,
            'incluye_ambiental': True
        }
        response = authenticated_client.post(
            '/api/revision-direccion/programas/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['periodo'] == 'Segundo Semestre 2025'

    def test_retrieve_programa(self, authenticated_client, programa_revision):
        """Test obtener detalle de programa"""
        response = authenticated_client.get(
            f'/api/revision-direccion/programas/{programa_revision.id}/'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == programa_revision.id

    def test_dashboard(self, authenticated_client, programa_revision, empresa):
        """Test endpoint dashboard"""
        response = authenticated_client.get(
            f'/api/revision-direccion/programas/dashboard/?empresa={empresa.id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'total_revisiones' in response.data
        assert 'revisiones_realizadas' in response.data
        assert 'compromisos_totales' in response.data

    def test_calendario(self, authenticated_client, programa_revision, empresa):
        """Test endpoint calendario"""
        response = authenticated_client.get(
            f'/api/revision-direccion/programas/calendario/?empresa={empresa.id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_cambiar_estado(self, authenticated_client, programa_revision):
        """Test cambiar estado de programa"""
        response = authenticated_client.post(
            f'/api/revision-direccion/programas/{programa_revision.id}/cambiar_estado/',
            {'estado': 'convocada'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        programa_revision.refresh_from_db()
        assert programa_revision.estado == 'convocada'

    def test_toggle_active(self, authenticated_client, programa_revision):
        """Test toggle_active del mixin"""
        response = authenticated_client.post(
            f'/api/revision-direccion/programas/{programa_revision.id}/toggle_active/'
        )
        assert response.status_code == status.HTTP_200_OK
        programa_revision.refresh_from_db()
        assert programa_revision.is_active is False

    def test_unauthenticated_access(self, api_client):
        """Test acceso sin autenticacion"""
        response = api_client.get('/api/revision-direccion/programas/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestParticipanteRevisionViewSet:
    """Tests para ParticipanteRevisionViewSet"""

    def test_list_participantes(self, authenticated_client, participante_revision):
        """Test listar participantes"""
        response = authenticated_client.get('/api/revision-direccion/participantes/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_participante(self, authenticated_client, programa_revision, admin_user):
        """Test crear participante"""
        data = {
            'programa': programa_revision.id,
            'usuario': admin_user.id,
            'rol': 'lider_proceso',
            'es_obligatorio': False
        }
        response = authenticated_client.post(
            '/api/revision-direccion/participantes/',
            data,
            format='json'
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestTemaRevisionViewSet:
    """Tests para TemaRevisionViewSet"""

    def test_list_temas(self, authenticated_client, tema_revision):
        """Test listar temas"""
        response = authenticated_client.get('/api/revision-direccion/temas/')
        assert response.status_code == status.HTTP_200_OK

    def test_plantilla_temas_iso(self, authenticated_client):
        """Test plantilla de temas ISO"""
        response = authenticated_client.get(
            '/api/revision-direccion/temas/plantilla_temas_iso/'
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0


@pytest.mark.django_db
class TestActaRevisionViewSet:
    """Tests para ActaRevisionViewSet"""

    def test_list_actas(self, authenticated_client, acta_revision):
        """Test listar actas"""
        response = authenticated_client.get('/api/revision-direccion/actas/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCompromisoRevisionViewSet:
    """Tests para CompromisoRevisionViewSet"""

    def test_list_compromisos(self, authenticated_client, compromiso_revision):
        """Test listar compromisos"""
        response = authenticated_client.get('/api/revision-direccion/compromisos/')
        assert response.status_code == status.HTTP_200_OK

    def test_pendientes(self, authenticated_client, compromiso_revision, empresa):
        """Test endpoint compromisos pendientes"""
        # Obtener empresa del programa relacionado
        empresa_id = compromiso_revision.acta.programa.empresa_id
        response = authenticated_client.get(
            f'/api/revision-direccion/compromisos/pendientes/?empresa={empresa_id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_vencidos(self, authenticated_client, compromiso_revision, empresa):
        """Test endpoint compromisos vencidos"""
        empresa_id = compromiso_revision.acta.programa.empresa_id
        response = authenticated_client.get(
            f'/api/revision-direccion/compromisos/vencidos/?empresa={empresa_id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_por_responsable(self, authenticated_client, compromiso_revision, empresa):
        """Test endpoint compromisos por responsable"""
        empresa_id = compromiso_revision.acta.programa.empresa_id
        response = authenticated_client.get(
            f'/api/revision-direccion/compromisos/por_responsable/?empresa={empresa_id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_registrar_avance(self, authenticated_client, compromiso_revision):
        """Test registrar avance en compromiso"""
        response = authenticated_client.post(
            f'/api/revision-direccion/compromisos/{compromiso_revision.id}/registrar_avance/',
            {'porcentaje_avance': 50, 'descripcion_avance': 'Avance test'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        compromiso_revision.refresh_from_db()
        assert compromiso_revision.porcentaje_avance == 50


@pytest.mark.django_db
class TestSeguimientoCompromisoViewSet:
    """Tests para SeguimientoCompromisoViewSet"""

    def test_list_seguimientos(self, authenticated_client, seguimiento_compromiso):
        """Test listar seguimientos"""
        response = authenticated_client.get('/api/revision-direccion/seguimientos/')
        assert response.status_code == status.HTTP_200_OK
