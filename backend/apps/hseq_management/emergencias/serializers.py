"""
Serializers para Gestión de Emergencias
"""
from rest_framework import serializers
from .models import (
    AnalisisVulnerabilidad, Amenaza, PlanEmergencia, ProcedimientoEmergencia,
    PlanoEvacuacion, TipoBrigada, Brigada, BrigadistaActivo,
    Simulacro, EvaluacionSimulacro, RecursoEmergencia, InspeccionRecurso
)


class AmenazaSerializer(serializers.ModelSerializer):
    """Serializer para Amenazas"""
    nivel_riesgo_texto = serializers.ReadOnlyField()

    class Meta:
        model = Amenaza
        fields = '__all__'
        read_only_fields = ['nivel_riesgo', 'creado_en', 'actualizado_en']


class AnalisisVulnerabilidadListSerializer(serializers.ModelSerializer):
    """Serializer para listar análisis de vulnerabilidad"""
    total_amenazas = serializers.SerializerMethodField()
    amenazas_criticas = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisVulnerabilidad
        fields = [
            'id', 'codigo', 'nombre', 'tipo_amenaza', 'fecha_analisis',
            'nivel_vulnerabilidad', 'puntuacion_vulnerabilidad', 'estado',
            'proxima_revision', 'total_amenazas', 'amenazas_criticas',
            'creado_en', 'actualizado_en'
        ]

    def get_total_amenazas(self, obj):
        return obj.amenazas.filter(activo=True).count()

    def get_amenazas_criticas(self, obj):
        return obj.amenazas.filter(activo=True, nivel_riesgo__gte=15).count()


class AnalisisVulnerabilidadDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para análisis de vulnerabilidad"""
    amenazas = AmenazaSerializer(many=True, read_only=True)
    total_amenazas = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisVulnerabilidad
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']

    def get_total_amenazas(self, obj):
        return obj.amenazas.filter(activo=True).count()


class ProcedimientoEmergenciaSerializer(serializers.ModelSerializer):
    """Serializer para Procedimientos de Emergencia"""
    tipo_emergencia_display = serializers.CharField(
        source='get_tipo_emergencia_display',
        read_only=True
    )

    class Meta:
        model = ProcedimientoEmergencia
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


class PlanoEvacuacionSerializer(serializers.ModelSerializer):
    """Serializer para Planos de Evacuación"""

    class Meta:
        model = PlanoEvacuacion
        fields = '__all__'
        read_only_fields = ['fecha_actualizacion', 'creado_en', 'actualizado_en']


class PlanEmergenciaListSerializer(serializers.ModelSerializer):
    """Serializer para listar planes de emergencia"""
    total_procedimientos = serializers.SerializerMethodField()
    total_planos = serializers.SerializerMethodField()
    total_simulacros = serializers.SerializerMethodField()

    class Meta:
        model = PlanEmergencia
        fields = [
            'id', 'codigo', 'nombre', 'version', 'fecha_elaboracion',
            'fecha_vigencia', 'fecha_revision', 'estado',
            'total_procedimientos', 'total_planos', 'total_simulacros',
            'creado_en', 'actualizado_en'
        ]

    def get_total_procedimientos(self, obj):
        return obj.procedimientos.filter(activo=True).count()

    def get_total_planos(self, obj):
        return obj.planos_evacuacion.filter(activo=True).count()

    def get_total_simulacros(self, obj):
        return obj.simulacros.filter(activo=True).count()


class PlanEmergenciaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para plan de emergencia"""
    procedimientos = ProcedimientoEmergenciaSerializer(many=True, read_only=True)
    planos_evacuacion = PlanoEvacuacionSerializer(many=True, read_only=True)

    class Meta:
        model = PlanEmergencia
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


class TipoBrigadaSerializer(serializers.ModelSerializer):
    """Serializer para Tipos de Brigada"""
    total_brigadas = serializers.SerializerMethodField()

    class Meta:
        model = TipoBrigada
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']

    def get_total_brigadas(self, obj):
        return obj.brigadas.filter(activo=True, estado='ACTIVA').count()


class BrigadistaActivoSerializer(serializers.ModelSerializer):
    """Serializer para Brigadistas Activos"""
    brigada_nombre = serializers.CharField(source='brigada.nombre', read_only=True)
    certificado_vigente = serializers.ReadOnlyField()

    class Meta:
        model = BrigadistaActivo
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


