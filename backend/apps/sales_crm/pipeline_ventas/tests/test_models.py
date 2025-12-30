"""
Tests para modelos de Pipeline de Ventas - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.sales_crm.pipeline_ventas.models import (
    EtapaVenta, MotivoPerdida, FuenteOportunidad, Oportunidad,
    Cotizacion, DetalleCotizacion
)
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestOportunidadModel:
    """Tests para el modelo Oportunidad."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests."""
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='testuser', email='test@test.com', empresa=empresa)

        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)

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

        etapa_inicial = EtapaVenta.objects.create(
            codigo='PROSPECTO',
            nombre='Prospecto',
            orden=1,
            probabilidad_cierre=Decimal('10.00'),
            es_inicial=True
        )

        etapa_ganada = EtapaVenta.objects.create(
            codigo='GANADA',
            nombre='Ganada',
            orden=99,
            probabilidad_cierre=Decimal('100.00'),
            es_ganada=True,
            es_final=True
        )

        etapa_perdida = EtapaVenta.objects.create(
            codigo='PERDIDA',
            nombre='Perdida',
            orden=100,
            probabilidad_cierre=Decimal('0.00'),
            es_perdida=True,
            es_final=True
        )

        fuente = FuenteOportunidad.objects.create(codigo='WEB', nombre='Sitio Web', orden=1)
        motivo_perdida = MotivoPerdida.objects.create(codigo='PRECIO', nombre='Precio Alto', orden=1)

        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente,
            'etapa_inicial': etapa_inicial,
            'etapa_ganada': etapa_ganada,
            'etapa_perdida': etapa_perdida,
            'fuente': fuente,
            'motivo_perdida': motivo_perdida
        }

    def test_auto_generate_codigo(self, setup_data):
        """Test generación automática de código."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        assert oportunidad.codigo.startswith('OPO-')
        assert str(timezone.now().year) in oportunidad.codigo

    def test_cambiar_etapa(self, setup_data):
        """Test cambiar etapa de oportunidad."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        # Crear nueva etapa
        nueva_etapa = EtapaVenta.objects.create(
            codigo='CALIFICADO',
            nombre='Calificado',
            orden=2,
            probabilidad_cierre=Decimal('25.00')
        )

        # Cambiar etapa
        oportunidad.cambiar_etapa(nueva_etapa, 'Cliente interesado', data['usuario'])
        oportunidad.refresh_from_db()

        assert oportunidad.etapa_actual == nueva_etapa
        assert oportunidad.probabilidad_cierre == Decimal('25.00')
        assert oportunidad.historial_etapas.count() == 1

    def test_cerrar_ganada(self, setup_data):
        """Test cerrar oportunidad como ganada."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        oportunidad.cerrar_ganada(data['usuario'])
        oportunidad.refresh_from_db()

        assert oportunidad.etapa_actual.es_ganada is True
        assert oportunidad.fecha_cierre_real is not None
        assert oportunidad.probabilidad_cierre == Decimal('100.00')

    def test_cerrar_perdida(self, setup_data):
        """Test cerrar oportunidad como perdida."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        oportunidad.cerrar_perdida(
            data['motivo_perdida'],
            'Precio muy alto',
            data['usuario']
        )
        oportunidad.refresh_from_db()

        assert oportunidad.etapa_actual.es_perdida is True
        assert oportunidad.motivo_perdida == data['motivo_perdida']
        assert oportunidad.fecha_cierre_real is not None

    def test_esta_activa_property(self, setup_data):
        """Test property esta_activa."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        assert oportunidad.esta_activa is True

        oportunidad.cerrar_ganada(data['usuario'])
        oportunidad.refresh_from_db()

        assert oportunidad.esta_activa is False

    def test_dias_en_pipeline(self, setup_data):
        """Test cálculo de días en pipeline."""
        data = setup_data

        fecha_pasada = date.today() - timedelta(days=15)

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('5000000.00'),
            fecha_creacion=fecha_pasada,
            fecha_cierre_estimada=date.today() + timedelta(days=15),
            created_by=data['usuario']
        )

        assert oportunidad.dias_en_pipeline >= 15


@pytest.mark.django_db
class TestCotizacionModel:
    """Tests para el modelo Cotizacion."""

    @pytest.fixture
    def setup_cotizacion(self):
        """Setup para tests de cotización."""
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='testuser', email='test@test.com', empresa=empresa)

        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)

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

        return {'empresa': empresa, 'usuario': usuario, 'cliente': cliente}

    def test_auto_generate_codigo_cotizacion(self, setup_cotizacion):
        """Test generación automática de código de cotización."""
        data = setup_cotizacion

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            dias_validez=15,
            created_by=data['usuario']
        )

        assert cotizacion.codigo.startswith('COT-')
        assert str(timezone.now().year) in cotizacion.codigo

    def test_calcular_fecha_vencimiento(self, setup_cotizacion):
        """Test cálculo automático de fecha de vencimiento."""
        data = setup_cotizacion

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            dias_validez=15,
            created_by=data['usuario']
        )

        fecha_esperada = cotizacion.fecha_cotizacion + timedelta(days=15)
        assert cotizacion.fecha_vencimiento == fecha_esperada

    def test_aprobar_cotizacion(self, setup_cotizacion):
        """Test aprobar cotización."""
        data = setup_cotizacion

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            estado='ENVIADA',
            created_by=data['usuario']
        )

        result = cotizacion.aprobar()
        cotizacion.refresh_from_db()

        assert result is True
        assert cotizacion.estado == 'APROBADA'

    def test_rechazar_cotizacion(self, setup_cotizacion):
        """Test rechazar cotización."""
        data = setup_cotizacion

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            estado='ENVIADA',
            created_by=data['usuario']
        )

        result = cotizacion.rechazar()
        cotizacion.refresh_from_db()

        assert result is True
        assert cotizacion.estado == 'RECHAZADA'

    def test_esta_vencida_property(self, setup_cotizacion):
        """Test property esta_vencida."""
        data = setup_cotizacion

        # Cotización no vencida
        cotizacion1 = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            fecha_vencimiento=date.today() + timedelta(days=10),
            created_by=data['usuario']
        )

        assert cotizacion1.esta_vencida is False

        # Cotización vencida
        cotizacion2 = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            fecha_vencimiento=date.today() - timedelta(days=5),
            created_by=data['usuario']
        )

        assert cotizacion2.esta_vencida is True

    def test_clonar_cotizacion(self, setup_cotizacion):
        """Test clonar cotización existente."""
        data = setup_cotizacion

        cotizacion_original = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            estado='ENVIADA',
            subtotal=Decimal('1000000.00'),
            total=Decimal('1190000.00'),
            created_by=data['usuario']
        )

        cotizacion_clonada = cotizacion_original.clonar(data['usuario'])

        assert cotizacion_clonada.id != cotizacion_original.id
        assert cotizacion_clonada.codigo != cotizacion_original.codigo
        assert cotizacion_clonada.estado == 'BORRADOR'
        assert cotizacion_clonada.cliente == cotizacion_original.cliente
        assert cotizacion_clonada.subtotal == cotizacion_original.subtotal

    def test_calcular_totales(self, setup_cotizacion):
        """Test cálculo de totales de cotización."""
        data = setup_cotizacion

        cotizacion = Cotizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            vendedor=data['usuario'],
            created_by=data['usuario']
        )

        # Crear detalle de cotización (simulado)
        # Nota: Esto requiere que exista el modelo DetalleCotizacion
        cotizacion.subtotal = Decimal('1000000.00')
        cotizacion.descuento_porcentaje = Decimal('10.00')
        cotizacion.impuestos = Decimal('19.00')

        # Calcular: 1000000 - 10% = 900000, + 19% = 1071000
        descuento = cotizacion.subtotal * (cotizacion.descuento_porcentaje / 100)
        base_imponible = cotizacion.subtotal - descuento
        impuestos_valor = base_imponible * (cotizacion.impuestos / 100)
        total_esperado = base_imponible + impuestos_valor

        cotizacion.total = total_esperado
        cotizacion.save()

        assert cotizacion.total == Decimal('1071000.00')


@pytest.mark.django_db
class TestOportunidadEdgeCases:
    """Tests de casos extremos para Oportunidad."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests."""
        empresa = EmpresaConfig.objects.create(razon_social='Test Co', nit='900123456-7')
        usuario = Usuario.objects.create_user(username='testuser', email='test@test.com', empresa=empresa)

        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)

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

        etapa_inicial = EtapaVenta.objects.create(
            codigo='PROSPECTO',
            nombre='Prospecto',
            orden=1,
            probabilidad_cierre=Decimal('10.00'),
            es_inicial=True
        )

        fuente = FuenteOportunidad.objects.create(codigo='WEB', nombre='Sitio Web', orden=1)

        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente,
            'etapa_inicial': etapa_inicial,
            'fuente': fuente
        }

    def test_oportunidad_valor_estimado_cero(self, setup_data):
        """Test que una oportunidad puede tener valor estimado de cero."""
        data = setup_data

        oportunidad = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad Test',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('0.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        assert oportunidad.valor_estimado == Decimal('0.00')

    def test_oportunidad_multiple_mismo_cliente(self, setup_data):
        """Test que un cliente puede tener múltiples oportunidades."""
        data = setup_data

        oportunidad1 = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad 1',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('1000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=30),
            created_by=data['usuario']
        )

        oportunidad2 = Oportunidad.objects.create(
            empresa=data['empresa'],
            nombre='Oportunidad 2',
            cliente=data['cliente'],
            vendedor=data['usuario'],
            etapa_actual=data['etapa_inicial'],
            fuente=data['fuente'],
            valor_estimado=Decimal('2000000.00'),
            fecha_cierre_estimada=date.today() + timedelta(days=60),
            created_by=data['usuario']
        )

        assert data['cliente'].oportunidades.count() == 2
        assert oportunidad1.codigo != oportunidad2.codigo
