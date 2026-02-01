"""
Serializers para Formación y Reinducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from .models import (
    PlanFormacion, Capacitacion, ProgramacionCapacitacion,
    EjecucionCapacitacion, Badge, GamificacionColaborador,
    BadgeColaborador, EvaluacionEficacia, Certificado,
)


# =============================================================================
# PLAN DE FORMACIÓN
# =============================================================================

class PlanFormacionListSerializer(serializers.ModelSerializer):
    porcentaje_ejecucion = serializers.DecimalField(
        source='porcentaje_ejecucion_presupuesto', max_digits=5, decimal_places=2, read_only=True
    )
    capacitaciones_count = serializers.IntegerField(source='capacitaciones.count', read_only=True)

    class Meta:
        model = PlanFormacion
        fields = [
            'id', 'codigo', 'nombre', 'anio', 'fecha_inicio', 'fecha_fin',
            'presupuesto_asignado', 'presupuesto_ejecutado', 'porcentaje_ejecucion',
            'aprobado', 'capacitaciones_count', 'is_active',
        ]


class PlanFormacionDetailSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    porcentaje_ejecucion = serializers.DecimalField(
        source='porcentaje_ejecucion_presupuesto', max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = PlanFormacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# CAPACITACIÓN
# =============================================================================

class CapacitacionListSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_capacitacion_display', read_only=True)
    modalidad_display = serializers.CharField(source='get_modalidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Capacitacion
        fields = [
            'id', 'codigo', 'nombre', 'tipo_capacitacion', 'tipo_display',
            'modalidad', 'modalidad_display', 'duracion_horas', 'estado',
            'estado_display', 'puntos_otorgados', 'is_active',
        ]


class CapacitacionDetailSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_capacitacion_display', read_only=True)
    modalidad_display = serializers.CharField(source='get_modalidad_display', read_only=True)
    plan_nombre = serializers.CharField(source='plan_formacion.nombre', read_only=True)
    instructor_nombre = serializers.CharField(source='instructor_interno.get_full_name', read_only=True)

    class Meta:
        model = Capacitacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class CapacitacionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Capacitacion
        fields = [
            'codigo', 'nombre', 'descripcion', 'tipo_capacitacion', 'modalidad',
            'plan_formacion', 'duracion_horas', 'numero_sesiones', 'instructor_interno',
            'instructor_externo', 'proveedor_externo', 'objetivos', 'contenido_tematico',
            'material_apoyo', 'cupo_maximo', 'cupo_minimo', 'requisitos_previos',
            'cargos_objetivo', 'requiere_evaluacion', 'nota_aprobacion', 'genera_certificado',
            'costo_por_persona', 'costo_total', 'puntos_otorgados', 'estado', 'observaciones',
        ]


# =============================================================================
# PROGRAMACIÓN
# =============================================================================

class ProgramacionCapacitacionListSerializer(serializers.ModelSerializer):
    capacitacion_nombre = serializers.CharField(source='capacitacion.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cupo_disponible = serializers.IntegerField(read_only=True)
    esta_llena = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProgramacionCapacitacion
        fields = [
            'id', 'capacitacion', 'capacitacion_nombre', 'numero_sesion',
            'titulo_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'lugar',
            'inscritos', 'cupo_disponible', 'esta_llena', 'estado', 'estado_display',
        ]


class ProgramacionCapacitacionDetailSerializer(serializers.ModelSerializer):
    capacitacion_info = CapacitacionListSerializer(source='capacitacion', read_only=True)
    instructor_nombre = serializers.CharField(source='instructor.get_full_name', read_only=True)

    class Meta:
        model = ProgramacionCapacitacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# EJECUCIÓN
# =============================================================================

class EjecucionCapacitacionListSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    capacitacion_nombre = serializers.CharField(source='programacion.capacitacion.nombre', read_only=True)
    fecha = serializers.DateField(source='programacion.fecha', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    aprobo = serializers.BooleanField(read_only=True)

    class Meta:
        model = EjecucionCapacitacion
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'programacion',
            'capacitacion_nombre', 'fecha', 'estado', 'estado_display',
            'asistio', 'nota_evaluacion', 'puntos_ganados', 'aprobo',
        ]


class EjecucionCapacitacionDetailSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    programacion_info = ProgramacionCapacitacionListSerializer(source='programacion', read_only=True)
    aprobo = serializers.BooleanField(read_only=True)

    class Meta:
        model = EjecucionCapacitacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# GAMIFICACIÓN
# =============================================================================

class BadgeSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Badge
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class GamificacionColaboradorSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)

    class Meta:
        model = GamificacionColaborador
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class BadgeColaboradorSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    badge_info = BadgeSerializer(source='badge', read_only=True)

    class Meta:
        model = BadgeColaborador
        fields = '__all__'
        read_only_fields = ['empresa', 'fecha_obtencion']


class LeaderboardSerializer(serializers.Serializer):
    """Serializer para el leaderboard de gamificación."""
    posicion = serializers.IntegerField()
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    nivel = serializers.IntegerField()
    nombre_nivel = serializers.CharField()
    puntos_totales = serializers.IntegerField()
    badges_obtenidos = serializers.IntegerField()
    capacitaciones_completadas = serializers.IntegerField()


# =============================================================================
# EVALUACIÓN DE EFICACIA
# =============================================================================

class EvaluacionEficaciaSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source='get_nivel_evaluacion_display', read_only=True)
    colaborador_nombre = serializers.CharField(source='ejecucion.colaborador.get_nombre_corto', read_only=True)
    capacitacion_nombre = serializers.CharField(
        source='ejecucion.programacion.capacitacion.nombre', read_only=True
    )
    evaluador_nombre = serializers.CharField(source='evaluador.get_full_name', read_only=True)

    class Meta:
        model = EvaluacionEficacia
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# CERTIFICADO
# =============================================================================

class CertificadoListSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='ejecucion.colaborador.get_nombre_corto', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = Certificado
        fields = [
            'id', 'numero_certificado', 'titulo_capacitacion', 'colaborador_nombre',
            'fecha_emision', 'fecha_vencimiento', 'nota_obtenida', 'anulado', 'esta_vigente',
        ]


class CertificadoDetailSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='ejecucion.colaborador.get_nombre_completo', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = Certificado
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'fecha_emision']


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class FormacionEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de formación."""
    capacitaciones_activas = serializers.IntegerField()
    sesiones_programadas_mes = serializers.IntegerField()
    participantes_mes = serializers.IntegerField()
    tasa_asistencia = serializers.DecimalField(max_digits=5, decimal_places=2)
    tasa_aprobacion = serializers.DecimalField(max_digits=5, decimal_places=2)
    horas_formacion_mes = serializers.IntegerField()
    certificados_emitidos_mes = serializers.IntegerField()
    presupuesto_ejecutado_anio = serializers.DecimalField(max_digits=14, decimal_places=2)
