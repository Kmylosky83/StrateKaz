"""
Serializers para IPEVR - Identificacion de Peligros, Evaluacion y Valoracion de Riesgos
========================================================================================

Serializers para la gestion de la matriz IPEVR segun GTC-45.

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from rest_framework import serializers
from .models import ClasificacionPeligro, PeligroGTC45, MatrizIPEVR, ControlSST


class ClasificacionPeligroSerializer(serializers.ModelSerializer):
    """Serializer para Clasificaciones de Peligros GTC-45."""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    total_peligros = serializers.SerializerMethodField()

    class Meta:
        model = ClasificacionPeligro
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_display',
            'descripcion', 'color', 'icono', 'orden', 'is_active',
            'total_peligros', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_peligros(self, obj):
        return obj.peligros.filter(is_active=True).count()


class PeligroGTC45Serializer(serializers.ModelSerializer):
    """Serializer para Peligros GTC-45."""
    clasificacion_nombre = serializers.CharField(source='clasificacion.nombre', read_only=True)
    clasificacion_categoria = serializers.CharField(source='clasificacion.categoria', read_only=True)
    clasificacion_color = serializers.CharField(source='clasificacion.color', read_only=True)

    class Meta:
        model = PeligroGTC45
        fields = [
            'id', 'clasificacion', 'clasificacion_nombre', 'clasificacion_categoria',
            'clasificacion_color', 'codigo', 'nombre', 'descripcion',
            'efectos_posibles', 'orden', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ControlSSTSerializer(serializers.ModelSerializer):
    """Serializer para Controles SST."""
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    efectividad_display = serializers.CharField(source='get_efectividad_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    matriz_area = serializers.CharField(source='matriz_ipevr.area', read_only=True)
    matriz_cargo = serializers.CharField(source='matriz_ipevr.cargo', read_only=True)

    class Meta:
        model = ControlSST
        fields = [
            'id', 'matriz_ipevr', 'matriz_area', 'matriz_cargo',
            'tipo_control', 'tipo_control_display', 'descripcion',
            'responsable', 'responsable_nombre',
            'fecha_implementacion', 'estado', 'estado_display',
            'efectividad', 'efectividad_display',
            'evidencia', 'observaciones',
            'empresa_id', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MatrizIPEVRListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de Matriz IPEVR."""
    peligro_nombre = serializers.CharField(source='peligro.nombre', read_only=True)
    peligro_clasificacion = serializers.CharField(source='peligro.clasificacion.nombre', read_only=True)
    peligro_categoria = serializers.CharField(source='peligro.clasificacion.categoria', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Campos calculados
    nivel_probabilidad = serializers.IntegerField(read_only=True)
    interpretacion_np = serializers.CharField(read_only=True)
    nivel_riesgo = serializers.IntegerField(read_only=True)
    interpretacion_nr = serializers.CharField(read_only=True)
    aceptabilidad = serializers.CharField(read_only=True)

    class Meta:
        model = MatrizIPEVR
        fields = [
            'id', 'area', 'cargo', 'proceso', 'actividad', 'rutinaria',
            'peligro', 'peligro_nombre', 'peligro_clasificacion', 'peligro_categoria',
            'nivel_deficiencia', 'nivel_exposicion', 'nivel_consecuencia',
            'nivel_probabilidad', 'interpretacion_np',
            'nivel_riesgo', 'interpretacion_nr', 'aceptabilidad',
            'num_expuestos', 'estado', 'estado_display',
            'responsable', 'responsable_nombre',
            'fecha_valoracion', 'is_active', 'empresa_id', 'created_at'
        ]


class MatrizIPEVRDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de Matriz IPEVR."""
    peligro_detail = PeligroGTC45Serializer(source='peligro', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Campos calculados
    nivel_probabilidad = serializers.IntegerField(read_only=True)
    interpretacion_np = serializers.CharField(read_only=True)
    nivel_riesgo = serializers.IntegerField(read_only=True)
    interpretacion_nr = serializers.CharField(read_only=True)
    aceptabilidad = serializers.CharField(read_only=True)
    significado_aceptabilidad = serializers.CharField(read_only=True)

    # Controles relacionados
    controles_sst = serializers.SerializerMethodField()

    class Meta:
        model = MatrizIPEVR
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_controles_sst(self, obj):
        controles = obj.controles_sst.filter(is_active=True)
        return ControlSSTSerializer(controles, many=True).data
