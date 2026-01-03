"""
Fixtures compartidos para tests de Almacenamiento e Inventario
===============================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoMovimientoInventario, EstadoInventario, etc.)
- Inventarios
- Movimientos de inventario
- Kardex (generación automática)
- Alertas de stock
- Configuraciones de stock

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.supply_chain.catalogos.models import Almacen
from apps.supply_chain.almacenamiento.models import (
    # Catálogos
    TipoMovimientoInventario,
    EstadoInventario,
    TipoAlerta,
    UnidadMedida,
    # Principales
    Inventario,
    MovimientoInventario,
    Kardex,
    AlertaStock,
    ConfiguracionStock,
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


# ==============================================================================
# FIXTURES DE ALMACEN
# ==============================================================================

@pytest.fixture
def almacen(db, empresa):
    """Almacén de prueba."""
    return Almacen.objects.create(
        codigo='ALM-01',
        nombre='Almacén Principal',
        descripcion='Almacén principal de materias primas',
        tipo_almacen='PRINCIPAL',
        direccion='Calle 123 # 45-67',
        responsable_nombre='Juan Pérez',
        responsable_telefono='3001234567',
        capacidad_total=1000.00,
        orden=1,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS
# ==============================================================================

@pytest.fixture
def tipo_movimiento_entrada(db):
    """Tipo de movimiento ENTRADA."""
    return TipoMovimientoInventario.objects.create(
        codigo='ENTRADA',
        nombre='Entrada de Inventario',
        descripcion='Entrada de mercancía al almacén',
        afecta_stock='POSITIVO',
        requiere_origen=False,
        requiere_destino=True,
        requiere_documento=True,
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_movimiento_salida(db):
    """Tipo de movimiento SALIDA."""
    return TipoMovimientoInventario.objects.create(
        codigo='SALIDA',
        nombre='Salida de Inventario',
        descripcion='Salida de mercancía del almacén',
        afecta_stock='NEGATIVO',
        requiere_origen=True,
        requiere_destino=False,
        requiere_documento=True,
        orden=2,
        is_active=True
    )


@pytest.fixture
def tipo_movimiento_ajuste(db):
    """Tipo de movimiento AJUSTE."""
    return TipoMovimientoInventario.objects.create(
        codigo='AJUSTE',
        nombre='Ajuste de Inventario',
        descripcion='Ajuste por diferencias de inventario',
        afecta_stock='NEUTRO',
        requiere_origen=False,
        requiere_destino=True,
        requiere_documento=False,
        orden=3,
        is_active=True
    )


@pytest.fixture
def estado_inventario_disponible(db):
    """Estado DISPONIBLE."""
    return EstadoInventario.objects.create(
        codigo='DISPONIBLE',
        nombre='Disponible',
        descripcion='Inventario disponible para uso',
        permite_uso=True,
        color_hex='#10B981',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_inventario_bloqueado(db):
    """Estado BLOQUEADO."""
    return EstadoInventario.objects.create(
        codigo='BLOQUEADO',
        nombre='Bloqueado',
        descripcion='Inventario bloqueado temporalmente',
        permite_uso=False,
        color_hex='#EF4444',
        orden=2,
        is_active=True
    )


@pytest.fixture
def tipo_alerta_stock_minimo(db):
    """Tipo de alerta STOCK_MINIMO."""
    return TipoAlerta.objects.create(
        codigo='STOCK_MINIMO',
        nombre='Stock Mínimo',
        descripcion='Alerta cuando el stock está por debajo del mínimo',
        prioridad='ALTA',
        color_hex='#F59E0B',
        dias_anticipacion=0,
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_alerta_vencimiento(db):
    """Tipo de alerta VENCIMIENTO."""
    return TipoAlerta.objects.create(
        codigo='VENCIMIENTO',
        nombre='Vencimiento Próximo',
        descripcion='Alerta de producto próximo a vencer',
        prioridad='CRITICA',
        color_hex='#EF4444',
        dias_anticipacion=30,
        orden=2,
        is_active=True
    )


@pytest.fixture
def unidad_medida_kg(db):
    """Unidad de medida KG."""
    return UnidadMedida.objects.create(
        codigo='KG',
        nombre='Kilogramos',
        abreviatura='kg',
        tipo='PESO',
        factor_conversion_base=Decimal('1.0000'),
        orden=1,
        is_active=True
    )


@pytest.fixture
def unidad_medida_lb(db):
    """Unidad de medida LB."""
    return UnidadMedida.objects.create(
        codigo='LB',
        nombre='Libras',
        abreviatura='lb',
        tipo='PESO',
        factor_conversion_base=Decimal('0.4536'),
        orden=2,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE INVENTARIO
# ==============================================================================

@pytest.fixture
def inventario(db, empresa, almacen, unidad_medida_kg, estado_inventario_disponible):
    """Inventario de prueba."""
    return Inventario.objects.create(
        empresa=empresa,
        almacen=almacen,
        producto_codigo='PROD-001',
        producto_nombre='Producto Test',
        producto_tipo='MATERIA_PRIMA',
        lote='L-2025-001',
        fecha_vencimiento=date.today() + timedelta(days=90),
        fecha_ingreso=timezone.now(),
        cantidad_disponible=Decimal('1000.000'),
        cantidad_reservada=Decimal('0.000'),
        cantidad_en_transito=Decimal('0.000'),
        unidad_medida=unidad_medida_kg,
        costo_unitario=Decimal('2500.00'),
        costo_promedio=Decimal('2500.00'),
        estado=estado_inventario_disponible,
        ubicacion_fisica='A-1-3',
        zona='Zona A'
    )


@pytest.fixture
def inventario_bajo_stock(db, empresa, almacen, unidad_medida_kg, estado_inventario_disponible):
    """Inventario con stock bajo."""
    return Inventario.objects.create(
        empresa=empresa,
        almacen=almacen,
        producto_codigo='PROD-002',
        producto_nombre='Producto Bajo Stock',
        producto_tipo='MATERIA_PRIMA',
        cantidad_disponible=Decimal('50.000'),  # Bajo
        unidad_medida=unidad_medida_kg,
        costo_unitario=Decimal('3000.00'),
        costo_promedio=Decimal('3000.00'),
        estado=estado_inventario_disponible
    )


# ==============================================================================
# FIXTURES DE MOVIMIENTO INVENTARIO
# ==============================================================================

@pytest.fixture
def movimiento_entrada(db, empresa, almacen, tipo_movimiento_entrada, unidad_medida_kg, usuario):
    """Movimiento de entrada de prueba."""
    return MovimientoInventario.objects.create(
        empresa=empresa,
        almacen_destino=almacen,
        tipo_movimiento=tipo_movimiento_entrada,
        fecha_movimiento=timezone.now(),
        producto_codigo='PROD-001',
        producto_nombre='Producto Test',
        lote='L-2025-001',
        cantidad=Decimal('500.000'),
        unidad_medida=unidad_medida_kg,
        costo_unitario=Decimal('2500.00'),
        documento_referencia='OC-001',
        origen_tipo='RECEPCION',
        origen_id=1,
        observaciones='Entrada de prueba',
        registrado_por=usuario
    )


@pytest.fixture
def movimiento_salida(db, empresa, almacen, tipo_movimiento_salida, unidad_medida_kg, usuario):
    """Movimiento de salida de prueba."""
    return MovimientoInventario.objects.create(
        empresa=empresa,
        almacen_origen=almacen,
        tipo_movimiento=tipo_movimiento_salida,
        fecha_movimiento=timezone.now(),
        producto_codigo='PROD-001',
        producto_nombre='Producto Test',
        lote='L-2025-001',
        cantidad=Decimal('100.000'),
        unidad_medida=unidad_medida_kg,
        costo_unitario=Decimal('2500.00'),
        documento_referencia='REQ-001',
        origen_tipo='REQUISICION',
        origen_id=1,
        observaciones='Salida de prueba',
        registrado_por=usuario
    )


# ==============================================================================
# FIXTURES DE CONFIGURACION STOCK
# ==============================================================================

@pytest.fixture
def configuracion_stock(db, empresa, almacen):
    """Configuración de stock de prueba."""
    return ConfiguracionStock.objects.create(
        empresa=empresa,
        almacen=almacen,
        producto_codigo='PROD-002',
        producto_nombre='Producto Bajo Stock',
        stock_minimo=Decimal('100.000'),
        stock_maximo=Decimal('1000.000'),
        punto_reorden=Decimal('200.000'),
        dias_alerta_vencimiento=30,
        lead_time_dias=7,
        cantidad_economica_pedido=Decimal('500.000'),
        activo=True
    )


# ==============================================================================
# FIXTURES DE ALERTA STOCK
# ==============================================================================

@pytest.fixture
def alerta_stock(db, empresa, almacen, inventario_bajo_stock, tipo_alerta_stock_minimo):
    """Alerta de stock de prueba."""
    return AlertaStock.objects.create(
        empresa=empresa,
        almacen=almacen,
        inventario=inventario_bajo_stock,
        tipo_alerta=tipo_alerta_stock_minimo,
        mensaje=f'Stock bajo para {inventario_bajo_stock.producto_nombre}',
        criticidad='ALTA',
        leida=False,
        resuelta=False
    )
