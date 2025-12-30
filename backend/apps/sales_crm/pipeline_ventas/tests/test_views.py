"""
Tests para views de Pipeline de Ventas - Sales CRM
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.test import APIClient
from rest_framework import status

from apps.sales_crm.pipeline_ventas.models import Oportunidad, Cotizacion, EtapaVenta, FuenteOportunidad
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestOportunidadViewSet:
    """Tests para OportunidadViewSet."""

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
        etapa = EtapaVenta.objects.create(codigo='PROSPECTO', nombre='Prospecto', orden=1, probabilidad_cierre=Decimal('10.00'))
        fuente = FuenteOportunidad.objects.create(codigo='WEB', nombre='Web', orden=1)

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {'client': client, 'empresa': empresa, 'usuario': usuario, 'cliente': cliente, 'etapa': etapa, 'fuente': fuente}

    def test_list_oportunidades(self, setup_api):
        """Test listar oportunidades."""
        data = setup_api

        for i in range(3):
            Oportunidad.objects.create(
                empresa=data['empresa'], nombre=f'Opp {i}', cliente=data['cliente'],
                vendedor=data['usuario'], etapa_actual=data['etapa'], fuente=data['fuente'],
                valor_estimado=Decimal('1000000.00'),
                fecha_cierre_estimada=date.today() + timedelta(days=30),
                created_by=data['usuario']
            )

        response = data['client'].get('/api/sales-crm/pipeline/oportunidades/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_oportunidad(self, setup_api):
        """Test crear oportunidad."""
        data = setup_api

        opp_data = {
            'nombre': 'Nueva Oportunidad',
            'cliente': data['cliente'].id,
            'etapa_actual': data['etapa'].id,
            'fuente': data['fuente'].id,
            'valor_estimado': '2000000.00',
            'fecha_cierre_estimada': (date.today() + timedelta(days=30)).isoformat()
        }

        response = data['client'].post('/api/sales-crm/pipeline/oportunidades/', opp_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['nombre'] == 'Nueva Oportunidad'


@pytest.mark.django_db
class TestCotizacionViewSet:
    """Tests para CotizacionViewSet."""

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

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {'client': client, 'empresa': empresa, 'usuario': usuario, 'cliente': cliente}

    def test_aprobar_cotizacion_action(self, setup_api):
        """Test acción aprobar cotización."""
        data = setup_api

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'], cliente=data['cliente'],
            vendedor=data['usuario'], estado='ENVIADA',
            created_by=data['usuario']
        )

        response = data['client'].post(f'/api/sales-crm/pipeline/cotizaciones/{cotizacion.id}/aprobar/')
        assert response.status_code == status.HTTP_200_OK

        cotizacion.refresh_from_db()
        assert cotizacion.estado == 'APROBADA'
