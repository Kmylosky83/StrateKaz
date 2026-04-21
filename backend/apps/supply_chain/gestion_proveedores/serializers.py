"""
Serializers para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Solo serializers de lo que vive en SC: ModalidadLogistica + Precios.
  Serializers de Proveedor, TipoProveedor → /api/catalogo-productos/.
"""
from rest_framework import serializers

from .models import ModalidadLogistica, PrecioMateriaPrima, HistorialPrecioProveedor


class ModalidadLogisticaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModalidadLogistica
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'orden', 'is_active',
        ]


class PrecioMateriaPrimaSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True,
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True,
    )
    producto_nombre = serializers.CharField(
        source='producto.nombre', read_only=True,
    )
    producto_codigo = serializers.CharField(
        source='producto.codigo', read_only=True,
    )
    unidad_medida = serializers.CharField(
        source='producto.unidad_medida.abreviatura', read_only=True, default='',
    )
    modalidad_logistica_nombre = serializers.CharField(
        source='modalidad_logistica.nombre', read_only=True, default=None,
    )
    # Flag del tipo_proveedor para que la UI sepa si exigir modalidad
    tipo_proveedor_requiere_modalidad = serializers.SerializerMethodField()

    class Meta:
        model = PrecioMateriaPrima
        fields = [
            'id',
            'proveedor', 'proveedor_nombre', 'proveedor_codigo',
            'producto', 'producto_nombre', 'producto_codigo', 'unidad_medida',
            'precio_kg',
            'modalidad_logistica', 'modalidad_logistica_nombre',
            'tipo_proveedor_requiere_modalidad',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tipo_proveedor_requiere_modalidad(self, obj):
        tp = getattr(obj.proveedor, 'tipo_proveedor', None)
        return bool(tp and tp.requiere_modalidad_logistica)

    def validate_precio_kg(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo.')
        return value


class HistorialPrecioSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True,
    )
    producto_nombre = serializers.CharField(
        source='producto.nombre', read_only=True, default=None,
    )
    modificado_por_nombre = serializers.CharField(
        source='modificado_por.get_full_name', read_only=True, default=None,
    )
    variacion_precio = serializers.ReadOnlyField()
    tipo_cambio = serializers.ReadOnlyField()

    class Meta:
        model = HistorialPrecioProveedor
        fields = [
            'id', 'proveedor', 'proveedor_nombre',
            'producto', 'producto_nombre',
            'precio_anterior', 'precio_nuevo',
            'variacion_precio', 'tipo_cambio',
            'modificado_por', 'modificado_por_nombre',
            'motivo', 'created_at',
        ]
        read_only_fields = fields
