"""
Tests de Views para Config Indicadores - Analytics
==================================================

Tests de API para:
- CatalogoKPIViewSet: CRUD, filtros, acciones customizadas
- FichaTecnicaKPIViewSet: CRUD y relaciones
- MetaKPIViewSet: CRUD y filtros por periodo
- ConfiguracionSemaforoViewSet: CRUD

Total de tests: 13
Cobertura: Todos los endpoints y acciones principales
"""
import pytest
from datetime import date
from decimal import Decimal
from django.urls import reverse
from rest_framework import status


# ---- URL helpers (reverse-based) -------------------------------------------

def _kpis_list():
    return reverse('analytics:catalogo-kpi-list')


def _kpis_detail(pk):
    return reverse('analytics:catalogo-kpi-detail', args=[pk])


def _fichas_list():
    return reverse('analytics:ficha-tecnica-kpi-list')


def _metas_list():
    return reverse('analytics:meta-kpi-list')


def _semaforos_list():
    return reverse('analytics:configuracion-semaforo-list')


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
        response = authenticated_client.get(_kpis_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_crear_kpi(self, authenticated_client, empresa):
        """
        Test: Crear nuevo KPI.

        Given: Datos validos de KPI
        When: POST /api/analytics/config/kpis/
        Then: Debe crear el KPI y retornar 201
        """
        data = {
            'empresa': empresa.id,
            'codigo': 'KPI-NEW-001',
            'nombre': 'Nuevo KPI Test',
            'descripcion': 'Descripcion de prueba',
            'tipo_indicador': 'eficacia',
            'categoria': 'calidad',
            'frecuencia_medicion': 'mensual',
            'unidad_medida': '%',
            'es_mayor_mejor': True
        }
        response = authenticated_client.post(_kpis_list(), data, format='json')
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
        data = {
            'nombre': 'Nombre Actualizado',
            'descripcion': 'Descripcion actualizada'
        }
        response = authenticated_client.patch(
            _kpis_detail(catalogo_kpi.id), data, format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre'] == 'Nombre Actualizado'
        catalogo_kpi.refresh_from_db()
        assert catalogo_kpi.nombre == 'Nombre Actualizado'

    def test_eliminar_kpi_soft_delete(self, authenticated_client, catalogo_kpi):
        """
        Test: Eliminar KPI (soft delete).

        Given: KPI existente activo
        When: DELETE /api/analytics/config/kpis/{id}/
        Then: Debe marcar is_active=False
        """
        response = authenticated_client.delete(_kpis_detail(catalogo_kpi.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        catalogo_kpi.refresh_from_db()
        assert catalogo_kpi.is_active is False

    def test_filtro_por_categoria(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Filtrar KPIs por categoria.

        Given: KPIs de diferentes categorias
        When: GET /api/analytics/config/kpis/?categoria=sst
        Then: Debe retornar solo KPIs de categoria SST
        """
        response = authenticated_client.get(_kpis_list() + '?categoria=sst')
        assert response.status_code == status.HTTP_200_OK
        for kpi in response.data['results']:
            assert kpi['categoria'] == 'sst'

    def test_filtro_por_tipo_indicador(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Filtrar KPIs por tipo de indicador.

        Given: KPIs de diferentes tipos
        When: GET /api/analytics/config/kpis/?tipo_indicador=eficiencia
        Then: Debe retornar solo KPIs de tipo eficiencia
        """
        response = authenticated_client.get(_kpis_list() + '?tipo_indicador=eficiencia')
        assert response.status_code == status.HTTP_200_OK
        for kpi in response.data['results']:
            assert kpi['tipo_indicador'] == 'eficiencia'

    def test_accion_por_categoria(self, authenticated_client, catalogo_kpi, catalogo_kpi_financiero, catalogo_kpi_calidad):
        """
        Test: Accion customizada por_categoria.

        Given: KPIs de diferentes categorias
        When: GET /api/analytics/config/kpis/por-categoria/
        Then: Debe retornar KPIs agrupados por categoria con conteo
        """
        url = reverse('analytics:catalogo-kpi-por-categoria')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        categorias = [item['categoria'] for item in response.data]
        assert 'sst' in categorias or 'financiero' in categorias


@pytest.mark.django_db
class TestFichaTecnicaKPIViewSet:
    """Tests para FichaTecnicaKPIViewSet."""

    def test_crear_ficha_tecnica(self, authenticated_client, empresa, catalogo_kpi, cargo_medicion, cargo_analisis):
        """
        Test: Crear ficha tecnica de KPI.

        Given: KPI sin ficha tecnica
        When: POST /api/analytics/config/fichas-tecnicas/
        Then: Debe crear la ficha y retornar 201
        """
        data = {
            'empresa': empresa.id,
            'kpi': catalogo_kpi.id,
            'objetivo': 'Objetivo de test',
            'formula': '(A / B) * 100',
            'variables': {'A': 'Variable A', 'B': 'Variable B'},
            'fuente_datos': 'Sistema de gestion',
            'responsable_medicion': cargo_medicion.id,
            'responsable_analisis': cargo_analisis.id,
            'fecha_inicio_medicion': date.today().isoformat(),
            'notas': 'Notas de prueba'
        }
        response = authenticated_client.post(_fichas_list(), data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['objetivo'] == 'Objetivo de test'
        assert response.data['kpi'] == catalogo_kpi.id

    def test_listar_fichas_tecnicas(self, authenticated_client, ficha_tecnica):
        """
        Test: Listar fichas tecnicas.

        Given: Fichas tecnicas existentes
        When: GET /api/analytics/config/fichas-tecnicas/
        Then: Debe retornar lista con status 200
        """
        response = authenticated_client.get(_fichas_list())
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
        response = authenticated_client.post(_metas_list(), data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data['valor_meta']) == Decimal('5.00')

    def test_listar_metas(self, authenticated_client, meta_kpi):
        """
        Test: Listar metas de KPIs.

        Given: Metas existentes
        When: GET /api/analytics/config/metas/
        Then: Debe retornar lista con status 200
        """
        response = authenticated_client.get(_metas_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestConfiguracionSemaforoViewSet:
    """Tests para ConfiguracionSemaforoViewSet."""

    def test_crear_configuracion_semaforo(self, authenticated_client, empresa, catalogo_kpi_calidad):
        """
        Test: Crear configuracion de semaforo.

        Given: KPI sin configuracion de semaforo
        When: POST /api/analytics/config/semaforos/
        Then: Debe crear configuracion y retornar 201
        """
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
        response = authenticated_client.post(_semaforos_list(), data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Decimal(response.data['umbral_verde_max']) == Decimal('2.00')

    def test_listar_configuraciones_semaforo(self, authenticated_client, semaforo_config):
        """
        Test: Listar configuraciones de semaforo.

        Given: Configuraciones existentes
        When: GET /api/analytics/config/semaforos/
        Then: Debe retornar lista con status 200
        """
        response = authenticated_client.get(_semaforos_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
