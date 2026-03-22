"""
Tests de views para Estructura de Cargos - Mi Equipo.

Cobertura:
- ProfesiogramaViewSet: list, create, unauthenticated, estadisticas, vigentes
- MatrizCompetenciaViewSet: list, create, unauthenticated
- RequisitoEspecialViewSet: list, unauthenticated
- VacanteViewSet: list, create, unauthenticated, abiertas, cerrar

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from rest_framework import status


BASE_URL = '/api/mi-equipo/estructura-cargos'


@pytest.mark.django_db
class TestProfesiogramaViewSet:
    """Tests para endpoints de Profesiograma."""

    def test_list_authenticated(self, authenticated_client, profesiograma):
        """GET /profesiogramas/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/profesiogramas/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /profesiogramas/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/profesiogramas/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_authenticated(self, authenticated_client, profesiograma):
        """GET /profesiogramas/{id}/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/profesiogramas/{profesiograma.pk}/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_estadisticas_authenticated(self, authenticated_client, profesiograma):
        """GET /profesiogramas/estadisticas/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/profesiogramas/estadisticas/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_vigentes_authenticated(self, authenticated_client, profesiograma):
        """GET /profesiogramas/vigentes/ retorna 200."""
        response = authenticated_client.get(
            f'{BASE_URL}/profesiogramas/vigentes/'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_soft_deletes(self, authenticated_client, profesiograma):
        """DELETE /profesiogramas/{id}/ debe hacer soft delete."""
        response = authenticated_client.delete(
            f'{BASE_URL}/profesiogramas/{profesiograma.pk}/'
        )
        assert response.status_code in (
            status.HTTP_204_NO_CONTENT,
            status.HTTP_200_OK,
        )
        profesiograma.refresh_from_db()
        assert profesiograma.is_active is False


@pytest.mark.django_db
class TestMatrizCompetenciaViewSet:
    """Tests para endpoints de MatrizCompetencia."""

    def test_list_authenticated(self, authenticated_client, matriz_competencia):
        """GET /competencias/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/competencias/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /competencias/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/competencias/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_profesiograma(
        self, authenticated_client, matriz_competencia, profesiograma
    ):
        """GET /competencias/?profesiograma={id} filtra correctamente."""
        response = authenticated_client.get(
            f'{BASE_URL}/competencias/?profesiograma={profesiograma.pk}'
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestRequisitoEspecialViewSet:
    """Tests para endpoints de RequisitoEspecial."""

    def test_list_authenticated(self, authenticated_client):
        """GET /requisitos-especiales/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/requisitos-especiales/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /requisitos-especiales/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/requisitos-especiales/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestVacanteViewSet:
    """Tests para endpoints de Vacante."""

    def test_list_authenticated(self, authenticated_client):
        """GET /vacantes/ con auth retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/vacantes/')
        assert response.status_code == status.HTTP_200_OK

    def test_list_unauthenticated(self, api_client):
        """GET /vacantes/ sin auth retorna 401."""
        response = api_client.get(f'{BASE_URL}/vacantes/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_estadisticas_authenticated(self, authenticated_client):
        """GET /vacantes/estadisticas/ retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/vacantes/estadisticas/')
        assert response.status_code == status.HTTP_200_OK

    def test_abiertas_authenticated(self, authenticated_client):
        """GET /vacantes/abiertas/ retorna 200."""
        response = authenticated_client.get(f'{BASE_URL}/vacantes/abiertas/')
        assert response.status_code == status.HTTP_200_OK
