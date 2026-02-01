"""
Tests para serializers de Pipeline de Ventas - Sales CRM
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta

from apps.sales_crm.pipeline_ventas.models import Oportunidad, Cotizacion, EtapaVenta, FuenteOportunidad
from apps.sales_crm.pipeline_ventas.serializers import OportunidadSerializer, CotizacionSerializer
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestOportunidadSerializer:
    """Tests para OportunidadSerializer."""

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
        etapa = EtapaVenta.objects.create(codigo='PROSPECTO', nombre='Prospecto', orden=1, probabilidad_cierre=Decimal('10.00'))
        fuente = FuenteOportunidad.objects.create(codigo='WEB', nombre='Web', orden=1)

        return {'empresa': empresa, 'usuario': usuario, 'cliente': cliente, 'etapa': etapa, 'fuente': fuente}

    def test_serialize_oportunidad(self, setup_data):
        """Test serialización de oportunidad."""
        data = setup_data
        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'], nombre='Test Opp', cliente=data['cliente'],
            vendedor=data['usuario'], etapa_actual=data['etapa'], fuente=data['fuente'],
            valor_estimado=Decimal('1000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        serializer = OportunidadSerializer(oportunidad)
        assert serializer.data['nombre'] == 'Test Opp'
        assert 'codigo' in serializer.data


@pytest.mark.django_db
class TestCotizacionSerializer:
    """Tests para CotizacionSerializer."""

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

        return {'empresa': empresa, 'usuario': usuario, 'cliente': cliente}

    def test_serialize_cotizacion(self, setup_data):
        """Test serialización de cotización."""
        data = setup_data
        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'], cliente=data['cliente'],
            vendedor=data['usuario'], dias_validez=15, created_by=data['usuario']
        )

        serializer = CotizacionSerializer(cotizacion)
        assert 'codigo' in serializer.data
        assert serializer.data['estado'] == 'BORRADOR'
