"""
Serializers para movimientos - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from .models import ComprobanteContable, DetalleComprobante, SecuenciaDocumento, AsientoPlantilla


class DetalleComprobanteSerializer(serializers.ModelSerializer):
    cuenta_codigo = serializers.CharField(source='cuenta.codigo', read_only=True)
    cuenta_nombre = serializers.CharField(source='cuenta.nombre', read_only=True)
    tercero_nombre = serializers.CharField(source='tercero.razon_social', read_only=True)
    centro_costo_nombre = serializers.CharField(source='centro_costo.nombre', read_only=True)
    monto = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)

    class Meta:
        model = DetalleComprobante
        fields = ['id', 'secuencia', 'cuenta', 'cuenta_codigo', 'cuenta_nombre', 'descripcion', 'debito', 'credito', 'monto', 'tercero', 'tercero_nombre', 'centro_costo', 'centro_costo_nombre', 'base_retencion', 'tipo_documento_soporte', 'numero_documento_soporte', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ComprobanteContableListSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    esta_cuadrado = serializers.BooleanField(read_only=True)
    diferencia = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)

    class Meta:
        model = ComprobanteContable
        fields = ['id', 'numero_comprobante', 'tipo_documento', 'tipo_documento_codigo', 'tipo_documento_nombre', 'periodo', 'fecha_comprobante', 'concepto', 'total_debito', 'total_credito', 'estado', 'estado_display', 'esta_cuadrado', 'diferencia', 'origen_automatico', 'modulo_origen', 'created_at']


class ComprobanteContableSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    esta_cuadrado = serializers.BooleanField(read_only=True)
    diferencia = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    detalles = DetalleComprobanteSerializer(many=True, read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    anulado_por_nombre = serializers.CharField(source='anulado_por.get_full_name', read_only=True)

    class Meta:
        model = ComprobanteContable
        fields = ['id', 'empresa', 'numero_comprobante', 'tipo_documento', 'tipo_documento_codigo', 'tipo_documento_nombre', 'periodo', 'fecha_comprobante', 'fecha_elaboracion', 'concepto', 'total_debito', 'total_credito', 'estado', 'estado_display', 'requiere_aprobacion', 'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion', 'origen_automatico', 'modulo_origen', 'documento_origen_id', 'fecha_anulacion', 'motivo_anulacion', 'anulado_por', 'anulado_por_nombre', 'notas', 'esta_cuadrado', 'diferencia', 'detalles', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['numero_comprobante', 'fecha_elaboracion', 'total_debito', 'total_credito', 'fecha_aprobacion', 'fecha_anulacion', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ComprobanteContableCreateSerializer(serializers.ModelSerializer):
    detalles = DetalleComprobanteSerializer(many=True)

    class Meta:
        model = ComprobanteContable
        fields = ['empresa', 'tipo_documento', 'fecha_comprobante', 'concepto', 'requiere_aprobacion', 'notas', 'detalles']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        comprobante = ComprobanteContable.objects.create(**validated_data)
        for i, detalle_data in enumerate(detalles_data, 1):
            detalle_data['secuencia'] = i
            DetalleComprobante.objects.create(comprobante=comprobante, **detalle_data)
        comprobante.calcular_totales()
        return comprobante


class SecuenciaDocumentoSerializer(serializers.ModelSerializer):
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)

    class Meta:
        model = SecuenciaDocumento
        fields = ['id', 'empresa', 'tipo_documento', 'tipo_documento_codigo', 'tipo_documento_nombre', 'periodo', 'consecutivo_actual', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AsientoPlantillaListSerializer(serializers.ModelSerializer):
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)

    class Meta:
        model = AsientoPlantilla
        fields = ['id', 'codigo', 'nombre', 'tipo_documento', 'tipo_documento_codigo', 'es_recurrente', 'frecuencia', 'frecuencia_display', 'is_active', 'created_at']


class AsientoPlantillaSerializer(serializers.ModelSerializer):
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)

    class Meta:
        model = AsientoPlantilla
        fields = ['id', 'empresa', 'codigo', 'nombre', 'descripcion', 'tipo_documento', 'tipo_documento_codigo', 'tipo_documento_nombre', 'es_recurrente', 'frecuencia', 'frecuencia_display', 'estructura_json', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
