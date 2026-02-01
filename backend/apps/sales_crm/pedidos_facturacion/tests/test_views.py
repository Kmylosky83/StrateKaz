"""
Tests para views de Pedidos y Facturación - Sales CRM
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.test import APIClient
from rest_framework import status

from apps.sales_crm.pedidos_facturacion.models import Pedido, Factura, EstadoPedido, CondicionPago, MetodoPago
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestPedidoViewSet:
    """Tests para PedidoViewSet."""

    @pytest.fixture
    def setup_api(self):
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='test', email='test@test.com', password='pass', empresa=empresa)
        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)
        cliente = Cliente.objects.create(
            empresa=empresa, tipo_documento='NIT', numero_documento='900111111-1',
            razon_social='Cliente Test', tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente, canal_venta=canal_venta, created_by=usuario
        )
        estado_pedido = EstadoPedido.objects.create(codigo='BORRADOR', nombre='Borrador', orden=1)
        estado_aprobado = EstadoPedido.objects.create(codigo='APROBADO', nombre='Aprobado', permite_facturar=True, orden=2)
        condicion_pago = CondicionPago.objects.create(codigo='30_DIAS', nombre='30 Días', dias_plazo=30, orden=1)

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {
            'client': client, 'empresa': empresa, 'usuario': usuario, 'cliente': cliente,
            'estado': estado_pedido, 'estado_aprobado': estado_aprobado, 'condicion': condicion_pago
        }

    def test_list_pedidos(self, setup_api):
        """Test listar pedidos."""
        data = setup_api

        for i in range(2):
            Pedido.objects.create(
                empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
                estado=data['estado'], condicion_pago=data['condicion'],
                direccion_entrega=f'Calle {i}', created_by=data['usuario']
            )

        response = data['client'].get('/api/sales-crm/pedidos/pedidos/')
        assert response.status_code == status.HTTP_200_OK

    def test_aprobar_pedido_action(self, setup_api):
        """Test acción aprobar pedido."""
        data = setup_api

        pedido = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado'], condicion_pago=data['condicion'],
            direccion_entrega='Calle 123', created_by=data['usuario']
        )

        response = data['client'].post(f'/api/sales-crm/pedidos/pedidos/{pedido.id}/aprobar/')
        assert response.status_code == status.HTTP_200_OK

        pedido.refresh_from_db()
        assert pedido.estado.codigo == 'APROBADO'


@pytest.mark.django_db
class TestFacturaViewSet:
    """Tests para FacturaViewSet."""

    @pytest.fixture
    def setup_api(self):
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='test', email='test@test.com', password='pass', empresa=empresa)
        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)
        cliente = Cliente.objects.create(
            empresa=empresa, tipo_documento='NIT', numero_documento='900111111-1',
            razon_social='Cliente Test', tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente, canal_venta=canal_venta, created_by=usuario
        )
        estado_pedido = EstadoPedido.objects.create(codigo='APROBADO', nombre='Aprobado', permite_facturar=True, orden=1)
        condicion_pago = CondicionPago.objects.create(codigo='30_DIAS', nombre='30 Días', dias_plazo=30, orden=1)
        pedido = Pedido.objects.create(
            empresa=empresa, cliente=cliente, vendedor=usuario,
            estado=estado_pedido, condicion_pago=condicion_pago,
            direccion_entrega='Calle 123', total=Decimal('1000000.00'),
            created_by=usuario
        )
        metodo_pago = MetodoPago.objects.create(codigo='EFECTIVO', nombre='Efectivo', orden=1)

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {'client': client, 'empresa': empresa, 'usuario': usuario, 'cliente': cliente, 'pedido': pedido, 'metodo_pago': metodo_pago}

    def test_registrar_pago_action(self, setup_api):
        """Test acción registrar pago."""
        data = setup_api

        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        pago_data = {
            'monto': '500000.00',
            'metodo_pago': data['metodo_pago'].id,
            'referencia_pago': 'REF123'
        }

        response = data['client'].post(
            f'/api/sales-crm/pedidos/facturas/{factura.id}/registrar_pago/',
            pago_data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
