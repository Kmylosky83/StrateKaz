"""
Tests para ViewSets de Gestión de Transporte
=============================================

Tests completos para endpoints REST incluyendo:
- CRUD de rutas y conductores
- Flujo completo de despacho
- Programaciones de ruta (iniciar/finalizar)
- Despachos pendientes y en tránsito
- Generación de manifiestos

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date, timedelta, time
from decimal import Decimal

from apps.logistics_fleet.gestion_transporte.models import (
    Ruta,
    Conductor,
    ProgramacionRuta,
    Despacho,
    DetalleDespacho,
    Manifiesto,
)


# ==============================================================================
# TESTS DE RUTA VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestRutaViewSet:
    """Tests para RutaViewSet."""

    def test_listar_rutas(self, authenticated_client, ruta):
        """Test listar rutas."""
        url = '/api/transport/rutas/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_ruta(self, authenticated_client, empresa, tipo_ruta_entrega):
        """Test crear ruta."""
        url = '/api/transport/rutas/'
        data = {
            'empresa': empresa.id,
            'codigo': 'RUT-002',
            'nombre': 'Ruta Bogotá - Medellín',
            'tipo_ruta': tipo_ruta_entrega.id,
            'origen_ciudad': 'Bogotá',
            'destino_ciudad': 'Medellín',
            'distancia_km': '400.00',
            'tiempo_estimado_minutos': 480
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'RUT-002'

    def test_obtener_ruta(self, authenticated_client, ruta):
        """Test obtener detalle de ruta."""
        url = f'/api/transport/rutas/{ruta.id}/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == ruta.codigo
        assert response.data['nombre'] == ruta.nombre

    def test_actualizar_ruta(self, authenticated_client, ruta):
        """Test actualizar ruta."""
        url = f'/api/transport/rutas/{ruta.id}/'
        data = {
            'distancia_km': '28.00',
            'tiempo_estimado_minutos': 70
        }
        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['distancia_km']) == 28.00

    def test_filtrar_por_tipo(self, authenticated_client, ruta, tipo_ruta_entrega):
        """Test filtrar rutas por tipo."""
        url = f'/api/transport/rutas/?tipo_ruta={tipo_ruta_entrega.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


# ==============================================================================
# TESTS DE CONDUCTOR VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestConductorViewSet:
    """Tests para ConductorViewSet."""

    def test_listar_conductores(self, authenticated_client, conductor):
        """Test listar conductores."""
        url = '/api/transport/conductores/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_conductor(self, authenticated_client, empresa):
        """Test crear conductor."""
        url = '/api/transport/conductores/'
        data = {
            'empresa': empresa.id,
            'nombre_completo': 'Luis Martínez',
            'tipo_documento': 'CC',
            'documento_identidad': '1122334455',
            'licencia_conduccion': 'C1-11223344',
            'categoria_licencia': 'C1',
            'fecha_vencimiento_licencia': str(date.today() + timedelta(days=300)),
            'es_empleado': True
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['nombre_completo'] == 'Luis Martínez'
        assert response.data['licencia_vigente'] is True

    def test_obtener_conductor(self, authenticated_client, conductor):
        """Test obtener detalle de conductor."""
        url = f'/api/transport/conductores/{conductor.id}/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre_completo'] == conductor.nombre_completo
        assert 'licencia_vigente' in response.data
        assert 'esta_activo' in response.data

    def test_conductores_disponibles(self, authenticated_client, conductor):
        """Test endpoint de conductores disponibles."""
        url = '/api/transport/conductores/disponibles/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'results' in response.data


# ==============================================================================
# TESTS DE PROGRAMACION RUTA VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestProgramacionRutaViewSet:
    """Tests para ProgramacionRutaViewSet."""

    def test_listar_programaciones(self, authenticated_client, programacion_ruta):
        """Test listar programaciones."""
        url = '/api/transport/programaciones/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_programacion(self, authenticated_client, empresa, ruta, vehiculo, conductor):
        """Test crear programación de ruta."""
        url = '/api/transport/programaciones/'
        data = {
            'empresa': empresa.id,
            'ruta': ruta.id,
            'vehiculo': vehiculo.id,
            'conductor': conductor.id,
            'fecha_programada': str(date.today() + timedelta(days=2)),
            'hora_salida_programada': '09:00:00',
            'hora_llegada_estimada': '11:00:00',
            'estado': 'PROGRAMADA'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'].startswith('PRG-')
        assert response.data['estado'] == 'PROGRAMADA'

    def test_filtrar_por_fecha(self, authenticated_client, programacion_ruta):
        """Test filtrar programaciones por fecha."""
        url = f'/api/transport/programaciones/?fecha_programada={date.today()}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_estado(self, authenticated_client, programacion_ruta):
        """Test filtrar programaciones por estado."""
        url = '/api/transport/programaciones/?estado=PROGRAMADA'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


@pytest.mark.django_db
class TestProgramacionRutaAcciones:
    """Tests para acciones personalizadas de ProgramacionRutaViewSet."""

    def test_iniciar_programacion(self, authenticated_client, programacion_ruta, vehiculo):
        """Test acción de iniciar programación."""
        url = f'/api/transport/programaciones/{programacion_ruta.id}/iniciar/'
        data = {
            'km_inicial': vehiculo.km_actual
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == 'EN_CURSO'
        assert response.data['hora_salida_real'] is not None

    def test_finalizar_programacion(self, authenticated_client, programacion_en_curso):
        """Test acción de finalizar programación."""
        km_final = programacion_en_curso.km_inicial + Decimal('25.50')
        url = f'/api/transport/programaciones/{programacion_en_curso.id}/finalizar/'
        data = {
            'km_final': str(km_final)
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == 'FINALIZADA'
        assert response.data['hora_llegada_real'] is not None
        assert response.data['km_recorridos'] is not None

    def test_cancelar_programacion(self, authenticated_client, programacion_ruta):
        """Test acción de cancelar programación."""
        url = f'/api/transport/programaciones/{programacion_ruta.id}/cancelar/'
        data = {
            'motivo_cancelacion': 'Vehículo con falla mecánica'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == 'CANCELADA'
        assert response.data['motivo_cancelacion'] is not None

    def test_programaciones_del_dia(self, authenticated_client, programacion_ruta):
        """Test endpoint de programaciones del día."""
        url = '/api/transport/programaciones/programaciones_del_dia/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'fecha' in response.data
        assert 'count' in response.data
        assert response.data['count'] >= 1

    def test_programaciones_activas(self, authenticated_client, programacion_en_curso):
        """Test endpoint de programaciones activas."""
        url = '/api/transport/programaciones/programaciones_activas/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert response.data['count'] >= 1


# ==============================================================================
# TESTS DE DESPACHO VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestDespachoViewSet:
    """Tests para DespachoViewSet."""

    def test_listar_despachos(self, authenticated_client, despacho):
        """Test listar despachos."""
        url = '/api/transport/despachos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_despacho_completo(self, authenticated_client, empresa, programacion_ruta,
                                     estado_despacho_programado):
        """Test crear despacho completo con detalles."""
        url = '/api/transport/despachos/'
        data = {
            'empresa': empresa.id,
            'programacion_ruta': programacion_ruta.id,
            'estado_despacho': estado_despacho_programado.id,
            'cliente_nombre': 'Restaurante Don José',
            'cliente_direccion': 'Avenida 15 # 30-40',
            'cliente_telefono': '3171234567',
            'peso_total_kg': '200.00',
            'valor_declarado': '3000000.00',
            'detalles': [
                {
                    'descripcion_producto': 'Grasa Industrial',
                    'cantidad': '150.00',
                    'unidad_medida': 'kg',
                    'peso_kg': '150.00'
                },
                {
                    'descripcion_producto': 'Subproductos',
                    'cantidad': '50.00',
                    'unidad_medida': 'kg',
                    'peso_kg': '50.00'
                }
            ]
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'].startswith('DESP-')
        assert response.data['cliente_nombre'] == 'Restaurante Don José'
        assert 'detalles' in response.data
        assert len(response.data['detalles']) == 2

    def test_obtener_despacho(self, authenticated_client, despacho):
        """Test obtener detalle de despacho."""
        url = f'/api/transport/despachos/{despacho.id}/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == despacho.codigo
        assert 'puede_editar' in response.data
        assert 'esta_finalizado' in response.data

    def test_actualizar_despacho(self, authenticated_client, despacho):
        """Test actualizar despacho."""
        url = f'/api/transport/despachos/{despacho.id}/'
        data = {
            'observaciones_entrega': 'Actualización: Entregar antes de las 10 AM'
        }
        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'Actualización' in response.data['observaciones_entrega']

    def test_filtrar_por_estado(self, authenticated_client, despacho, estado_despacho_programado):
        """Test filtrar despachos por estado."""
        url = f'/api/transport/despachos/?estado_despacho={estado_despacho_programado.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filtrar_por_programacion(self, authenticated_client, despacho, programacion_ruta):
        """Test filtrar despachos por programación."""
        url = f'/api/transport/despachos/?programacion_ruta={programacion_ruta.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1


@pytest.mark.django_db
class TestDespachoAcciones:
    """Tests para acciones personalizadas de DespachoViewSet."""

    def test_despachos_pendientes(self, authenticated_client, despacho):
        """Test endpoint de despachos pendientes."""
        url = '/api/transport/despachos/pendientes/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'results' in response.data

    def test_despachos_en_transito(self, authenticated_client, despacho, estado_despacho_en_transito):
        """Test endpoint de despachos en tránsito."""
        # Cambiar estado a en tránsito
        despacho.estado_despacho = estado_despacho_en_transito
        despacho.save()

        url = '/api/transport/despachos/en_transito/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_iniciar_despacho(self, authenticated_client, despacho, estado_despacho_en_transito):
        """Test acción de iniciar despacho."""
        url = f'/api/transport/despachos/{despacho.id}/iniciar/'
        response = authenticated_client.post(url, {}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_despacho']['codigo'] == 'EN_TRANSITO'

    def test_finalizar_despacho(self, authenticated_client, despacho,
                               estado_despacho_en_transito, estado_despacho_entregado):
        """Test acción de finalizar despacho."""
        # Primero iniciar
        despacho.estado_despacho = estado_despacho_en_transito
        despacho.save()

        url = f'/api/transport/despachos/{despacho.id}/finalizar/'
        data = {
            'recibido_por': 'María López',
            'observaciones_entrega': 'Entrega conforme'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado_despacho']['codigo'] == 'ENTREGADO'
        assert response.data['fecha_entrega_real'] is not None


# ==============================================================================
# TESTS DE MANIFIESTO VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestManifiestoViewSet:
    """Tests para ManifiestoViewSet."""

    def test_listar_manifiestos(self, authenticated_client, manifiesto):
        """Test listar manifiestos."""
        url = '/api/transport/manifiestos/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_crear_manifiesto(self, authenticated_client, empresa, programacion_ruta):
        """Test crear manifiesto."""
        url = '/api/transport/manifiestos/'
        data = {
            'empresa': empresa.id,
            'programacion_ruta': programacion_ruta.id,
            'remitente_nombre': 'GHN S.A.S.',
            'remitente_nit': '900123456-1',
            'destinatario_nombre': 'Cliente Test',
            'destinatario_nit': '900987654-2',
            'origen_ciudad': 'Bogotá',
            'destino_ciudad': 'Soacha',
            'descripcion_carga': 'Grasa industrial',
            'peso_kg': '100.00',
            'valor_flete': '50000.00'
        }
        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['numero_manifiesto'].startswith('MAN-')

    def test_obtener_manifiesto(self, authenticated_client, manifiesto):
        """Test obtener detalle de manifiesto."""
        url = f'/api/transport/manifiestos/{manifiesto.id}/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['numero_manifiesto'] == manifiesto.numero_manifiesto

    def test_filtrar_por_programacion(self, authenticated_client, manifiesto, programacion_ruta):
        """Test filtrar manifiestos por programación."""
        url = f'/api/transport/manifiestos/?programacion_ruta={programacion_ruta.id}'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_generar_pdf(self, authenticated_client, manifiesto):
        """Test acción de generar PDF del manifiesto."""
        url = f'/api/transport/manifiestos/{manifiesto.id}/generar_pdf/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/pdf'


# ==============================================================================
# TESTS DE PERMISOS Y SEGURIDAD
# ==============================================================================

@pytest.mark.django_db
class TestPermisosYSeguridad:
    """Tests de permisos y seguridad de endpoints."""

    def test_endpoint_sin_autenticacion(self, api_client):
        """Test acceso sin autenticación."""
        url = '/api/transport/rutas/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filtrado_por_empresa(self, authenticated_client, ruta, empresa):
        """Test que los datos se filtran por empresa del usuario."""
        url = '/api/transport/rutas/'
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Verificar que todas las rutas retornadas pertenecen a la empresa
        for ruta_data in response.data['results']:
            assert ruta_data['empresa'] == empresa.id


# ==============================================================================
# TESTS DE FLUJO COMPLETO
# ==============================================================================

@pytest.mark.django_db
class TestFlujoCompletoDespacho:
    """Tests de flujo completo de despacho desde inicio hasta entrega."""

    def test_flujo_completo_despacho(self, authenticated_client, empresa, ruta, vehiculo,
                                     conductor, tipo_ruta_entrega, estado_despacho_programado,
                                     estado_despacho_en_transito, estado_despacho_entregado):
        """Test flujo completo: crear programación -> crear despacho -> iniciar -> finalizar."""

        # 1. Crear programación de ruta
        prog_data = {
            'empresa': empresa.id,
            'ruta': ruta.id,
            'vehiculo': vehiculo.id,
            'conductor': conductor.id,
            'fecha_programada': str(date.today()),
            'hora_salida_programada': '08:00:00',
            'estado': 'PROGRAMADA'
        }
        prog_response = authenticated_client.post('/api/transport/programaciones/', prog_data, format='json')
        assert prog_response.status_code == status.HTTP_201_CREATED
        programacion_id = prog_response.data['id']

        # 2. Crear despacho asociado
        desp_data = {
            'empresa': empresa.id,
            'programacion_ruta': programacion_id,
            'estado_despacho': estado_despacho_programado.id,
            'cliente_nombre': 'Cliente Flujo Test',
            'peso_total_kg': '150.00',
            'valor_declarado': '2000000.00'
        }
        desp_response = authenticated_client.post('/api/transport/despachos/', desp_data, format='json')
        assert desp_response.status_code == status.HTTP_201_CREATED
        despacho_id = desp_response.data['id']

        # 3. Iniciar programación
        iniciar_response = authenticated_client.post(
            f'/api/transport/programaciones/{programacion_id}/iniciar/',
            {'km_inicial': str(vehiculo.km_actual)},
            format='json'
        )
        assert iniciar_response.status_code == status.HTTP_200_OK
        assert iniciar_response.data['estado'] == 'EN_CURSO'

        # 4. Iniciar despacho
        iniciar_desp_response = authenticated_client.post(
            f'/api/transport/despachos/{despacho_id}/iniciar/',
            {},
            format='json'
        )
        assert iniciar_desp_response.status_code == status.HTTP_200_OK

        # 5. Finalizar despacho
        finalizar_desp_response = authenticated_client.post(
            f'/api/transport/despachos/{despacho_id}/finalizar/',
            {
                'recibido_por': 'Cliente Test',
                'observaciones_entrega': 'Entrega exitosa'
            },
            format='json'
        )
        assert finalizar_desp_response.status_code == status.HTTP_200_OK
        assert finalizar_desp_response.data['esta_finalizado'] is True

        # 6. Finalizar programación
        finalizar_prog_response = authenticated_client.post(
            f'/api/transport/programaciones/{programacion_id}/finalizar/',
            {'km_final': str(vehiculo.km_actual + 25)},
            format='json'
        )
        assert finalizar_prog_response.status_code == status.HTTP_200_OK
        assert finalizar_prog_response.data['estado'] == 'FINALIZADA'
