"""Serializers para tareas_recordatorios"""
from rest_framework import serializers
from .models import Tarea, Recordatorio, EventoCalendario, ComentarioTarea

class TareaSerializer(serializers.ModelSerializer):
    asignado_a_nombre = serializers.CharField(source='asignado_a.get_full_name', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = Tarea
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class RecordatorioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Recordatorio
        fields = '__all__'

class EventoCalendarioSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    participantes_nombres = serializers.SerializerMethodField()
    
    class Meta:
        model = EventoCalendario
        fields = '__all__'
    
    def get_participantes_nombres(self, obj):
        return [p.get_full_name() for p in obj.participantes.all()]

class ComentarioTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = ComentarioTarea
        fields = '__all__'
        read_only_fields = ['created_at']
