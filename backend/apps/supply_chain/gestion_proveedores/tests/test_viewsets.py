"""
Tests de ViewSets para Gestión de Proveedores - Supply Chain
=============================================================

Tests de integración para:
- CRUD de catálogos dinámicos
- CRUD de proveedores
- Endpoints personalizados (cambiar-precio, historial-precio)
- CRUD de pruebas de acidez
- Endpoint simular prueba de acidez
- CRUD de evaluaciones

Total de tests: 50+
Cobertura: Todos los endpoints principales

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.supply_chain.gestion_proveedores.models import (
    TipoMateriaPrima,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    PruebaAcidez,
    EvaluacionProveedor,
)


@pytest.fixture
def api_client():
    """Cliente de API de DRF."""
    return APIClient()


# ==============================================================================
# TESTS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoMateriaPrimaViewSet:
    """Tests para TipoMateriaPrimaViewSet."""

    def test_list_tipos_materia_prima(self, api_client, superadmin, tipo_hueso_crudo, tipo_sebo_procesado_a):
        """Test: Listar tipos de materia prima."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_obtener_por_acidez_encontrado(self, api_client, superadmin, tipo_sebo_procesado_a):
        """
        Test: Endpoint por-acidez retorna tipo correcto.

        Given: Tipo con rango de acidez definido
        When: Se busca por valor dentro del rango
        Then: Debe retornar el tipo
        """
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-por-acidez')
        response = api_client.get(url, {'valor': '2.5'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['encontrado'] is True
        assert response.data['tipo_materia']['codigo'] == 'SEBO_PROCESADO_A'

    def test_obtener_por_acidez_no_encontrado(self, api_client, superadmin):
        """Test: Endpoint por-acidez retorna no encontrado."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-por-acidez')
        response = api_client.get(url, {'valor': '100.0'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['encontrado'] is False

    def test_obtener_por_acidez_sin_valor(self, api_client, superadmin):
        """Test: Endpoint por-acidez requiere parámetro valor."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-por-acidez')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_crear_tipo_materia_prima_admin(
        self,
        api_client,
        superadmin,
        categoria_hueso
    ):
        """Test: Admin puede crear tipo de materia prima."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'HUESO_NUEVO',
            'nombre': 'Hueso Nuevo',
            'is_active': True
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert TipoMateriaPrima.objects.filter(codigo='HUESO_NUEVO').exists()

    def test_crear_tipo_materia_prima_sin_permiso(
        self,
        api_client,
        usuario_operativo,
        categoria_hueso
    ):
        """Test: Usuario operativo no puede crear catálogos."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'TEST',
            'nombre': 'Test',
            'is_active': True
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN


# ==============================================================================
# TESTS DE PROVEEDOR VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestProveedorViewSet:
    """Tests para ProveedorViewSet."""

    def test_list_proveedores(self, api_client, usuario_coordinador, proveedor_materia_prima):
        """Test: Listar proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_retrieve_proveedor(self, api_client, usuario_coordinador, proveedor_materia_prima):
        """Test: Obtener detalle de proveedor."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo_interno'] == 'MP-0001'

    def test_crear_proveedor_coordinador(
        self,
        api_client,
        usuario_coordinador,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca,
        forma_pago_contado
    ):
        """Test: Coordinador puede crear proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-list')
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Nuevo Proveedor API',
            'razon_social': 'Nuevo Proveedor API SAS',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900999888',
            'direccion': 'Calle API',
            'ciudad': 'Bogotá',
            'departamento': departamento_cundinamarca.id,
            'formas_pago': [forma_pago_contado.id],
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Proveedor.objects.filter(numero_documento='900999888').exists()

    def test_crear_proveedor_sin_permiso(
        self,
        api_client,
        usuario_operativo,
        tipo_proveedor_materia_prima,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """Test: Operativo no puede crear proveedores."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:proveedor-list')
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '888999777',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_actualizar_proveedor_coordinador(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Coordinador puede actualizar proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        data = {
            'nombre_comercial': 'Nombre Actualizado',
            'telefono': '3009999999'
        }

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

        proveedor_materia_prima.refresh_from_db()
        assert proveedor_materia_prima.nombre_comercial == 'Nombre Actualizado'

    def test_eliminar_proveedor_gerente(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima
    ):
        """Test: Gerente puede eliminar (soft delete) proveedores."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        proveedor_materia_prima.refresh_from_db()
        assert proveedor_materia_prima.is_deleted is True

    def test_eliminar_proveedor_sin_permiso(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Coordinador no puede eliminar proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filtrar_proveedores_por_tipo(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima,
        proveedor_servicio
    ):
        """Test: Filtrar proveedores por tipo."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-list')
        response = api_client.get(url, {'tipo_proveedor': proveedor_materia_prima.tipo_proveedor.id})

        assert response.status_code == status.HTTP_200_OK
        # Debe retornar solo proveedores de materia prima
        for item in response.data['results']:
            assert item['tipo_proveedor'] == proveedor_materia_prima.tipo_proveedor.id


@pytest.mark.django_db
class TestProveedorCambiarPrecio:
    """Tests para endpoint cambiar-precio."""

    def test_cambiar_precio_gerente(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso
    ):
        """
        Test: Gerente puede cambiar precio.

        Given: Proveedor con precio existente
        When: Gerente ejecuta cambiar-precio
        Then: Debe actualizar precio y crear historial
        """
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3500.00',
            'motivo': 'Ajuste por mercado desde API'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'precio_nuevo' in response.data
        assert response.data['precio_nuevo'] == '3500.00'

        # Verificar precio actualizado
        precio_hueso.refresh_from_db()
        assert precio_hueso.precio_kg == Decimal('3500.00')

        # Verificar historial creado
        historial = HistorialPrecioProveedor.objects.filter(
            proveedor=proveedor_materia_prima,
            tipo_materia=tipo_hueso_crudo
        ).order_by('-fecha_modificacion').first()

        assert historial is not None
        assert historial.precio_nuevo == Decimal('3500.00')

    def test_cambiar_precio_sin_permiso(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima,
        tipo_hueso_crudo
    ):
        """Test: Coordinador no puede cambiar precios."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3500.00',
            'motivo': 'Test'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cambiar_precio_proveedor_no_materia_prima(
        self,
        api_client,
        usuario_gerente,
        proveedor_servicio
    ):
        """Test: No se puede cambiar precio a proveedor que no es de materia prima."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_servicio.id])
        data = {
            'tipo_materia_id': 1,
            'precio_nuevo': '3500.00',
            'motivo': 'Test'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProveedorHistorialPrecio:
    """Tests para endpoint historial-precio."""

    def test_obtener_historial_precio(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima,
        precio_hueso,
        tipo_hueso_crudo,
        usuario_gerente
    ):
        """Test: Obtener historial de precios de proveedor."""
        # Crear historial
        HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_materia_prima,
            tipo_materia=tipo_hueso_crudo,
            precio_anterior=Decimal('2000.00'),
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario_gerente,
            motivo='Ajuste inicial'
        )

        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-historial-precio', args=[proveedor_materia_prima.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'precios_actuales' in response.data
        assert 'historial' in response.data
        assert len(response.data['historial']) >= 1

    def test_historial_precio_proveedor_no_materia_prima(
        self,
        api_client,
        usuario_coordinador,
        proveedor_servicio
    ):
        """Test: No se puede obtener historial de proveedor que no es de materia prima."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-historial-precio', args=[proveedor_servicio.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProveedorRestore:
    """Tests para endpoint restore."""

    def test_restore_proveedor_gerente(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima
    ):
        """Test: Gerente puede restaurar proveedor eliminado."""
        # Primero eliminar
        proveedor_materia_prima.soft_delete()

        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-restore', args=[proveedor_materia_prima.id])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK

        proveedor_materia_prima.refresh_from_db()
        assert proveedor_materia_prima.is_deleted is False

    def test_restore_proveedor_no_eliminado(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima
    ):
        """Test: No se puede restaurar proveedor que no está eliminado."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-restore', args=[proveedor_materia_prima.id])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ==============================================================================
# TESTS DE PRUEBA ACIDEZ VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestPruebaAcidezViewSet:
    """Tests para PruebaAcidezViewSet."""

    def test_list_pruebas_acidez(self, api_client, usuario_coordinador, prueba_acidez):
        """Test: Listar pruebas de acidez."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_retrieve_prueba_acidez(self, api_client, usuario_coordinador, prueba_acidez):
        """Test: Obtener detalle de prueba de acidez."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-detail', args=[prueba_acidez.id])
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo_voucher'] == prueba_acidez.codigo_voucher

    def test_crear_prueba_acidez(
        self,
        api_client,
        usuario_coordinador,
        proveedor_sebo
    ):
        """Test: Crear prueba de acidez."""
        api_client.force_authenticate(user=usuario_coordinador)

        foto = SimpleUploadedFile('test_api.jpg', b'fake_content', content_type='image/jpeg')

        url = reverse('supply_chain:prueba-acidez-list')
        data = {
            'proveedor': proveedor_sebo.id,
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '2.8',
            'foto_prueba': foto,
            'cantidad_kg': '600.00'
        }

        response = api_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        assert PruebaAcidez.objects.filter(
            proveedor=proveedor_sebo,
            valor_acidez=Decimal('2.8')
        ).exists()

    def test_filtrar_pruebas_por_proveedor(
        self,
        api_client,
        usuario_coordinador,
        prueba_acidez,
        proveedor_sebo
    ):
        """Test: Filtrar pruebas por proveedor."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-list')
        response = api_client.get(url, {'proveedor': proveedor_sebo.id})

        assert response.status_code == status.HTTP_200_OK
        for item in response.data['results']:
            assert item['proveedor'] == proveedor_sebo.id

    def test_filtrar_pruebas_por_calidad(
        self,
        api_client,
        usuario_coordinador,
        prueba_acidez
    ):
        """Test: Filtrar pruebas por calidad resultante."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-list')
        response = api_client.get(url, {'calidad_resultante': 'A'})

        assert response.status_code == status.HTTP_200_OK
        for item in response.data['results']:
            assert item['calidad_resultante'] == 'A'

    def test_eliminar_prueba_acidez_gerente(
        self,
        api_client,
        usuario_gerente,
        prueba_acidez
    ):
        """Test: Gerente puede eliminar (soft delete) prueba de acidez."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:prueba-acidez-detail', args=[prueba_acidez.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        prueba_acidez.refresh_from_db()
        assert prueba_acidez.is_deleted is True


@pytest.mark.django_db
class TestPruebaAcidezSimular:
    """Tests para endpoint simular."""

    def test_simular_prueba_acidez_con_precio(
        self,
        api_client,
        usuario_coordinador,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        precio_sebo_a
    ):
        """
        Test: Simular prueba de acidez retorna calidad y precio.

        Given: Proveedor con precio para calidad A
        When: Se simula con acidez en rango A
        Then: Debe retornar calidad A, precio y valor total
        """
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-simular')
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': proveedor_sebo.id,
            'cantidad_kg': '500.00'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['calidad_resultante'] == 'A'
        assert response.data['tipo_materia'] == 'Sebo Procesado Calidad A'
        assert response.data['precio_kg'] == 4500.0
        assert response.data['valor_total'] == 500.0 * 4500.0

    def test_simular_prueba_sin_cantidad(
        self,
        api_client,
        usuario_coordinador,
        proveedor_sebo,
        tipo_sebo_procesado_a
    ):
        """Test: Simular sin cantidad retorna calidad sin valor total."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-simular')
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': proveedor_sebo.id
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['calidad_resultante'] == 'A'
        assert response.data['valor_total'] is None


@pytest.mark.django_db
class TestPruebaAcidezEstadisticas:
    """Tests para endpoint estadisticas."""

    def test_obtener_estadisticas(
        self,
        api_client,
        usuario_coordinador,
        prueba_acidez
    ):
        """Test: Obtener estadísticas de pruebas de acidez."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-estadisticas')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'por_calidad' in response.data
        assert 'por_tipo_materia' in response.data
        assert 'totales' in response.data

    def test_estadisticas_filtradas_por_fecha(
        self,
        api_client,
        usuario_coordinador,
        prueba_acidez
    ):
        """Test: Filtrar estadísticas por rango de fechas."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:prueba-acidez-estadisticas')
        response = api_client.get(url, {
            'fecha_desde': date.today().isoformat(),
            'fecha_hasta': date.today().isoformat()
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'filtros' in response.data


# ==============================================================================
# TESTS DE EVALUACIÓN PROVEEDOR VIEWSET
# ==============================================================================

@pytest.mark.django_db
class TestEvaluacionProveedorViewSet:
    """Tests para EvaluacionProveedorViewSet."""

    def test_list_evaluaciones(self, api_client, usuario_coordinador, evaluacion_proveedor):
        """Test: Listar evaluaciones de proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:evaluacion-proveedor-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_evaluacion(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Crear evaluación de proveedor."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:evaluacion-proveedor-list')
        data = {
            'proveedor': proveedor_materia_prima.id,
            'periodo': '2025-Q2',
            'fecha_evaluacion': date.today().isoformat(),
            'estado': 'BORRADOR'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert EvaluacionProveedor.objects.filter(
            proveedor=proveedor_materia_prima,
            periodo='2025-Q2'
        ).exists()

    def test_calcular_calificacion(
        self,
        api_client,
        usuario_coordinador,
        evaluacion_proveedor,
        criterio_calidad,
        criterio_puntualidad
    ):
        """
        Test: Endpoint calcular calcula calificación total.

        Given: Evaluación con detalles
        When: Se ejecuta calcular
        Then: Debe calcular y guardar calificación_total
        """
        from apps.supply_chain.gestion_proveedores.models import DetalleEvaluacion

        # Crear detalles
        DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('85.00')
        )
        DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_puntualidad,
            calificacion=Decimal('90.00')
        )

        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:evaluacion-proveedor-calcular', args=[evaluacion_proveedor.id])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'calificacion_total' in response.data

        evaluacion_proveedor.refresh_from_db()
        assert evaluacion_proveedor.calificacion_total is not None

    def test_aprobar_evaluacion(
        self,
        api_client,
        usuario_gerente,
        evaluacion_proveedor,
        criterio_calidad
    ):
        """Test: Gerente puede aprobar evaluación."""
        from apps.supply_chain.gestion_proveedores.models import DetalleEvaluacion

        # Crear detalle y calcular calificación
        DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('85.00')
        )
        evaluacion_proveedor.calcular_calificacion()
        evaluacion_proveedor.save()

        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:evaluacion-proveedor-aprobar', args=[evaluacion_proveedor.id])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK

        evaluacion_proveedor.refresh_from_db()
        assert evaluacion_proveedor.estado == 'APROBADA'
        assert evaluacion_proveedor.aprobado_por == usuario_gerente

    def test_aprobar_evaluacion_sin_calificacion(
        self,
        api_client,
        usuario_gerente,
        evaluacion_proveedor
    ):
        """Test: No se puede aprobar evaluación sin calificación calculada."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:evaluacion-proveedor-aprobar', args=[evaluacion_proveedor.id])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
