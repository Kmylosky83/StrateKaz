"""
Serializers para matriz_legal - motor_cumplimiento
"""
from rest_framework import serializers
from .models import TipoNorma, NormaLegal, EmpresaNorma


class TipoNormaSerializer(serializers.ModelSerializer):
    """Serializer para TipoNorma"""

    class Meta:
        model = TipoNorma
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class NormaLegalSerializer(serializers.ModelSerializer):
    """Serializer para lectura de NormaLegal"""

    tipo_norma = TipoNormaSerializer(read_only=True)
    tipo_norma_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoNorma.objects.all(),
        source='tipo_norma',
        write_only=True
    )
    codigo_completo = serializers.CharField(read_only=True)
    sistemas_aplicables = serializers.SerializerMethodField()

    class Meta:
        model = NormaLegal
        fields = [
            'id', 'tipo_norma', 'tipo_norma_id', 'numero', 'anio',
            'titulo', 'entidad_emisora', 'fecha_expedicion', 'fecha_vigencia',
            'url_original', 'resumen', 'contenido',
            'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv',
            'vigente', 'fecha_scraping', 'codigo_completo', 'sistemas_aplicables',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'fecha_scraping']

    def get_sistemas_aplicables(self, obj):
        """Retorna lista de sistemas a los que aplica la norma"""
        sistemas = []
        if obj.aplica_sst:
            sistemas.append('SST')
        if obj.aplica_ambiental:
            sistemas.append('Ambiental')
        if obj.aplica_calidad:
            sistemas.append('Calidad')
        if obj.aplica_pesv:
            sistemas.append('PESV')
        return sistemas


class NormaLegalCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar NormaLegal"""

    class Meta:
        model = NormaLegal
        fields = [
            'tipo_norma', 'numero', 'anio', 'titulo', 'entidad_emisora',
            'fecha_expedicion', 'fecha_vigencia', 'url_original',
            'resumen', 'contenido',
            'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv',
            'vigente'
        ]


class NormaLegalListSerializer(serializers.ModelSerializer):
    """Serializer reducido para listados"""

    tipo_norma_codigo = serializers.CharField(source='tipo_norma.codigo', read_only=True)
    codigo_completo = serializers.CharField(read_only=True)

    class Meta:
        model = NormaLegal
        fields = [
            'id', 'tipo_norma_codigo', 'codigo_completo', 'numero', 'anio',
            'titulo', 'fecha_expedicion', 'vigente',
            'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv'
        ]


class EmpresaNormaSerializer(serializers.ModelSerializer):
    """Serializer para EmpresaNorma"""

    norma = NormaLegalListSerializer(read_only=True)
    norma_id = serializers.PrimaryKeyRelatedField(
        queryset=NormaLegal.objects.all(),
        source='norma',
        write_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    estado_cumplimiento = serializers.CharField(read_only=True)

    class Meta:
        model = EmpresaNorma
        fields = [
            'id', 'empresa_id', 'norma', 'norma_id',
            'responsable', 'responsable_nombre',
            'aplica', 'justificacion',
            'porcentaje_cumplimiento', 'estado_cumplimiento',
            'fecha_evaluacion', 'observaciones',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class EmpresaNormaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar EmpresaNorma"""

    class Meta:
        model = EmpresaNorma
        fields = [
            'empresa_id', 'norma', 'responsable',
            'aplica', 'justificacion',
            'porcentaje_cumplimiento', 'fecha_evaluacion', 'observaciones'
        ]

    def validate(self, data):
        # Si no aplica, debe tener justificación
        if not data.get('aplica', True) and not data.get('justificacion'):
            raise serializers.ValidationError({
                'justificacion': 'Debe proporcionar una justificación cuando la norma no aplica'
            })
        return data


class EvaluarCumplimientoSerializer(serializers.Serializer):
    """Serializer para actualizar cumplimiento de norma"""

    porcentaje_cumplimiento = serializers.ChoiceField(
        choices=EmpresaNorma.CUMPLIMIENTO_CHOICES
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)
