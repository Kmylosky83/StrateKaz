"""
Serializers para Revisión por la Dirección
"""
from rest_framework import serializers
from .models import (
    ProgramaRevision, ParticipanteRevision, TemaRevision,
    ActaRevision, AnalisisTemaActa, CompromisoRevision,
    SeguimientoCompromiso
)


class ParticipanteRevisionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name', read_only=True
    )
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = ParticipanteRevision
        fields = '__all__'


class TemaRevisionSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(
        source='get_categoria_display', read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )

    class Meta:
        model = TemaRevision
        fields = '__all__'


class ProgramaRevisionListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados"""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable_convocatoria.get_full_name', read_only=True
    )
    total_participantes = serializers.SerializerMethodField()
    total_temas = serializers.SerializerMethodField()
    tiene_acta = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaRevision
        fields = [
            'id', 'anio', 'periodo', 'frecuencia', 'frecuencia_display',
            'fecha_programada', 'fecha_realizada', 'estado', 'estado_display',
            'lugar', 'responsable_convocatoria', 'responsable_nombre',
            'incluye_calidad', 'incluye_sst', 'incluye_ambiental',
            'incluye_pesv', 'incluye_seguridad_info',
            'total_participantes', 'total_temas', 'tiene_acta', 'is_active'
        ]

    def get_total_participantes(self, obj):
        return obj.participantes.count()

    def get_total_temas(self, obj):
        return obj.temas.count()

    def get_tiene_acta(self, obj):
        return hasattr(obj, 'acta')


class ProgramaRevisionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar programas de revisión"""

    class Meta:
        model = ProgramaRevision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'empresa', 'created_by', 'updated_by']


class ProgramaRevisionSerializer(serializers.ModelSerializer):
    """Serializer completo con relaciones"""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable_convocatoria.get_full_name', read_only=True
    )
    participantes = ParticipanteRevisionSerializer(many=True, read_only=True)
    temas = TemaRevisionSerializer(many=True, read_only=True)

    class Meta:
        model = ProgramaRevision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'empresa']


class AnalisisTemaActaSerializer(serializers.ModelSerializer):
    tema_titulo = serializers.CharField(source='tema.titulo', read_only=True)
    presentado_por_nombre = serializers.CharField(
        source='presentado_por.get_full_name', read_only=True
    )

    class Meta:
        model = AnalisisTemaActa
        fields = '__all__'


class ActaRevisionSerializer(serializers.ModelSerializer):
    programa_periodo = serializers.CharField(source='programa.periodo', read_only=True)
    elaborado_por_nombre = serializers.CharField(
        source='elaborado_por.get_full_name', read_only=True
    )
    revisado_por_nombre = serializers.CharField(
        source='revisado_por.get_full_name', read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name', read_only=True
    )
    analisis_temas = AnalisisTemaActaSerializer(many=True, read_only=True)
    total_compromisos = serializers.SerializerMethodField()

    class Meta:
        model = ActaRevision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_total_compromisos(self, obj):
        return obj.compromisos.filter(is_active=True).count()


class SeguimientoCompromisoSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name', read_only=True
    )

    class Meta:
        model = SeguimientoCompromiso
        fields = '__all__'
        read_only_fields = ['created_at']


class CompromisoRevisionListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados"""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    acta_numero = serializers.CharField(source='acta.numero_acta', read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = CompromisoRevision
        fields = [
            'id', 'consecutivo', 'tipo', 'tipo_display',
            'descripcion', 'responsable', 'responsable_nombre',
            'fecha_compromiso', 'fecha_cumplimiento',
            'estado', 'estado_display', 'prioridad', 'prioridad_display',
            'porcentaje_avance', 'acta', 'acta_numero',
            'dias_para_vencer', 'esta_vencido', 'is_active'
        ]


class CompromisoRevisionSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle"""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    acta_numero = serializers.CharField(source='acta.numero_acta', read_only=True)
    tema_titulo = serializers.CharField(
        source='tema_relacionado.titulo', read_only=True
    )
    seguimientos = SeguimientoCompromisoSerializer(many=True, read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = CompromisoRevision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DashboardRevisionSerializer(serializers.Serializer):
    """Serializer para dashboard de revisiones"""
    total_revisiones = serializers.IntegerField()
    revisiones_realizadas = serializers.IntegerField()
    revisiones_pendientes = serializers.IntegerField()
    proxima_revision = serializers.DictField(allow_null=True)
    compromisos_totales = serializers.IntegerField()
    compromisos_pendientes = serializers.IntegerField()
    compromisos_vencidos = serializers.IntegerField()
    porcentaje_cumplimiento = serializers.FloatField()
