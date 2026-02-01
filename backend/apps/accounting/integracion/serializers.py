"""
Serializers para integracion - accounting
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from .models import ParametrosIntegracion, LogIntegracion, ColaContabilizacion


class ParametrosIntegracionListSerializer(serializers.ModelSerializer):
    modulo_display = serializers.CharField(source='get_modulo_display', read_only=True)
    cuenta_codigo = serializers.CharField(source='cuenta_contable.codigo', read_only=True)
    cuenta_nombre = serializers.CharField(source='cuenta_contable.nombre', read_only=True)

    class Meta:
        model = ParametrosIntegracion
        fields = ['id', 'modulo', 'modulo_display', 'clave', 'descripcion', 'cuenta_contable', 'cuenta_codigo', 'cuenta_nombre', 'activo']


class ParametrosIntegracionSerializer(serializers.ModelSerializer):
    modulo_display = serializers.CharField(source='get_modulo_display', read_only=True)
    cuenta_codigo = serializers.CharField(source='cuenta_contable.codigo', read_only=True)
    cuenta_nombre = serializers.CharField(source='cuenta_contable.nombre', read_only=True)

    class Meta:
        model = ParametrosIntegracion
        fields = ['id', 'empresa', 'modulo', 'modulo_display', 'clave', 'descripcion', 'cuenta_contable', 'cuenta_codigo', 'cuenta_nombre', 'configuracion_json', 'activo', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class LogIntegracionListSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    comprobante_numero = serializers.CharField(source='comprobante.numero', read_only=True)

    class Meta:
        model = LogIntegracion
        fields = ['id', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'estado', 'estado_display', 'comprobante', 'comprobante_numero', 'created_at']


class LogIntegracionSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    comprobante_numero = serializers.CharField(source='comprobante.numero', read_only=True)
    comprobante_tipo = serializers.CharField(source='comprobante.tipo_documento.nombre', read_only=True)

    class Meta:
        model = LogIntegracion
        fields = ['id', 'empresa', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'comprobante', 'comprobante_numero', 'comprobante_tipo', 'estado', 'estado_display', 'descripcion', 'datos_json', 'mensaje_error', 'created_at', 'procesado_at', 'created_by']
        read_only_fields = ['comprobante', 'estado', 'mensaje_error', 'created_at', 'procesado_at', 'created_by']


class ColaContabilizacionListSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)

    class Meta:
        model = ColaContabilizacion
        fields = ['id', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'prioridad', 'prioridad_display', 'estado', 'estado_display', 'intentos', 'max_intentos', 'created_at']


class ColaContabilizacionSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    comprobante_numero = serializers.CharField(source='comprobante_generado.numero', read_only=True)
    puede_reintentar = serializers.SerializerMethodField()

    class Meta:
        model = ColaContabilizacion
        fields = ['id', 'empresa', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'prioridad', 'prioridad_display', 'estado', 'estado_display', 'datos_json', 'comprobante_generado', 'comprobante_numero', 'mensaje_error', 'intentos', 'max_intentos', 'puede_reintentar', 'created_at', 'procesado_at', 'proximo_intento_at']
        read_only_fields = ['estado', 'comprobante_generado', 'mensaje_error', 'intentos', 'created_at', 'procesado_at', 'proximo_intento_at']

    def get_puede_reintentar(self, obj):
        return obj.puede_reintentar()


class ColaContabilizacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear elementos en la cola de contabilización."""

    class Meta:
        model = ColaContabilizacion
        fields = ['empresa', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'prioridad', 'datos_json', 'max_intentos']

    def validate(self, data):
        # Verificar que no exista ya en cola pendiente
        if ColaContabilizacion.objects.filter(
            empresa=data['empresa'],
            modulo_origen=data['modulo_origen'],
            documento_origen_tipo=data['documento_origen_tipo'],
            documento_origen_id=data['documento_origen_id'],
            estado__in=['pendiente', 'procesando']
        ).exists():
            raise serializers.ValidationError('Este documento ya está en la cola de contabilización')
        return data
