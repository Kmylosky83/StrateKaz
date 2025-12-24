"""
Serializers para Aspectos Ambientales - ISO 14001
Sistema de Gestión Ambiental
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CategoriaAspecto,
    AspectoAmbiental,
    ImpactoAmbiental,
    ProgramaAmbiental,
    MonitoreoAmbiental
)

User = get_user_model()


class CategoriaAspectoSerializer(serializers.ModelSerializer):
    """Serializer para categorías de aspectos ambientales"""

    class Meta:
        model = CategoriaAspecto
        fields = [
            'id', 'codigo', 'tipo', 'nombre', 'descripcion',
            'impactos_asociados', 'requisitos_legales', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ImpactoAmbientalSerializer(serializers.ModelSerializer):
    """Serializer para impactos ambientales"""
    aspecto_codigo = serializers.CharField(source='aspecto.codigo', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ImpactoAmbiental
        fields = [
            'id', 'aspecto', 'aspecto_codigo', 'codigo', 'nombre',
            'descripcion', 'componente_ambiental', 'tipo_impacto',
            'magnitud', 'duracion', 'extension', 'valor_cuantitativo',
            'unidad_medida', 'medidas_control', 'empresa_id',
            'created_at', 'updated_at', 'created_by', 'created_by_nombre'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class AspectoAmbientalListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de aspectos ambientales"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_impactos = serializers.IntegerField(source='impactos.count', read_only=True)

    class Meta:
        model = AspectoAmbiental
        fields = [
            'id', 'codigo', 'categoria', 'categoria_nombre', 'proceso',
            'actividad', 'condicion_operacion', 'significancia',
            'valor_significancia', 'estado', 'fecha_identificacion',
            'total_impactos', 'empresa_id', 'created_at',
            'created_by', 'created_by_nombre'
        ]


class AspectoAmbientalDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de aspectos ambientales"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    impactos = ImpactoAmbientalSerializer(many=True, read_only=True)
    nivel_prioridad = serializers.CharField(source='get_nivel_prioridad', read_only=True)

    class Meta:
        model = AspectoAmbiental
        fields = '__all__'
        read_only_fields = [
            'valor_significancia', 'significancia',
            'created_at', 'updated_at', 'created_by'
        ]


class ProgramaAmbientalListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de programas ambientales"""
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    total_aspectos = serializers.IntegerField(source='aspectos_relacionados.count', read_only=True)
    duracion_dias = serializers.IntegerField(source='get_duracion_dias', read_only=True)
    is_vencido = serializers.BooleanField(source='is_vencido', read_only=True)

    class Meta:
        model = ProgramaAmbiental
        fields = [
            'id', 'codigo', 'nombre', 'tipo_programa', 'responsable',
            'responsable_nombre', 'fecha_inicio', 'fecha_fin',
            'estado', 'porcentaje_avance', 'total_aspectos',
            'duracion_dias', 'is_vencido', 'empresa_id',
            'created_at', 'updated_at'
        ]


class ProgramaAmbientalDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de programas ambientales"""
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    aspectos_relacionados_detalle = AspectoAmbientalListSerializer(
        source='aspectos_relacionados',
        many=True,
        read_only=True
    )
    equipo_apoyo_nombres = serializers.SerializerMethodField()
    duracion_dias = serializers.IntegerField(source='get_duracion_dias', read_only=True)
    is_vencido = serializers.BooleanField(source='is_vencido', read_only=True)

    class Meta:
        model = ProgramaAmbiental
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_equipo_apoyo_nombres(self, obj):
        """Obtiene nombres del equipo de apoyo"""
        return [user.get_full_name() for user in obj.equipo_apoyo.all()]


class MonitoreoAmbientalSerializer(serializers.ModelSerializer):
    """Serializer para monitoreos ambientales"""
    aspecto_codigo = serializers.CharField(source='aspecto_relacionado.codigo', read_only=True)
    programa_nombre = serializers.CharField(source='programa_relacionado.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable_medicion.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    porcentaje_cumplimiento = serializers.DecimalField(
        source='get_porcentaje_cumplimiento',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    requiere_accion = serializers.BooleanField(source='requiere_accion_correctiva', read_only=True)

    class Meta:
        model = MonitoreoAmbiental
        fields = [
            'id', 'codigo', 'tipo_monitoreo', 'aspecto_relacionado',
            'aspecto_codigo', 'programa_relacionado', 'programa_nombre',
            'ubicacion', 'fecha_monitoreo', 'hora_monitoreo',
            'frecuencia_requerida', 'parametro_medido', 'valor_medido',
            'unidad_medida', 'valor_referencia', 'cumplimiento',
            'normatividad_aplicable', 'metodo_medicion', 'equipo_utilizado',
            'responsable_medicion', 'responsable_nombre', 'laboratorio_externo',
            'numero_informe', 'observaciones', 'acciones_tomadas',
            'evidencia_fotografica', 'archivo_adjunto', 'porcentaje_cumplimiento',
            'requiere_accion', 'empresa_id', 'created_at', 'updated_at',
            'created_by', 'created_by_nombre'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
