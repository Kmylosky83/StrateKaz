"""
Tests de Views para Indicadores Área - Analytics
================================================

Tests de API para:
- ValorKPIViewSet: CRUD, acciones registrar_valor, ultimos_valores, tendencia
- AccionPorKPIViewSet: CRUD y filtros por estado
- AlertaKPIViewSet: CRUD, acciones marcar_leida, no_leidas

Total de tests: 9
Cobertura: Todos los endpoints y acciones principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from rest_framework import status

from apps.analytics.indicadores_area.models import (
    ValorKPI,
    AccionPorKPI,
    AlertaKPI
)


@pytest.mark.django_db
class TestValorKPIViewSet:
    """Tests para ValorKPIViewSet."""

    def test_listar_valores_kpi(self, api_client, valor_kpi_verde, valor_kpi_amarillo):
        """
        Test: Listar valores de KPIs.

        Given: Valores existentes
        When: GET /api/analytics/indicadores/valores/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/indicadores-area/valores-kpi/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_accion_registrar_valor(self, api_client, empresa, kpi_sst, usuario):
        """
        Test: Acción customizada registrar_valor.

        Given: KPI existente
        When: POST /api/analytics/indicadores/valores/registrar_valor/
        Then: Debe crear valor y retornar 201
        """
        url = '/api/analytics/indicadores-area/valores-kpi/registrar_valor/'
        data = {
            'empresa': empresa.id,
            'kpi': kpi_sst.id,
            'fecha_medicion': date.today().isoformat(),
            'periodo': '2025-12',
            'valor': '4.5',
            'valor_meta': '5.0',
            'observaciones': 'Valor de prueba'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data['valor']) == Decimal('4.5')
        assert response.data['registrado_por'] == usuario.id

    def test_accion_ultimos_valores(self, api_client, kpi_sst, valor_kpi_verde, valor_kpi_amarillo, valor_kpi_rojo):
        """
        Test: Acción customizada ultimos_valores.

        Given: KPI con múltiples valores históricos
        When: GET /api/analytics/indicadores/valores/ultimos_valores/?kpi_id={id}&limit=3
        Then: Debe retornar últimos N valores
        """
        url = f'/api/analytics/indicadores-area/valores-kpi/ultimos_valores/?kpi_id={kpi_sst.id}&limit=3'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) <= 3
        # Deben estar ordenados por fecha descendente
        if len(response.data) >= 2:
            fecha1 = date.fromisoformat(response.data[0]['fecha_medicion'])
            fecha2 = date.fromisoformat(response.data[1]['fecha_medicion'])
            assert fecha1 >= fecha2

    def test_accion_ultimos_valores_sin_kpi_id(self, api_client):
        """
        Test: ultimos_valores sin parámetro kpi_id.

        Given: Request sin kpi_id
        When: GET /api/analytics/indicadores/valores/ultimos_valores/
        Then: Debe retornar error 400
        """
        url = '/api/analytics/indicadores-area/valores-kpi/ultimos_valores/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_accion_tendencia(self, api_client, kpi_sst, valor_kpi_verde, valor_kpi_amarillo, valor_kpi_rojo):
        """
        Test: Acción customizada tendencia.

        Given: KPI con valores históricos
        When: GET /api/analytics/indicadores/valores/tendencia/?kpi_id={id}
        Then: Debe retornar valores de últimos 6 meses
        """
        url = f'/api/analytics/indicadores-area/valores-kpi/tendencia/?kpi_id={kpi_sst.id}'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        # Verificar estructura de respuesta
        if len(response.data) > 0:
            assert 'periodo' in response.data[0]
            assert 'valor' in response.data[0]
            assert 'semaforo' in response.data[0]

    def test_filtro_por_kpi(self, api_client, kpi_sst, valor_kpi_verde, valor_kpi_amarillo):
        """
        Test: Filtrar valores por KPI.

        Given: Valores de diferentes KPIs
        When: GET /api/analytics/indicadores/valores/?kpi={id}
        Then: Debe retornar solo valores de ese KPI
        """
        url = f'/api/analytics/indicadores-area/valores-kpi/?kpi={kpi_sst.id}'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for valor in response.data['results']:
            assert valor['kpi'] == kpi_sst.id

    def test_filtro_por_semaforo(self, api_client, valor_kpi_verde, valor_kpi_amarillo, valor_kpi_rojo):
        """
        Test: Filtrar valores por color de semáforo.

        Given: Valores con diferentes semáforos
        When: GET /api/analytics/indicadores/valores/?semaforo=rojo
        Then: Debe retornar solo valores en rojo
        """
        url = '/api/analytics/indicadores-area/valores-kpi/?semaforo=rojo'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for valor in response.data['results']:
            assert valor['semaforo'] == 'rojo'


