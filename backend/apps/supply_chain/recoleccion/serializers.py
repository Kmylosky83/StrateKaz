"""
Serializers para Recolección en Ruta — H-SC-RUTA-02 refactor 2 (1=1 parada).
"""
from rest_framework import serializers

from .models import VoucherRecoleccion


class VoucherRecoleccionSerializer(serializers.ModelSerializer):
    """Voucher atómico = 1 parada visitada."""

    codigo = serializers.CharField(required=False, allow_blank=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    ruta_codigo = serializers.CharField(source='ruta.codigo', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True,
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True,
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    operador_nombre = serializers.CharField(
        source='operador.get_full_name', read_only=True,
    )
    operador_cargo = serializers.SerializerMethodField()

    class Meta:
        model = VoucherRecoleccion
        fields = [
            'id', 'codigo',
            'ruta', 'ruta_codigo', 'ruta_nombre',
            'fecha_recoleccion',
            'proveedor', 'proveedor_codigo', 'proveedor_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'cantidad',
            'operador', 'operador_nombre', 'operador_cargo',
            'estado', 'estado_display',
            'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'operador', 'created_at', 'updated_at']

    def get_operador_cargo(self, obj):
        try:
            colab = getattr(obj.operador, 'colaborador', None)
            if colab and colab.cargo:
                return colab.cargo.nombre
            cargo = getattr(obj.operador, 'cargo', None)
            if cargo:
                return getattr(cargo, 'nombre', None) or getattr(cargo, 'name', None)
        except Exception:
            pass
        return None

    def validate_cantidad(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero.')
        return value
