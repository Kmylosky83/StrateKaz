"""
Serializers para Contexto Organizacional - Motor de Riesgos
==========================================================

Serializers para los modelos de análisis estratégico del contexto organizacional.

Modelos soportados:
- AnalisisDOFA: Análisis DOFA consolidado
- FactorDOFA: Factores individuales del análisis DOFA
- EstrategiaTOWS: Estrategias derivadas de la Matriz TOWS
- AnalisisPESTEL: Análisis PESTEL del entorno externo
- FactorPESTEL: Factores individuales del análisis PESTEL
- FuerzaPorter: Análisis de las 5 Fuerzas de Porter

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""

from rest_framework import serializers
from .models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter
)


class FactorDOFASerializer(serializers.ModelSerializer):
    """Serializer para FactorDOFA."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FactorDOFA
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion',
            'area_afectada', 'impacto', 'impacto_display', 'evidencias',
            'orden', 'empresa', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']


class AnalisisDOFASerializer(serializers.ModelSerializer):
    """Serializer para AnalisisDOFA."""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_name = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_name = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    factores = FactorDOFASerializer(many=True, read_only=True)
    total_factores = serializers.SerializerMethodField()
    total_estrategias = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisDOFA
        fields = [
            'id', 'nombre', 'fecha_analisis', 'periodo', 'responsable',
            'responsable_name', 'estado', 'estado_display', 'observaciones',
            'aprobado_por', 'aprobado_por_name', 'fecha_aprobacion',
            'empresa', 'created_at', 'updated_at', 'created_by',
            'factores', 'total_factores', 'total_estrategias'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores asociados."""
        return obj.factores.count()

    def get_total_estrategias(self, obj) -> int:
        """Retorna el total de estrategias asociadas."""
        return obj.estrategias.count()


class EstrategiaTOWSSerializer(serializers.ModelSerializer):
    """Serializer para EstrategiaTOWS."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    responsable_name = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = EstrategiaTOWS
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion', 'objetivo',
            'responsable', 'responsable_name', 'fecha_implementacion', 'fecha_limite',
            'prioridad', 'prioridad_display', 'estado', 'estado_display',
            'recursos_necesarios', 'indicadores_exito', 'progreso_porcentaje',
            'empresa', 'created_at', 'updated_at', 'created_by', 'created_by_name',
            'dias_restantes'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_dias_restantes(self, obj) -> int | None:
        """Calcula los días restantes hasta la fecha límite."""
        if obj.fecha_limite:
            from datetime import date
            delta = obj.fecha_limite - date.today()
            return delta.days
        return None


class FactorPESTELSerializer(serializers.ModelSerializer):
    """Serializer para FactorPESTEL."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    tendencia_display = serializers.CharField(source='get_tendencia_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    probabilidad_display = serializers.CharField(source='get_probabilidad_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FactorPESTEL
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion',
            'tendencia', 'tendencia_display', 'impacto', 'impacto_display',
            'probabilidad', 'probabilidad_display', 'implicaciones', 'fuentes',
            'orden', 'empresa', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']


class AnalisisPESTELSerializer(serializers.ModelSerializer):
    """Serializer para AnalisisPESTEL."""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_name = serializers.CharField(source='responsable.get_full_name', read_only=True)
    factores = FactorPESTELSerializer(many=True, read_only=True)
    total_factores = serializers.SerializerMethodField()
    distribucion_factores = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisPESTEL
        fields = [
            'id', 'nombre', 'fecha_analisis', 'periodo', 'responsable',
            'responsable_name', 'estado', 'estado_display', 'conclusiones',
            'empresa', 'created_at', 'updated_at', 'created_by',
            'factores', 'total_factores', 'distribucion_factores'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores asociados."""
        return obj.factores.count()

    def get_distribucion_factores(self, obj) -> dict:
        """Retorna la distribución de factores por tipo."""
        from django.db.models import Count
        distribucion = obj.factores.values('tipo').annotate(
            total=Count('id')
        ).order_by('tipo')
        return {item['tipo']: item['total'] for item in distribucion}


class FuerzaPorterSerializer(serializers.ModelSerializer):
    """Serializer para FuerzaPorter."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_factores = serializers.SerializerMethodField()

    class Meta:
        model = FuerzaPorter
        fields = [
            'id', 'tipo', 'tipo_display', 'nivel', 'nivel_display',
            'descripcion', 'factores', 'fecha_analisis', 'periodo',
            'implicaciones_estrategicas', 'empresa', 'created_at',
            'updated_at', 'created_by', 'created_by_name', 'total_factores'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores en el campo JSON."""
        if isinstance(obj.factores, list):
            return len(obj.factores)
        return 0