@pytest.mark.django_db
class TestAccionPorKPIViewSet:
    """Tests para AccionPorKPIViewSet."""

    def test_crear_accion_por_kpi(self, api_client, empresa, valor_kpi_rojo, colaborador):
        """
        Test: Crear acción por KPI.

        Given: Valor de KPI en rojo
        When: POST /api/analytics/indicadores/acciones/
        Then: Debe crear acción y retornar 201
        """
        url = '/api/analytics/indicadores-area/acciones-kpi/'
        data = {
            'empresa': empresa.id,
            'valor_kpi': valor_kpi_rojo.id,
            'tipo_accion': 'plan_mejora',
            'descripcion': 'Plan de mejora de prueba',
            'responsable': colaborador.id,
            'fecha_compromiso': (date.today() + timedelta(days=30)).isoformat(),
            'estado': 'pendiente'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['descripcion'] == 'Plan de mejora de prueba'

    def test_listar_acciones(self, api_client, accion_por_kpi, accion_completada):
        """
        Test: Listar acciones por KPI.

        Given: Acciones existentes
        When: GET /api/analytics/indicadores/acciones/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/indicadores-area/acciones-kpi/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_filtro_por_estado(self, api_client, accion_por_kpi, accion_completada):
        """
        Test: Filtrar acciones por estado.

        Given: Acciones con diferentes estados
        When: GET /api/analytics/indicadores/acciones/?estado=completada
        Then: Debe retornar solo acciones completadas
        """
        url = '/api/analytics/indicadores-area/acciones-kpi/?estado=completada'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for accion in response.data['results']:
            assert accion['estado'] == 'completada'


@pytest.mark.django_db
class TestAlertaKPIViewSet:
    """Tests para AlertaKPIViewSet."""

    def test_listar_alertas(self, api_client, alerta_umbral_rojo, alerta_sin_medicion):
        """
        Test: Listar alertas de KPIs.

        Given: Alertas existentes
        When: GET /api/analytics/indicadores/alertas/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/indicadores-area/alertas-kpi/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_accion_marcar_leida(self, api_client, usuario, alerta_umbral_rojo):
        """
        Test: Acción customizada marcar_leida.

        Given: Alerta no leída
        When: POST /api/analytics/indicadores/alertas/{id}/marcar_leida/
        Then: Debe marcar como leída
        """
        assert alerta_umbral_rojo.esta_leida is False

        url = f'/api/analytics/indicadores-area/alertas-kpi/{alerta_umbral_rojo.id}/marcar_leida/'
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

        # Verificar en BD
        alerta_umbral_rojo.refresh_from_db()
        assert alerta_umbral_rojo.esta_leida is True
        assert alerta_umbral_rojo.leida_por == usuario

    def test_accion_no_leidas(self, api_client, alerta_umbral_rojo, alerta_sin_medicion, alerta_leida):
        """
        Test: Acción customizada no_leidas.

        Given: Alertas leídas y no leídas
        When: GET /api/analytics/indicadores/alertas/no_leidas/
        Then: Debe retornar solo alertas no leídas
        """
        url = '/api/analytics/indicadores-area/alertas-kpi/no_leidas/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Todas deben estar no leídas
        for alerta in response.data:
            assert alerta['esta_leida'] is False

    def test_filtro_por_tipo_alerta(self, api_client, alerta_umbral_rojo, alerta_sin_medicion):
        """
        Test: Filtrar alertas por tipo.

        Given: Alertas de diferentes tipos
        When: GET /api/analytics/indicadores/alertas/?tipo_alerta=umbral_rojo
        Then: Debe retornar solo alertas de ese tipo
        """
        url = '/api/analytics/indicadores-area/alertas-kpi/?tipo_alerta=umbral_rojo'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for alerta in response.data['results']:
            assert alerta['tipo_alerta'] == 'umbral_rojo'

    def test_filtro_por_kpi(self, api_client, kpi_sst, alerta_umbral_rojo, alerta_sin_medicion):
        """
        Test: Filtrar alertas por KPI.

        Given: Alertas de diferentes KPIs
        When: GET /api/analytics/indicadores/alertas/?kpi={id}
        Then: Debe retornar solo alertas de ese KPI
        """
        url = f'/api/analytics/indicadores-area/alertas-kpi/?kpi={kpi_sst.id}'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for alerta in response.data['results']:
            assert alerta['kpi'] == kpi_sst.id
