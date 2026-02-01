"""
Tests para modelos de Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import date, timedelta
from django.core.exceptions import ValidationError

from apps.sales_crm.gestion_clientes.models import (
    TipoCliente, EstadoCliente, CanalVenta, Cliente,
    ContactoCliente, SegmentoCliente, ClienteSegmento,
    InteraccionCliente, ScoringCliente
)
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestClienteModel:
    """Tests para el modelo Cliente."""

    @pytest.fixture
    def empresa(self):
        """Fixture para crear empresa de prueba."""
        return EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7',
            nombre_comercial='Test Co'
        )

    @pytest.fixture
    def usuario(self, empresa):
        """Fixture para crear usuario de prueba."""
        return Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa,
            first_name='Test',
            last_name='User'
        )

    @pytest.fixture
    def tipo_cliente(self):
        """Fixture para crear tipo de cliente."""
        return TipoCliente.objects.create(
            codigo='EMPRESA',
            nombre='Empresa',
            orden=1
        )

    @pytest.fixture
    def estado_cliente(self):
        """Fixture para crear estado de cliente."""
        return EstadoCliente.objects.create(
            codigo='ACTIVO',
            nombre='Activo',
            color='success',
            permite_ventas=True,
            orden=1
        )

    @pytest.fixture
    def canal_venta(self):
        """Fixture para crear canal de venta."""
        return CanalVenta.objects.create(
            codigo='DIRECTO',
            nombre='Venta Directa',
            orden=1
        )

    def test_auto_generate_codigo(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test que el código del cliente se genera automáticamente."""
        cliente = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test 1',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        assert cliente.codigo_cliente == 'CLI-00001'
        assert cliente.codigo_cliente.startswith('CLI-')

    def test_codigo_incremental(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test que el código se incrementa correctamente."""
        cliente1 = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test 1',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        cliente2 = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Cliente Test 2',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        assert cliente1.codigo_cliente == 'CLI-00001'
        assert cliente2.codigo_cliente == 'CLI-00002'

    def test_unique_codigo_per_empresa(self, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test que el código es único por empresa."""
        empresa1 = EmpresaConfig.objects.create(
            razon_social='Empresa 1',
            nit='900111111-1'
        )
        empresa2 = EmpresaConfig.objects.create(
            razon_social='Empresa 2',
            nit='900222222-2'
        )

        cliente1 = Cliente.objects.create(
            empresa=empresa1,
            tipo_documento='NIT',
            numero_documento='900333333-3',
            razon_social='Cliente E1',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        cliente2 = Cliente.objects.create(
            empresa=empresa2,
            tipo_documento='NIT',
            numero_documento='900444444-4',
            razon_social='Cliente E2',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        # Ambos deberían tener CLI-00001 porque son de empresas diferentes
        assert cliente1.codigo_cliente == 'CLI-00001'
        assert cliente2.codigo_cliente == 'CLI-00001'

    def test_actualizar_estadisticas_compra(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test actualización de estadísticas de compra."""
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

        fecha_pedido = date.today()
        monto = Decimal('1000000.00')

        # Primera compra
        cliente.actualizar_estadisticas_compra(monto, fecha_pedido)
        cliente.refresh_from_db()

        assert cliente.fecha_primera_compra == fecha_pedido
        assert cliente.ultima_compra == fecha_pedido
        assert cliente.total_compras_acumulado == monto
        assert cliente.cantidad_pedidos == 1

        # Segunda compra
        monto2 = Decimal('500000.00')
        cliente.actualizar_estadisticas_compra(monto2, fecha_pedido)
        cliente.refresh_from_db()

        assert cliente.total_compras_acumulado == Decimal('1500000.00')
        assert cliente.cantidad_pedidos == 2

    def test_dias_sin_comprar(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test cálculo de días sin comprar."""
        cliente = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            ultima_compra=date.today() - timedelta(days=30),
            created_by=usuario
        )

        assert cliente.dias_sin_comprar == 30

    def test_dias_sin_comprar_sin_compras(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test días sin comprar cuando no hay compras."""
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

        assert cliente.dias_sin_comprar is None

    def test_ticket_promedio(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test cálculo de ticket promedio."""
        cliente = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            total_compras_acumulado=Decimal('3000000.00'),
            cantidad_pedidos=3,
            created_by=usuario
        )

        assert cliente.ticket_promedio == Decimal('1000000.00')

    def test_nombre_completo_property(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test property nombre_completo."""
        # Con nombre comercial
        cliente1 = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Razón Social S.A.S',
            nombre_comercial='Nombre Comercial',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        assert cliente1.nombre_completo == 'Nombre Comercial'

        # Sin nombre comercial
        cliente2 = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Razón Social 2 S.A.S',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        assert cliente2.nombre_completo == 'Razón Social 2 S.A.S'

    def test_validacion_cupo_credito_negativo(self, empresa, tipo_cliente, estado_cliente, canal_venta, usuario):
        """Test que el cupo de crédito no puede ser negativo."""
        cliente = Cliente(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            cupo_credito=Decimal('-1000.00'),
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            cliente.clean()

        assert 'cupo_credito' in exc_info.value.message_dict


@pytest.mark.django_db
class TestScoringClienteModel:
    """Tests para el modelo ScoringCliente."""

    @pytest.fixture
    def setup_cliente(self):
        """Setup común para crear un cliente con empresa y relaciones."""
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

    def test_actualizar_scoring(self, setup_cliente):
        """Test actualización del scoring de cliente."""
        cliente = setup_cliente

        # Actualizar estadísticas del cliente
        cliente.fecha_primera_compra = date.today() - timedelta(days=365)
        cliente.total_compras_acumulado = Decimal('10000000.00')
        cliente.cantidad_pedidos = 10
        cliente.save()

        # Actualizar scoring
        cliente.actualizar_scoring()

        # Verificar que se creó el scoring
        assert hasattr(cliente, 'scoring')
        assert cliente.scoring.puntuacion_total > 0

    def test_calcular_puntuacion_cliente_nuevo(self, setup_cliente):
        """Test cálculo de puntuación para cliente nuevo sin compras."""
        cliente = setup_cliente
        scoring = ScoringCliente.objects.create(cliente=cliente)

        scoring.calcular_puntuacion()

        # Cliente nuevo debe tener puntuación baja (solo puntualidad pago base)
        assert scoring.frecuencia_compra == Decimal('0.00')
        assert scoring.volumen_compra == Decimal('0.00')
        assert scoring.antiguedad == Decimal('0.00')
        assert scoring.puntualidad_pago == Decimal('20.00')  # Puntaje base

    def test_nivel_scoring_excelente(self, setup_cliente):
        """Test nivel de scoring EXCELENTE."""
        cliente = setup_cliente
        scoring = ScoringCliente.objects.create(
            cliente=cliente,
            puntuacion_total=Decimal('85.00')
        )

        assert scoring.nivel_scoring == 'EXCELENTE'
        assert scoring.color_nivel == 'success'

    def test_nivel_scoring_bueno(self, setup_cliente):
        """Test nivel de scoring BUENO."""
        cliente = setup_cliente
        scoring = ScoringCliente.objects.create(
            cliente=cliente,
            puntuacion_total=Decimal('65.00')
        )

        assert scoring.nivel_scoring == 'BUENO'
        assert scoring.color_nivel == 'info'

    def test_historial_scores(self, setup_cliente):
        """Test que se guarda el historial de scores."""
        cliente = setup_cliente

        # Configurar cliente con compras
        cliente.fecha_primera_compra = date.today() - timedelta(days=365)
        cliente.total_compras_acumulado = Decimal('5000000.00')
        cliente.cantidad_pedidos = 5
        cliente.save()

        scoring = ScoringCliente.objects.create(cliente=cliente)
        scoring.calcular_puntuacion()

        # Verificar que se guardó en historial
        assert isinstance(scoring.historial_scores, list)
        assert len(scoring.historial_scores) > 0
        assert 'fecha' in scoring.historial_scores[0]
        assert 'puntuacion' in scoring.historial_scores[0]
        assert 'componentes' in scoring.historial_scores[0]


@pytest.mark.django_db
class TestContactoClienteModel:
    """Tests para el modelo ContactoCliente."""

    @pytest.fixture
    def setup_contacto_data(self):
        """Setup común para tests de contacto."""
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
        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente
        }

    def test_contacto_principal_unico(self, setup_contacto_data):
        """Test que solo puede haber un contacto principal por cliente."""
        data = setup_contacto_data

        # Crear primer contacto principal
        contacto1 = ContactoCliente.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nombre_completo='Juan Pérez',
            es_principal=True,
            created_by=data['usuario']
        )

        # Crear segundo contacto
        contacto2 = ContactoCliente.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nombre_completo='María García',
            es_principal=False,
            created_by=data['usuario']
        )

        assert contacto1.es_principal is True
        assert contacto2.es_principal is False

    def test_contacto_str_representation(self, setup_contacto_data):
        """Test representación string de contacto."""
        data = setup_contacto_data

        contacto = ContactoCliente.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nombre_completo='Juan Pérez',
            created_by=data['usuario']
        )

        expected = f"Juan Pérez - {data['cliente'].razon_social}"
        assert str(contacto) == expected


@pytest.mark.django_db
class TestSegmentoCliente:
    """Tests para los modelos de segmentación."""

    @pytest.fixture
    def setup_segmento_data(self):
        """Setup común para tests de segmentación."""
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
        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente
        }

    def test_segmento_asignacion(self, setup_segmento_data):
        """Test asignación de cliente a segmento."""
        data = setup_segmento_data

        segmento = SegmentoCliente.objects.create(
            empresa=data['empresa'],
            codigo='VIP',
            nombre='Clientes VIP',
            color='gold',
            created_by=data['usuario']
        )

        asignacion = ClienteSegmento.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            segmento=segmento,
            asignado_por=data['usuario'],
            created_by=data['usuario']
        )

        assert asignacion.cliente == data['cliente']
        assert asignacion.segmento == segmento
        assert asignacion.asignado_por == data['usuario']

    def test_segmento_unique_codigo_per_empresa(self, setup_segmento_data):
        """Test que el código de segmento es único por empresa."""
        data = setup_segmento_data

        empresa2 = EmpresaConfig.objects.create(
            razon_social='Company 2',
            nit='900222222-2'
        )

        # Mismo código en diferentes empresas debe funcionar
        seg1 = SegmentoCliente.objects.create(
            empresa=data['empresa'],
            codigo='VIP',
            nombre='VIP E1',
            created_by=data['usuario']
        )

        seg2 = SegmentoCliente.objects.create(
            empresa=empresa2,
            codigo='VIP',
            nombre='VIP E2',
            created_by=data['usuario']
        )

        assert seg1.codigo == seg2.codigo
        assert seg1.empresa != seg2.empresa


@pytest.mark.django_db
class TestInteraccionCliente:
    """Tests para el modelo InteraccionCliente."""

    @pytest.fixture
    def setup_interaccion_data(self):
        """Setup común para tests de interacción."""
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
        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente
        }

    def test_interaccion_seguimiento(self, setup_interaccion_data):
        """Test creación de interacción con seguimiento."""
        data = setup_interaccion_data

        interaccion = InteraccionCliente.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            tipo_interaccion='LLAMADA',
            descripcion='Llamada de seguimiento',
            resultado='Cliente interesado',
            proxima_accion='Enviar cotización',
            fecha_proxima_accion=date.today() + timedelta(days=7),
            registrado_por=data['usuario'],
            created_by=data['usuario']
        )

        assert interaccion.tipo_interaccion == 'LLAMADA'
        assert interaccion.proxima_accion == 'Enviar cotización'
        assert interaccion.fecha_proxima_accion is not None

    def test_interaccion_str_representation(self, setup_interaccion_data):
        """Test representación string de interacción."""
        data = setup_interaccion_data

        interaccion = InteraccionCliente.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            tipo_interaccion='EMAIL',
            descripcion='Email de cotización',
            registrado_por=data['usuario'],
            created_by=data['usuario']
        )

        str_repr = str(interaccion)
        assert 'Email' in str_repr
        assert data['cliente'].razon_social in str_repr
