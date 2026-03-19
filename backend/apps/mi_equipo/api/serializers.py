"""
Serializers para Mi Equipo (L20).

Portal Jefe (MSS) — datos del equipo del jefe autenticado.
Módulo Mi Equipo — perfiles de cargo, selección, colaboradores, onboarding.

Desacoplado de talent_hub. Consume modelos via apps.get_model().
"""
from rest_framework import serializers


class ColaboradorEquipoSerializer(serializers.Serializer):
    """Datos básicos de un miembro del equipo."""
    id = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    numero_identificacion = serializers.CharField(allow_blank=True, default='')
    cargo_nombre = serializers.CharField(allow_blank=True, default='')
    is_externo = serializers.BooleanField(default=False)
    estado = serializers.CharField()
    fecha_ingreso = serializers.DateField(allow_null=True)
    foto_url = serializers.URLField(allow_null=True, allow_blank=True)


class AprobacionPendienteSerializer(serializers.Serializer):
    """Una solicitud pendiente de aprobación."""
    id = serializers.IntegerField()
    tipo = serializers.CharField()  # vacaciones | permiso | hora_extra
    colaborador_nombre = serializers.CharField()
    fecha_solicitud = serializers.DateTimeField()
    detalle = serializers.CharField(max_length=500)
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
    horas_extra = serializers.FloatField()  # Float, no Decimal (FE espera number)
    tardanzas = serializers.IntegerField()


class EvaluacionEquipoSerializer(serializers.Serializer):
    """Estado de evaluación de un miembro del equipo."""
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    evaluacion_id = serializers.IntegerField(allow_null=True)
    estado = serializers.CharField()
    calificacion_general = serializers.FloatField(allow_null=True)  # Float, no Decimal
    fecha_evaluacion = serializers.DateField(allow_null=True)
