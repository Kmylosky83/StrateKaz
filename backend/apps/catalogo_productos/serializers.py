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
            'orden', 'is_system', 'full_path', 'subcategorias_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_system', 'created_at', 'updated_at']

    def get_subcategorias_count(self, obj):
        return obj.subcategorias.filter(is_deleted=False).count()


class UnidadMedidaSerializer(serializers.ModelSerializer):
    unidad_base_nombre = serializers.CharField(
        source='unidad_base.nombre', read_only=True, default=None,
    )

    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'nombre', 'nombre_plural', 'abreviatura', 'simbolo',
            'descripcion', 'tipo',
            'unidad_base', 'unidad_base_nombre', 'factor_conversion', 'es_base',
            'decimales_display', 'prefiere_notacion_cientifica', 'usar_separador_miles',
            'orden', 'is_system',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_system', 'created_at', 'updated_at']


class ProductoSerializer(serializers.ModelSerializer):
    codigo = serializers.CharField(required=False, allow_blank=True)
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
            # H-SC-03: flag QC obligatorio
            'requiere_qc_recepcion',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
