"""
Tests para serializers de Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta

from apps.sales_crm.gestion_clientes.models import (
    Cliente, TipoCliente, EstadoCliente, CanalVenta, ScoringCliente
)
from apps.sales_crm.gestion_clientes.serializers import (
    ClienteSerializer, ClienteListSerializer, ScoringClienteSerializer
)
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestClienteSerializer:
    """Tests para el serializer de Cliente."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
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

        return {
            'empresa': empresa,
            'usuario': usuario,
            'tipo_cliente': tipo_cliente,
            'estado_cliente': estado_cliente,
            'canal_venta': canal_venta
        }

    def test_serialize_cliente(self, setup_data):
        """Test serialización de cliente."""
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

        serializer = ClienteSerializer(cliente)
        serialized_data = serializer.data

        assert serialized_data['razon_social'] == 'Cliente Test'
        assert serialized_data['numero_documento'] == '900111111-1'
        assert serialized_data['codigo_cliente'].startswith('CLI-')
        assert 'tipo_cliente_data' in serialized_data
        assert 'estado_cliente_data' in serialized_data

    def test_computed_fields(self, setup_data):
        """Test campos calculados en serializer."""
        data = setup_data
        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Razón Social',
            nombre_comercial='Nombre Comercial',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            total_compras_acumulado=Decimal('3000000.00'),
            cantidad_pedidos=3,
            ultima_compra=date.today() - timedelta(days=15),
            created_by=data['usuario']
        )

        serializer = ClienteSerializer(cliente)
        serialized_data = serializer.data

        assert serialized_data['nombre_completo'] == 'Nombre Comercial'
        assert serialized_data['ticket_promedio'] == '1000000.00'
        assert serialized_data['dias_sin_comprar'] == 15

    def test_read_only_fields(self, setup_data):
        """Test que los campos de solo lectura no se pueden modificar."""
        data = setup_data

        input_data = {
            'empresa': data['empresa'].id,
            'tipo_documento': 'NIT',
            'numero_documento': '900111111-1',
            'razon_social': 'Cliente Test',
            'tipo_cliente': data['tipo_cliente'].id,
            'estado_cliente': data['estado_cliente'].id,
            'canal_venta': data['canal_venta'].id,
            'codigo_cliente': 'CLI-99999',  # Este debería ser ignorado
            'total_compras_acumulado': '9999999.00',  # También ignorado
        }

        serializer = ClienteSerializer(data=input_data)
        assert serializer.is_valid()

        # Al guardar, el código se debe generar automáticamente
        cliente = serializer.save(created_by=data['usuario'])

        assert cliente.codigo_cliente != 'CLI-99999'
        assert cliente.codigo_cliente == 'CLI-00001'
        assert cliente.total_compras_acumulado == Decimal('0.00')


@pytest.mark.django_db
class TestClienteListSerializer:
    """Tests para el serializer de listado de clientes."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa,
            first_name='John',
            last_name='Doe'
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

        return {
            'empresa': empresa,
            'usuario': usuario,
            'tipo_cliente': tipo_cliente,
            'estado_cliente': estado_cliente,
            'canal_venta': canal_venta
        }

    def test_list_serializer_includes_related_names(self, setup_data):
        """Test que el list serializer incluye nombres de relaciones."""
        data = setup_data
        cliente = Cliente.objects.create(
            empresa=data['empresa'],
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=data['tipo_cliente'],
            estado_cliente=data['estado_cliente'],
            canal_venta=data['canal_venta'],
            vendedor_asignado=data['usuario'],
            created_by=data['usuario']
        )

        serializer = ClienteListSerializer(cliente)
        serialized_data = serializer.data

        assert serialized_data['tipo_cliente_nombre'] == 'Empresa'
        assert serialized_data['estado_cliente_nombre'] == 'Activo'
        assert serialized_data['estado_cliente_color'] == 'success'
        assert serialized_data['canal_venta_nombre'] == 'Venta Directa'
        assert serialized_data['vendedor_nombre'] == 'John Doe'


@pytest.mark.django_db
class TestScoringClienteSerializer:
    """Tests para el serializer de ScoringCliente."""

    @pytest.fixture
    def setup_cliente(self):
        """Setup común para crear un cliente."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa
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

        cliente = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        return cliente

    def test_serialize_scoring(self, setup_cliente):
        """Test serialización de scoring."""
        cliente = setup_cliente
        scoring = ScoringCliente.objects.create(
            cliente=cliente,
            puntuacion_total=Decimal('75.50'),
            frecuencia_compra=Decimal('20.00'),
            volumen_compra=Decimal('15.00'),
            puntualidad_pago=Decimal('25.00'),
            antiguedad=Decimal('15.50')
        )

        serializer = ScoringClienteSerializer(scoring)
        serialized_data = serializer.data

        assert float(serialized_data['puntuacion_total']) == 75.50
        assert serialized_data['nivel_scoring'] == 'BUENO'
        assert serialized_data['color_nivel'] == 'info'

    def test_read_only_puntuacion_fields(self, setup_cliente):
        """Test que los campos de puntuación son read-only."""
        cliente = setup_cliente
        scoring = ScoringCliente.objects.create(cliente=cliente)

        # Intentar actualizar campos read-only
        update_data = {
            'puntuacion_total': '100.00',
            'frecuencia_compra': '50.00'
        }

        serializer = ScoringClienteSerializer(scoring, data=update_data, partial=True)

        # El serializer debe ser válido pero no actualizar estos campos
        assert serializer.is_valid()
        serializer.save()

        scoring.refresh_from_db()
        # Los valores no deben cambiar
        assert scoring.puntuacion_total != Decimal('100.00')
