"""
Factories mínimas para tests de almacenamiento.

Construye la cadena de dependencias requerida:
    EmpresaConfig + ConsecutivoConfig
    TipoDocumentoIdentidad
    CategoriaProducto + UnidadMedida → Producto
    TipoProveedor → Proveedor
    TipoAlmacen → Almacen
    TipoMovimientoInventario + EstadoInventario
    VoucherRecepcion (todo lo anterior + operador_bascula)
"""
from datetime import date
from decimal import Decimal

from apps.catalogo_productos.models import CategoriaProducto, Producto, UnidadMedida
from apps.core.models import TipoDocumentoIdentidad
from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
from apps.supply_chain.almacenamiento.models import (
    EstadoInventario,
    TipoMovimientoInventario,
)
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.gestion_proveedores.models import Proveedor, TipoProveedor
from apps.supply_chain.recepcion.models import VoucherRecepcion


def create_empresa(razon_social='Empresa Test', nit='900000001'):
    return EmpresaConfig.objects.create(razon_social=razon_social, nit=nit)


def create_consecutivo_movimiento(empresa):
    """Consecutivo requerido por MovimientoInventario.save()."""
    return ConsecutivoConfig.objects.create(
        codigo='MOVIMIENTO_INV',
        nombre='Movimiento de Inventario',
        prefix='MOV',
        empresa_id=empresa.id,
        current_number=0,
        padding=5,
        numero_inicial=1,
    )


def create_tipo_documento(codigo='NIT', nombre='NIT'):
    obj, _ = TipoDocumentoIdentidad.objects.get_or_create(
        codigo=codigo, defaults={'nombre': nombre, 'orden': 1},
    )
    return obj


def create_unidad_kg():
    return UnidadMedida.objects.create(
        nombre='Kilogramo', abreviatura='kg', tipo='PESO', es_base=True,
    )


def create_categoria_producto(nombre='Materias Primas'):
    return CategoriaProducto.objects.create(nombre=nombre, orden=1)


def create_producto(categoria, unidad_medida, codigo='PRD-001', nombre='Producto Test'):
    return Producto.objects.create(
        codigo=codigo,
        nombre=nombre,
        categoria=categoria,
        unidad_medida=unidad_medida,
        tipo='MATERIA_PRIMA',
    )


def create_tipo_proveedor(codigo='MP'):
    return TipoProveedor.objects.create(
        codigo=codigo, nombre='Proveedor MP',
        requiere_materia_prima=True, orden=1,
    )


def create_proveedor(tipo_proveedor, tipo_documento, numero='900111222'):
    return Proveedor.objects.create(
        tipo_proveedor=tipo_proveedor,
        nombre_comercial='Proveedor Test',
        razon_social='Proveedor Test S.A.S.',
        tipo_documento=tipo_documento,
        numero_documento=numero,
    )


def create_tipo_almacen(codigo='SILO'):
    return TipoAlmacen.objects.create(codigo=codigo, nombre='Silo', orden=1)


def create_almacen(empresa, tipo_almacen, codigo='SIL-01'):
    return Almacen.objects.create(
        empresa=empresa,
        codigo=codigo,
        nombre='Almacén Test',
        tipo_almacen=tipo_almacen,
        permite_recepcion=True,
    )


def create_tipo_movimiento_entrada():
    return TipoMovimientoInventario.objects.create(
        codigo='ENTRADA',
        nombre='Entrada de Inventario',
        afecta_stock='POSITIVO',
        requiere_destino=True,
    )


def create_estado_disponible():
    return EstadoInventario.objects.create(
        codigo='DISPONIBLE',
        nombre='Disponible',
        permite_uso=True,
    )


def create_voucher(
    *, proveedor, producto, almacen_destino, operador,
    peso_bruto=Decimal('1050.000'),
    peso_tara=Decimal('50.000'),
    precio_kg=Decimal('3500.00'),
    fecha_viaje=None,
):
    return VoucherRecepcion.objects.create(
        proveedor=proveedor,
        producto=producto,
        modalidad_entrega='DIRECTO',
        fecha_viaje=fecha_viaje or date(2026, 4, 17),
        peso_bruto_kg=peso_bruto,
        peso_tara_kg=peso_tara,
        precio_kg_snapshot=precio_kg,
        almacen_destino=almacen_destino,
        operador_bascula=operador,
    )


def setup_full_supply_chain(test_case):
    """
    Setup completo para tests que necesitan la cadena entera.

    Asigna a `test_case` los siguientes atributos:
        empresa, consecutivo, tipo_doc, unidad_kg, categoria, producto,
        tipo_proveedor, proveedor, tipo_almacen, almacen,
        tipo_entrada, estado_disponible
    """
    test_case.empresa = create_empresa()
    test_case.consecutivo = create_consecutivo_movimiento(test_case.empresa)
    test_case.tipo_doc = create_tipo_documento()
    test_case.unidad_kg = create_unidad_kg()
    test_case.categoria = create_categoria_producto()
    test_case.producto = create_producto(test_case.categoria, test_case.unidad_kg)
    test_case.tipo_proveedor = create_tipo_proveedor()
    test_case.proveedor = create_proveedor(test_case.tipo_proveedor, test_case.tipo_doc)
    test_case.tipo_almacen = create_tipo_almacen()
    test_case.almacen = create_almacen(test_case.empresa, test_case.tipo_almacen)
    test_case.tipo_entrada = create_tipo_movimiento_entrada()
    test_case.estado_disponible = create_estado_disponible()
