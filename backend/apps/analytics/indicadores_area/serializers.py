"""
Serializers para Indicadores Área - Analytics
"""
from rest_framework import serializers
from .models import ValorKPI, AccionPorKPI, AlertaKPI


class ValorKPISerializer(serializers.ModelSerializer):
    """Serializer para ValorKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = ValorKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'fecha_medicion', 'periodo', 'valor', 'valor_meta',
            'semaforo', 'porcentaje_cumplimiento', 'observaciones',
            'registrado_por', 'registrado_por_nombre', 'fecha_registro',
            'datos_origen', 'is_active', 'empresa',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'semaforo', 'porcentaje_cumplimiento', 'fecha_registro',
            'created_at', 'updated_at'
        ]


class AccionPorKPISerializer(serializers.ModelSerializer):
    """Serializer para AccionPorKPI"""
    valor_kpi_info = serializers.SerializerMethodField()
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = AccionPorKPI
        fields = [
            'id', 'valor_kpi', 'valor_kpi_info', 'tipo_accion',
            'accion_correctiva', 'descripcion', 'responsable',
            'responsable_nombre', 'fecha_compromiso', 'estado',
            'fecha_cierre', 'efectividad', 'esta_vencida',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'esta_vencida', 'created_at', 'updated_at']

    def get_valor_kpi_info(self, obj):
        return {
            'kpi_codigo': obj.valor_kpi.kpi.codigo,
            'periodo': obj.valor_kpi.periodo,
            'valor': str(obj.valor_kpi.valor),
            'semaforo': obj.valor_kpi.semaforo
        }


class AlertaKPISerializer(serializers.ModelSerializer):
    """Serializer para AlertaKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)
    leida_por_nombre = serializers.CharField(source='leida_por.get_full_name', read_only=True)

    class Meta:
        model = AlertaKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre', 'tipo_alerta',
            'mensaje', 'fecha_generacion', 'esta_leida',
            'leida_por', 'leida_por_nombre', 'fecha_lectura',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'fecha_generacion', 'esta_leida', 'leida_por',
            'fecha_lectura', 'created_at', 'updated_at'
        ]
