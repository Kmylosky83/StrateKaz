"""
Serializers para Generador de Informes - Analytics
"""
from rest_framework import serializers
from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme


class PlantillaInformeSerializer(serializers.ModelSerializer):
    """Serializer para PlantillaInforme"""
    tipo_informe_display = serializers.CharField(source='get_tipo_informe_display', read_only=True)
    formato_salida_display = serializers.CharField(source='get_formato_salida_display', read_only=True)

    class Meta:
        model = PlantillaInforme
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'tipo_informe', 'tipo_informe_display',
            'norma_relacionada', 'estructura_json',
            'formato_salida', 'formato_salida_display',
            'template_archivo', 'es_predefinida',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class InformeDinamicoSerializer(serializers.ModelSerializer):
    """Serializer para InformeDinamico"""
    plantilla_codigo = serializers.CharField(source='plantilla.codigo', read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    generado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = InformeDinamico
        fields = [
            'id', 'plantilla', 'plantilla_codigo', 'plantilla_nombre',
            'nombre', 'periodo_inicio', 'periodo_fin', 'parametros_json',
            'estado', 'estado_display', 'fecha_generacion',
            'archivo_generado', 'tamaño_archivo', 'error_mensaje',
            'generado_por', 'generado_por_nombre',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fecha_generacion', 'created_at', 'updated_at']

    def get_generado_por_nombre(self, obj):
        if obj.generado_por:
            return obj.generado_por.get_full_name() or obj.generado_por.username
        return None


class ProgramacionInformeSerializer(serializers.ModelSerializer):
    """Serializer para ProgramacionInforme"""
    plantilla_codigo = serializers.CharField(source='plantilla.codigo', read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)

    class Meta:
        model = ProgramacionInforme
        fields = [
            'id', 'plantilla', 'plantilla_codigo', 'plantilla_nombre',
            'nombre', 'frecuencia', 'frecuencia_display',
            'dia_ejecucion', 'hora_ejecucion', 'destinatarios',
            'parametros_json', 'esta_activa',
            'proxima_ejecucion', 'ultima_ejecucion',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'proxima_ejecucion', 'ultima_ejecucion', 'created_at', 'updated_at']


class HistorialInformeSerializer(serializers.ModelSerializer):
    """Serializer para HistorialInforme"""
    programacion_nombre = serializers.CharField(source='programacion.nombre', read_only=True)
    informe_nombre = serializers.CharField(source='informe.nombre', read_only=True)

    class Meta:
        model = HistorialInforme
        fields = [
            'id', 'programacion', 'programacion_nombre',
            'informe', 'informe_nombre', 'fecha_ejecucion',
            'fue_exitoso', 'fue_enviado', 'destinatarios_enviados',
            'error_mensaje', 'duracion_segundos',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fecha_ejecucion', 'created_at', 'updated_at']
