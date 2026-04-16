"""Serializers para Catálogo de Productos."""
from rest_framework import serializers

from .models import CategoriaProducto, UnidadMedida, Producto


class CategoriaProductoSerializer(serializers.ModelSerializer):
    full_path = serializers.CharField(read_only=True)
    subcategorias_count = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaProducto
        fields = [
            'id', 'nombre', 'descripcion', 'parent', 'codigo',
            'orden', 'full_path', 'subcategorias_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_subcategorias_count(self, obj):
        return obj.subcategorias.filter(is_deleted=False).count()


class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'nombre', 'abreviatura', 'tipo',
            'factor_conversion', 'es_base', 'orden',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(
        source='categoria.nombre', read_only=True, default=None,
    )
    unidad_medida_nombre = serializers.CharField(
        source='unidad_medida.nombre', read_only=True,
    )
    unidad_medida_abreviatura = serializers.CharField(
        source='unidad_medida.abreviatura', read_only=True,
    )

    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'categoria', 'categoria_nombre',
            'unidad_medida', 'unidad_medida_nombre', 'unidad_medida_abreviatura',
            'tipo', 'precio_referencia', 'sku', 'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
