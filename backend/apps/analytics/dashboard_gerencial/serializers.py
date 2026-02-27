"""
Serializers para Dashboard Gerencial - Analytics
"""
from rest_framework import serializers
from .models import VistaDashboard, WidgetDashboard, FavoritoDashboard


class VistaDashboardSerializer(serializers.ModelSerializer):
    """Serializer para VistaDashboard"""

    class Meta:
        model = VistaDashboard
        fields = [
            'id', 'nombre', 'codigo', 'perspectiva_bsc', 'descripcion',
            'es_publica', 'roles_permitidos', 'orden',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class WidgetDashboardSerializer(serializers.ModelSerializer):
    """Serializer para WidgetDashboard"""
    vista_codigo = serializers.CharField(source='vista.codigo', read_only=True)

    class Meta:
        model = WidgetDashboard
        fields = [
            'id', 'vista', 'vista_codigo', 'tipo_widget', 'titulo',
            'kpis', 'configuracion', 'posicion_x', 'posicion_y',
            'ancho', 'alto', 'orden', 'is_active', 'empresa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FavoritoDashboardSerializer(serializers.ModelSerializer):
    """Serializer para FavoritoDashboard"""
    vista_nombre = serializers.CharField(source='vista.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)

    class Meta:
        model = FavoritoDashboard
        fields = [
            'id', 'usuario', 'usuario_nombre', 'vista', 'vista_nombre',
            'es_default', 'fecha_agregado'
        ]
        read_only_fields = ['id', 'fecha_agregado']
