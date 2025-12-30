"""Serializers para Acciones por Indicador"""
from rest_framework import serializers
from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva

class PlanAccionKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanAccionKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class ActividadPlanKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = ActividadPlanKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class SeguimientoPlanKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = SeguimientoPlanKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class IntegracionAccionCorrectivaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegracionAccionCorrectiva
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
