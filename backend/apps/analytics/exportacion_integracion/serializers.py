"""Serializers para Exportación e Integración"""
from rest_framework import serializers
from .models import ConfiguracionExportacion, LogExportacion

class ConfiguracionExportacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionExportacion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class LogExportacionSerializer(serializers.ModelSerializer):
    configuracion_nombre = serializers.CharField(source='configuracion.nombre', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = LogExportacion
        fields = '__all__'
        read_only_fields = ['id', 'fecha_ejecucion', 'created_at', 'updated_at']

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return None
