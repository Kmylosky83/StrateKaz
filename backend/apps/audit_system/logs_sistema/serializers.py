"""
Serializers del módulo Logs del Sistema - Audit System
"""

from rest_framework import serializers
from .models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)


class ConfiguracionAuditoriaSerializer(serializers.ModelSerializer):
    """Serializer para ConfiguracionAuditoria"""

    empresa_nombre = serializers.CharField(source='empresa.razon_social', read_only=True)

    class Meta:
        model = ConfiguracionAuditoria
        fields = [
            'id',
            'empresa',
            'empresa_nombre',
            'modulo',
            'modelo',
            'auditar_creacion',
            'auditar_modificacion',
            'auditar_eliminacion',
            'auditar_consulta',
            'campos_sensibles',
            'dias_retencion',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LogAccesoSerializer(serializers.ModelSerializer):
    """Serializer para LogAcceso"""

    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model = LogAcceso
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'usuario_email',
            'tipo_evento',
            'ip_address',
            'user_agent',
            'ubicacion',
            'dispositivo',
            'navegador',
            'fue_exitoso',
            'mensaje_error',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LogCambioSerializer(serializers.ModelSerializer):
    """Serializer para LogCambio"""

    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    modelo = serializers.CharField(source='content_type.model', read_only=True)
    app = serializers.CharField(source='content_type.app_label', read_only=True)

    class Meta:
        model = LogCambio
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'content_type',
            'app',
            'modelo',
            'object_id',
            'object_repr',
            'accion',
            'cambios',
            'ip_address',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LogConsultaSerializer(serializers.ModelSerializer):
    """Serializer para LogConsulta"""

    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)

    class Meta:
        model = LogConsulta
        fields = [
            'id',
            'usuario',
            'usuario_nombre',
            'modulo',
            'endpoint',
            'parametros',
            'registros_accedidos',
            'fue_exportacion',
            'formato_exportacion',
            'ip_address',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
