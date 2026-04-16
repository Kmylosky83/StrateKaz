"""Tests de modelos para Catálogo de Productos."""
import pytest

from django.db import IntegrityError

from apps.catalogo_productos.models import CategoriaProducto, UnidadMedida, Producto


pytestmark = pytest.mark.django_db


class TestCategoriaProducto:
    """Tests para el modelo CategoriaProducto."""

    def test_create_simple(self, categoria):
        assert categoria.pk is not None
        assert categoria.nombre == 'Materias Primas'
        assert categoria.is_deleted is False

    def test_create_jerarquica(self, categoria, subcategoria):
        assert subcategoria.parent == categoria
        assert subcategoria.parent.nombre == 'Materias Primas'

    def test_str_raiz(self, categoria):
        assert str(categoria) == 'Materias Primas'

    def test_str_jerarquica(self, subcategoria):
        assert str(subcategoria) == 'Materias Primas > Grasas'

    def test_full_path(self, subcategoria):
        assert subcategoria.full_path == 'Materias Primas > Grasas'

    def test_soft_delete(self, categoria):
        categoria.soft_delete()
        categoria.refresh_from_db()
        assert categoria.is_deleted is True
        assert CategoriaProducto.objects.filter(
            pk=categoria.pk, is_deleted=False
        ).count() == 0

    def test_subcategorias_count(self, categoria, subcategoria):
        count = categoria.subcategorias.filter(is_deleted=False).count()
        assert count == 1


class TestUnidadMedida:
    """Tests para el modelo UnidadMedida."""

    def test_create(self, unidad_medida):
        assert unidad_medida.pk is not None
        assert unidad_medida.nombre == 'Kilogramo'
        assert unidad_medida.abreviatura == 'kg'
        assert unidad_medida.tipo == 'PESO'
        assert unidad_medida.es_base is True

    def test_str(self, unidad_medida):
        assert str(unidad_medida) == 'Kilogramo (kg)'

    def test_soft_delete(self, unidad_medida):
        unidad_medida.soft_delete()
        unidad_medida.refresh_from_db()
        assert unidad_medida.is_deleted is True


class TestProducto:
    """Tests para el modelo Producto."""

    def test_create_completo(self, producto):
        assert producto.pk is not None
        assert producto.codigo == 'MP-001'
        assert producto.nombre == 'Grasa de Cerdo'
        assert producto.tipo == 'MATERIA_PRIMA'
        assert producto.categoria is not None
        assert producto.unidad_medida is not None

    def test_str(self, producto):
        assert str(producto) == '[MP-001] Grasa de Cerdo'

    def test_codigo_unique(self, producto, unidad_medida):
        with pytest.raises(IntegrityError):
            Producto.objects.create(
                codigo='MP-001',  # duplicado
                nombre='Otro Producto',
                unidad_medida=unidad_medida,
            )

    def test_soft_delete(self, producto):
        producto.soft_delete()
        producto.refresh_from_db()
        assert producto.is_deleted is True
        assert Producto.objects.filter(
            pk=producto.pk, is_deleted=False
        ).count() == 0

    def test_categoria_nullable(self, unidad_medida):
        p = Producto.objects.create(
            codigo='SRV-001',
            nombre='Servicio de Transporte',
            tipo='SERVICIO',
            unidad_medida=unidad_medida,
            categoria=None,
        )
        assert p.pk is not None
        assert p.categoria is None

    def test_precio_referencia_nullable(self, unidad_medida):
        p = Producto.objects.create(
            codigo='INS-001',
            nombre='Empaque Genérico',
            tipo='INSUMO',
            unidad_medida=unidad_medida,
        )
        assert p.precio_referencia is None
