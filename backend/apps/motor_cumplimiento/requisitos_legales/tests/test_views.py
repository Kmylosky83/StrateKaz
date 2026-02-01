"""
Tests para views de requisitos_legales

Coverage:
- TipoRequisitoViewSet: CRUD basico
- RequisitoLegalViewSet: CRUD basico
- EmpresaRequisitoViewSet: CRUD, por_vencer, vencidos, estadisticas
- AlertaVencimientoViewSet: CRUD, pendientes
"""
import pytest
from datetime import date, timedelta
from rest_framework import status


@pytest.mark.django_db
class TestTipoRequisitoViewSet:
    """Tests para TipoRequisitoViewSet."""

    def test_listar_tipos_requisito(self, authenticated_client, tipo_requisito):
        """
        Test: Listar tipos de requisito

        Given: Tipos existentes
        When: GET /tipos-requisito/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/requisitos-legales/tipos-requisito/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo_requisito(self, authenticated_client):
        """
        Test: Crear tipo de requisito

        Given: Datos validos
        When: POST /tipos-requisito/
        Then: Debe crearse exitosamente
        """
        # Arrange
        data = {
            'codigo': 'PER-FUN',
            'nombre': 'Permiso de Funcionamiento',
            'descripcion': 'Permiso municipal',
            'requiere_renovacion': True,
            'dias_anticipacion_alerta': 30,
            'is_active': True
        }

        # Act
        response = authenticated_client.post(
            '/api/cumplimiento/requisitos-legales/tipos-requisito/',
            data=data
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'PER-FUN'


@pytest.mark.django_db
class TestRequisitoLegalViewSet:
    """Tests para RequisitoLegalViewSet."""

    def test_listar_requisitos(self, authenticated_client, requisito_legal):
        """
        Test: Listar requisitos legales

        Given: Requisitos existentes
        When: GET /requisitos/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/requisitos-legales/requisitos/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestEmpresaRequisitoViewSet:
    """Tests para EmpresaRequisitoViewSet."""

    def test_listar_empresa_requisitos(self, authenticated_client, empresa_requisito):
        """
        Test: Listar requisitos de empresa

        Given: Requisitos asignados
        When: GET /empresa-requisitos/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/requisitos-legales/empresa-requisitos/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_empresa_requisito(self, authenticated_client, empresa, requisito_legal):
        """
        Test: Crear requisito para empresa

        Given: Empresa y requisito disponibles
        When: POST /empresa-requisitos/
        Then: Debe crearse exitosamente
        """
        # Arrange
        data = {
            'empresa_id': empresa.id,
            'requisito': requisito_legal.id,
            'numero_documento': 'TEST-001',
            'fecha_expedicion': str(date.today()),
            'fecha_vencimiento': str(date.today() + timedelta(days=365)),
            'estado': 'vigente'
        }

        # Act
        response = authenticated_client.post(
            '/api/cumplimiento/requisitos-legales/empresa-requisitos/',
            data=data
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['numero_documento'] == 'TEST-001'

    def test_requisitos_por_vencer(self, authenticated_client, empresa, empresa_requisito_por_vencer):
        """
        Test: Listar requisitos proximos a vencer

        Given: Requisitos con diferentes fechas de vencimiento
        When: GET /empresa-requisitos/por_vencer/?empresa=X&dias=30
        Then: Debe retornar solo los que vencen en 30 dias
        """
        # Act
        response = authenticated_client.get(
            f'/api/cumplimiento/requisitos-legales/empresa-requisitos/por_vencer/?empresa={empresa.id}&dias=30'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_requisitos_vencidos(self, authenticated_client, empresa, requisito_legal, user):
        """
        Test: Listar requisitos vencidos

        Given: Requisitos vencidos
        When: GET /empresa-requisitos/vencidos/?empresa=X
        Then: Debe retornar solo los vencidos
        """
        # Arrange
        from apps.motor_cumplimiento.requisitos_legales.models import EmpresaRequisito
        EmpresaRequisito.objects.create(
            empresa=empresa,
            requisito=requisito_legal,
            fecha_vencimiento=date.today() - timedelta(days=10),
            estado=EmpresaRequisito.Estado.VENCIDO,
            is_active=True,
            created_by=user
        )

        # Act
        response = authenticated_client.get(
            f'/api/cumplimiento/requisitos-legales/empresa-requisitos/vencidos/?empresa={empresa.id}'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_estadisticas_requisitos(self, authenticated_client, empresa, empresa_requisito):
        """
        Test: Obtener estadisticas de requisitos

        Given: Requisitos con diferentes estados
        When: GET /empresa-requisitos/estadisticas/?empresa=X
        Then: Debe retornar contadores por estado
        """
        # Act
        response = authenticated_client.get(
            f'/api/cumplimiento/requisitos-legales/empresa-requisitos/estadisticas/?empresa={empresa.id}'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'estadisticas_por_estado' in response.data
        assert 'total' in response.data


@pytest.mark.django_db
class TestAlertaVencimientoViewSet:
    """Tests para AlertaVencimientoViewSet."""

    def test_listar_alertas(self, authenticated_client, alerta_vencimiento):
        """
        Test: Listar alertas de vencimiento

        Given: Alertas existentes
        When: GET /alertas-vencimiento/
        Then: Debe retornar lista
        """
        # Act
        response = authenticated_client.get('/api/cumplimiento/requisitos-legales/alertas-vencimiento/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_alertas_pendientes(self, authenticated_client, empresa_requisito):
        """
        Test: Listar alertas pendientes de envio

        Given: Alertas pendientes
        When: GET /alertas-vencimiento/pendientes/
        Then: Debe retornar solo las pendientes
        """
        # Arrange
        from apps.motor_cumplimiento.requisitos_legales.models import AlertaVencimiento
        AlertaVencimiento.objects.create(
            empresa_requisito=empresa_requisito,
            dias_antes=15,
            fecha_programada=date.today() - timedelta(days=1),
            enviada=False
        )

        # Act
        response = authenticated_client.get(
            '/api/cumplimiento/requisitos-legales/alertas-vencimiento/pendientes/'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
