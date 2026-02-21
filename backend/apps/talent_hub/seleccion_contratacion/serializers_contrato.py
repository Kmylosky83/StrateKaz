"""
Serializers para Historial de Contratos - Talent Hub
Ley 2466/2025 Compliance
"""
from rest_framework import serializers
from .models import HistorialContrato


class HistorialContratoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de contratos."""

    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo', read_only=True
    )
    colaborador_identificacion = serializers.CharField(
        source='colaborador.numero_identificacion', read_only=True
    )
    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre', read_only=True
    )
    tipo_movimiento_display = serializers.CharField(
        source='get_tipo_movimiento_display', read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)

    class Meta:
        model = HistorialContrato
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'colaborador_identificacion',
            'tipo_contrato', 'tipo_contrato_nombre',
            'numero_contrato', 'fecha_inicio', 'fecha_fin',
            'salario_pactado',
            'tipo_movimiento', 'tipo_movimiento_display',
            'numero_renovacion', 'firmado',
            'esta_vigente', 'dias_para_vencer',
            'created_at',
        ]
        read_only_fields = ['created_at']


class HistorialContratoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para contrato."""

    colaborador_info = serializers.SerializerMethodField()
    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre', read_only=True
    )
    tipo_movimiento_display = serializers.CharField(
        source='get_tipo_movimiento_display', read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    duracion_meses = serializers.FloatField(read_only=True)
    warnings = serializers.SerializerMethodField()
    movimientos_hijos = serializers.SerializerMethodField()

    class Meta:
        model = HistorialContrato
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_colaborador_info(self, obj):
        return {
            'id': obj.colaborador.id,
            'nombre_completo': obj.colaborador.get_nombre_completo(),
            'numero_identificacion': obj.colaborador.numero_identificacion,
            'cargo': obj.colaborador.cargo.name if obj.colaborador.cargo else None,
            'area': obj.colaborador.area.name if obj.colaborador.area else None,
        }

    def get_warnings(self, obj):
        return obj.get_warnings()

    def get_movimientos_hijos(self, obj):
        hijos = obj.movimientos.filter(is_active=True).order_by('-fecha_inicio')
        return HistorialContratoListSerializer(hijos, many=True).data


class HistorialContratoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de contrato."""

    class Meta:
        model = HistorialContrato
        fields = [
            'colaborador', 'tipo_contrato', 'numero_contrato',
            'fecha_inicio', 'fecha_fin', 'salario_pactado',
            'objeto_contrato', 'tipo_movimiento', 'contrato_padre',
            'numero_renovacion', 'justificacion_tipo_contrato',
            'fecha_preaviso_terminacion', 'preaviso_entregado',
            'archivo_contrato',
        ]

    def validate_numero_contrato(self, value):
        qs = HistorialContrato.objects.filter(
            numero_contrato=value, is_active=True
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un contrato con este número.")
        return value

    def validate(self, attrs):
        # Fechas
        if attrs.get('fecha_fin') and attrs.get('fecha_inicio'):
            if attrs['fecha_fin'] < attrs['fecha_inicio']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la de inicio.'
                })

        # Ley 2466/2025: Justificación requerida si no es indefinido
        tipo = attrs.get('tipo_contrato')
        if tipo and tipo.codigo != 'INDEFINIDO':
            if not attrs.get('justificacion_tipo_contrato') and not self.instance:
                raise serializers.ValidationError({
                    'justificacion_tipo_contrato': 'Debe justificar el tipo de contrato cuando no es indefinido (Ley 2466/2025).'
                })

        return attrs
