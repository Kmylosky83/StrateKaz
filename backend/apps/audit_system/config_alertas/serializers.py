"""Serializers para config_alertas"""
from rest_framework import serializers
from .models import TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta

class TipoAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlerta
        fields = '__all__'

class ConfiguracionAlertaSerializer(serializers.ModelSerializer):
    tipo_alerta_nombre = serializers.CharField(source='tipo_alerta.nombre', read_only=True)
    class Meta:
        model = ConfiguracionAlerta
        fields = '__all__'

class AlertaGeneradaSerializer(serializers.ModelSerializer):
    configuracion_nombre = serializers.CharField(source='configuracion.nombre', read_only=True)
    class Meta:
        model = AlertaGenerada
        fields = '__all__'

class EscalamientoAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscalamientoAlerta
        fields = '__all__'
