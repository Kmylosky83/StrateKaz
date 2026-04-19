"""Fixtures para tests de Sesión 3 — VoucherRecepcion + RecepcionCalidad."""
from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from apps.catalogo_productos.models import CategoriaProducto, Producto, UnidadMedida
from apps.core.models import TipoDocumentoIdentidad
from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.gestion_proveedores.models import (
    PrecioMateriaPrima,
    Proveedor,
    TipoProveedor,
)

User = get_user_model()


# ─── Core / Identidad ──────────────────────────────────────────────────
@pytest.fixture
def tipo_documento_nit(db):
    return TipoDocumentoIdentidad.objects.get_or_create(
        codigo='NIT', defaults={'nombre': 'NIT', 'orden': 1},
    )[0]


@pytest.fixture
def user_operador(db):
    return User.objects.create_user(
        username='operador_bascula',
        email='operador@test.local',
        password='test-pass',
        first_name='Juan',
        last_name='Operador',
        document_number='CC-OPER-001',
    )


@pytest.fixture
def user_analista(db):
    return User.objects.create_user(
        username='analista_qc',
        email='analista@test.local',
        password='test-pass',
        first_name='Ana',
        last_name='Analista',
        document_number='CC-ANA-002',
    )


# ─── Configuración tenant ──────────────────────────────────────────────
@pytest.fixture
def empresa(db):
    return EmpresaConfig.objects.create(
        razon_social='Empresa Test S.A.S.',
        nit='900000001',
    )


@pytest.fixture
def uneg_planta(db, empresa):
    return SedeEmpresa.objects.create(
        nombre='Planta Principal',
        tipo_unidad='PLANTA',
        es_sede_principal=True,
        direccion='Cra 1 # 1-1',
        ciudad='Bogotá',
        departamento='CUNDINAMARCA',
    )


@pytest.fixture
def uneg_recolectora(db, empresa):
    return SedeEmpresa.objects.create(
        nombre='Ruta Recolección Norte',
        tipo_unidad='CENTRO_ACOPIO',
        es_proveedor_interno=True,
        direccion='Km 5 vía Norte',
        ciudad='Bogotá',
        departamento='CUNDINAMARCA',
    )


# ─── Catálogos ─────────────────────────────────────────────────────────
@pytest.fixture
def tipo_almacen_silo(db):
    return TipoAlmacen.objects.create(
        codigo='SILO', nombre='Silo', orden=1,
    )


@pytest.fixture
def almacen_silo(db, tipo_almacen_silo):
    return Almacen.objects.create(
        codigo='SIL-01',
        nombre='Silo 01 Sebo',
        tipo_almacen=tipo_almacen_silo,
        permite_recepcion=True,
    )


@pytest.fixture
def almacen_sin_tipo(db):
    """Almacén legacy sin tipo — backward compat."""
    return Almacen.objects.create(
        codigo='ALM-OLD',
        nombre='Almacén legacy',
        permite_recepcion=True,
    )


@pytest.fixture
def categoria_producto(db):
    return CategoriaProducto.objects.create(nombre='Materias Primas S3', orden=1)


@pytest.fixture
def unidad_kg(db):
    return UnidadMedida.objects.create(
        nombre='Kilogramo S3', abreviatura='kg-s3', tipo='PESO', es_base=True,
    )


@pytest.fixture
def producto_sebo(db, categoria_producto, unidad_kg):
    return Producto.objects.create(
        codigo='S3-SEBO-A',
        nombre='Sebo S3',
        categoria=categoria_producto,
        unidad_medida=unidad_kg,
        tipo='MATERIA_PRIMA',
    )


# ─── Proveedores y Precio ──────────────────────────────────────────────
@pytest.fixture
def tipo_proveedor_mp(db):
    return TipoProveedor.objects.create(
        codigo='MP', nombre='Proveedor MP', requiere_materia_prima=True, orden=1,
    )


@pytest.fixture
def proveedor_mp(db, tipo_proveedor_mp, tipo_documento_nit):
    return Proveedor.objects.create(
        tipo_proveedor=tipo_proveedor_mp,
        nombre_comercial='Finca El Prado',
        razon_social='Finca El Prado S.A.S.',
        tipo_documento=tipo_documento_nit,
        numero_documento='900111222',
    )


@pytest.fixture
def precio_sebo(db, proveedor_mp, producto_sebo):
    return PrecioMateriaPrima.objects.create(
        proveedor=proveedor_mp,
        producto=producto_sebo,
        precio_kg=Decimal('3500.00'),
    )


# ─── Voucher base ──────────────────────────────────────────────────────
@pytest.fixture
def voucher_base_kwargs(proveedor_mp, producto_sebo, almacen_silo, user_operador, precio_sebo):
    """Datos mínimos reutilizables para crear un VoucherRecepcion."""
    return dict(
        proveedor=proveedor_mp,
        producto=producto_sebo,
        modalidad_entrega='DIRECTO',
        fecha_viaje=date(2026, 4, 17),
        peso_bruto_kg=Decimal('1050.000'),
        peso_tara_kg=Decimal('50.000'),
        precio_kg_snapshot=precio_sebo.precio_kg,
        almacen_destino=almacen_silo,
        operador_bascula=user_operador,
    )
