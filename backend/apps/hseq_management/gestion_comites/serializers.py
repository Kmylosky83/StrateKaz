"""
Serializers para Gestión de Comités HSEQ
"""
from rest_framework import serializers
from .models import (
    TipoComite, Comite, MiembroComite, Reunion, AsistenciaReunion,
    ActaReunion, Compromiso, SeguimientoCompromiso, Votacion, VotoMiembro
)


class TipoComiteSerializer(serializers.ModelSerializer):
    """Serializer para TipoComite."""

    class Meta:
        model = TipoComite
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('num_maximo_miembros') and attrs.get('num_minimo_miembros'):
            if attrs['num_maximo_miembros'] < attrs['num_minimo_miembros']:
                raise serializers.ValidationError(
                    "El número máximo de miembros no puede ser menor al mínimo"
                )
        return attrs


class MiembroComiteSerializer(serializers.ModelSerializer):
    """Serializer para MiembroComite."""

    class Meta:
        model = MiembroComite
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('fecha_fin') and attrs.get('fecha_inicio'):
            if attrs['fecha_fin'] < attrs['fecha_inicio']:
                raise serializers.ValidationError(
                    "La fecha de fin no puede ser anterior a la fecha de inicio"
                )
        return attrs


class ComiteSerializer(serializers.ModelSerializer):
    """Serializer para Comite."""
    tipo_comite_nombre = serializers.CharField(source='tipo_comite.nombre', read_only=True)
    tipo_comite_codigo = serializers.CharField(source='tipo_comite.codigo', read_only=True)
    num_miembros_activos = serializers.IntegerField(source='num_miembros', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    miembros = MiembroComiteSerializer(many=True, read_only=True)

    class Meta:
        model = Comite
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('fecha_fin') and attrs.get('fecha_inicio'):
            if attrs['fecha_fin'] <= attrs['fecha_inicio']:
                raise serializers.ValidationError(
                    "La fecha de fin debe ser posterior a la fecha de inicio"
                )
        return attrs


class AsistenciaReunionSerializer(serializers.ModelSerializer):
    """Serializer para AsistenciaReunion."""
    miembro_nombre = serializers.CharField(source='miembro.empleado_nombre', read_only=True)
    miembro_rol = serializers.CharField(source='miembro.rol', read_only=True)

    class Meta:
        model = AsistenciaReunion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ReunionSerializer(serializers.ModelSerializer):
    """Serializer para Reunion."""
    comite_nombre = serializers.CharField(source='comite.nombre', read_only=True)
    comite_codigo = serializers.CharField(source='comite.codigo_comite', read_only=True)
    duracion_minutos = serializers.IntegerField(read_only=True)
    asistencias = AsistenciaReunionSerializer(many=True, read_only=True)
    tiene_acta = serializers.SerializerMethodField()

    class Meta:
        model = Reunion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_tiene_acta(self, obj):
        """Indica si la reunión tiene acta."""
        return hasattr(obj, 'acta')

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('hora_fin_programada') and attrs.get('hora_inicio_programada'):
            if attrs['hora_fin_programada'] <= attrs['hora_inicio_programada']:
                raise serializers.ValidationError(
                    "La hora de fin debe ser posterior a la hora de inicio"
                )

        if attrs.get('hora_fin_real') and attrs.get('hora_inicio_real'):
            if attrs['hora_fin_real'] <= attrs['hora_inicio_real']:
                raise serializers.ValidationError(
                    "La hora de fin real debe ser posterior a la hora de inicio real"
                )

        return attrs


class CompromisoSerializer(serializers.ModelSerializer):
    """Serializer para Compromiso."""
    acta_numero = serializers.CharField(source='acta.numero_acta', read_only=True)
    comite_nombre = serializers.CharField(source='acta.reunion.comite.nombre', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)

    class Meta:
        model = Compromiso
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('fecha_cierre') and attrs.get('fecha_compromiso'):
            if attrs['fecha_cierre'] < attrs['fecha_compromiso']:
                raise serializers.ValidationError(
                    "La fecha de cierre no puede ser anterior a la fecha del compromiso"
                )

        if attrs.get('fecha_limite') and attrs.get('fecha_compromiso'):
            if attrs['fecha_limite'] < attrs['fecha_compromiso']:
                raise serializers.ValidationError(
                    "La fecha límite no puede ser anterior a la fecha del compromiso"
                )

        if attrs.get('porcentaje_avance', 0) > 100 or attrs.get('porcentaje_avance', 0) < 0:
            raise serializers.ValidationError(
                "El porcentaje de avance debe estar entre 0 y 100"
            )

        return attrs


class SeguimientoCompromisoSerializer(serializers.ModelSerializer):
    """Serializer para SeguimientoCompromiso."""
    compromiso_numero = serializers.CharField(source='compromiso.numero_compromiso', read_only=True)
    compromiso_descripcion = serializers.CharField(source='compromiso.descripcion', read_only=True)

    class Meta:
        model = SeguimientoCompromiso
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ActaReunionSerializer(serializers.ModelSerializer):
    """Serializer para ActaReunion."""
    reunion_numero = serializers.CharField(source='reunion.numero_reunion', read_only=True)
    comite_nombre = serializers.CharField(source='reunion.comite.nombre', read_only=True)
    fecha_reunion = serializers.DateField(source='reunion.fecha_realizada', read_only=True)
    compromisos = CompromisoSerializer(many=True, read_only=True)
    num_compromisos = serializers.SerializerMethodField()
    num_compromisos_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = ActaReunion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fecha_aprobacion', 'aprobada_por_id', 'aprobada_por_nombre']

    def get_num_compromisos(self, obj):
        """Número total de compromisos."""
        return obj.compromisos.count()

    def get_num_compromisos_pendientes(self, obj):
        """Número de compromisos pendientes."""
        return obj.compromisos.filter(estado__in=['PENDIENTE', 'EN_PROCESO']).count()


class VotoMiembroSerializer(serializers.ModelSerializer):
    """Serializer para VotoMiembro."""
    miembro_nombre = serializers.CharField(source='miembro.empleado_nombre', read_only=True)

    class Meta:
        model = VotoMiembro
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fecha_voto']

    def validate(self, attrs):
        """Validaciones adicionales."""
        if not attrs.get('es_abstencion') and not attrs.get('opcion_id'):
            raise serializers.ValidationError(
                "Debe seleccionar una opción o marcar como abstención"
            )

        if attrs.get('es_abstencion') and attrs.get('opcion_id'):
            raise serializers.ValidationError(
                "No puede seleccionar una opción y marcar como abstención al mismo tiempo"
            )

        return attrs


class VotacionSerializer(serializers.ModelSerializer):
    """Serializer para Votacion."""
    comite_nombre = serializers.CharField(source='comite.nombre', read_only=True)
    reunion_numero = serializers.CharField(source='reunion.numero_reunion', read_only=True, allow_null=True)
    esta_activa = serializers.BooleanField(read_only=True)
    votos = VotoMiembroSerializer(many=True, read_only=True)
    porcentaje_participacion = serializers.SerializerMethodField()

    class Meta:
        model = Votacion
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'total_votos_emitidos',
            'resultados', 'opcion_ganadora', 'fecha_cierre_real', 'cerrada_por_id'
        ]

    def get_porcentaje_participacion(self, obj):
        """Calcula el porcentaje de participación."""
        total_miembros = obj.comite.num_miembros
        if total_miembros == 0:
            return 0
        return round((obj.total_votos_emitidos / total_miembros) * 100, 2)

    def validate(self, attrs):
        """Validaciones adicionales."""
        if attrs.get('fecha_fin') and attrs.get('fecha_inicio'):
            if attrs['fecha_fin'] <= attrs['fecha_inicio']:
                raise serializers.ValidationError(
                    "La fecha de fin debe ser posterior a la fecha de inicio"
                )

        return attrs