class BrigadaListSerializer(serializers.ModelSerializer):
    """Serializer para listar brigadas"""
    tipo_brigada_nombre = serializers.CharField(
        source='tipo_brigada.nombre',
        read_only=True
    )
    tipo_brigada_color = serializers.CharField(
        source='tipo_brigada.color_identificacion',
        read_only=True
    )
    total_brigadistas = serializers.SerializerMethodField()
    brigadistas_activos = serializers.SerializerMethodField()
    estado_capacidad = serializers.SerializerMethodField()

    class Meta:
        model = Brigada
        fields = [
            'id', 'codigo', 'nombre', 'tipo_brigada', 'tipo_brigada_nombre',
            'tipo_brigada_color', 'lider_brigada', 'estado',
            'numero_minimo_brigadistas', 'numero_brigadistas_actuales',
            'total_brigadistas', 'brigadistas_activos', 'estado_capacidad',
            'fecha_conformacion', 'fecha_proxima_capacitacion',
            'creado_en', 'actualizado_en'
        ]

    def get_total_brigadistas(self, obj):
        return obj.brigadistas.filter(activo=True).count()

    def get_brigadistas_activos(self, obj):
        return obj.brigadistas.filter(activo=True, estado='ACTIVO').count()

    def get_estado_capacidad(self, obj):
        """Retorna el estado de capacidad de la brigada"""
        activos = obj.brigadistas.filter(activo=True, estado='ACTIVO').count()
        if activos < obj.numero_minimo_brigadistas:
            return 'INSUFICIENTE'
        elif activos == obj.numero_minimo_brigadistas:
            return 'MINIMO'
        else:
            return 'OPTIMO'


class BrigadaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para brigada"""
    tipo_brigada_data = TipoBrigadaSerializer(source='tipo_brigada', read_only=True)
    brigadistas = BrigadistaActivoSerializer(many=True, read_only=True)
    total_brigadistas = serializers.SerializerMethodField()

    class Meta:
        model = Brigada
        fields = '__all__'
        read_only_fields = ['numero_brigadistas_actuales', 'creado_en', 'actualizado_en']

    def get_total_brigadistas(self, obj):
        return obj.brigadistas.filter(activo=True, estado='ACTIVO').count()


class EvaluacionSimulacroSerializer(serializers.ModelSerializer):
    """Serializer para Evaluaciones de Simulacro"""

    class Meta:
        model = EvaluacionSimulacro
        fields = '__all__'
        read_only_fields = ['calificacion_general', 'calificacion_porcentaje', 'creado_en', 'actualizado_en']


class SimulacroListSerializer(serializers.ModelSerializer):
    """Serializer para listar simulacros"""
    tipo_simulacro_display = serializers.CharField(
        source='get_tipo_simulacro_display',
        read_only=True
    )
    plan_emergencia_nombre = serializers.CharField(
        source='plan_emergencia.nombre',
        read_only=True
    )
    total_brigadas = serializers.SerializerMethodField()
    total_evaluaciones = serializers.SerializerMethodField()
    dias_hasta_fecha = serializers.SerializerMethodField()

    class Meta:
        model = Simulacro
        fields = [
            'id', 'codigo', 'nombre', 'tipo_simulacro', 'tipo_simulacro_display',
            'plan_emergencia', 'plan_emergencia_nombre', 'alcance', 'estado',
            'fecha_programada', 'fecha_realizada', 'coordinador',
            'fue_exitoso', 'total_brigadas', 'total_evaluaciones',
            'dias_hasta_fecha', 'creado_en', 'actualizado_en'
        ]

    def get_total_brigadas(self, obj):
        return obj.brigadas_participantes.count()

    def get_total_evaluaciones(self, obj):
        return obj.evaluaciones.filter(activo=True).count()

    def get_dias_hasta_fecha(self, obj):
        """Días hasta la fecha programada (negativo si ya pasó)"""
        from django.utils import timezone
        if obj.estado in ['REALIZADO', 'EVALUADO', 'CANCELADO']:
            return None
        delta = obj.fecha_programada.date() - timezone.now().date()
        return delta.days


class SimulacroDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para simulacro"""
    plan_emergencia_data = PlanEmergenciaListSerializer(
        source='plan_emergencia',
        read_only=True
    )
    brigadas_participantes_data = BrigadaListSerializer(
        source='brigadas_participantes',
        many=True,
        read_only=True
    )
    evaluaciones = EvaluacionSimulacroSerializer(many=True, read_only=True)

    class Meta:
        model = Simulacro
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


class InspeccionRecursoSerializer(serializers.ModelSerializer):
    """Serializer para Inspecciones de Recursos"""
    recurso_codigo = serializers.CharField(source='recurso.codigo', read_only=True)
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)
    recurso_tipo = serializers.CharField(source='recurso.tipo_recurso', read_only=True)

    class Meta:
        model = InspeccionRecurso
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


