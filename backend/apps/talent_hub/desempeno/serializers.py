"""
Serializers para Desempeño - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from .models import (
    CicloEvaluacion, CompetenciaEvaluacion, CriterioEvaluacion, EscalaCalificacion,
    EvaluacionDesempeno, DetalleEvaluacion, EvaluadorPar,
    PlanMejora, ActividadPlanMejora, SeguimientoPlanMejora,
    TipoReconocimiento, Reconocimiento, MuroReconocimientos,
)


# =============================================================================
# CONFIGURACIÓN DE EVALUACIÓN
# =============================================================================

class CicloEvaluacionListSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_ciclo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    evaluaciones_count = serializers.IntegerField(source='evaluaciones.count', read_only=True)

    class Meta:
        model = CicloEvaluacion
        fields = [
            'id', 'codigo', 'nombre', 'tipo_ciclo', 'tipo_display', 'anio', 'periodo',
            'fecha_inicio', 'fecha_fin', 'fecha_inicio_evaluacion', 'fecha_fin_evaluacion',
            'estado', 'estado_display', 'evaluaciones_count', 'is_active',
        ]


class CicloEvaluacionDetailSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_ciclo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    peso_total = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = CicloEvaluacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class CriterioEvaluacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriterioEvaluacion
        fields = ['id', 'descripcion', 'peso', 'orden']


class CompetenciaEvaluacionListSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_competencia_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_esperado_display', read_only=True)
    criterios_count = serializers.IntegerField(source='criterios.count', read_only=True)

    class Meta:
        model = CompetenciaEvaluacion
        fields = [
            'id', 'codigo', 'nombre', 'tipo_competencia', 'tipo_display',
            'nivel_esperado', 'nivel_display', 'peso', 'orden',
            'aplica_a_todos', 'criterios_count', 'is_active',
        ]


class CompetenciaEvaluacionDetailSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_competencia_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_esperado_display', read_only=True)
    criterios = CriterioEvaluacionSerializer(many=True, read_only=True)

    class Meta:
        model = CompetenciaEvaluacion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class EscalaCalificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscalaCalificacion
        fields = ['id', 'valor', 'etiqueta', 'descripcion', 'color']


# =============================================================================
# EVALUACIÓN DE DESEMPEÑO
# =============================================================================

class EvaluadorParSerializer(serializers.ModelSerializer):
    evaluador_nombre = serializers.CharField(source='evaluador.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = EvaluadorPar
        fields = [
            'id', 'evaluador', 'evaluador_nombre', 'es_subordinado',
            'fecha_asignacion', 'fecha_limite', 'fecha_evaluacion',
            'calificacion_otorgada', 'estado', 'estado_display', 'comentario',
        ]
        read_only_fields = ['fecha_asignacion']


class DetalleEvaluacionSerializer(serializers.ModelSerializer):
    competencia_nombre = serializers.CharField(source='competencia.nombre', read_only=True)
    criterio_descripcion = serializers.CharField(source='criterio.descripcion', read_only=True)
    tipo_evaluador_display = serializers.CharField(source='get_tipo_evaluador_display', read_only=True)
    evaluador_nombre = serializers.CharField(source='evaluador.get_full_name', read_only=True)

    class Meta:
        model = DetalleEvaluacion
        fields = [
            'id', 'competencia', 'competencia_nombre', 'criterio', 'criterio_descripcion',
            'tipo_evaluador', 'tipo_evaluador_display', 'evaluador', 'evaluador_nombre',
            'calificacion', 'comentario', 'fecha_evaluacion',
        ]
        read_only_fields = ['fecha_evaluacion']


class EvaluacionDesempenoListSerializer(serializers.ModelSerializer):
    ciclo_codigo = serializers.CharField(source='ciclo.codigo', read_only=True)
    ciclo_nombre = serializers.CharField(source='ciclo.nombre', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    jefe_nombre = serializers.CharField(source='jefe_evaluador.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = EvaluacionDesempeno
        fields = [
            'id', 'ciclo', 'ciclo_codigo', 'ciclo_nombre', 'colaborador', 'colaborador_nombre',
            'jefe_evaluador', 'jefe_nombre', 'fecha_asignacion', 'estado', 'estado_display',
            'calificacion_autoevaluacion', 'calificacion_jefe', 'calificacion_final',
            'calificacion_calibrada', 'firma_colaborador',
        ]


class EvaluacionDesempenoDetailSerializer(serializers.ModelSerializer):
    ciclo_info = CicloEvaluacionListSerializer(source='ciclo', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    jefe_nombre = serializers.CharField(source='jefe_evaluador.get_full_name', read_only=True)
    calibrado_por_nombre = serializers.CharField(source='calibrado_por.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    detalles = DetalleEvaluacionSerializer(many=True, read_only=True)
    evaluadores_pares = EvaluadorParSerializer(many=True, read_only=True)

    class Meta:
        model = EvaluacionDesempeno
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'fecha_asignacion']


class EvaluacionDesempenoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionDesempeno
        fields = ['ciclo', 'colaborador', 'jefe_evaluador']


# =============================================================================
# PLAN DE MEJORA
# =============================================================================

class ActividadPlanMejoraSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_actividad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)

    class Meta:
        model = ActividadPlanMejora
        fields = [
            'id', 'tipo_actividad', 'tipo_display', 'descripcion', 'resultado_esperado',
            'fecha_inicio', 'fecha_fin', 'fecha_completado', 'responsable', 'responsable_nombre',
            'prioridad', 'estado', 'estado_display', 'comentarios', 'evidencia',
        ]


class SeguimientoPlanMejoraSerializer(serializers.ModelSerializer):
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)

    class Meta:
        model = SeguimientoPlanMejora
        fields = [
            'id', 'fecha_seguimiento', 'realizado_por', 'realizado_por_nombre',
            'porcentaje_avance', 'logros', 'dificultades', 'acciones_correctivas',
            'proxima_fecha_seguimiento', 'observaciones',
        ]


class PlanMejoraListSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_plan_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    actividades_count = serializers.IntegerField(source='actividades.count', read_only=True)

    class Meta:
        model = PlanMejora
        fields = [
            'id', 'codigo', 'titulo', 'colaborador', 'colaborador_nombre',
            'tipo_plan', 'tipo_display', 'fecha_inicio', 'fecha_fin',
            'estado', 'estado_display', 'porcentaje_avance', 'actividades_count',
        ]


class PlanMejoraDetailSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_plan_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    actividades = ActividadPlanMejoraSerializer(many=True, read_only=True)
    seguimientos = SeguimientoPlanMejoraSerializer(many=True, read_only=True)

    class Meta:
        model = PlanMejora
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class PlanMejoraCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanMejora
        fields = [
            'codigo', 'titulo', 'evaluacion', 'colaborador', 'tipo_plan',
            'fecha_inicio', 'fecha_fin', 'responsable', 'objetivo_general',
            'competencias_a_desarrollar', 'recursos_necesarios', 'indicadores_exito',
            'observaciones',
        ]


# =============================================================================
# RECONOCIMIENTOS
# =============================================================================

class TipoReconocimientoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = TipoReconocimiento
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class ReconocimientoListSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_reconocimiento.nombre', read_only=True)
    tipo_categoria = serializers.CharField(source='tipo_reconocimiento.categoria', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nominado_por_nombre = serializers.CharField(source='nominado_por.get_full_name', read_only=True)

    class Meta:
        model = Reconocimiento
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'tipo_reconocimiento',
            'tipo_nombre', 'tipo_categoria', 'fecha_reconocimiento', 'motivo',
            'estado', 'estado_display', 'puntos_otorgados', 'nominado_por_nombre',
            'es_publico', 'publicado_en_muro',
        ]


class ReconocimientoDetailSerializer(serializers.ModelSerializer):
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_info = TipoReconocimientoSerializer(source='tipo_reconocimiento', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nominado_por_nombre = serializers.CharField(source='nominado_por.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    class Meta:
        model = Reconocimiento
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'puntos_otorgados']


class ReconocimientoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reconocimiento
        fields = [
            'colaborador', 'tipo_reconocimiento', 'evaluacion',
            'fecha_reconocimiento', 'motivo', 'logro_especifico',
            'es_publico', 'observaciones',
        ]


class MuroReconocimientosSerializer(serializers.ModelSerializer):
    reconocimiento_info = ReconocimientoListSerializer(source='reconocimiento', read_only=True)

    class Meta:
        model = MuroReconocimientos
        fields = [
            'id', 'reconocimiento', 'reconocimiento_info', 'titulo', 'mensaje',
            'imagen', 'fecha_publicacion', 'likes', 'comentarios_count', 'es_destacado',
        ]
        read_only_fields = ['fecha_publicacion', 'likes', 'comentarios_count']


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class DesempenoEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de desempeño."""
    ciclo_activo = serializers.CharField()
    evaluaciones_pendientes = serializers.IntegerField()
    evaluaciones_completadas = serializers.IntegerField()
    evaluaciones_en_proceso = serializers.IntegerField()
    promedio_calificacion = serializers.DecimalField(max_digits=5, decimal_places=2)
    planes_mejora_activos = serializers.IntegerField()
    reconocimientos_mes = serializers.IntegerField()
    tasa_completitud = serializers.DecimalField(max_digits=5, decimal_places=2)


class ResumenColaboradorSerializer(serializers.Serializer):
    """Resumen de desempeño de un colaborador."""
    colaborador_id = serializers.IntegerField()
    colaborador_nombre = serializers.CharField()
    ultima_calificacion = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    tendencia = serializers.CharField()  # 'mejorando', 'estable', 'declinando'
    planes_mejora_activos = serializers.IntegerField()
    reconocimientos_total = serializers.IntegerField()
    puntos_acumulados = serializers.IntegerField()
