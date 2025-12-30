"""
Serializers para informes_contables - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from .models import InformeContable, LineaInforme, GeneracionInforme


class LineaInformeSerializer(serializers.ModelSerializer):
    tipo_linea_display = serializers.CharField(source='get_tipo_linea_display', read_only=True)
    cuenta_desde_codigo = serializers.CharField(source='cuenta_desde.codigo', read_only=True)
    cuenta_hasta_codigo = serializers.CharField(source='cuenta_hasta.codigo', read_only=True)

    class Meta:
        model = LineaInforme
        fields = ['id', 'secuencia', 'codigo_linea', 'descripcion', 'tipo_linea', 'tipo_linea_display', 'cuenta_desde', 'cuenta_desde_codigo', 'cuenta_hasta', 'cuenta_hasta_codigo', 'formula', 'nivel_indentacion', 'negrita', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class InformeContableListSerializer(serializers.ModelSerializer):
    tipo_informe_display = serializers.CharField(source='get_tipo_informe_display', read_only=True)
    nivel_detalle_display = serializers.CharField(source='get_nivel_detalle_display', read_only=True)
    total_lineas = serializers.SerializerMethodField()

    class Meta:
        model = InformeContable
        fields = ['id', 'codigo', 'nombre', 'tipo_informe', 'tipo_informe_display', 'nivel_detalle', 'nivel_detalle_display', 'incluye_saldo_cero', 'total_lineas', 'is_active', 'created_at']

    def get_total_lineas(self, obj):
        return obj.lineas.count()


class InformeContableSerializer(serializers.ModelSerializer):
    tipo_informe_display = serializers.CharField(source='get_tipo_informe_display', read_only=True)
    nivel_detalle_display = serializers.CharField(source='get_nivel_detalle_display', read_only=True)
    lineas = LineaInformeSerializer(many=True, read_only=True)

    class Meta:
        model = InformeContable
        fields = ['id', 'empresa', 'codigo', 'nombre', 'tipo_informe', 'tipo_informe_display', 'nivel_detalle', 'nivel_detalle_display', 'incluye_saldo_cero', 'descripcion', 'lineas', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class GeneracionInformeListSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    informe_nombre = serializers.CharField(source='informe.nombre', read_only=True)
    informe_tipo = serializers.CharField(source='informe.get_tipo_informe_display', read_only=True)

    class Meta:
        model = GeneracionInforme
        fields = ['id', 'informe', 'informe_nombre', 'informe_tipo', 'fecha_desde', 'fecha_hasta', 'estado', 'estado_display', 'archivo_pdf', 'archivo_excel', 'created_at']


class GeneracionInformeSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    informe_nombre = serializers.CharField(source='informe.nombre', read_only=True)
    informe_codigo = serializers.CharField(source='informe.codigo', read_only=True)
    informe_tipo = serializers.CharField(source='informe.get_tipo_informe_display', read_only=True)
    centro_costo_nombre = serializers.CharField(source='centro_costo.nombre', read_only=True)

    class Meta:
        model = GeneracionInforme
        fields = ['id', 'empresa', 'informe', 'informe_nombre', 'informe_codigo', 'informe_tipo', 'fecha_desde', 'fecha_hasta', 'centro_costo', 'centro_costo_nombre', 'resultado_json', 'archivo_pdf', 'archivo_excel', 'estado', 'estado_display', 'mensaje_error', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['resultado_json', 'archivo_pdf', 'archivo_excel', 'estado', 'mensaje_error', 'created_at', 'updated_at', 'created_by', 'updated_by']
