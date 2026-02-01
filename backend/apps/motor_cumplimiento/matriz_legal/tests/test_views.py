"""
Tests para views de matriz_legal

Coverage:
- TipoNormaViewSet: CRUD, toggle_active
- NormaLegalViewSet: CRUD, by_sistema, vigentes, estadisticas
- EmpresaNormaViewSet: CRUD, evaluar, matriz, pendientes_evaluacion
"""
import pytest
from datetime import date
from rest_framework import status


@pytest.mark.django_db
class TestTipoNormaViewSet:
    """Tests para TipoNormaViewSet."""

    def test_listar_tipos_norma(self, authenticated_client, tipo_norma, tipo_norma_decreto):
        """
        Test: Listar tipos de norma

        Given: Tipos de norma existentes
        When: GET /tipos-norma/
        Then: Debe retornar lista de tipos
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/matriz-legal/tipos-norma/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_crear_tipo_norma(self, authenticated_client):
        """
        Test: Crear tipo de norma

        Given: Datos validos de tipo norma
        When: POST /tipos-norma/
        Then: Debe crearse exitosamente
        """
        # Arrange
        data = {
            'codigo': 'ACU',
            'nombre': 'Acuerdo',
            'descripcion': 'Acuerdos municipales',
            'is_active': True
        }

        # Act
        response = authenticated_client.post(
            '/api/cumplimiento/matriz-legal/tipos-norma/',
            data=data
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'ACU'

    def test_toggle_active_tipo_norma(self, authenticated_client, tipo_norma):
        """
        Test: Activar/desactivar tipo norma

        Given: Un tipo de norma activo
        When: POST /tipos-norma/{id}/toggle_active/
        Then: Debe desactivarse
        """
        # Arrange
        assert tipo_norma.is_active is True

        # Act
        response = authenticated_client.post(
            f'/api/cumplimiento/matriz-legal/tipos-norma/{tipo_norma.id}/toggle_active/'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        tipo_norma.refresh_from_db()
        assert tipo_norma.is_active is False


@pytest.mark.django_db
class TestNormaLegalViewSet:
    """Tests para NormaLegalViewSet."""

    def test_listar_normas(self, authenticated_client, norma_legal):
        """
        Test: Listar normas legales

        Given: Normas existentes
        When: GET /normas/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/matriz-legal/normas/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filtrar_normas_by_sistema_sst(self, authenticated_client, norma_legal, norma_ambiental):
        """
        Test: Filtrar normas por sistema SST

        Given: Normas de diferentes sistemas
        When: GET /normas/by_sistema/?sistema=sst
        Then: Solo debe retornar normas SST
        """
        # Act
        response = authenticated_client.get(
            '/api/cumplimiento/matriz-legal/normas/by_sistema/?sistema=sst'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['numero'] == '1072'

    def test_filtrar_normas_vigentes(self, authenticated_client, norma_legal):
        """
        Test: Filtrar normas vigentes

        Given: Normas vigentes y no vigentes
        When: GET /normas/vigentes/
        Then: Solo debe retornar vigentes
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/matriz-legal/normas/vigentes/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        for norma in response.data:
            assert norma['vigente'] is True

    def test_estadisticas_normas(self, authenticated_client, norma_legal, norma_ambiental):
        """
        Test: Obtener estadisticas de normas

        Given: Normas existentes
        When: GET /normas/estadisticas/
        Then: Debe retornar contadores
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/matriz-legal/normas/estadisticas/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'vigentes' in response.data
        assert 'por_sistema' in response.data
        assert response.data['total'] >= 2


@pytest.mark.django_db
class TestEmpresaNormaViewSet:
    """Tests para EmpresaNormaViewSet."""

    def test_listar_empresa_normas(self, authenticated_client, empresa_norma):
        """
        Test: Listar relaciones empresa-norma

        Given: Relaciones empresa-norma existentes
        When: GET /empresa-normas/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/matriz-legal/empresa-normas/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_empresa_norma(self, authenticated_client, empresa, norma_ambiental):
        """
        Test: Crear relacion empresa-norma

        Given: Empresa y norma disponibles
        When: POST /empresa-normas/
        Then: Debe crearse exitosamente
        """
        # Arrange
        data = {
            'empresa_id': empresa.id,
            'norma': norma_ambiental.id,
            'aplica': True,
            'porcentaje_cumplimiento': 50,
            'observaciones': 'En proceso'
        }

        # Act
        response = authenticated_client.post(
            '/api/cumplimiento/matriz-legal/empresa-normas/',
            data=data
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['porcentaje_cumplimiento'] == 50

    def test_evaluar_cumplimiento(self, authenticated_client, empresa_norma):
        """
        Test: Evaluar cumplimiento de norma

        Given: Una empresa-norma existente
        When: POST /empresa-normas/{id}/evaluar/
        Then: Debe actualizar porcentaje y fecha
        """
        # Arrange
        data = {
            'porcentaje_cumplimiento': 100,
            'observaciones': 'Cumplimiento total alcanzado'
        }

        # Act
        response = authenticated_client.post(
            f'/api/cumplimiento/matriz-legal/empresa-normas/{empresa_norma.id}/evaluar/',
            data=data
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['porcentaje'] == 100
        assert response.data['estado'] == 'Cumple'
        empresa_norma.refresh_from_db()
        assert empresa_norma.porcentaje_cumplimiento == 100
        assert empresa_norma.fecha_evaluacion == date.today()

    def test_matriz_cumplimiento(self, authenticated_client, empresa, empresa_norma):
        """
        Test: Obtener matriz de cumplimiento

        Given: Normas asignadas a empresa
        When: GET /empresa-normas/matriz/?empresa=X
        Then: Debe retornar resumen y normas
        """
        # Act
        response = authenticated_client.get(
            f'/api/cumplimiento/matriz-legal/empresa-normas/matriz/?empresa={empresa.id}'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'empresa_id' in response.data
        assert 'total_normas' in response.data
        assert 'porcentaje_cumplimiento_general' in response.data
        assert 'resumen' in response.data
        assert 'normas' in response.data

    def test_pendientes_evaluacion(self, authenticated_client, empresa, norma_ambiental, user):
        """
        Test: Listar normas pendientes de evaluacion

        Given: Normas con 0% cumplimiento
        When: GET /empresa-normas/pendientes_evaluacion/?empresa=X
        Then: Debe retornar solo las pendientes
        """
        # Arrange
        from apps.motor_cumplimiento.matriz_legal.models import EmpresaNorma
        EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_ambiental,
            aplica=True,
            porcentaje_cumplimiento=0,
            created_by=user
        )

        # Act
        response = authenticated_client.get(
            f'/api/cumplimiento/matriz-legal/empresa-normas/pendientes_evaluacion/?empresa={empresa.id}'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        for norma in response.data:
            assert norma['porcentaje_cumplimiento'] == 0
