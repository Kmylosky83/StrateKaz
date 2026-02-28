"""
Serializers de Control de Tiempo - Talent Hub
"""
from rest_framework import serializers
from .models import (
    Turno, AsignacionTurno, RegistroAsistencia,
    MarcajeTiempo, HoraExtra, ConsolidadoAsistencia,
    ConfiguracionRecargo
)


class TurnoListSerializer(serializers.ModelSerializer):
    """List serializer for Turno"""
    class Meta:
        model = Turno
        fields = [
            'id', 'codigo', 'nombre', 'hora_inicio', 'hora_fin',
            'duracion_jornada', 'aplica_recargo_nocturno', 'dias_semana',
            'tipo_jornada', 'horas_semanales_maximas', 'is_active'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class TurnoDetailSerializer(serializers.ModelSerializer):
    """Detail serializer for Turno"""
    es_turno_nocturno = serializers.BooleanField(read_only=True)
    horario_formateado = serializers.CharField(read_only=True)

    class Meta:
        model = Turno
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'qr_token', 'created_at', 'updated_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }


class AsignacionTurnoSerializer(serializers.ModelSerializer):
    """Serializer for AsignacionTurno"""
    colaborador_nombre = serializers.SerializerMethodField()
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = AsignacionTurno
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']

    def get_colaborador_nombre(self, obj):
        try:
            return obj.colaborador.get_nombre_completo()
        except Exception:
            return ''


class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer for RegistroAsistencia"""
    colaborador_nombre = serializers.SerializerMethodField()
    turno_nombre = serializers.CharField(source='turno.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    horas_trabajadas = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = RegistroAsistencia
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'minutos_tardanza', 'created_at', 'updated_at']

    def get_colaborador_nombre(self, obj):
        try:
            return obj.colaborador.get_nombre_completo()
        except Exception:
            return ''


class MarcajeTiempoSerializer(serializers.ModelSerializer):
    """Serializer for MarcajeTiempo"""
    colaborador_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    metodo_display = serializers.CharField(source='get_metodo_display', read_only=True)

    class Meta:
        model = MarcajeTiempo
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']

    def get_colaborador_nombre(self, obj):
        try:
            return obj.colaborador.get_nombre_completo()
        except Exception:
            return ''


class MarcajeCreateSerializer(serializers.Serializer):
    """Serializer para registrar un marcaje (entrada/salida)."""
    colaborador_id = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=MarcajeTiempo.TipoMarcaje.choices)
    metodo = serializers.ChoiceField(
        choices=MarcajeTiempo.MetodoMarcaje.choices,
        default=MarcajeTiempo.MetodoMarcaje.WEB
    )
    latitud = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitud = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)


class MarcajeQRSerializer(serializers.Serializer):
    """Serializer para marcaje via QR."""
    qr_token = serializers.UUIDField()
    tipo = serializers.ChoiceField(choices=MarcajeTiempo.TipoMarcaje.choices)
    latitud = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitud = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)


class RegistrarEntradaSerializer(serializers.Serializer):
    """Serializer para registrar entrada manualmente."""
    colaborador_id = serializers.IntegerField()
    turno_id = serializers.IntegerField()
    fecha = serializers.DateField()
    hora_entrada = serializers.TimeField()
    observaciones = serializers.CharField(required=False, allow_blank=True)


class RegistrarSalidaSerializer(serializers.Serializer):
    """Serializer para registrar salida."""
    hora_salida = serializers.TimeField()
    observaciones = serializers.CharField(required=False, allow_blank=True)


class JustificarAsistenciaSerializer(serializers.Serializer):
    """Serializer para justificar una ausencia o tardanza."""
    justificacion = serializers.CharField(min_length=10)
    nuevo_estado = serializers.ChoiceField(
        choices=['permiso', 'incapacidad', 'vacaciones', 'licencia'],
        required=False
    )


class HoraExtraSerializer(serializers.ModelSerializer):
    """Serializer for HoraExtra"""
    colaborador_nombre = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    horas_con_recargo = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    porcentaje_recargo = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = HoraExtra
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'horas_trabajadas', 'factor_recargo',
            'aprobado', 'aprobado_por', 'fecha_aprobacion', 'created_at', 'updated_at'
        ]

    def get_colaborador_nombre(self, obj):
        try:
            return obj.colaborador.get_nombre_completo()
        except Exception:
            return ''


class AprobarHoraExtraSerializer(serializers.Serializer):
    """Serializer para aprobar horas extras."""
    pass  # No requiere datos adicionales, el usuario se toma del request


class RechazarHoraExtraSerializer(serializers.Serializer):
    """Serializer para rechazar horas extras."""
    motivo = serializers.CharField(required=False, allow_blank=True)


class ConsolidadoAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer for ConsolidadoAsistencia"""
    colaborador_nombre = serializers.SerializerMethodField()
    periodo_formateado = serializers.CharField(read_only=True)
    total_horas_tardanza = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = ConsolidadoAsistencia
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'dias_trabajados', 'dias_ausente', 'dias_tardanza',
            'total_horas_trabajadas', 'total_horas_extras', 'total_minutos_tardanza',
            'porcentaje_asistencia', 'cerrado', 'cerrado_por', 'fecha_cierre',
            'created_at', 'updated_at'
        ]

    def get_colaborador_nombre(self, obj):
        try:
            return obj.colaborador.get_nombre_completo()
        except Exception:
            return ''


class GenerarConsolidadoSerializer(serializers.Serializer):
    """Serializer para generar o recalcular un consolidado."""
    colaborador_id = serializers.IntegerField(required=False, allow_null=True)
    anio = serializers.IntegerField(min_value=2000, max_value=2100)
    mes = serializers.IntegerField(min_value=1, max_value=12)


class ConfiguracionRecargoSerializer(serializers.ModelSerializer):
    """Serializer for ConfiguracionRecargo"""
    tipo_hora_extra_display = serializers.CharField(source='get_tipo_hora_extra_display', read_only=True)
    factor_actual = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionRecargo
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']

    def get_factor_actual(self, obj):
        return str(obj.get_factor_actual())


class EstadisticasAsistenciaSerializer(serializers.Serializer):
    """Serializer para estadísticas de asistencia."""
    total_registros = serializers.IntegerField()
    presentes = serializers.IntegerField()
    ausentes = serializers.IntegerField()
    tardanzas = serializers.IntegerField()
    permisos = serializers.IntegerField()
    incapacidades = serializers.IntegerField()
    vacaciones = serializers.IntegerField()
    licencias = serializers.IntegerField()
    porcentaje_asistencia = serializers.FloatField()
    total_minutos_tardanza = serializers.IntegerField()
    total_horas_trabajadas = serializers.FloatField()
