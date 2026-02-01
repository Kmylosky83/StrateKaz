"""
Tests de Views para IPEVR
==========================

Tests unitarios para:
- ClasificacionPeligroViewSet
- PeligroGTC45ViewSet
- MatrizIPEVRViewSet (CRUD, resumen, criticos, filtros)
- ControlSSTViewSet

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
import pytest
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.motor_riesgos.ipevr.models import (
    ClasificacionPeligro,
    PeligroGTC45,
    MatrizIPEVR,
    ControlSST
)


@pytest.fixture
def api_client():
    """Fixture para cliente de API."""
    return APIClient()


@pytest.fixture
def api_client_autenticado(api_client, usuario_test):
    """Fixture para cliente de API autenticado."""
    api_client.force_authenticate(user=usuario_test)
    return api_client


@pytest.mark.django_db
class TestClasificacionPeligroViewSet:
    """Tests para ClasificacionPeligroViewSet."""

    def test_listar_clasificaciones(
        self,
        api_client_autenticado,
        clasificacion_biologico,
        clasificacion_fisico
    ):
        """Test: Listar clasificaciones de peligros."""
        url = '/api/motor-riesgos/ipevr/clasificaciones-peligro/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_crear_clasificacion(self, api_client_autenticado):
        """Test: Crear nueva clasificacion de peligro."""
        url = '/api/motor-riesgos/ipevr/clasificaciones-peligro/'
        data = {
            'codigo': 'TEST',
            'nombre': 'Test Clasificacion',
            'categoria': ClasificacionPeligro.Categoria.BIOLOGICO,
            'descripcion': 'Test descripcion',
            'color': '#FF0000',
            'orden': 1
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'TEST'
        assert response.data['nombre'] == 'Test Clasificacion'

    def test_obtener_clasificacion(self, api_client_autenticado, clasificacion_biologico):
        """Test: Obtener detalle de clasificacion."""
        url = f'/api/motor-riesgos/ipevr/clasificaciones-peligro/{clasificacion_biologico.id}/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == 'BIO'
        assert response.data['nombre'] == 'Biologico'

    def test_actualizar_clasificacion(self, api_client_autenticado, clasificacion_biologico):
        """Test: Actualizar clasificacion."""
        url = f'/api/motor-riesgos/ipevr/clasificaciones-peligro/{clasificacion_biologico.id}/'
        data = {
            'codigo': 'BIO',
            'nombre': 'Biologico Actualizado',
            'categoria': ClasificacionPeligro.Categoria.BIOLOGICO,
            'color': '#FF0000',
            'orden': 1
        }
        response = api_client_autenticado.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre'] == 'Biologico Actualizado'

    def test_eliminar_clasificacion(self, api_client_autenticado, clasificacion_biologico):
        """Test: Eliminar (soft delete) clasificacion."""
        url = f'/api/motor-riesgos/ipevr/clasificaciones-peligro/{clasificacion_biologico.id}/'
        response = api_client_autenticado.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        clasificacion_biologico.refresh_from_db()
        assert clasificacion_biologico.is_active is False

    def test_filtrar_por_categoria(
        self,
        api_client_autenticado,
        clasificacion_biologico,
        clasificacion_fisico
    ):
        """Test: Filtrar clasificaciones por categoria."""
        url = f'/api/motor-riesgos/ipevr/clasificaciones-peligro/?categoria={ClasificacionPeligro.Categoria.BIOLOGICO}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert all(
            item['categoria'] == ClasificacionPeligro.Categoria.BIOLOGICO
            for item in response.data['results']
        )

    def test_buscar_clasificacion(self, api_client_autenticado, clasificacion_biologico):
        """Test: Buscar clasificacion por nombre o codigo."""
        url = '/api/motor-riesgos/ipevr/clasificaciones-peligro/?search=BIO'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_accion_por_categoria(
        self,
        api_client_autenticado,
        clasificacion_biologico,
        clasificacion_fisico
    ):
        """Test: Accion personalizada por_categoria."""
        url = '/api/motor-riesgos/ipevr/clasificaciones-peligro/por_categoria/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'biologico' in response.data
        assert 'fisico' in response.data

    def test_sin_autenticacion(self, api_client, clasificacion_biologico):
        """Test: Acceso sin autenticacion debe fallar."""
        url = '/api/motor-riesgos/ipevr/clasificaciones-peligro/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestPeligroGTC45ViewSet:
    """Tests para PeligroGTC45ViewSet."""

    def test_listar_peligros(
        self,
        api_client_autenticado,
        peligro_virus,
        peligro_ruido
    ):
        """Test: Listar peligros GTC-45."""
        url = '/api/motor-riesgos/ipevr/peligros-gtc45/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_crear_peligro(
        self,
        api_client_autenticado,
        clasificacion_biologico
    ):
        """Test: Crear nuevo peligro GTC-45."""
        url = '/api/motor-riesgos/ipevr/peligros-gtc45/'
        data = {
            'clasificacion': clasificacion_biologico.id,
            'codigo': 'BIO-TEST',
            'nombre': 'Test Peligro',
            'descripcion': 'Test descripcion',
            'efectos_posibles': 'Test efectos',
            'orden': 1
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'BIO-TEST'

    def test_obtener_peligro(self, api_client_autenticado, peligro_virus):
        """Test: Obtener detalle de peligro."""
        url = f'/api/motor-riesgos/ipevr/peligros-gtc45/{peligro_virus.id}/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == 'BIO-001'
        assert response.data['nombre'] == 'Virus'

    def test_filtrar_por_clasificacion(
        self,
        api_client_autenticado,
        peligro_virus,
        clasificacion_biologico
    ):
        """Test: Filtrar peligros por clasificacion."""
        url = f'/api/motor-riesgos/ipevr/peligros-gtc45/?clasificacion={clasificacion_biologico.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_accion_por_clasificacion(
        self,
        api_client_autenticado,
        peligro_virus,
        peligro_ruido
    ):
        """Test: Accion personalizada por_clasificacion."""
        url = '/api/motor-riesgos/ipevr/peligros-gtc45/por_clasificacion/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Debe tener grupos por clasificacion
        assert len(response.data) > 0


@pytest.mark.django_db
class TestMatrizIPEVRViewSet:
    """Tests para MatrizIPEVRViewSet."""

    def test_listar_matrices(
        self,
        api_client_autenticado,
        matriz_ipevr_critica,
        matriz_ipevr_alta
    ):
        """Test: Listar matrices IPEVR."""
        url = '/api/motor-riesgos/ipevr/matrices/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_crear_matriz(
        self,
        api_client_autenticado,
        empresa_test,
        peligro_virus,
        usuario_test
    ):
        """Test: Crear nueva matriz IPEVR."""
        url = '/api/motor-riesgos/ipevr/matrices/'
        data = {
            'empresa_id': empresa_test.id,
            'area': 'Test Area',
            'cargo': 'Test Cargo',
            'proceso': 'Test Proceso',
            'actividad': 'Test Actividad',
            'tarea': 'Test Tarea',
            'rutinaria': True,
            'peligro': peligro_virus.id,
            'fuente': 'Test Fuente',
            'medio': 'Test Medio',
            'trabajador': 'Test Trabajador',
            'efectos': 'Test Efectos',
            'nivel_deficiencia': 6,
            'nivel_exposicion': 3,
            'nivel_consecuencia': 25,
            'num_expuestos': 5,
            'peor_consecuencia': 'Test Consecuencia',
            'fecha_valoracion': date.today().isoformat()
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['area'] == 'Test Area'
        # Verificar calculos automaticos
        assert response.data['nivel_probabilidad'] == 18  # 6 * 3
        assert response.data['nivel_riesgo'] == 450  # 18 * 25

    def test_obtener_matriz(self, api_client_autenticado, matriz_ipevr_critica):
        """Test: Obtener detalle de matriz IPEVR."""
        url = f'/api/motor-riesgos/ipevr/matrices/{matriz_ipevr_critica.id}/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['area'] == 'Laboratorio'
        assert response.data['nivel_probabilidad'] == 40
        assert response.data['nivel_riesgo'] == 4000
        assert response.data['interpretacion_nr'] == 'I'
        assert response.data['aceptabilidad'] == 'no_aceptable'

    def test_actualizar_matriz(self, api_client_autenticado, matriz_ipevr_critica):
        """Test: Actualizar matriz IPEVR."""
        url = f'/api/motor-riesgos/ipevr/matrices/{matriz_ipevr_critica.id}/'
        data = {
            'nivel_deficiencia': 6  # Cambiar de 10 a 6
        }
        response = api_client_autenticado.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        # Verificar recalculo
        assert response.data['nivel_probabilidad'] == 24  # 6 * 4

    def test_filtrar_por_area(
        self,
        api_client_autenticado,
        matriz_ipevr_critica,
        matriz_ipevr_alta
    ):
        """Test: Filtrar matrices por area."""
        url = '/api/motor-riesgos/ipevr/matrices/?area=Laboratorio'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert all(
            item['area'] == 'Laboratorio'
            for item in response.data['results']
        )

    def test_filtrar_por_cargo(
        self,
        api_client_autenticado,
        matriz_ipevr_critica,
        matriz_ipevr_media
    ):
        """Test: Filtrar matrices por cargo."""
        url = '/api/motor-riesgos/ipevr/matrices/?cargo=Tecnico de Laboratorio'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filtrar_por_estado(
        self,
        api_client_autenticado,
        matriz_ipevr_critica,
        matriz_ipevr_alta
    ):
        """Test: Filtrar matrices por estado."""
        url = f'/api/motor-riesgos/ipevr/matrices/?estado={MatrizIPEVR.EstadoMatriz.VIGENTE}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert all(
            item['estado'] == MatrizIPEVR.EstadoMatriz.VIGENTE
            for item in response.data['results']
        )

    def test_buscar_matrices(self, api_client_autenticado, matriz_ipevr_critica):
        """Test: Buscar matrices por texto."""
        url = '/api/motor-riesgos/ipevr/matrices/?search=Laboratorio'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_accion_resumen(
        self,
        api_client_autenticado,
        empresa_test,
        matriz_ipevr_critica,
        matriz_ipevr_alta,
        matriz_ipevr_media,
        matriz_ipevr_baja
    ):
        """Test: Accion resumen de matrices."""
        url = f'/api/motor-riesgos/ipevr/matrices/resumen/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'vigentes' in response.data
        assert 'borradores' in response.data
        assert 'total_expuestos' in response.data
        assert 'por_estado' in response.data
        assert 'por_area' in response.data
        assert 'por_cargo' in response.data
        assert response.data['total'] >= 4

    def test_accion_criticos(
        self,
        api_client_autenticado,
        empresa_test,
        matriz_ipevr_critica,
        matriz_ipevr_alta,
        matriz_ipevr_baja
    ):
        """Test: Accion criticos (niveles I y II)."""
        url = f'/api/motor-riesgos/ipevr/matrices/criticos/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # critica y alta
        # Verificar que todos tienen NR >= 150
        for item in response.data:
            assert item['nivel_riesgo'] >= 150

    def test_accion_por_area(
        self,
        api_client_autenticado,
        empresa_test,
        matriz_ipevr_critica,
        matriz_ipevr_alta,
        matriz_ipevr_media
    ):
        """Test: Accion por_area."""
        url = f'/api/motor-riesgos/ipevr/matrices/por_area/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        # Debe tener estructura area + total
        for item in response.data:
            assert 'area' in item
            assert 'total' in item

    def test_accion_por_cargo(
        self,
        api_client_autenticado,
        empresa_test,
        matriz_ipevr_critica,
        matriz_ipevr_alta
    ):
        """Test: Accion por_cargo."""
        url = f'/api/motor-riesgos/ipevr/matrices/por_cargo/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_accion_por_peligro(
        self,
        api_client_autenticado,
        empresa_test,
        matriz_ipevr_critica,
        matriz_ipevr_alta
    ):
        """Test: Accion por_peligro."""
        url = f'/api/motor-riesgos/ipevr/matrices/por_peligro/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_accion_cambiar_estado(
        self,
        api_client_autenticado,
        matriz_ipevr_critica
    ):
        """Test: Accion cambiar_estado."""
        url = f'/api/motor-riesgos/ipevr/matrices/{matriz_ipevr_critica.id}/cambiar_estado/'
        data = {
            'estado': MatrizIPEVR.EstadoMatriz.EN_REVISION
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == MatrizIPEVR.EstadoMatriz.EN_REVISION

    def test_accion_cambiar_estado_invalido(
        self,
        api_client_autenticado,
        matriz_ipevr_critica
    ):
        """Test: Accion cambiar_estado con estado invalido."""
        url = f'/api/motor-riesgos/ipevr/matrices/{matriz_ipevr_critica.id}/cambiar_estado/'
        data = {
            'estado': 'estado_invalido'
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestControlSSTViewSet:
    """Tests para ControlSSTViewSet."""

    def test_listar_controles(
        self,
        api_client_autenticado,
        control_eliminacion,
        control_ingenieria,
        control_epp
    ):
        """Test: Listar controles SST."""
        url = '/api/motor-riesgos/ipevr/controles-sst/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 3

    def test_crear_control(
        self,
        api_client_autenticado,
        matriz_ipevr_critica,
        usuario_test
    ):
        """Test: Crear nuevo control SST."""
        url = '/api/motor-riesgos/ipevr/controles-sst/'
        data = {
            'empresa_id': matriz_ipevr_critica.empresa.id,
            'matriz_ipevr': matriz_ipevr_critica.id,
            'tipo_control': ControlSST.TipoControl.SUSTITUCION,
            'descripcion': 'Test Control',
            'estado': ControlSST.EstadoControl.PROPUESTO,
            'efectividad': ControlSST.Efectividad.NO_EVALUADA
        }
        response = api_client_autenticado.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['descripcion'] == 'Test Control'

    def test_obtener_control(self, api_client_autenticado, control_epp):
        """Test: Obtener detalle de control SST."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/{control_epp.id}/'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['tipo_control'] == ControlSST.TipoControl.EPP
        assert response.data['estado'] == ControlSST.EstadoControl.IMPLEMENTADO

    def test_actualizar_control(self, api_client_autenticado, control_eliminacion):
        """Test: Actualizar control SST."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/{control_eliminacion.id}/'
        data = {
            'estado': ControlSST.EstadoControl.EN_IMPLEMENTACION
        }
        response = api_client_autenticado.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == ControlSST.EstadoControl.EN_IMPLEMENTACION

    def test_filtrar_por_matriz(
        self,
        api_client_autenticado,
        control_eliminacion,
        matriz_ipevr_critica
    ):
        """Test: Filtrar controles por matriz IPEVR."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/?matriz_ipevr={matriz_ipevr_critica.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filtrar_por_tipo_control(
        self,
        api_client_autenticado,
        control_epp,
        control_ingenieria
    ):
        """Test: Filtrar controles por tipo."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/?tipo_control={ControlSST.TipoControl.EPP}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert all(
            item['tipo_control'] == ControlSST.TipoControl.EPP
            for item in response.data['results']
        )

    def test_filtrar_por_estado(
        self,
        api_client_autenticado,
        control_epp,
        control_eliminacion
    ):
        """Test: Filtrar controles por estado."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/?estado={ControlSST.EstadoControl.IMPLEMENTADO}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert all(
            item['estado'] == ControlSST.EstadoControl.IMPLEMENTADO
            for item in response.data['results']
        )

    def test_accion_pendientes(
        self,
        api_client_autenticado,
        empresa_test,
        control_eliminacion,
        control_ingenieria
    ):
        """Test: Accion pendientes (propuestos y en implementacion)."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/pendientes/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Debe incluir controles propuestos y en implementacion
        estados_pendientes = [
            ControlSST.EstadoControl.PROPUESTO,
            ControlSST.EstadoControl.EN_IMPLEMENTACION
        ]
        for item in response.data:
            assert item['estado'] in estados_pendientes

    def test_accion_por_tipo(
        self,
        api_client_autenticado,
        empresa_test,
        control_eliminacion,
        control_ingenieria,
        control_epp
    ):
        """Test: Accion por_tipo (estadisticas por tipo de control)."""
        url = f'/api/motor-riesgos/ipevr/controles-sst/por_tipo/?empresa={empresa_test.id}'
        response = api_client_autenticado.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        # Verificar estructura
        for item in response.data:
            assert 'tipo_control' in item
            assert 'total' in item
            assert 'implementados' in item
            assert 'verificados' in item
