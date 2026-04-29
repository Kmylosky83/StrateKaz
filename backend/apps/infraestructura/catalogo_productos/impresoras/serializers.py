"""Serializers para ImpresoraTermica."""
from rest_framework import serializers

from .models import ImpresoraTermica


class ImpresoraTermicaSerializer(serializers.ModelSerializer):
    tipo_conexion_display = serializers.CharField(
        source='get_tipo_conexion_display', read_only=True
    )
    ancho_papel_display = serializers.CharField(
        source='get_ancho_papel_display', read_only=True
    )

    class Meta:
        model = ImpresoraTermica
        fields = [
            'id',
            'nombre',
            'tipo_conexion',
            'tipo_conexion_display',
            'direccion',
            'ancho_papel',
            'ancho_papel_display',
            'encoding',
            'usuario_asignado',
            'sede',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
