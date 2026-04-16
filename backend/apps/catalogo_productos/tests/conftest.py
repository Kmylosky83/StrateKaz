"""Fixtures para tests de catalogo_productos."""
import pytest

from apps.catalogo_productos.models import CategoriaProducto, UnidadMedida, Producto


@pytest.fixture
def categoria(db):
    """Categoría raíz de productos."""
    return CategoriaProducto.objects.create(
        nombre='Materias Primas',
        descripcion='Materiales para producción',
        orden=1,
    )


@pytest.fixture
def subcategoria(db, categoria):
    """Subcategoría hija."""
    return CategoriaProducto.objects.create(
        nombre='Grasas',
        descripcion='Grasas y aceites',
        parent=categoria,
        orden=1,
    )


@pytest.fixture
def unidad_medida(db):
    """Unidad de medida base (kilogramo)."""
    return UnidadMedida.objects.create(
        nombre='Kilogramo',
        abreviatura='kg',
        tipo='PESO',
        es_base=True,
        orden=1,
    )


@pytest.fixture
def unidad_litro(db):
    """Unidad de medida secundaria (litro)."""
    return UnidadMedida.objects.create(
        nombre='Litro',
        abreviatura='L',
        tipo='VOLUMEN',
        es_base=True,
        orden=1,
    )


@pytest.fixture
def producto(db, categoria, unidad_medida):
    """Producto completo con categoría y unidad."""
    return Producto.objects.create(
        codigo='MP-001',
        nombre='Grasa de Cerdo',
        descripcion='Grasa animal para procesamiento',
        categoria=categoria,
        unidad_medida=unidad_medida,
        tipo='MATERIA_PRIMA',
        precio_referencia=2500.00,
    )
