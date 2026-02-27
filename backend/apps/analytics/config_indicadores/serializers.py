"""
Serializers para Config Indicadores - Analytics
"""
from rest_framework import serializers
from .models import CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo


class CatalogoKPISerializer(serializers.ModelSerializer):
    """Serializer para CatalogoKPI"""

    class Meta:
        model = CatalogoKPI
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'tipo_indicador',
            'categoria', 'frecuencia_medicion', 'unidad_medida',
            'es_mayor_mejor', 'is_active', 'empresa',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class FichaTecnicaKPISerializer(serializers.ModelSerializer):
    """Serializer para FichaTecnicaKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)

    class Meta:
        model = FichaTecnicaKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'objetivo', 'formula', 'variables', 'fuente_datos',
            'responsable_medicion', 'responsable_analisis',
            'fecha_inicio_medicion', 'notas',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MetaKPISerializer(serializers.ModelSerializer):
    """Serializer para MetaKPI"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)

    class Meta:
        model = MetaKPI
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'periodo_inicio', 'periodo_fin',
            'valor_meta', 'valor_minimo_aceptable',
            'valor_satisfactorio', 'valor_sobresaliente',
            'is_active', 'empresa', 'created_at', 'updated_at'
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


class ConfiguracionSemaforoSerializer(serializers.ModelSerializer):
    """Serializer para ConfiguracionSemaforo"""
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)

    class Meta:
        model = ConfiguracionSemaforo
        fields = [
            'id', 'kpi', 'kpi_codigo', 'kpi_nombre',
            'umbral_rojo_min', 'umbral_rojo_max',
            'umbral_amarillo_min', 'umbral_amarillo_max',
            'umbral_verde_min', 'umbral_verde_max',
            'is_active', 'empresa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
