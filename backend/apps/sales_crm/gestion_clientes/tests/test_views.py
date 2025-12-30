"""
Tests para views de Gestión de Clientes - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.test import APIClient
from rest_framework import status

from apps.sales_crm.gestion_clientes.models import (
    Cliente, TipoCliente, EstadoCliente, CanalVenta, ScoringCliente
)
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestClienteViewSet:
    """Tests para ClienteViewSet."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests de API."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            empresa=empresa,
            first_name='Test',
            last_name='User'
        )
        tipo_cliente = TipoCliente.objects.create(
            codigo='EMPRESA',
            nombre='Empresa',
            orden=1
        )
        estado_cliente = EstadoCliente.objects.create(
            codigo='ACTIVO',
            nombre='Activo',
            color='success',
            permite_ventas=True,
            orden=1
        )
        canal_venta = CanalVenta.objects.create(
            codigo='DIRECTO',
            nombre='Venta Directa',
            orden=1
        )

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {
            'client': client,
            'empresa': empresa,
            'usuario': usuario,
            'tipo_cliente': tipo_cliente,
            'estado_cliente': estado_cliente,
            'canal_venta': canal_venta
        }

    def test_list_clientes(self, setup_data):
        """Test listar clientes."""
        data = setup_data

        # Crear algunos clientes
        for i in range(3):
            Cliente.objects.create(
                empresa=data['empresa'],
                tipo_documento='NIT',
                numero_documento=f'90011111{i}-{i}',
                razon_social=f'Cliente Test {i}',
                tipo_cliente=data['tipo_cliente'],
                estado_cliente=data['estado_cliente'],
                canal_venta=data['canal_venta'],
                created_by=data['usuario']
            )

        response = data['client'].get('/api/sales-crm/clientes/clientes/')

        assert response.status_code == status.HTTP_200_OK
        # Verificar que retorna resultados (paginación o lista directa)
        if 'results' in response.data:
            assert len(response.data['results']) == 3
        else:
            assert len(response.data) == 3

    def test_create_cliente(self, setup_data):
        """Test crear cliente."""
        data = setup_data

        cliente_data = {
            'tipo_documento': 'NIT',
            'numero_documento': '900555555-5',
            'razon_social': 'Nuevo Cliente S.A.S',
            'nombre_comercial': 'Nuevo Cliente',
            'tipo_cliente': data['tipo_cliente'].id,
            'estado_cliente': data['estado_cliente'].id,
            'canal_venta': data['canal_venta'].id,
            'telefono': '3001234567',
            'email': 'cliente@test.com',
            'ciudad': 'Bogotá',
            'pais': 'Colombia'
        }

        response = data['client'].post(
            '/api/sales-crm/clientes/clientes/',
            cliente_data,
            format='json'
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['razon_social'] == 'Nuevo Cliente S.A.S'
        assert response.data['codigo_cliente'].startswith('CLI-')

    def test_retrieve_cliente(self, setup_data):
        """Test obtener detalle de cliente."""
        data = setup_data

        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        response = data['client'].get(f'/api/sales-crm/clientes/clientes/{cliente.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['razon_social'] == 'Cliente Test'
        assert 'tipo_cliente_data' in response.data
        assert 'scoring_data' in response.data

    def test_update_cliente(self, setup_data):
        """Test actualizar cliente."""
        data = setup_data

        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Original',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        update_data = {
            'razon_social': 'Cliente Actualizado',
            'tipo_documento': 'NIT',
            'numero_documento': '900111111-1',
            'tipo_cliente': data['tipo_cliente'].id,
            'estado_cliente': data['estado_cliente'].id,
            'canal_venta': data['canal_venta'].id
        }

        response = data['client'].put(
            f'/api/sales-crm/clientes/clientes/{cliente.id}/',
            update_data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['razon_social'] == 'Cliente Actualizado'

    def test_actualizar_scoring_action(self, setup_data):
        """Test acción de actualizar scoring."""
        data = setup_data

        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            fecha_primera_compra=date.today() - timedelta(days=365),
            total_compras_acumulado=Decimal('10000000.00'),
            cantidad_pedidos=10,
            created_by=data['usuario']
        )

        response = data['client'].post(
            f'/api/sales-crm/clientes/clientes/{cliente.id}/actualizar_scoring/'
        )

        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'scoring' in response.data
        assert response.data['scoring']['puntuacion_total'] is not None

    def test_dashboard_action(self, setup_data):
        """Test acción de dashboard."""
        data = setup_data

        # Crear varios clientes con diferentes características
        for i in range(5):
            Cliente.objects.create(
                empresa=data['empresa'],
                tipo_documento='NIT',
                numero_documento=f'90011111{i}-{i}',
                razon_social=f'Cliente {i}',
                tipo_cliente=data['tipo_cliente'],
                estado_cliente=data['estado_cliente'],
                canal_venta=data['canal_venta'],
                total_compras_acumulado=Decimal(str(1000000 * (i + 1))),
                cantidad_pedidos=i + 1,
                created_by=data['usuario']
            )

        response = data['client'].get('/api/sales-crm/clientes/clientes/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert 'resumen' in response.data
        assert 'por_estado' in response.data
        assert 'por_tipo' in response.data
        assert 'top_clientes' in response.data
        assert 'scoring' in response.data
        assert response.data['resumen']['total_clientes'] == 5

    def test_filter_by_tipo_cliente(self, setup_data):
        """Test filtrar clientes por tipo."""
        data = setup_data

        # Crear otro tipo de cliente
        tipo_distribuidor = TipoCliente.objects.create(
            codigo='DISTRIBUIDOR',
            nombre='Distribuidor',
            orden=2
        )

        # Crear clientes de diferentes tipos
        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Empresa Cliente',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Distribuidor Cliente',
            tipo_cliente=tipo_distribuidor,
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        response = data['client'].get(
            f'/api/sales-crm/clientes/clientes/?tipo_cliente={data["tipo_cliente"].id}'
        )

        assert response.status_code == status.HTTP_200_OK

        # Verificar que solo retorna clientes del tipo especificado
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 1
        assert results[0]['tipo_cliente'] == data['tipo_cliente'].id

    def test_search_clientes(self, setup_data):
        """Test buscar clientes por diferentes campos."""
        data = setup_data

        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900123456-7',
            razon_social='Búsqueda Test S.A.S',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        # Buscar por razón social
        response = data['client'].get('/api/sales-crm/clientes/clientes/?search=Búsqueda')

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) > 0
        assert 'Búsqueda' in results[0]['razon_social']

    def test_multi_tenant_isolation(self, setup_data):
        """Test aislamiento multi-tenant."""
        data = setup_data

        # Crear otra empresa
        empresa2 = EmpresaConfig.objects.create(
            razon_social='Company 2',
            nit='900987654-3'
        )

        usuario2 = Usuario.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='pass123',
            empresa=empresa2
        )

        # Crear cliente en empresa 1
        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Empresa 1',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=data['usuario']
        )

        # Crear cliente en empresa 2
        Cliente.objects.create(
            empresa=empresa2,
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Cliente Empresa 2',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            created_by=usuario2
        )

        # Usuario de empresa 1 solo debe ver clientes de empresa 1
        response = data['client'].get('/api/sales-crm/clientes/clientes/')

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 1
        assert results[0]['razon_social'] == 'Cliente Empresa 1'

    def test_cliente_historial_compras(self, setup_data):
        """Test obtener historial de compras del cliente."""
        data = setup_data

        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            fecha_primera_compra=date.today() - timedelta(days=365),
            ultima_compra=date.today() - timedelta(days=30),
            total_compras_acumulado=Decimal('5000000.00'),
            cantidad_pedidos=5,
            created_by=data['usuario']
        )

        response = data['client'].get(
            f'/api/sales-crm/clientes/clientes/{cliente.id}/historial_compras/'
        )

        assert response.status_code == status.HTTP_200_OK
        assert 'total_compras' in response.data
        assert 'cantidad_pedidos' in response.data
        assert 'ticket_promedio' in response.data
        assert 'dias_sin_comprar' in response.data
        assert response.data['cantidad_pedidos'] == 5
        assert response.data['dias_sin_comprar'] == 30

    def test_cliente_dashboard_metricas(self, setup_data):
        """Test métricas del dashboard más detalladas."""
        data = setup_data

        # Crear clientes con diferentes características
        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Activo',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            vendedor_asignado=data['usuario'],
            total_compras_acumulado=Decimal('10000000.00'),
            cantidad_pedidos=10,
            ultima_compra=date.today(),
            is_active=True,
            created_by=data['usuario']
        )

        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Cliente Inactivo',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            ultima_compra=date.today() - timedelta(days=120),
            created_by=data['usuario']
        )

        Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900333333-3',
            razon_social='Cliente Sin Compras',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            cantidad_pedidos=0,
            created_by=data['usuario']
        )

        response = data['client'].get('/api/sales-crm/clientes/clientes/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['resumen']['total_clientes'] == 3
        assert response.data['resumen']['sin_compras'] == 1
        assert response.data['resumen']['inactivos_90_dias'] >= 1
