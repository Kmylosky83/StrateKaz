"""
Serializers para IPEVR - GTC-45
"""
from rest_framework import serializers
from .models import ClasificacionPeligro, Peligro, MatrizIPEVR, ControlPropuesto


class ClasificacionPeligroSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = ClasificacionPeligro
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'nombre',
            'descripcion', 'efectos_posibles', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PeligroSerializer(serializers.ModelSerializer):
    clasificacion_nombre = serializers.CharField(
        source='clasificacion.nombre', read_only=True
    )
    clasificacion_tipo = serializers.CharField(
        source='clasificacion.get_tipo_display', read_only=True
    )

    class Meta:
        model = Peligro
        fields = [
            'id', 'clasificacion', 'clasificacion_nombre', 'clasificacion_tipo',
            'codigo', 'descripcion', 'fuente', 'medio', 'efectos',
            'empresa_id', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class ControlPropuestoSerializer(serializers.ModelSerializer):
    tipo_control_display = serializers.CharField(
        source='get_tipo_control_display', read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display', read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )

    class Meta:
        model = ControlPropuesto
        fields = [
            'id', 'matriz', 'tipo_control', 'tipo_control_display',
            'descripcion', 'responsable', 'responsable_nombre',
            'fecha_implementacion', 'estado', 'estado_display',
            'evidencia', 'empresa_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MatrizIPEVRListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    peligro_descripcion = serializers.CharField(
        source='peligro.descripcion', read_only=True
    )
    peligro_tipo = serializers.CharField(
        source='peligro.clasificacion.get_tipo_display', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    interpretacion_texto = serializers.CharField(
        source='get_interpretacion_display', read_only=True
    )

    class Meta:
        model = MatrizIPEVR
        fields = [
            'id', 'codigo', 'proceso', 'zona_lugar', 'actividad',
            'peligro', 'peligro_descripcion', 'peligro_tipo',
            'nivel_riesgo', 'interpretacion_nr', 'aceptabilidad',
            'estado', 'estado_display', 'interpretacion_texto',
            'num_expuestos', 'fecha_evaluacion'
        ]


class MatrizIPEVRDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle"""
    peligro_data = PeligroSerializer(source='peligro', read_only=True)
    controles_propuestos = ControlPropuestoSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    interpretacion_texto = serializers.CharField(
        source='get_interpretacion_display', read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )

    class Meta:
        model = MatrizIPEVR
        fields = [
            'id', 'codigo', 'proceso', 'zona_lugar', 'actividad', 'tarea',
            'rutinaria', 'peligro', 'peligro_data',
            'control_fuente', 'control_medio', 'control_individuo',
            'nivel_deficiencia', 'nivel_exposicion', 'nivel_probabilidad',
            'nivel_consecuencia', 'nivel_riesgo', 'interpretacion_nr',
            'aceptabilidad', 'interpretacion_texto',
            'num_expuestos', 'peor_consecuencia', 'requisito_legal',
            'estado', 'estado_display', 'fecha_evaluacion', 'proxima_revision',
            'controles_propuestos', 'empresa_id',
            'created_at', 'updated_at', 'created_by', 'created_by_nombre'
        ]
        read_only_fields = [
            'nivel_probabilidad', 'nivel_riesgo', 'interpretacion_nr',
            'aceptabilidad', 'created_at', 'updated_at', 'created_by'
        ]
