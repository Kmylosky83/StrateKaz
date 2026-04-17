"""Fixtures para tests de Sesión 2 — migración a TenantModel + tipo_entidad + coexistencia FK."""
from decimal import Decimal

import pytest

from apps.catalogo_productos.models import CategoriaProducto, Producto, UnidadMedida
from apps.supply_chain.gestion_proveedores.models import (
    CategoriaMateriaPrima,
    ModalidadLogistica,
    PrecioMateriaPrima,
    Proveedor,
    TipoMateriaPrima,
    TipoProveedor,
)
from apps.core.models import TipoDocumentoIdentidad


@pytest.fixture
def tipo_documento_nit(db):
    """TipoDocumentoIdentidad NIT."""
    return TipoDocumentoIdentidad.objects.get_or_create(
        codigo='NIT',
        defaults={'nombre': 'NIT', 'orden': 1},
    )[0]


@pytest.fixture
def tipo_proveedor_mp(db):
    return TipoProveedor.objects.create(
        codigo='MATERIA_PRIMA',
        nombre='Proveedor Materia Prima',
        requiere_materia_prima=True,
        orden=1,
    )


@pytest.fixture
def tipo_proveedor_servicio(db):
    return TipoProveedor.objects.create(
        codigo='PRODUCTOS_SERVICIOS',
        nombre='Proveedor Servicios',
        orden=2,
    )


@pytest.fixture
def categoria_mp(db):
    return CategoriaMateriaPrima.objects.create(
        codigo='GRASAS',
        nombre='Grasas',
        orden=1,
    )


@pytest.fixture
def tipo_materia_sebo(db, categoria_mp):
    return TipoMateriaPrima.objects.create(
        codigo='SEBO_A',
        nombre='Sebo Tipo A',
        categoria=categoria_mp,
        acidez_min=Decimal('0.50'),
        acidez_max=Decimal('2.00'),
    )


@pytest.fixture
def categoria_producto(db):
    return CategoriaProducto.objects.create(
        nombre='Materias Primas Test',
        orden=1,
    )


@pytest.fixture
def unidad_kg(db):
    return UnidadMedida.objects.create(
        nombre='Kilogramo Test',
        abreviatura='kg-t',
        tipo='PESO',
        es_base=True,
    )


@pytest.fixture
def producto_catalogo(db, categoria_producto, unidad_kg):
    return Producto.objects.create(
        codigo='TEST-SEBO-A',
        nombre='Sebo Tipo A (Catálogo)',
        categoria=categoria_producto,
        unidad_medida=unidad_kg,
        tipo='MATERIA_PRIMA',
    )


@pytest.fixture
def proveedor(db, tipo_proveedor_mp, tipo_documento_nit):
    return Proveedor.objects.create(
        tipo_proveedor=tipo_proveedor_mp,
        nombre_comercial='Proveedor Test S.A.S.',
        razon_social='Proveedor Test S.A.S.',
        tipo_documento=tipo_documento_nit,
        numero_documento='900123456',
    )
