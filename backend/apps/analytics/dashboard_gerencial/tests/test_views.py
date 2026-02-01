"""
Tests de Views para Dashboard Gerencial - Analytics
===================================================

Tests de API para:
- VistaDashboardViewSet: CRUD, acciones mis_favoritos, agregar_favorito
- WidgetDashboardViewSet: CRUD y filtros
- FavoritoDashboardViewSet: Gestión de favoritos

Total de tests: 7
Cobertura: Todos los endpoints y acciones principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from rest_framework import status

from apps.analytics.dashboard_gerencial.models import (
    VistaDashboard,
    WidgetDashboard,
    FavoritoDashboard
)


@pytest.mark.django_db
class TestVistaDashboardViewSet:
    """Tests para VistaDashboardViewSet."""

    def test_listar_vistas_dashboard(self, api_client, vista_dashboard_financiera, vista_dashboard_procesos):
        """
        Test: Listar vistas de dashboard.

        Given: Vistas existentes
        When: GET /api/analytics/dashboard/vistas/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/dashboard-gerencial/vistas-dashboard/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_crear_vista_dashboard(self, api_client, empresa):
        """
        Test: Crear nueva vista de dashboard.

        Given: Datos válidos de vista
        When: POST /api/analytics/dashboard/vistas/
        Then: Debe crear y retornar 201
        """
        url = '/api/analytics/dashboard-gerencial/vistas-dashboard/'
        data = {
            'empresa': empresa.id,
            'codigo': 'DASH-NEW-001',
            'nombre': 'Nuevo Dashboard',
            'descripcion': 'Dashboard de prueba',
            'perspectiva_bsc': 'aprendizaje',
            'es_publica': True
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'DASH-NEW-001'

    def test_filtro_por_perspectiva(self, api_client, vista_dashboard_financiera, vista_dashboard_procesos):
        """
        Test: Filtrar vistas por perspectiva BSC.

        Given: Vistas de diferentes perspectivas
        When: GET /api/analytics/dashboard/vistas/?perspectiva_bsc=financiera
        Then: Debe retornar solo vistas de perspectiva financiera
        """
        url = '/api/analytics/dashboard-gerencial/vistas-dashboard/?perspectiva_bsc=financiera'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for vista in response.data['results']:
            assert vista['perspectiva_bsc'] == 'financiera'

    def test_accion_mis_favoritos(self, api_client, favorito_dashboard, favorito_default):
        """
        Test: Acción customizada mis_favoritos.

        Given: Usuario con dashboards favoritos
        When: GET /api/analytics/dashboard/vistas/mis_favoritos/
        Then: Debe retornar solo favoritos del usuario
        """
        url = '/api/analytics/dashboard-gerencial/vistas-dashboard/mis_favoritos/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_accion_agregar_favorito(self, api_client, usuario, vista_dashboard_financiera):
        """
        Test: Acción agregar_favorito.

        Given: Vista no marcada como favorita
        When: POST /api/analytics/dashboard/vistas/{id}/agregar_favorito/
        Then: Debe crear favorito y retornar success
        """
        url = f'/api/analytics/dashboard-gerencial/vistas-dashboard/{vista_dashboard_financiera.id}/agregar_favorito/'
        data = {'es_default': False}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['created'] is True

        # Verificar que se creó el favorito
        assert FavoritoDashboard.objects.filter(
            usuario=usuario,
            vista=vista_dashboard_financiera
        ).exists()

    def test_agregar_favorito_como_default(self, api_client, usuario, vista_dashboard_procesos):
        """
        Test: Agregar favorito marcado como default.

        Given: Vista y usuario
        When: POST /api/analytics/dashboard/vistas/{id}/agregar_favorito/ con es_default=True
        Then: Debe crear favorito default
        """
        url = f'/api/analytics/dashboard-gerencial/vistas-dashboard/{vista_dashboard_procesos.id}/agregar_favorito/'
        data = {'es_default': True}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

        # Verificar que es default
        favorito = FavoritoDashboard.objects.get(
            usuario=usuario,
            vista=vista_dashboard_procesos
        )
        assert favorito.es_default is True


@pytest.mark.django_db
class TestWidgetDashboardViewSet:
    """Tests para WidgetDashboardViewSet."""

    def test_crear_widget(self, api_client, empresa, vista_dashboard_financiera, kpi_financiero):
        """
        Test: Crear widget de dashboard.

        Given: Vista de dashboard existente
        When: POST /api/analytics/dashboard/widgets/
        Then: Debe crear widget y retornar 201
        """
        url = '/api/analytics/dashboard-gerencial/widgets-dashboard/'
        data = {
            'empresa': empresa.id,
            'vista': vista_dashboard_financiera.id,
            'tipo_widget': 'gauge',
            'titulo': 'Gauge Test',
            'kpis': [kpi_financiero.id],
            'configuracion': {'min': 0, 'max': 100},
            'posicion_x': 0,
            'posicion_y': 1,
            'ancho': 6,
            'alto': 2
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['titulo'] == 'Gauge Test'
        assert response.data['tipo_widget'] == 'gauge'

    def test_listar_widgets(self, api_client, widget_kpi_card, widget_grafico_linea):
        """
        Test: Listar widgets de dashboard.

        Given: Widgets existentes
        When: GET /api/analytics/dashboard/widgets/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/dashboard-gerencial/widgets-dashboard/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_filtro_por_vista(self, api_client, widget_kpi_card, widget_grafico_linea, vista_dashboard_financiera):
        """
        Test: Filtrar widgets por vista.

        Given: Widgets de diferentes vistas
        When: GET /api/analytics/dashboard/widgets/?vista={id}
        Then: Debe retornar solo widgets de esa vista
        """
        url = f'/api/analytics/dashboard-gerencial/widgets-dashboard/?vista={vista_dashboard_financiera.id}'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for widget in response.data['results']:
            assert widget['vista'] == vista_dashboard_financiera.id


@pytest.mark.django_db
class TestFavoritoDashboardViewSet:
    """Tests para FavoritoDashboardViewSet."""

    def test_listar_favoritos_solo_usuario_actual(self, api_client, favorito_dashboard, otro_usuario, vista_dashboard_procesos):
        """
        Test: Listar solo favoritos del usuario actual.

        Given: Favoritos de diferentes usuarios
        When: GET /api/analytics/dashboard/favoritos/
        Then: Debe retornar solo favoritos del usuario autenticado
        """
        # Crear favorito de otro usuario
        FavoritoDashboard.objects.create(
            usuario=otro_usuario,
            vista=vista_dashboard_procesos,
            es_default=False
        )

        url = '/api/analytics/dashboard-gerencial/favoritos-dashboard/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Todos los favoritos deben ser del usuario actual
        for fav in response.data['results']:
            assert fav['usuario'] == favorito_dashboard.usuario.id