class RecursoEmergenciaListSerializer(serializers.ModelSerializer):
    """Serializer para listar recursos de emergencia"""
    tipo_recurso_display = serializers.CharField(
        source='get_tipo_recurso_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    ultima_inspeccion = serializers.SerializerMethodField()
    dias_proxima_inspeccion = serializers.SerializerMethodField()
    requiere_inspeccion = serializers.ReadOnlyField()

    class Meta:
        model = RecursoEmergencia
        fields = [
            'id', 'codigo', 'tipo_recurso', 'tipo_recurso_display',
            'nombre', 'area', 'ubicacion_especifica', 'estado', 'estado_display',
            'fecha_proxima_inspeccion', 'ultima_inspeccion',
            'dias_proxima_inspeccion', 'requiere_inspeccion',
            'responsable', 'creado_en', 'actualizado_en'
        ]

    def get_ultima_inspeccion(self, obj):
        ultima = obj.inspecciones.filter(activo=True).order_by('-fecha_inspeccion').first()
        if ultima:
            return {
                'fecha': ultima.fecha_inspeccion,
                'resultado': ultima.resultado,
                'inspector': ultima.inspector
            }
        return None

    def get_dias_proxima_inspeccion(self, obj):
        """Días hasta la próxima inspección (negativo si ya pasó)"""
        if not obj.fecha_proxima_inspeccion:
            return None
        from django.utils import timezone
        delta = obj.fecha_proxima_inspeccion - timezone.now().date()
        return delta.days


class RecursoEmergenciaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para recurso de emergencia"""
    inspecciones = InspeccionRecursoSerializer(many=True, read_only=True)
    tipo_recurso_display = serializers.CharField(
        source='get_tipo_recurso_display',
        read_only=True
    )
    requiere_inspeccion = serializers.ReadOnlyField()

    class Meta:
        model = RecursoEmergencia
        fields = '__all__'
        read_only_fields = ['creado_en', 'actualizado_en']


# Serializers para actions específicos
class ProgramarSimulacroSerializer(serializers.Serializer):
    """Serializer para programar un simulacro"""
    plan_emergencia_id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=255)
    tipo_simulacro = serializers.ChoiceField(choices=Simulacro.TIPO_SIMULACRO_CHOICES)
    alcance = serializers.ChoiceField(choices=Simulacro.ALCANCE_CHOICES)
    fecha_programada = serializers.DateTimeField()
    duracion_programada = serializers.IntegerField(min_value=1)
    objetivo_general = serializers.CharField()
    objetivos_especificos = serializers.CharField(required=False, allow_blank=True)
    descripcion_escenario = serializers.CharField()
    ubicacion = serializers.CharField(max_length=255)
    areas_involucradas = serializers.CharField()
    coordinador = serializers.CharField(max_length=255)
    numero_participantes_esperados = serializers.IntegerField(min_value=0)
    brigadas_participantes_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    tipo_simulacro_anunciado = serializers.BooleanField(default=True)
    notificar_participantes = serializers.BooleanField(default=False)


class RegistrarEvaluacionSerializer(serializers.Serializer):
    """Serializer para registrar evaluación de simulacro"""
    simulacro_id = serializers.IntegerField()
    fecha_evaluacion = serializers.DateField()
    evaluador = serializers.CharField(max_length=255)
    cargo_evaluador = serializers.CharField(max_length=255, required=False, allow_blank=True)

    # Calificaciones (1-5)
    tiempo_respuesta_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    tiempo_respuesta_observaciones = serializers.CharField(required=False, allow_blank=True)

    activacion_alarma_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    activacion_alarma_observaciones = serializers.CharField(required=False, allow_blank=True)

    comunicacion_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    comunicacion_observaciones = serializers.CharField(required=False, allow_blank=True)

    evacuacion_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    evacuacion_observaciones = serializers.CharField(required=False, allow_blank=True)

    brigadas_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    brigadas_observaciones = serializers.CharField(required=False, allow_blank=True)

    punto_encuentro_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    punto_encuentro_observaciones = serializers.CharField(required=False, allow_blank=True)

    conteo_personas_calificacion = serializers.IntegerField(min_value=1, max_value=5)
    conteo_personas_observaciones = serializers.CharField(required=False, allow_blank=True)

    # Tiempos medidos
    tiempo_deteccion = serializers.IntegerField(required=False, allow_null=True)
    tiempo_alarma = serializers.IntegerField(required=False, allow_null=True)
    tiempo_evacuacion_total = serializers.IntegerField(required=False, allow_null=True)

    # Resultados cuantitativos
    personas_evacuadas = serializers.IntegerField(min_value=0)
    personas_no_evacuadas = serializers.IntegerField(min_value=0)
    personas_heridas_simuladas = serializers.IntegerField(min_value=0, required=False)

    # Análisis
    fortalezas_identificadas = serializers.CharField()
    debilidades_identificadas = serializers.CharField()
    recomendaciones = serializers.CharField()

    # Acciones correctivas
    requiere_acciones_correctivas = serializers.BooleanField(default=False)
    acciones_correctivas = serializers.CharField(required=False, allow_blank=True)

    # Conclusión
    conclusion_general = serializers.CharField()
    aprobado = serializers.BooleanField(default=False)
