"""
Tests para serializers de Pedidos y Facturación - Sales CRM
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta

from apps.sales_crm.pedidos_facturacion.models import Pedido, Factura, EstadoPedido, CondicionPago
from apps.sales_crm.pedidos_facturacion.serializers import PedidoSerializer, FacturaSerializer
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestPedidoSerializer:
    """Tests para PedidoSerializer."""

    @pytest.fixture
    def setup_data(self):
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='test', email='test@test.com', empresa=empresa)
        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)
        cliente = Cliente.objects.create(
            empresa=empresa, tipo_documento='NIT', numero_documento='900111111-1',
            razon_social='Cliente Test', tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente, canal_venta=canal_venta, created_by=usuario
        )
        estado_pedido = EstadoPedido.objects.create(codigo='BORRADOR', nombre='Borrador', orden=1)
        condicion_pago = CondicionPago.objects.create(codigo='30_DIAS', nombre='30 Días', dias_plazo=30, orden=1)

        return {'empresa': empresa, 'usuario': usuario, 'cliente': cliente, 'estado': estado_pedido, 'condicion': condicion_pago}

    def test_serialize_pedido(self, setup_data):
        """Test serialización de pedido."""
        data = setup_data
        pedido = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado'], condicion_pago=data['condicion'],
            direccion_entrega='Calle 123', total=Decimal('1000000.00'),
            created_by=data['usuario']
        )

        serializer = PedidoSerializer(pedido)
        assert 'codigo' in serializer.data
        assert serializer.data['total'] == '1000000.00'


@pytest.mark.django_db
class TestFacturaSerializer:
    """Tests para FacturaSerializer."""

    @pytest.fixture
    def setup_data(self):
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='test', email='test@test.com', empresa=empresa)
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

        return {'empresa': empresa, 'usuario': usuario, 'cliente': cliente, 'pedido': pedido}

    def test_serialize_factura(self, setup_data):
        """Test serialización de factura."""
        data = setup_data
        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        serializer = FacturaSerializer(factura)
        assert 'codigo' in serializer.data
        assert serializer.data['estado'] == 'PENDIENTE'
