"""
Serializers para catalogos - supply_chain
"""
from rest_framework import serializers
from .models import UnidadMedida, Almacen


class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'codigo', 'nombre', 'simbolo', 'tipo',
            'descripcion', 'factor_conversion_kg', 'orden',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'direccion',
            'es_principal', 'permite_despacho', 'permite_recepcion',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
