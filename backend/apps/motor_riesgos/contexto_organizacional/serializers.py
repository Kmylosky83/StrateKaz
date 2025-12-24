from rest_framework import serializers
from .models import FactorExterno, FactorInterno, AnalisisDOFA, EstrategiaDOFA


class FactorExternoSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    probabilidad_display = serializers.CharField(source='get_probabilidad_display', read_only=True)
    relevancia_display = serializers.CharField(source='get_relevancia_display', read_only=True)
    
    class Meta:
        model = FactorExterno
        fields = [
            'id', 'tipo', 'tipo_display', 'descripcion', 'impacto', 'impacto_display',
            'probabilidad', 'probabilidad_display', 'relevancia', 'relevancia_display',
            'is_active', 'empresa_id', 'created_at', 'updated_at', 'created_by',
            'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class FactorInternoSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    relevancia_display = serializers.CharField(source='get_relevancia_display', read_only=True)
    
    class Meta:
        model = FactorInterno
        fields = [
            'id', 'tipo', 'tipo_display', 'descripcion', 'area_afectada', 'impacto',
            'relevancia', 'relevancia_display', 'is_active', 'empresa_id',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class EstrategiaDOFASerializer(serializers.ModelSerializer):
    responsable_name = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    
    class Meta:
        model = EstrategiaDOFA
        fields = [
            'id', 'analisis_dofa', 'tipo', 'tipo_display', 'descripcion', 'objetivo',
            'responsable', 'responsable_name', 'fecha_limite', 'estado', 'estado_display',
            'prioridad', 'prioridad_display', 'empresa_id', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class AnalisisDOFASerializer(serializers.ModelSerializer):
    elaborado_por_name = serializers.CharField(source='elaborado_por.get_full_name', read_only=True)
    aprobado_por_name = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    estrategias = EstrategiaDOFASerializer(many=True, read_only=True)
    total_estrategias = serializers.SerializerMethodField()
    
    class Meta:
        model = AnalisisDOFA
        fields = [
            'id', 'periodo', 'fecha_analisis', 'fortalezas', 'debilidades',
            'oportunidades', 'amenazas', 'conclusiones', 'elaborado_por',
            'elaborado_por_name', 'aprobado_por', 'aprobado_por_name', 'empresa_id',
            'created_at', 'updated_at', 'estrategias', 'total_estrategias'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_total_estrategias(self, obj):
        return obj.estrategias.count()
