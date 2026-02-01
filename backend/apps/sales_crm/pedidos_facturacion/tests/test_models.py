"""
Tests para modelos de Pedidos y Facturación - Sales CRM
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.sales_crm.pedidos_facturacion.models import (
    EstadoPedido, MetodoPago, CondicionPago, Pedido, DetallePedido,
    Factura, PagoFactura
)
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestPedidoModel:
    """Tests para el modelo Pedido."""

    @pytest.fixture
    def setup_pedido(self):
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

        estado_borrador = EstadoPedido.objects.create(codigo='BORRADOR', nombre='Borrador', es_inicial=True, orden=1)
        estado_aprobado = EstadoPedido.objects.create(codigo='APROBADO', nombre='Aprobado', permite_facturar=True, orden=2)
        estado_cancelado = EstadoPedido.objects.create(codigo='CANCELADO', nombre='Cancelado', es_final=True, orden=99)

        condicion_pago = CondicionPago.objects.create(codigo='30_DIAS', nombre='30 Días', dias_plazo=30, orden=1)

        return {
            'empresa': empresa, 'usuario': usuario, 'cliente': cliente,
            'estado_borrador': estado_borrador, 'estado_aprobado': estado_aprobado,
            'estado_cancelado': estado_cancelado, 'condicion_pago': condicion_pago
        }

    def test_auto_generate_codigo(self, setup_pedido):
        """Test generación automática de código de pedido."""
        data = setup_pedido

        pedido = Pedido.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            estado=data['estado_borrador'],
            condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 123',
            created_by=data['usuario']
        )

        assert pedido.codigo.startswith('PED-')
        assert str(timezone.now().year) in pedido.codigo

    def test_codigo_incremental(self, setup_pedido):
        """Test que el código se incrementa."""
        data = setup_pedido

        pedido1 = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 123', created_by=data['usuario']
        )

        pedido2 = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 456', created_by=data['usuario']
        )

        num1 = int(pedido1.codigo.split('-')[-1])
        num2 = int(pedido2.codigo.split('-')[-1])
        assert num2 == num1 + 1

    def test_aprobar_pedido(self, setup_pedido):
        """Test aprobar pedido."""
        data = setup_pedido

        pedido = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 123', created_by=data['usuario']
        )

        pedido.aprobar(data['usuario'])
        pedido.refresh_from_db()

        assert pedido.estado.codigo == 'APROBADO'
        assert pedido.puede_facturar is True

    def test_cancelar_pedido(self, setup_pedido):
        """Test cancelar pedido."""
        data = setup_pedido

        pedido = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 123', created_by=data['usuario']
        )

        motivo = 'Cliente canceló la orden'
        pedido.cancelar(data['usuario'], motivo)
        pedido.refresh_from_db()

        assert pedido.estado.codigo == 'CANCELADO'
        assert motivo in pedido.observaciones


@pytest.mark.django_db
class TestFacturaModel:
    """Tests para el modelo Factura."""

    @pytest.fixture
    def setup_factura(self):
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

        metodo_pago = MetodoPago.objects.create(codigo='EFECTIVO', nombre='Efectivo', orden=1)

        return {
            'empresa': empresa, 'usuario': usuario, 'cliente': cliente,
            'pedido': pedido, 'metodo_pago': metodo_pago
        }

    def test_auto_generate_codigo_factura(self, setup_factura):
        """Test generación automática de código de factura."""
        data = setup_factura

        factura = Factura.objects.create(
            empresa=data['empresa'],
            pedido=data['pedido'],
            cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'),
            created_by=data['usuario']
        )

        assert factura.codigo.startswith('FAC-')
        assert str(timezone.now().year) in factura.codigo

    def test_generar_desde_pedido(self, setup_factura):
        """Test generar factura desde pedido."""
        data = setup_factura

        factura = Factura.generar_desde_pedido(data['pedido'], data['usuario'])

        assert factura.pedido == data['pedido']
        assert factura.cliente == data['cliente']
        assert factura.total == data['pedido'].total
        assert factura.estado == 'PENDIENTE'

    def test_registrar_pago(self, setup_factura):
        """Test registrar pago a factura."""
        data = setup_factura

        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        pago = factura.registrar_pago(
            monto=Decimal('500000.00'),
            metodo_pago=data['metodo_pago'],
            referencia_pago='REF123',
            usuario=data['usuario']
        )

        assert pago is not None
        assert pago.monto == Decimal('500000.00')
        assert factura.saldo_pendiente == Decimal('500000.00')

    def test_saldo_pendiente(self, setup_factura):
        """Test cálculo de saldo pendiente."""
        data = setup_factura

        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        assert factura.saldo_pendiente == Decimal('1000000.00')

        factura.registrar_pago(
            monto=Decimal('600000.00'),
            metodo_pago=data['metodo_pago'],
            usuario=data['usuario']
        )

        assert factura.saldo_pendiente == Decimal('400000.00')

    def test_esta_vencida_property(self, setup_factura):
        """Test property esta_vencida."""
        data = setup_factura

        # Factura no vencida
        factura_vigente = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=10),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        assert factura_vigente.esta_vencida is False

        # Factura vencida
        factura_vencida = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() - timedelta(days=5),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        assert factura_vencida.esta_vencida is True

    def test_anular_factura(self, setup_factura):
        """Test anular factura."""
        data = setup_factura

        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), estado='PENDIENTE',
            created_by=data['usuario']
        )

        motivo = 'Error en facturación'
        factura.anular(data['usuario'], motivo)
        factura.refresh_from_db()

        assert factura.estado == 'ANULADA'
        assert motivo in factura.observaciones

    def test_pago_actualiza_estado_factura(self, setup_factura):
        """Test que el pago completo actualiza estado de factura."""
        data = setup_factura

        factura = Factura.objects.create(
            empresa=data['empresa'], pedido=data['pedido'], cliente=data['cliente'],
            fecha_vencimiento=date.today() + timedelta(days=30),
            total=Decimal('1000000.00'), created_by=data['usuario']
        )

        # Pago total
        factura.registrar_pago(
            monto=Decimal('1000000.00'),
            metodo_pago=data['metodo_pago'],
            usuario=data['usuario']
        )

        factura.refresh_from_db()
        assert factura.estado == 'PAGADA'
        assert factura.saldo_pendiente == Decimal('0.00')


@pytest.mark.django_db
class TestPedidoEdgeCases:
    """Tests de casos extremos para Pedido."""

    @pytest.fixture
    def setup_pedido(self):
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

        estado_borrador = EstadoPedido.objects.create(codigo='BORRADOR', nombre='Borrador', es_inicial=True, orden=1)
        condicion_pago = CondicionPago.objects.create(codigo='30_DIAS', nombre='30 Días', dias_plazo=30, orden=1)

        return {
            'empresa': empresa, 'usuario': usuario, 'cliente': cliente,
            'estado_borrador': estado_borrador, 'condicion_pago': condicion_pago
        }

    def test_pedido_subtotal_cero(self, setup_pedido):
        """Test pedido con subtotal cero."""
        data = setup_pedido

        pedido = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Calle 123', subtotal=Decimal('0.00'),
            created_by=data['usuario']
        )

        assert pedido.subtotal == Decimal('0.00')
        assert pedido.total >= Decimal('0.00')

    def test_pedido_multiple_mismo_cliente(self, setup_pedido):
        """Test que un cliente puede tener múltiples pedidos."""
        data = setup_pedido

        pedido1 = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Dirección 1', created_by=data['usuario']
        )

        pedido2 = Pedido.objects.create(
            empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
            estado=data['estado_borrador'], condicion_pago=data['condicion_pago'],
            direccion_entrega='Dirección 2', created_by=data['usuario']
        )

        assert data['cliente'].pedidos.count() == 2
        assert pedido1.codigo != pedido2.codigo

    def test_pedido_dashboard_metricas(self, setup_pedido):
        """Test que los pedidos generan métricas correctas."""
        data = setup_pedido

        estado_aprobado = EstadoPedido.objects.create(
            codigo='APROBADO', nombre='Aprobado', permite_facturar=True, orden=2
        )

        # Crear varios pedidos con diferentes estados y totales
        pedidos_data = [
            (data['estado_borrador'], Decimal('1000000.00')),
            (estado_aprobado, Decimal('2000000.00')),
            (estado_aprobado, Decimal('3000000.00')),
        ]

        for estado, total in pedidos_data:
            Pedido.objects.create(
                empresa=data['empresa'], cliente=data['cliente'], vendedor=data['usuario'],
                estado=estado, condicion_pago=data['condicion_pago'],
                direccion_entrega='Calle 123', total=total,
                created_by=data['usuario']
            )

        # Verificar métricas
        total_pedidos = Pedido.objects.filter(empresa=data['empresa']).count()
        pedidos_aprobados = Pedido.objects.filter(empresa=data['empresa'], estado=estado_aprobado).count()

        assert total_pedidos == 3
        assert pedidos_aprobados == 2