# Serializers para acciones específicas

class RegistrarAsistenciaSerializer(serializers.Serializer):
    """Serializer para registrar asistencia a una reunión."""
    asistencias = serializers.ListField(
        child=serializers.DictField(),
        help_text="Lista de asistencias [{miembro_id, asistio, hora_llegada, excusa}]"
    )

    def validate_asistencias(self, value):
        """Valida el formato de las asistencias."""
        for asistencia in value:
            if 'miembro_id' not in asistencia:
                raise serializers.ValidationError("Cada asistencia debe incluir miembro_id")
            if 'asistio' not in asistencia:
                raise serializers.ValidationError("Cada asistencia debe indicar si asistió")
        return value


class AprobarActaSerializer(serializers.Serializer):
    """Serializer para aprobar un acta."""
    aprobada_por_id = serializers.IntegerField(required=True)
    aprobada_por_nombre = serializers.CharField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)


class CerrarCompromisoSerializer(serializers.Serializer):
    """Serializer para cerrar un compromiso."""
    verificado_por_id = serializers.IntegerField(required=True)
    verificado_por_nombre = serializers.CharField(required=True)
    observaciones_verificacion = serializers.CharField(required=False, allow_blank=True)
    evidencias = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Evidencias del cierre"
    )


class CerrarVotacionSerializer(serializers.Serializer):
    """Serializer para cerrar una votación."""
    cerrada_por_id = serializers.IntegerField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)
