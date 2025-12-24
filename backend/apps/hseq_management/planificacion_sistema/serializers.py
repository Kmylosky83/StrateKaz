# -*- coding: utf-8 -*-
"""
Serializers para Planificacion del Sistema - HSEQ Management
"""
from rest_framework import serializers
from apps.core.models import User
from .models import (
    PlanTrabajoAnual,
    ActividadPlan,
    ObjetivoSistema,
    ProgramaGestion,
    ActividadPrograma,
    SeguimientoCronograma
)


# ==================== PLAN TRABAJO ANUAL ====================

class PlanTrabajoAnualListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Plan de Trabajo Anual"""

    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Contadores
    total_actividades = serializers.SerializerMethodField()
    total_objetivos = serializers.SerializerMethodField()
    total_programas = serializers.SerializerMethodField()
    porcentaje_avance = serializers.SerializerMethodField()

    class Meta:
        model = PlanTrabajoAnual
        fields = [
            'id', 'empresa_id', 'codigo', 'nombre', 'periodo',
            'estado', 'responsable', 'responsable_nombre',
            'fecha_inicio', 'fecha_fin',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'total_actividades', 'total_objetivos', 'total_programas',
            'porcentaje_avance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_actividades(self, obj):
        return obj.actividades.count()

    def get_total_objetivos(self, obj):
        return obj.objetivos.count()

    def get_total_programas(self, obj):
        return obj.programas.count()

    def get_porcentaje_avance(self, obj):
        actividades = obj.actividades.all()
        if not actividades:
            return 0
        total = sum(act.porcentaje_avance for act in actividades)
        return round(total / len(actividades), 2)


class PlanTrabajoAnualDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Plan de Trabajo Anual"""

    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Relaciones anidadas
    actividades_resumen = serializers.SerializerMethodField()
    objetivos_resumen = serializers.SerializerMethodField()
    programas_resumen = serializers.SerializerMethodField()

    class Meta:
        model = PlanTrabajoAnual
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_actividades_resumen(self, obj):
        actividades = obj.actividades.all()
        return {
            'total': actividades.count(),
            'pendientes': actividades.filter(estado='PENDIENTE').count(),
            'en_proceso': actividades.filter(estado='EN_PROCESO').count(),
            'completadas': actividades.filter(estado='COMPLETADA').count(),
            'retrasadas': actividades.filter(estado='RETRASADA').count(),
        }

    def get_objetivos_resumen(self, obj):
        objetivos = obj.objetivos.all()
        return {
            'total': objetivos.count(),
            'activos': objetivos.filter(estado='ACTIVO').count(),
            'cumplidos': objetivos.filter(estado='CUMPLIDO').count(),
            'no_cumplidos': objetivos.filter(estado='NO_CUMPLIDO').count(),
        }

    def get_programas_resumen(self, obj):
        programas = obj.programas.all()
        return {
            'total': programas.count(),
            'en_ejecucion': programas.filter(estado='EN_EJECUCION').count(),
            'completados': programas.filter(estado='COMPLETADO').count(),
        }


# ==================== ACTIVIDAD PLAN ====================

class ActividadPlanListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Actividades del Plan"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = ActividadPlan
        fields = [
            'id', 'empresa_id', 'plan_trabajo', 'plan_trabajo_codigo',
            'codigo', 'nombre', 'tipo_actividad', 'area_responsable',
            'fecha_programada_inicio', 'fecha_programada_fin',
            'responsable', 'responsable_nombre',
            'estado', 'porcentaje_avance', 'dias_restantes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_dias_restantes(self, obj):
        from datetime import date
        if obj.estado in ['COMPLETADA', 'CANCELADA']:
            return None
        dias = (obj.fecha_programada_fin - date.today()).days
        return dias if dias >= 0 else 0


class ActividadPlanDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Actividades del Plan"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    colaboradores_nombres = serializers.SerializerMethodField()
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ActividadPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_colaboradores_nombres(self, obj):
        return [user.get_full_name() for user in obj.colaboradores.all()]


# ==================== OBJETIVO SISTEMA ====================

class ObjetivoSistemaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Objetivos del Sistema"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    dias_para_meta = serializers.SerializerMethodField()

    class Meta:
        model = ObjetivoSistema
        fields = [
            'id', 'empresa_id', 'plan_trabajo', 'plan_trabajo_codigo',
            'codigo', 'nombre', 'perspectiva_bsc', 'tipo_objetivo',
            'area_aplicacion', 'responsable', 'responsable_nombre',
            'meta_cuantitativa', 'unidad_medida', 'valor_actual',
            'porcentaje_cumplimiento', 'estado', 'fecha_meta',
            'dias_para_meta', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_dias_para_meta(self, obj):
        from datetime import date
        if obj.estado in ['CUMPLIDO', 'NO_CUMPLIDO', 'CANCELADO']:
            return None
        dias = (obj.fecha_meta - date.today()).days
        return dias


class ObjetivoSistemaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Objetivos del Sistema"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ObjetivoSistema
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


# ==================== PROGRAMA GESTION ====================

class ProgramaGestionListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Programas de Gestion"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    total_actividades = serializers.SerializerMethodField()
    actividades_completadas = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaGestion
        fields = [
            'id', 'empresa_id', 'plan_trabajo', 'plan_trabajo_codigo',
            'codigo', 'nombre', 'tipo_programa',
            'responsable', 'responsable_nombre',
            'fecha_inicio', 'fecha_fin', 'estado', 'porcentaje_avance',
            'presupuesto', 'total_actividades', 'actividades_completadas',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_actividades(self, obj):
        return obj.actividades.count()

    def get_actividades_completadas(self, obj):
        return obj.actividades.filter(estado='EJECUTADA').count()


class ProgramaGestionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Programas de Gestion"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    coordinadores_nombres = serializers.SerializerMethodField()
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Resumen de actividades
    actividades_resumen = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaGestion
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_coordinadores_nombres(self, obj):
        return [user.get_full_name() for user in obj.coordinadores.all()]

    def get_actividades_resumen(self, obj):
        actividades = obj.actividades.all()
        return {
            'total': actividades.count(),
            'pendientes': actividades.filter(estado='PENDIENTE').count(),
            'en_proceso': actividades.filter(estado='EN_PROCESO').count(),
            'ejecutadas': actividades.filter(estado='EJECUTADA').count(),
        }


# ==================== ACTIVIDAD PROGRAMA ====================

class ActividadProgramaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Actividades del Programa"""

    programa_codigo = serializers.CharField(
        source='programa.codigo',
        read_only=True
    )
    programa_nombre = serializers.CharField(
        source='programa.nombre',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )

    class Meta:
        model = ActividadPrograma
        fields = [
            'id', 'empresa_id', 'programa', 'programa_codigo', 'programa_nombre',
            'codigo', 'nombre', 'fecha_programada', 'fecha_ejecucion',
            'responsable', 'responsable_nombre', 'estado',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ActividadProgramaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Actividades del Programa"""

    programa_codigo = serializers.CharField(
        source='programa.codigo',
        read_only=True
    )
    programa_nombre = serializers.CharField(
        source='programa.nombre',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ActividadPrograma
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


# ==================== SEGUIMIENTO CRONOGRAMA ====================

class SeguimientoCronogramaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para Seguimientos de Cronograma"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = SeguimientoCronograma
        fields = [
            'id', 'empresa_id', 'plan_trabajo', 'plan_trabajo_codigo',
            'periodo', 'fecha_seguimiento',
            'realizado_por', 'realizado_por_nombre',
            'actividades_totales', 'actividades_completadas',
            'actividades_retrasadas', 'porcentaje_avance_general',
            'nivel_cumplimiento',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SeguimientoCronogramaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Seguimientos de Cronograma"""

    plan_trabajo_codigo = serializers.CharField(
        source='plan_trabajo.codigo',
        read_only=True
    )
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Indicadores adicionales
    eficiencia_presupuestal = serializers.SerializerMethodField()

    class Meta:
        model = SeguimientoCronograma
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_eficiencia_presupuestal(self, obj):
        if obj.presupuesto_planificado and obj.presupuesto_ejecutado:
            if obj.presupuesto_planificado > 0:
                return round(
                    (float(obj.presupuesto_ejecutado) / float(obj.presupuesto_planificado)) * 100,
                    2
                )
        return None
