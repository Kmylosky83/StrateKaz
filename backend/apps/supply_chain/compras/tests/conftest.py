"""
Fixtures compartidos para tests de Gestión de Compras
======================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (EstadoRequisicion, EstadoCotizacion, etc.)
- Requisiciones y detalles
- Cotizaciones y evaluaciones
- Órdenes de compra
- Contratos
- Recepciones

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.supply_chain.gestion_proveedores.models import Proveedor
from apps.supply_chain.compras.models import (
    # Catálogos
    EstadoRequisicion,
    EstadoCotizacion,
    EstadoOrdenCompra,
    TipoContrato,
    PrioridadRequisicion,
    Moneda,
    EstadoContrato,
    EstadoMaterial,
    # Principales
    Requisicion,
    DetalleRequisicion,
    Cotizacion,
    EvaluacionCotizacion,
    OrdenCompra,
    DetalleOrdenCompra,
    Contrato,
    RecepcionCompra,
)

User = get_user_model()


# ==============================================================================
# FIXTURES DE EMPRESA Y USUARIOS
# ==============================================================================

@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    return EmpresaConfig.objects.create(
        nombre='Grasas y Huesos del Norte',
        nit='900123456-1',
        razon_social='Grasas y Huesos del Norte S.A.S.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia'
    )


@pytest.fixture
def sede(db, empresa):
    """Sede de prueba."""
    return SedeEmpresa.objects.create(
        empresa=empresa,
        codigo='BOG-01',
        nombre='Sede Bogotá',
        direccion='Calle 123 # 45-67',
        ciudad='Bogotá',
        departamento='Cundinamarca',
        telefono='6012345678',
        is_active=True
    )


@pytest.fixture
def usuario(db):
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@ghn.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def usuario_aprobador(db):
    """Usuario aprobador."""
    return User.objects.create_user(
        username='aprobador',
        email='aprobador@ghn.com',
        password='testpass123',
        first_name='Aprobador',
        last_name='Test',
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS
# ==============================================================================

@pytest.fixture
def estado_requisicion_borrador(db):
    """Estado BORRADOR."""
    return EstadoRequisicion.objects.create(
        codigo='BORRADOR',
        nombre='Borrador',
        descripcion='Requisición en borrador',
        permite_edicion=True,
        es_estado_inicial=True,
        es_estado_final=False,
        color_hex='#6B7280',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_requisicion_aprobada(db):
    """Estado APROBADA."""
    return EstadoRequisicion.objects.create(
        codigo='APROBADA',
        nombre='Aprobada',
        descripcion='Requisición aprobada',
        permite_edicion=False,
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#10B981',
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_cotizacion_recibida(db):
    """Estado RECIBIDA."""
    return EstadoCotizacion.objects.create(
        codigo='RECIBIDA',
        nombre='Recibida',
        descripcion='Cotización recibida',
        permite_evaluacion=True,
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#3B82F6',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_cotizacion_evaluada(db):
    """Estado EVALUADA."""
    return EstadoCotizacion.objects.create(
        codigo='EVALUADA',
        nombre='Evaluada',
        descripcion='Cotización evaluada',
        permite_evaluacion=False,
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#10B981',
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_orden_borrador(db):
    """Estado orden BORRADOR."""
    return EstadoOrdenCompra.objects.create(
        codigo='BORRADOR',
        nombre='Borrador',
        descripcion='Orden en borrador',
        permite_edicion=True,
        permite_recepcion=False,
        es_estado_inicial=True,
        es_estado_final=False,
        color_hex='#6B7280',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_orden_aprobada(db):
    """Estado orden APROBADA."""
    return EstadoOrdenCompra.objects.create(
        codigo='APROBADA',
        nombre='Aprobada',
        descripcion='Orden aprobada',
        permite_edicion=False,
        permite_recepcion=True,
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#10B981',
        orden=2,
        is_active=True
    )


@pytest.fixture
def prioridad_media(db):
    """Prioridad MEDIA."""
    return PrioridadRequisicion.objects.create(
        codigo='MEDIA',
        nombre='Media',
        descripcion='Prioridad media',
        nivel=2,
        color_hex='#F59E0B',
        orden=2,
        is_active=True
    )


@pytest.fixture
def moneda_cop(db):
    """Moneda COP."""
    return Moneda.objects.create(
        codigo='COP',
        nombre='Peso Colombiano',
        simbolo='$',
        es_moneda_base=True,
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_contrato_suministro(db):
    """Tipo contrato SUMINISTRO."""
    return TipoContrato.objects.create(
        codigo='SUMINISTRO',
        nombre='Suministro',
        descripcion='Contrato de suministro',
        requiere_entregables=False,
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_contrato_vigente(db):
    """Estado contrato VIGENTE."""
    return EstadoContrato.objects.create(
        codigo='VIGENTE',
        nombre='Vigente',
        descripcion='Contrato vigente',
        permite_ordenes=True,
        color_hex='#10B981',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_material_conforme(db):
    """Estado material CONFORME."""
    return EstadoMaterial.objects.create(
        codigo='CONFORME',
        nombre='Conforme',
        descripcion='Material conforme',
        requiere_accion=False,
        color_hex='#10B981',
        orden=1,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE PROVEEDOR
# ==============================================================================

@pytest.fixture
def proveedor(db):
    """Proveedor de prueba."""
    from apps.supply_chain.catalogos.models import Departamento
    from apps.supply_chain.gestion_proveedores.models import TipoProveedor, TipoDocumentoIdentidad

    departamento = Departamento.objects.create(
        codigo='CUNDINAMARCA',
        nombre='Cundinamarca',
        codigo_dane='25',
        is_active=True
    )

    tipo_doc = TipoDocumentoIdentidad.objects.create(
        codigo='NIT',
        nombre='NIT',
        is_active=True
    )

    tipo_prov = TipoProveedor.objects.create(
        codigo='PRODUCTO_SERVICIO',
        nombre='Producto/Servicio',
        requiere_materia_prima=False,
        is_active=True
    )

    return Proveedor.objects.create(
        codigo_interno='PROV-001',
        tipo_proveedor=tipo_prov,
        nombre_comercial='Proveedor Test',
        razon_social='Proveedor Test SAS',
        tipo_documento=tipo_doc,
        numero_documento='900111222',
        telefono='3001234567',
        email='proveedor@test.com',
        direccion='Calle 10 # 20-30',
        ciudad='Bogotá',
        departamento=departamento,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE REQUISICION
# ==============================================================================

@pytest.fixture
def requisicion(db, empresa, sede, usuario, estado_requisicion_borrador, prioridad_media):
    """Requisición de prueba."""
    return Requisicion.objects.create(
        empresa=empresa,
        sede=sede,
        solicitante=usuario,
        area_solicitante='Producción',
        fecha_requerida=date.today() + timedelta(days=7),
        justificacion='Necesario para producción',
        estado=estado_requisicion_borrador,
        prioridad=prioridad_media,
        created_by=usuario
    )


@pytest.fixture
def detalle_requisicion(db, requisicion):
    """Detalle de requisición."""
    return DetalleRequisicion.objects.create(
        requisicion=requisicion,
        producto_servicio='Producto Test',
        descripcion='Descripción del producto',
        cantidad=Decimal('10.000'),
        unidad_medida='UNIDAD',
        precio_estimado=Decimal('50000.00')
    )


# ==============================================================================
# FIXTURES DE COTIZACION
# ==============================================================================

@pytest.fixture
def cotizacion(db, requisicion, proveedor, moneda_cop, estado_cotizacion_recibida, usuario):
    """Cotización de prueba."""
    return Cotizacion.objects.create(
        requisicion=requisicion,
        proveedor=proveedor,
        numero_cotizacion='COT-001',
        fecha_cotizacion=date.today(),
        fecha_vencimiento=date.today() + timedelta(days=30),
        moneda=moneda_cop,
        subtotal=Decimal('500000.00'),
        impuestos=Decimal('95000.00'),
        total=Decimal('595000.00'),
        tiempo_entrega_dias=15,
        condiciones_pago='30 días',
        estado=estado_cotizacion_recibida,
        created_by=usuario
    )


@pytest.fixture
def evaluacion_cotizacion(db, cotizacion, usuario):
    """Evaluación de cotización."""
    return EvaluacionCotizacion.objects.create(
        cotizacion=cotizacion,
        evaluado_por=usuario,
        criterios_evaluacion={'precio': 85, 'calidad': 90, 'tiempo': 80},
        puntaje_total=Decimal('85.00'),
        recomendacion='Aprobada para orden de compra'
    )


# ==============================================================================
# FIXTURES DE ORDEN DE COMPRA
# ==============================================================================

@pytest.fixture
def orden_compra(db, empresa, sede, requisicion, cotizacion, proveedor,
                 estado_orden_borrador, moneda_cop, usuario):
    """Orden de compra de prueba."""
    return OrdenCompra.objects.create(
        empresa=empresa,
        sede=sede,
        requisicion=requisicion,
        cotizacion=cotizacion,
        proveedor=proveedor,
        fecha_entrega_esperada=date.today() + timedelta(days=15),
        estado=estado_orden_borrador,
        moneda=moneda_cop,
        subtotal=Decimal('500000.00'),
        impuestos=Decimal('95000.00'),
        descuento=Decimal('0.00'),
        total=Decimal('595000.00'),
        condiciones_pago='30 días',
        lugar_entrega='Sede Bogotá',
        creado_por=usuario
    )


@pytest.fixture
def detalle_orden_compra(db, orden_compra):
    """Detalle de orden de compra."""
    return DetalleOrdenCompra.objects.create(
        orden_compra=orden_compra,
        producto_servicio='Producto Test',
        descripcion='Descripción del producto',
        cantidad_solicitada=Decimal('10.000'),
        cantidad_recibida=Decimal('0.000'),
        unidad_medida='UNIDAD',
        precio_unitario=Decimal('50000.00'),
        subtotal=Decimal('500000.00')
    )


# ==============================================================================
# FIXTURES DE CONTRATO
# ==============================================================================

@pytest.fixture
def contrato(db, empresa, proveedor, tipo_contrato_suministro,
             moneda_cop, estado_contrato_vigente, usuario):
    """Contrato de prueba."""
    return Contrato.objects.create(
        empresa=empresa,
        proveedor=proveedor,
        tipo_contrato=tipo_contrato_suministro,
        numero_contrato='CONT-2025-001',
        objeto='Suministro de materiales',
        fecha_inicio=date.today(),
        fecha_fin=date.today() + timedelta(days=365),
        valor_total=Decimal('10000000.00'),
        moneda=moneda_cop,
        condiciones='Pago a 30 días',
        estado=estado_contrato_vigente,
        responsable=usuario,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE RECEPCION
# ==============================================================================

@pytest.fixture
def recepcion_compra(db, orden_compra, estado_material_conforme, usuario):
    """Recepción de compra."""
    return RecepcionCompra.objects.create(
        orden_compra=orden_compra,
        numero_remision='REM-001',
        fecha_recepcion=timezone.now(),
        recibido_por=usuario,
        cantidad_recibida=Decimal('10.000'),
        estado_material=estado_material_conforme,
        observaciones='Recepción conforme'
    )
