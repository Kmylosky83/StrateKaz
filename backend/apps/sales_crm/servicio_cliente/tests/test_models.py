"""
Tests para modelos de Servicio al Cliente - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.sales_crm.servicio_cliente.models import (
    TipoPQRS, EstadoPQRS, PrioridadPQRS, CanalRecepcion,
    PQRS, SeguimientoPQRS, EncuestaSatisfaccion, ProgramaFidelizacion
)
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestPQRSModel:
    """Tests para el modelo PQRS."""

    @pytest.fixture
    def setup_pqrs(self):
        """Setup común para tests de PQRS."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa
        )

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

        tipo_pqrs = TipoPQRS.objects.create(
            codigo='QUEJA',
            nombre='Queja',
            tiempo_respuesta_dias=15,
            orden=1
        )

        estado_recibida = EstadoPQRS.objects.create(
            codigo='RECIBIDA',
            nombre='Recibida',
            es_inicial=True,
            orden=1
        )

        estado_resuelta = EstadoPQRS.objects.create(
            codigo='RESUELTA',
            nombre='Resuelta',
            es_final=True,
            orden=99
        )

        prioridad = PrioridadPQRS.objects.create(
            codigo='MEDIA',
            nombre='Media',
            nivel=2,
            tiempo_sla_horas=48,
            orden=2
        )

        canal = CanalRecepcion.objects.create(
            codigo='EMAIL',
            nombre='Email',
            orden=1
        )

        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente,
            'tipo_pqrs': tipo_pqrs,
            'estado_recibida': estado_recibida,
            'estado_resuelta': estado_resuelta,
            'prioridad': prioridad,
            'canal': canal
        }

    def test_pqrs_codigo_auto(self, setup_pqrs):
        """Test generación automática de código de PQRS."""
        data = setup_pqrs

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Juan Pérez',
            contacto_email='juan@test.com',
            tipo=data['tipo_pqrs'],
            estado=data['estado_recibida'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Problema con producto',
            descripcion='El producto llegó defectuoso',
            created_by=data['usuario']
        )

        assert pqrs.codigo.startswith('PQRS-')
        assert str(timezone.now().year) in pqrs.codigo

    def test_pqrs_sla_calculo(self, setup_pqrs):
        """Test cálculo automático de SLA."""
        data = setup_pqrs

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Juan Pérez',
            tipo=data['tipo_pqrs'],
            estado=data['estado_recibida'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Test SLA',
            descripcion='Descripción test',
            created_by=data['usuario']
        )

        # El SLA debe calcularse basado en prioridad (48 horas)
        assert pqrs.fecha_vencimiento_sla is not None
        diferencia_horas = (pqrs.fecha_vencimiento_sla - pqrs.fecha_radicacion).total_seconds() / 3600
        assert diferencia_horas == 48

    def test_pqrs_asignar(self, setup_pqrs):
        """Test asignar PQRS a usuario."""
        data = setup_pqrs

        usuario_asignado = Usuario.objects.create_user(
            username='agente',
            email='agente@test.com',
            empresa=data['empresa']
        )

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Juan Pérez',
            tipo=data['tipo_pqrs'],
            estado=data['estado_recibida'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Test',
            descripcion='Test',
            created_by=data['usuario']
        )

        pqrs.asignar(usuario_asignado, data['usuario'])
        pqrs.refresh_from_db()

        assert pqrs.asignado_a == usuario_asignado

    def test_pqrs_escalar(self, setup_pqrs):
        """Test escalar PQRS a supervisor."""
        data = setup_pqrs

        supervisor = Usuario.objects.create_user(
            username='supervisor',
            email='supervisor@test.com',
            empresa=data['empresa']
        )

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Juan Pérez',
            tipo=data['tipo_pqrs'],
            estado=data['estado_recibida'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Test',
            descripcion='Test',
            created_by=data['usuario']
        )

        pqrs.escalar(supervisor, 'No se puede resolver', data['usuario'])
        pqrs.refresh_from_db()

        assert pqrs.escalado_a == supervisor

    def test_pqrs_resolver(self, setup_pqrs):
        """Test resolver PQRS."""
        data = setup_pqrs

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Juan Pérez',
            tipo=data['tipo_pqrs'],
            estado=data['estado_recibida'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Test',
            descripcion='Test',
            created_by=data['usuario']
        )

        solucion = 'Se reemplazó el producto'
        pqrs.resolver(data['estado_resuelta'], solucion, data['usuario'])
        pqrs.refresh_from_db()

        assert pqrs.estado == data['estado_resuelta']
        assert pqrs.fecha_respuesta is not None
        assert pqrs.dias_respuesta is not None


