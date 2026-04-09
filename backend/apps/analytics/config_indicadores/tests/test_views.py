"""
Tests de Views para Config Indicadores - Analytics
==================================================

Tests de API para:
- CatalogoKPIViewSet: CRUD, filtros, acciones customizadas
- FichaTecnicaKPIViewSet: CRUD y relaciones
- MetaKPIViewSet: CRUD y filtros por período
- ConfiguracionSemaforoViewSet: CRUD

Total de tests: 10
Cobertura: Todos los endpoints y acciones principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from rest_framework import status
from django.urls import reverse

from apps.analytics.config_indicadores.models import (
    CatalogoKPI,
    FichaTecnicaKPI,
    MetaKPI,
    ConfiguracionSemaforo
)


@pytest.mark.django_db
class TestCatalogoKPIViewSet:
    """Tests para CatalogoKPIViewSet."""

    def test_listar_kpis(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Listar todos los KPIs.

        Given: KPIs existentes en la base de datos
        When: GET /api/analytics/config/kpis/
        Then: Debe retornar lista de KPIs con status 200
        """
        url = '/api/analytics/config-indicadores/catalogo-kpis/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Verificar que existen al menos los 2 KPIs creados
        assert len(response.data['results']) >= 2

    def test_crear_kpi(self, authenticated_client, empresa):
        """
        Test: Crear nuevo KPI.

        Given: Datos válidos de KPI
        When: POST /api/analytics/config/kpis/
        Then: Debe crear el KPI y retornar 201
        """
        url = '/api/analytics/config-indicadores/catalogo-kpis/'
        data = {
            'empresa': empresa.id,
            'codigo': 'KPI-NEW-001',
            'nombre': 'Nuevo KPI Test',
            'descripcion': 'Descripción de prueba',
            'tipo_indicador': 'eficacia',
            'categoria': 'calidad',
            'frecuencia_medicion': 'mensual',
            'unidad_medida': '%',
            'es_mayor_mejor': True
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'KPI-NEW-001'
        assert response.data['nombre'] == 'Nuevo KPI Test'

    def test_actualizar_kpi(self, authenticated_client, catalogo_kpi):
        """
        Test: Actualizar KPI existente.

        Given: KPI existente
        When: PATCH /api/analytics/config/kpis/{id}/
        Then: Debe actualizar y retornar 200
        """
        url = f'/api/analytics/config-indicadores/catalogo-kpis/{catalogo_kpi.id}/'
        data = {
            'nombre': 'Nombre Actualizado',
            'descripcion': 'Descripción actualizada'
        }
        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre'] == 'Nombre Actualizado'

        # Verificar en BD
        catalogo_kpi.refresh_from_db()
        assert catalogo_kpi.nombre == 'Nombre Actualizado'

    def test_eliminar_kpi_soft_delete(self, authenticated_client, catalogo_kpi):
        """
        Test: Eliminar KPI (soft delete).

        Given: KPI existente activo
        When: DELETE /api/analytics/config/kpis/{id}/
        Then: Debe marcar is_active=False
        """
        url = f'/api/analytics/config-indicadores/catalogo-kpis/{catalogo_kpi.id}/'
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verificar soft delete
        catalogo_kpi.refresh_from_db()
        assert catalogo_kpi.is_active is False

    def test_filtro_por_categoria(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Filtrar KPIs por categoría.

        Given: KPIs de diferentes categorías
        When: GET /api/analytics/config/kpis/?categoria=sst
        Then: Debe retornar solo KPIs de categoría SST
        """
        url = '/api/analytics/config-indicadores/catalogo-kpis/?categoria=sst'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Todos los resultados deben ser categoría SST
        for kpi in response.data['results']:
            assert kpi['categoria'] == 'sst'

    def test_filtro_por_tipo_indicador(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Filtrar KPIs por tipo de indicador.

        Given: KPIs de diferentes tipos
        When: GET /api/analytics/config/kpis/?tipo_indicador=eficiencia
        Then: Debe retornar solo KPIs de tipo eficiencia
        """
        url = '/api/analytics/config-indicadores/catalogo-kpis/?tipo_indicador=eficiencia'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for kpi in response.data['results']:
            assert kpi['tipo_indicador'] == 'eficiencia'

    def test_accion_por_categoria(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero, catalogo_kpi_calidad):
        """
        Test: Acción customizada por_categoria.

        Given: KPIs de diferentes categorías
        When: GET /api/analytics/config/kpis/por_categoria/
        Then: Debe retornar KPIs agrupados por categoría con conteo
        """
        url = '/api/analytics/config-indicadores/catalogo-kpis/por_categoria/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

        # Verificar estructura de respuesta
        categorias = [item['categoria'] for item in response.data]
        assert 'sst' in categorias or 'financiero' in categorias


@pytest.mark.django_db
class TestFichaTecnicaKPIViewSet:
    """Tests para FichaTecnicaKPIViewSet."""

    def test_crear_ficha_tecnica(self, authenticated_client, empresa, catalogo_kpi, cargo_medicion, cargo_analisis):
        """
        Test: Crear ficha técnica de KPI.

        Given: KPI sin ficha técnica
        When: POST /api/analytics/config/fichas-tecnicas/
        Then: Debe crear la ficha y retornar 201
        """
        url = '/api/analytics/config-indicadores/fichas-tecnicas/'
        data = {
            'empresa': empresa.id,
            'kpi': catalogo_kpi.id,
            'objetivo': 'Objetivo de test',
            'formula': '(A / B) * 100',
            'variables': {'A': 'Variable A', 'B': 'Variable B'},
            'fuente_datos': 'Sistema de gestión',
            'responsable_medicion': cargo_medicion.id,
            'responsable_analisis': cargo_analisis.id,
            'fecha_inicio_medicion': date.today().isoformat(),
            'notas': 'Notas de prueba'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['objetivo'] == 'Objetivo de test'
        assert response.data['kpi'] == catalogo_kpi.id

    def test_listar_fichas_tecnicas(self, authenticated_client, ficha_tecnica):
        """
        Test: Listar fichas técnicas.

        Given: Fichas técnicas existentes
        When: GET /api/analytics/config/fichas-tecnicas/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/config-indicadores/fichas-tecnicas/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestMetaKPIViewSet:
    """Tests para MetaKPIViewSet."""

    def test_crear_meta_kpi(self, authenticated_client, empresa, catalogo_kpi):
        """
        Test: Crear meta de KPI.

        Given: KPI existente
        When: POST /api/analytics/config/metas/
        Then: Debe crear la meta y retornar 201
        """
        url = '/api/analytics/config-indicadores/metas-kpi/'
        data = {
            'empresa': empresa.id,
            'kpi': catalogo_kpi.id,
            'periodo_inicio': '2025-01-01',
            'periodo_fin': '2025-12-31',
            'valor_meta': '5.00',
            'valor_minimo_aceptable': '10.00',
            'valor_satisfactorio': '5.00',
            'valor_sobresaliente': '2.00'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data['valor_meta']) == Decimal('5.00')

    def test_listar_metas(self, authenticated_client, meta_kpi):
        """
        Test: Listar metas de KPIs.

        Given: Metas existentes
        When: GET /api/analytics/config/metas/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/config-indicadores/metas-kpi/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestConfiguracionSemaforoViewSet:
    """Tests para ConfiguracionSemaforoViewSet."""

    def test_crear_configuracion_semaforo(self, authenticated_client, empresa, catalogo_kpi_calidad):
        """
        Test: Crear configuración de semáforo.

        Given: KPI sin configuración de semáforo
        When: POST /api/analytics/config/semaforos/
        Then: Debe crear configuración y retornar 201
        """
        url = '/api/analytics/config-indicadores/configuraciones-semaforo/'
        data = {
            'empresa': empresa.id,
            'kpi': catalogo_kpi_calidad.id,
            'umbral_verde_min': '0.00',
            'umbral_verde_max': '2.00',
            'umbral_amarillo_min': '2.01',
            'umbral_amarillo_max': '5.00',
            'umbral_rojo_min': '5.01',
            'umbral_rojo_max': None
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data['umbral_verde_max']) == Decimal('2.00')

    def test_listar_configuraciones_semaforo(self, authenticated_client, semaforo_config):
        """
        Test: Listar configuraciones de semáforo.

        Given: Configuraciones existentes
        When: GET /api/analytics/config/semaforos/
        Then: Debe retornar lista con status 200
        """
        url = '/api/analytics/config-indicadores/configuraciones-semaforo/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
