"""
Serializers para Portal Jefe (MSS - Manager Self-Service).

Versiones limitadas que muestran solo datos del equipo
del jefe autenticado.
"""
from rest_framework import serializers


class ColaboradorEquipoSerializer(serializers.Serializer):
    """Datos basicos de un miembro del equipo."""
    id = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    numero_identificacion = serializers.CharField()
    cargo_nombre = serializers.CharField()
    estado = serializers.CharField()
    fecha_ingreso = serializers.DateField()
    foto_url = serializers.CharField(allow_null=True)


class AprobacionPendienteSerializer(serializers.Serializer):
    """Una solicitud pendiente de aprobacion."""
    id = serializers.IntegerField()
    tipo = serializers.CharField()  # vacaciones | permiso | hora_extra
    colaborador_nombre = serializers.CharField()
    fecha_solicitud = serializers.DateTimeField()
    detalle = serializers.CharField()
    estado = serializers.CharField()


class AprobarRechazarSerializer(serializers.Serializer):
    """Datos para aprobar o rechazar una solicitud."""
    accion = serializers.ChoiceField(choices=['aprobar', 'rechazar'])
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')


class AsistenciaEquipoSerializer(serializers.Serializer):
    """Resumen de asistencia de un colaborador."""
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    dias_trabajados = serializers.IntegerField()
    dias_ausencia = serializers.IntegerField()
    horas_extra = serializers.DecimalField(max_digits=6, decimal_places=2)
    tardanzas = serializers.IntegerField()


class EvaluacionEquipoSerializer(serializers.Serializer):
    """Estado de evaluacion de un miembro del equipo."""
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    evaluacion_id = serializers.IntegerField(allow_null=True)
    estado = serializers.CharField()
    calificacion_general = serializers.DecimalField(
        max_digits=4, decimal_places=2, allow_null=True
    )
    fecha_evaluacion = serializers.DateField(allow_null=True)
