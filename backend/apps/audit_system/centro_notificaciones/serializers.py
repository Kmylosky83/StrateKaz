"""Serializers para centro_notificaciones"""
from rest_framework import serializers
from .models import TipoNotificacion, Notificacion, PreferenciaNotificacion, NotificacionMasiva

class TipoNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoNotificacion
        fields = '__all__'

class NotificacionSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    class Meta:
        model = Notificacion
        fields = '__all__'

class PreferenciaNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenciaNotificacion
        fields = '__all__'

class NotificacionMasivaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificacionMasiva
        fields = '__all__'
