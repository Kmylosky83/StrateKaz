"""
Serializers para Análisis de Tendencias - Analytics
"""
from rest_framework import serializers
from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada


class AnalisisKPISerializer(serializers.ModelSerializer):
    """Serializer para AnalisisKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)
    direccion_display = serializers.CharField(source='get_direccion_display', read_only=True)

    class Meta:
        model = AnalisisKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'periodo_analisis', 'tipo_analisis',
            'valor_actual', 'valor_comparacion',
            'variacion_absoluta', 'variacion_porcentual',
            'direccion', 'direccion_display', 'observaciones',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'variacion_absoluta', 'variacion_porcentual',
            'direccion', 'created_at', 'updated_at'
        ]


class TendenciaKPISerializer(serializers.ModelSerializer):
    """Serializer para TendenciaKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)
    tipo_tendencia_display = serializers.CharField(source='get_tipo_tendencia_display', read_only=True)

    class Meta:
        model = TendenciaKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'periodo_inicio', 'periodo_fin', 'tipo_tendencia', 'tipo_tendencia_display',
            'coeficiente_correlacion', 'r_cuadrado', 'pendiente', 'intercepto',
            'proyeccion_3_meses', 'proyeccion_6_meses', 'proyeccion_12_meses',
            'datos_historicos', 'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validar que periodo_fin sea posterior a periodo_inicio"""
        if data.get('periodo_fin') and data.get('periodo_inicio'):
            if data['periodo_fin'] < data['periodo_inicio']:
                raise serializers.ValidationError(
                    "La fecha fin del período debe ser posterior a la fecha de inicio"
                )
        return data


class AnomaliaDetectadaSerializer(serializers.ModelSerializer):
    """Serializer para AnomaliaDetectada"""
    valor_kpi_info = serializers.SerializerMethodField()
    tipo_anomalia_display = serializers.CharField(source='get_tipo_anomalia_display', read_only=True)
    severidad_display = serializers.CharField(source='get_severidad_display', read_only=True)
    usuario_revision_nombre = serializers.SerializerMethodField()

    class Meta:
        model = AnomaliaDetectada
        fields = [
            'id', 'valor_kpi', 'valor_kpi_info',
            'tipo_anomalia', 'tipo_anomalia_display',
            'severidad', 'severidad_display',
            'valor_detectado', 'valor_esperado', 'desviacion_std',
            'fecha_deteccion', 'esta_revisada', 'fecha_revision',
            'usuario_revision', 'usuario_revision_nombre',
            'accion_tomada', 'es_falso_positivo',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fecha_deteccion', 'created_at', 'updated_at']

    def get_valor_kpi_info(self, obj):
        """Obtener información del valor KPI"""
        return {
            'id': obj.valor_kpi.id,
            'kpi_codigo': obj.valor_kpi.kpi.codigo,
            'kpi_nombre': obj.valor_kpi.kpi.nombre,
            'periodo': obj.valor_kpi.periodo.strftime('%Y-%m-%d') if obj.valor_kpi.periodo else None,
            'valor': str(obj.valor_kpi.valor)
        }

    def get_usuario_revision_nombre(self, obj):
        """Obtener nombre del usuario que revisó"""
        if obj.usuario_revision:
            return obj.usuario_revision.get_full_name() or obj.usuario_revision.username
        return None
