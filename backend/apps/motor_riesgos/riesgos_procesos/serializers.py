"""
Serializers para Riesgos de Procesos - ISO 31000
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    MonitoreoRiesgo,
    MapaCalor
)

User = get_user_model()


class CategoriaRiesgoSerializer(serializers.ModelSerializer):
    """Serializer para categorías de riesgo"""

    class Meta:
        model = CategoriaRiesgo
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'color', 'icono', 'orden', 'is_active',
            'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RiesgoProcesoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)

    class Meta:
        model = RiesgoProceso
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_nombre',
            'proceso', 'probabilidad', 'impacto', 'nivel_riesgo',
            'estado', 'responsable', 'responsable_nombre',
            'empresa_id', 'created_at'
        ]


class RiesgoProcesoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = RiesgoProceso
        fields = '__all__'
        read_only_fields = [
            'nivel_riesgo', 'nivel_residual',
            'created_at', 'updated_at', 'created_by'
        ]


class TratamientoRiesgoSerializer(serializers.ModelSerializer):
    """Serializer para planes de tratamiento"""
    riesgo_codigo = serializers.CharField(source='riesgo.codigo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)

    class Meta:
        model = TratamientoRiesgo
        fields = [
            'id', 'riesgo', 'riesgo_codigo', 'tipo_tratamiento',
            'descripcion', 'recursos_requeridos', 'responsable',
            'responsable_nombre', 'fecha_inicio', 'fecha_fin',
            'porcentaje_avance', 'estado', 'efectividad_esperada',
            'observaciones', 'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MonitoreoRiesgoSerializer(serializers.ModelSerializer):
    """Serializer para monitoreo de riesgos"""
    riesgo_codigo = serializers.CharField(source='riesgo.codigo', read_only=True)
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)

    class Meta:
        model = MonitoreoRiesgo
        fields = [
            'id', 'riesgo', 'riesgo_codigo', 'fecha_monitoreo',
            'probabilidad_actual', 'impacto_actual', 'nivel_actual',
            'efectividad_controles', 'observaciones', 'acciones_correctivas',
            'realizado_por', 'realizado_por_nombre',
            'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['nivel_actual', 'created_at', 'updated_at']


class MapaCalorSerializer(serializers.ModelSerializer):
    """Serializer para mapas de calor"""
    generado_por_nombre = serializers.CharField(source='generado_por.get_full_name', read_only=True)

    class Meta:
        model = MapaCalor
        fields = [
            'id', 'nombre', 'descripcion', 'fecha_generacion',
            'tipo', 'configuracion', 'datos', 'is_active',
            'generado_por', 'generado_por_nombre',
            'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['fecha_generacion', 'created_at', 'updated_at']
