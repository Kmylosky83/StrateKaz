"""
Tests de views para Colaboradores - Mi Equipo.

Cobertura:
- ColaboradorViewSet: list, retrieve, unauthenticated, estadisticas, activos
- HojaVidaViewSet: list, unauthenticated
- InfoPersonalViewSet: list, unauthenticated
- HistorialLaboralViewSet: list, unauthenticated, ascensos, traslados

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from rest_framework import status


BASE_URL = '/api/mi-equipo/empleados'


@pytest.mark.django_db
class TestColaboradorViewSet:
    """Tests para endpoints de Colaborador."""

    def test_list_authenticated(self, authenticated_client, colaborador):
        """GET /colaboradores/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/colaboradores/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /colaboradores/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/colaboradores/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_authenticated(self, authenticated_client, colaborador):
        """GET /colaboradores/{id}/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/{colaborador.pk}/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_estadisticas_authenticated(self, authenticated_client, colaborador):
        """GET /colaboradores/estadisticas/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/estadisticas/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_activos_authenticated(self, authenticated_client, colaborador):
        """GET /colaboradores/activos/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/activos/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_completo_authenticated(self, authenticated_client, colaborador):
        """GET /colaboradores/{id}/completo/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/{colaborador.pk}/completo/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_soft_deletes(self, authenticated_client, colaborador):
        """DELETE /colaboradores/{id}/ debe hacer soft delete."""
        response = authenticated_client.delete(
            f'{BASE_URL}/colaboradores/{colaborador.pk}/'
        )
        assert response.status_code in (
            status.HTTP_204_NO_CONTENT,
            status.HTTP_200_OK,
        )
        colaborador.refresh_from_db()
        assert colaborador.is_active is False

    def test_filter_by_estado(self, authenticated_client, colaborador):
        """GET /colaboradores/?estado=activo filtra correctamente."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/?estado=activo'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_search(self, authenticated_client, colaborador):
        """GET /colaboradores/?search=Juan filtra por nombre."""
        response = authenticated_client.get(
            f'{BASE_URL}/colaboradores/?search=Juan'
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestHojaVidaViewSet:
    """Tests para endpoints de HojaVida."""

    def test_list_authenticated(self, authenticated_client):
        """GET /hojas-vida/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/hojas-vida/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /hojas-vida/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/hojas-vida/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestInfoPersonalViewSet:
    """Tests para endpoints de InfoPersonal."""

    def test_list_authenticated(self, authenticated_client):
        """GET /info-personal/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/info-personal/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /info-personal/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/info-personal/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestHistorialLaboralViewSet:
    """Tests para endpoints de HistorialLaboral."""

    def test_list_authenticated(self, authenticated_client):
        """GET /historial-laboral/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/historial-laboral/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /historial-laboral/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/historial-laboral/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_ascensos_authenticated(self, authenticated_client):
        """GET /historial-laboral/ascensos/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/historial-laboral/ascensos/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_traslados_authenticated(self, authenticated_client):
        """GET /historial-laboral/traslados/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/historial-laboral/traslados/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_cambios_salario_authenticated(self, authenticated_client):
        """GET /historial-laboral/cambios-salario/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/historial-laboral/cambios-salario/'
        )
        assert response.status_code == status.HTTP_200_OK
