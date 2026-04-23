"""
Serializers para catalogos - supply_chain
"""
from rest_framework import serializers
from .models import Almacen, TipoAlmacen


class TipoAlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlmacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'icono',
            'orden', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlmacenSerializer(serializers.ModelSerializer):
    tipo_almacen_nombre = serializers.CharField(
        source='tipo_almacen.nombre', read_only=True, allow_null=True
    )
    sede_nombre = serializers.CharField(
        source='sede.nombre', read_only=True, allow_null=True
    )

    class Meta:
        model = Almacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'direccion',
            'es_principal', 'permite_despacho', 'permite_recepcion',
            'tipo_almacen', 'tipo_almacen_nombre', 'capacidad_maxima',
            'sede', 'sede_nombre',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