@pytest.mark.django_db
class TestEncuestaSatisfaccion:
    """Tests para el modelo EncuestaSatisfaccion."""

    @pytest.fixture
    def setup_encuesta(self):
        """Setup para tests de encuesta."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa
        )

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

        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente
        }

    def test_encuesta_nps_categoria(self, setup_encuesta):
        """Test categorización NPS basada en calificación."""
        data = setup_encuesta

        # Detractor (0-6)
        encuesta_detractor = EncuestaSatisfaccion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nps_score=5,
            comentarios='Muy mala experiencia',
            created_by=data['usuario']
        )
        assert encuesta_detractor.categoria_nps == 'DETRACTOR'

        # Pasivo (7-8)
        encuesta_pasivo = EncuestaSatisfaccion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nps_score=8,
            comentarios='Experiencia aceptable',
            created_by=data['usuario']
        )
        assert encuesta_pasivo.categoria_nps == 'PASIVO'

        # Promotor (9-10)
        encuesta_promotor = EncuestaSatisfaccion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            nps_score=10,
            comentarios='Excelente servicio',
            created_by=data['usuario']
        )
        assert encuesta_promotor.categoria_nps == 'PROMOTOR'


@pytest.mark.django_db
class TestProgramaFidelizacion:
    """Tests para el modelo ProgramaFidelizacion."""

    @pytest.fixture
    def setup_fidelizacion(self):
        """Setup para tests de fidelización."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa
        )

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

        return {
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente
        }

    def test_fidelizacion_acumular_puntos(self, setup_fidelizacion):
        """Test acumulación de puntos por compra."""
        data = setup_fidelizacion

        programa = ProgramaFidelizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            puntos_acumulados=0,
            created_by=data['usuario']
        )

        # Acumular 100 puntos
        programa.acumular_puntos(100, 'Compra de productos', data['usuario'])
        programa.refresh_from_db()

        assert programa.puntos_acumulados == 100
        assert programa.puntos_disponibles == 100

    def test_fidelizacion_canjear_puntos(self, setup_fidelizacion):
        """Test canje de puntos."""
        data = setup_fidelizacion

        programa = ProgramaFidelizacion.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            puntos_acumulados=500,
            puntos_disponibles=500,
            created_by=data['usuario']
        )

        # Canjear 200 puntos
        programa.canjear_puntos(200, 'Descuento en compra', data['usuario'])
        programa.refresh_from_db()

        assert programa.puntos_acumulados == 500  # Los acumulados no cambian
        assert programa.puntos_disponibles == 300  # Disponibles disminuyen
        assert programa.puntos_canjeados == 200


@pytest.mark.django_db
class TestPQRSEdgeCases:
    """Tests de casos extremos para PQRS."""

    @pytest.fixture
    def setup_pqrs(self):
        """Setup común."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            empresa=empresa
        )

        tipo_pqrs = TipoPQRS.objects.create(codigo='SUGERENCIA', nombre='Sugerencia', orden=1)
        estado = EstadoPQRS.objects.create(codigo='RECIBIDA', nombre='Recibida', orden=1)
        prioridad = PrioridadPQRS.objects.create(codigo='BAJA', nombre='Baja', nivel=1, orden=1)
        canal = CanalRecepcion.objects.create(codigo='WEB', nombre='Web', orden=1)

        return {
            'empresa': empresa,
            'usuario': usuario,
            'tipo_pqrs': tipo_pqrs,
            'estado': estado,
            'prioridad': prioridad,
            'canal': canal
        }

    def test_pqrs_anonima(self, setup_pqrs):
        """Test PQRS sin cliente asociado (anónima)."""
        data = setup_pqrs

        pqrs = PQRS.objects.create(
            empresa=data['empresa'],
            cliente=None,  # Sin cliente
            contacto_nombre='Anónimo',
            contacto_email='anonimo@test.com',
            tipo=data['tipo_pqrs'],
            estado=data['estado'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='Sugerencia anónima',
            descripcion='Mejorar atención',
            created_by=data['usuario']
        )

        assert pqrs.cliente is None
        assert pqrs.contacto_nombre == 'Anónimo'
        assert pqrs.codigo.startswith('PQRS-')
