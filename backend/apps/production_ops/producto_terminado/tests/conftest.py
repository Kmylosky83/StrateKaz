"""
Fixtures compartidos para tests de Producto Terminado
======================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoProducto, EstadoLote)
- Productos terminados
- Stock de productos
- Liberaciones de calidad
- Certificados de calidad

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.production_ops.producto_terminado.models import (
    TipoProducto,
    EstadoLote,
    ProductoTerminado,
    StockProducto,
    Liberacion,
    CertificadoCalidad,
)

User = get_user_model()


# ==============================================================================
# FIXTURES DE EMPRESA Y USUARIOS
# ==============================================================================

@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    return EmpresaConfig.objects.create(
        nombre='StrateKaz',
        nit='900123456-1',
        razon_social='StrateKaz.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia'
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
def usuario_calidad(db):
    """Usuario de control de calidad."""
    return User.objects.create_user(
        username='calidad',
        email='calidad@ghn.com',
        password='testpass123',
        first_name='Control',
        last_name='Calidad',
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@pytest.fixture
def tipo_producto_harina(db):
    """Tipo de producto: Harina de Hueso."""
    return TipoProducto.objects.create(
        codigo='HARINA_HUESO',
        nombre='Harina de Hueso',
        descripcion='Harina de hueso procesada',
        unidad_medida='KG',
        requiere_certificado=True,
        requiere_ficha_tecnica=True,
        vida_util_dias=365,
        temperatura_almacenamiento_min=Decimal('15.00'),
        temperatura_almacenamiento_max=Decimal('25.00'),
        activo=True,
        orden=1
    )


@pytest.fixture
def tipo_producto_sebo(db):
    """Tipo de producto: Sebo Refinado."""
    return TipoProducto.objects.create(
        codigo='SEBO_REFINADO',
        nombre='Sebo Refinado',
        descripcion='Sebo refinado grado A',
        unidad_medida='KG',
        requiere_certificado=True,
        requiere_ficha_tecnica=True,
        vida_util_dias=180,
        temperatura_almacenamiento_min=Decimal('10.00'),
        temperatura_almacenamiento_max=Decimal('20.00'),
        activo=True,
        orden=2
    )


@pytest.fixture
def estado_lote_cuarentena(db):
    """Estado: CUARENTENA."""
    return EstadoLote.objects.create(
        codigo='CUARENTENA',
        nombre='En Cuarentena',
        color='warning',
        descripcion='Lote en cuarentena pendiente de liberación',
        permite_despacho=False,
        requiere_liberacion=True,
        activo=True,
        orden=2
    )


@pytest.fixture
def estado_lote_liberado(db):
    """Estado: LIBERADO."""
    return EstadoLote.objects.create(
        codigo='LIBERADO',
        nombre='Liberado',
        color='success',
        descripcion='Lote liberado para despacho',
        permite_despacho=True,
        requiere_liberacion=False,
        activo=True,
        orden=3
    )


@pytest.fixture
def estado_lote_rechazado(db):
    """Estado: RECHAZADO."""
    return EstadoLote.objects.create(
        codigo='RECHAZADO',
        nombre='Rechazado',
        color='danger',
        descripcion='Lote rechazado por calidad',
        permite_despacho=False,
        requiere_liberacion=False,
        activo=True,
        orden=5
    )


# ==============================================================================
# FIXTURES DE PRODUCTOS
# ==============================================================================

@pytest.fixture
def producto_harina_45(db, empresa, tipo_producto_harina):
    """Producto: Harina de Hueso 45% proteína."""
    return ProductoTerminado.objects.create(
        empresa=empresa,
        codigo='HH-45',
        nombre='Harina de Hueso 45% Proteína',
        descripcion='Harina de hueso con 45% de proteína mínimo',
        tipo_producto=tipo_producto_harina,
        especificaciones_tecnicas='Proteína: 45-48%, Grasa: max 12%, Humedad: max 10%',
        precio_base=Decimal('3500.00'),
        moneda='COP',
        is_active=True,
        created_by=None
    )


# ==============================================================================
# FIXTURES DE STOCK
# ==============================================================================

@pytest.fixture
def stock_producto(db, empresa, producto_harina_45, estado_lote_cuarentena):
    """Stock de producto en cuarentena."""
    return StockProducto.objects.create(
        empresa=empresa,
        producto=producto_harina_45,
        estado_lote=estado_lote_cuarentena,
        cantidad_inicial=Decimal('1000.000'),
        cantidad_disponible=Decimal('1000.000'),
        cantidad_reservada=Decimal('0.000'),
        fecha_produccion=date.today(),
        fecha_vencimiento=date.today() + timedelta(days=365),
        ubicacion_almacen='A-01-01',
        costo_unitario=Decimal('2500.00'),
        is_active=True,
        created_by=None
    )


# ==============================================================================
# FIXTURES DE LIBERACION
# ==============================================================================

@pytest.fixture
def liberacion_pendiente(db, empresa, stock_producto, usuario):
    """Liberación pendiente."""
    return Liberacion.objects.create(
        empresa=empresa,
        stock_producto=stock_producto,
        resultado='PENDIENTE',
        solicitado_por=usuario,
        parametros_evaluados=[],
        observaciones='',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def liberacion_aprobada(db, empresa, stock_producto, usuario, usuario_calidad):
    """Liberación aprobada."""
    return Liberacion.objects.create(
        empresa=empresa,
        stock_producto=stock_producto,
        resultado='APROBADO',
        fecha_liberacion=timezone.now(),
        solicitado_por=usuario,
        aprobado_por=usuario_calidad,
        parametros_evaluados=[
            {'parametro': 'Proteína', 'valor': '46%', 'cumple': True},
            {'parametro': 'Humedad', 'valor': '8%', 'cumple': True}
        ],
        observaciones='Lote aprobado - cumple especificaciones',
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE CERTIFICADO
# ==============================================================================

@pytest.fixture
def certificado_calidad(db, empresa, liberacion_aprobada, usuario_calidad):
    """Certificado de calidad."""
    return CertificadoCalidad.objects.create(
        empresa=empresa,
        liberacion=liberacion_aprobada,
        cliente_nombre='Cliente Test SA',
        fecha_vencimiento=date.today() + timedelta(days=30),
        parametros_certificados={
            'Proteína': '46%',
            'Grasa': '10%',
            'Humedad': '8%',
            'Cenizas': '35%'
        },
        observaciones='Certificado emitido conforme',
        emitido_por=usuario_calidad,
        is_active=True,
        created_by=usuario_calidad
    )
