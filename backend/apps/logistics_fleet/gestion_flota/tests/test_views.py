"""
Tests para ViewSets de Gestión de Flota
========================================

Tests completos para endpoints REST incluyendo:
- CRUD de vehículos
- Documentos vencidos y alertas PESV
- Dashboard de flota con KPIs
- Próximos mantenimientos
- Vehículos disponibles

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal

from apps.logistics_fleet.gestion_flota.models import (
    Vehiculo,
    DocumentoVehiculo,
    MantenimientoVehiculo,
    CostoOperacion,
    VerificacionTercero,
)


# ==============================================================================
# TESTS DE VEHICULO VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestVehiculoViewSet:
    """Tests para VehiculoViewSet."""

    def test_listar_vehiculos(self, authenticated_client, vehiculo):
        """Test listar vehículos."""
        url = '/api/fleet/vehiculos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_vehiculo(self, authenticated_client, empresa, tipo_vehiculo_camion, estado_disponible):
        """Test crear vehículo."""
        url = '/api/fleet/vehiculos/'
        data = {
            'empresa': empresa.id,
            'placa': 'NEW123',
            'tipo_vehiculo': tipo_vehiculo_camion.id,
            'estado': estado_disponible.id,
            'marca': 'Hino',
            'modelo': '500',
            'anio': 2022,
            'capacidad_kg': '5000.00',
            'km_actual': 0,
            'es_propio': True,
            'es_contratado': False
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['placa'] == 'NEW123'

    def test_obtener_vehiculo(self, authenticated_client, vehiculo):
        """Test obtener detalle de vehículo."""
        url = f'/api/fleet/vehiculos/{vehiculo.id}/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['placa'] == vehiculo.placa
        assert 'dias_hasta_vencimiento_soat' in response.data
        assert 'disponible_para_operar' in response.data

    def test_actualizar_vehiculo(self, authenticated_client, vehiculo):
        """Test actualizar vehículo."""
        url = f'/api/fleet/vehiculos/{vehiculo.id}/'
        data = {
            'km_actual': 51000,
            'observaciones': 'Kilometraje actualizado'
        }
        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['km_actual'] == 51000

    def test_eliminar_vehiculo(self, authenticated_client, vehiculo):
        """Test eliminación lógica de vehículo."""
        url = f'/api/fleet/vehiculos/{vehiculo.id}/'
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verificar soft delete
        vehiculo.refresh_from_db()
        assert vehiculo.deleted_at is not None

    def test_filtrar_por_tipo(self, authenticated_client, vehiculo, tipo_vehiculo_camion):
        """Test filtrar vehículos por tipo."""
        url = f'/api/fleet/vehiculos/?tipo_vehiculo={tipo_vehiculo_camion.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_estado(self, authenticated_client, vehiculo, estado_disponible):
        """Test filtrar vehículos por estado."""
        url = f'/api/fleet/vehiculos/?estado={estado_disponible.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_buscar_por_placa(self, authenticated_client, vehiculo):
        """Test buscar vehículos por placa."""
        url = f'/api/fleet/vehiculos/?search={vehiculo.placa}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


@pytest.mark.django_db
class TestVehiculoAccionesPersonalizadas:
    """Tests para acciones personalizadas de VehiculoViewSet."""

    def test_vehiculos_disponibles(self, authenticated_client, vehiculo):
        """Test endpoint de vehículos disponibles para ruta."""
        url = '/api/fleet/vehiculos/disponibles/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'results' in response.data

    def test_documentos_vencidos_default(self, authenticated_client, vehiculo_documentos_vencidos):
        """Test endpoint de documentos vencidos (30 días default)."""
        url = '/api/fleet/vehiculos/documentos_vencidos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'dias_anticipacion' in response.data
        assert response.data['dias_anticipacion'] == 30
        assert response.data['count'] >= 1

    def test_documentos_vencidos_custom_dias(self, authenticated_client, vehiculo_documentos_vencidos):
        """Test endpoint de documentos vencidos con días personalizados."""
        url = '/api/fleet/vehiculos/documentos_vencidos/?dias=60'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['dias_anticipacion'] == 60

    def test_documentos_vencidos_detalles(self, authenticated_client, vehiculo_documentos_vencidos):
        """Test detalles de documentos vencidos."""
        url = '/api/fleet/vehiculos/documentos_vencidos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        if response.data['count'] > 0:
            vehiculo_data = response.data['results'][0]
            assert 'placa' in vehiculo_data
            assert 'alertas' in vehiculo_data
            assert 'nivel_urgencia' in vehiculo_data
            assert vehiculo_data['nivel_urgencia'] in ['CRITICO', 'ADVERTENCIA']

    def test_proximos_mantenimientos(self, authenticated_client, mantenimiento_programado):
        """Test endpoint de próximos mantenimientos."""
        url = '/api/fleet/vehiculos/proximos_mantenimientos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'dias_anticipacion' in response.data
        assert response.data['count'] >= 1

    def test_proximos_mantenimientos_custom_dias(self, authenticated_client, mantenimiento_programado):
        """Test próximos mantenimientos con días personalizados."""
        url = '/api/fleet/vehiculos/proximos_mantenimientos/?dias=30'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['dias_anticipacion'] == 30

    def test_dashboard_flota(self, authenticated_client, vehiculo, mantenimiento_programado,
                            costo_combustible, verificacion_preoperacional):
        """Test endpoint de dashboard de flota."""
        url = '/api/fleet/vehiculos/dashboard/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Verificar estructura de respuesta
        assert 'totales' in response.data
        assert 'documentacion' in response.data
        assert 'mantenimientos' in response.data
        assert 'distribucion' in response.data
        assert 'costos_mes_actual' in response.data
        assert 'pesv' in response.data

        # Verificar totales
        totales = response.data['totales']
        assert 'total_vehiculos' in totales
        assert 'vehiculos_disponibles' in totales
        assert 'vehiculos_en_mantenimiento' in totales

        # Verificar documentación
        docs = response.data['documentacion']
        assert 'documentos_vencidos' in docs
        assert 'documentos_por_vencer_30_dias' in docs

        # Verificar mantenimientos
        mant = response.data['mantenimientos']
        assert 'pendientes' in mant
        assert 'vencidos' in mant

        # Verificar distribución
        dist = response.data['distribucion']
        assert 'por_tipo' in dist
        assert 'por_estado' in dist

        # Verificar costos
        costos = response.data['costos_mes_actual']
        assert 'total' in costos
        assert 'combustible' in costos
        assert 'otros' in costos

        # Verificar PESV
        pesv = response.data['pesv']
        assert 'verificaciones_hoy' in pesv
        assert 'verificaciones_rechazadas_semana' in pesv


# ==============================================================================
# TESTS DE DOCUMENTO VEHICULO VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestDocumentoVehiculoViewSet:
    """Tests para DocumentoVehiculoViewSet."""

    def test_listar_documentos(self, authenticated_client, documento_soat):
        """Test listar documentos de vehículo."""
        url = '/api/fleet/documentos-vehiculo/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_documento(self, authenticated_client, empresa, vehiculo):
        """Test crear documento de vehículo."""
        url = '/api/fleet/documentos-vehiculo/'
        data = {
            'empresa': empresa.id,
            'vehiculo': vehiculo.id,
            'tipo_documento': 'POLIZA',
            'numero_documento': 'POL-2025-001',
            'fecha_expedicion': str(date.today()),
            'fecha_vencimiento': str(date.today() + timedelta(days=365)),
            'entidad_emisora': 'Seguros Test'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['tipo_documento'] == 'POLIZA'

    def test_filtrar_por_vehiculo(self, authenticated_client, documento_soat, vehiculo):
        """Test filtrar documentos por vehículo."""
        url = f'/api/fleet/documentos-vehiculo/?vehiculo={vehiculo.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_tipo(self, authenticated_client, documento_soat):
        """Test filtrar documentos por tipo."""
        url = '/api/fleet/documentos-vehiculo/?tipo_documento=SOAT'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


# ==============================================================================
# TESTS DE MANTENIMIENTO VEHICULO VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestMantenimientoVehiculoViewSet:
    """Tests para MantenimientoVehiculoViewSet."""

    def test_listar_mantenimientos(self, authenticated_client, mantenimiento_programado):
        """Test listar mantenimientos."""
        url = '/api/fleet/mantenimientos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_mantenimiento(self, authenticated_client, empresa, vehiculo, usuario):
        """Test crear mantenimiento."""
        url = '/api/fleet/mantenimientos/'
        data = {
            'empresa': empresa.id,
            'vehiculo': vehiculo.id,
            'tipo': 'PREVENTIVO',
            'descripcion': 'Cambio de llantas',
            'fecha_programada': str(date.today() + timedelta(days=30)),
            'km_mantenimiento': 52000,
            'costo_mano_obra': '100000.00',
            'costo_repuestos': '800000.00',
            'estado': 'PROGRAMADO',
            'responsable': usuario.id
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['tipo'] == 'PREVENTIVO'
        assert response.data['costo_total'] == '900000.00'

    def test_filtrar_por_vehiculo(self, authenticated_client, mantenimiento_programado, vehiculo):
        """Test filtrar mantenimientos por vehículo."""
        url = f'/api/fleet/mantenimientos/?vehiculo={vehiculo.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_estado(self, authenticated_client, mantenimiento_programado):
        """Test filtrar mantenimientos por estado."""
        url = '/api/fleet/mantenimientos/?estado=PROGRAMADO'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_tipo(self, authenticated_client, mantenimiento_completado):
        """Test filtrar mantenimientos por tipo."""
        url = '/api/fleet/mantenimientos/?tipo=CORRECTIVO'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


# ==============================================================================
# TESTS DE COSTO OPERACION VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestCostoOperacionViewSet:
    """Tests para CostoOperacionViewSet."""

    def test_listar_costos(self, authenticated_client, costo_combustible):
        """Test listar costos de operación."""
        url = '/api/fleet/costos-operacion/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_costo_combustible(self, authenticated_client, empresa, vehiculo, usuario):
        """Test crear costo de combustible con cálculo de consumo."""
        url = '/api/fleet/costos-operacion/'
        data = {
            'empresa': empresa.id,
            'vehiculo': vehiculo.id,
            'fecha': str(date.today()),
            'tipo_costo': 'COMBUSTIBLE',
            'valor': '200000.00',
            'cantidad': '40.00',
            'km_recorridos': 400,
            'registrado_por': usuario.id
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['tipo_costo'] == 'COMBUSTIBLE'
        # Consumo debería ser 400/40 = 10 km/litro
        assert float(response.data['consumo_km_litro']) == 10.0

    def test_crear_costo_peaje(self, authenticated_client, empresa, vehiculo, usuario):
        """Test crear costo de peaje sin consumo."""
        url = '/api/fleet/costos-operacion/'
        data = {
            'empresa': empresa.id,
            'vehiculo': vehiculo.id,
            'fecha': str(date.today()),
            'tipo_costo': 'PEAJE',
            'valor': '20000.00',
            'registrado_por': usuario.id
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['tipo_costo'] == 'PEAJE'
        assert response.data['consumo_km_litro'] is None

    def test_filtrar_por_vehiculo(self, authenticated_client, costo_combustible, vehiculo):
        """Test filtrar costos por vehículo."""
        url = f'/api/fleet/costos-operacion/?vehiculo={vehiculo.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_tipo_costo(self, authenticated_client, costo_combustible):
        """Test filtrar costos por tipo."""
        url = '/api/fleet/costos-operacion/?tipo_costo=COMBUSTIBLE'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


# ==============================================================================
# TESTS DE VERIFICACION TERCERO VIEWSET (PESV)
# ==============================================================================

@pytest.mark.django_db
class TestVerificacionTerceroViewSet:
    """Tests para VerificacionTerceroViewSet."""

    def test_listar_verificaciones(self, authenticated_client, verificacion_preoperacional):
        """Test listar verificaciones PESV."""
        url = '/api/fleet/verificaciones/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_verificacion(self, authenticated_client, empresa, vehiculo, usuario_inspector):
        """Test crear verificación preoperacional."""
        url = '/api/fleet/verificaciones/'
        data = {
            'empresa': empresa.id,
            'vehiculo': vehiculo.id,
            'fecha': '2025-12-28T08:00:00Z',
            'tipo': 'PREOPERACIONAL_DIARIA',
            'inspector': usuario_inspector.id,
            'checklist_items': [
                {'item': 'Luces', 'cumple': True, 'observacion': ''},
                {'item': 'Frenos', 'cumple': True, 'observacion': ''},
            ],
            'resultado': 'APROBADO',
            'kilometraje': 50100
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['resultado'] == 'APROBADO'
        assert response.data['porcentaje_cumplimiento'] == '100.00'

    def test_filtrar_por_vehiculo(self, authenticated_client, verificacion_preoperacional, vehiculo):
        """Test filtrar verificaciones por vehículo."""
        url = f'/api/fleet/verificaciones/?vehiculo={vehiculo.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_resultado(self, authenticated_client, verificacion_rechazada):
        """Test filtrar verificaciones por resultado."""
        url = '/api/fleet/verificaciones/?resultado=RECHAZADO'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_endpoint_pendientes(self, authenticated_client, vehiculo):
        """Test endpoint de verificaciones pendientes."""
        url = '/api/fleet/verificaciones/pendientes/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'fecha' in response.data
        assert 'count' in response.data
        assert 'results' in response.data

    def test_endpoint_no_conformes(self, authenticated_client, verificacion_rechazada):
        """Test endpoint de verificaciones no conformes."""
        url = '/api/fleet/verificaciones/no_conformes/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'dias_consultados' in response.data
        assert response.data['count'] >= 1

    def test_endpoint_no_conformes_custom_dias(self, authenticated_client, verificacion_rechazada):
        """Test endpoint no conformes con días personalizados."""
        url = '/api/fleet/verificaciones/no_conformes/?dias=14'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['dias_consultados'] == 14


# ==============================================================================
# TESTS DE PERMISOS Y SEGURIDAD
# ==============================================================================

@pytest.mark.django_db
class TestPermisosYSeguridad:
    """Tests de permisos y seguridad de endpoints."""

    def test_endpoint_sin_autenticacion(self, api_client):
        """Test acceso sin autenticación."""
        url = '/api/fleet/vehiculos/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filtrado_por_empresa(self, authenticated_client, vehiculo, empresa):
        """Test que los datos se filtran por empresa del usuario."""
        url = '/api/fleet/vehiculos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Verificar que todos los vehículos retornados pertenecen a la empresa
        for vehiculo_data in response.data['results']:
            # Los vehículos deben ser de la empresa del usuario autenticado
            assert vehiculo_data['empresa'] == empresa.id
