# -*- coding: utf-8 -*-
"""
Admin para Planificacion del Sistema - Gestion Estrategica

Migrado desde hseq_management.planificacion_sistema
"""
from django.contrib import admin
from .models import (
    PlanTrabajoAnual,
    ActividadPlan,
    ObjetivoSistema,
    ProgramaGestion,
    ActividadPrograma,
    SeguimientoCronograma
)


@admin.register(PlanTrabajoAnual)
class PlanTrabajoAnualAdmin(admin.ModelAdmin):
    """Admin para Plan de Trabajo Anual"""
    list_display = [
        'codigo', 'nombre', 'periodo', 'estado',
        'responsable', 'fecha_inicio', 'fecha_fin', 'created_at'
    ]
    list_filter = ['estado', 'periodo', 'created_at']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['-periodo', '-created_at']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion Basica', {
            'fields': ('codigo', 'nombre', 'periodo', 'descripcion')
        }),
        ('Estado y Responsable', {
            'fields': ('estado', 'responsable')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
        ('Aprobacion', {
            'fields': ('aprobado_por', 'fecha_aprobacion')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ActividadPlan)
class ActividadPlanAdmin(admin.ModelAdmin):
    """Admin para Actividades del Plan"""
    list_display = [
        'codigo', 'nombre', 'plan_trabajo', 'tipo_actividad',
        'responsable', 'estado', 'porcentaje_avance',
        'fecha_programada_inicio', 'fecha_programada_fin'
    ]
    list_filter = ['estado', 'tipo_actividad', 'plan_trabajo', 'created_at']
    search_fields = ['codigo', 'nombre', 'area_responsable']
    ordering = ['fecha_programada_inicio']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion Basica', {
            'fields': ('plan_trabajo', 'codigo', 'nombre', 'descripcion')
        }),
        ('Clasificacion', {
            'fields': ('tipo_actividad', 'area_responsable')
        }),
        ('Programacion', {
            'fields': (
                'fecha_programada_inicio', 'fecha_programada_fin',
                'fecha_real_inicio', 'fecha_real_fin'
            )
        }),
        ('Responsables', {
            'fields': ('responsable', 'colaboradores')
        }),
        ('Recursos', {
            'fields': ('recursos_necesarios', 'presupuesto_estimado', 'presupuesto_ejecutado')
        }),
        ('Estado y Avance', {
            'fields': ('estado', 'porcentaje_avance')
        }),
        ('Resultados', {
            'fields': ('evidencias', 'resultados_obtenidos', 'observaciones')
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ObjetivoSistema)
class ObjetivoSistemaAdmin(admin.ModelAdmin):
    """Admin para Objetivos del Sistema"""
    list_display = [
        'codigo', 'nombre', 'plan_trabajo', 'perspectiva_bsc',
        'tipo_objetivo', 'responsable', 'porcentaje_cumplimiento',
        'estado', 'fecha_meta'
    ]
    list_filter = ['perspectiva_bsc', 'tipo_objetivo', 'area_aplicacion', 'estado', 'created_at']
    search_fields = ['codigo', 'nombre', 'indicador_nombre']
    ordering = ['perspectiva_bsc', 'codigo']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion Basica', {
            'fields': ('plan_trabajo', 'codigo', 'nombre', 'descripcion')
        }),
        ('Vinculacion BSC', {
            'fields': ('perspectiva_bsc', 'objetivo_bsc_id')
        }),
        ('Clasificacion', {
            'fields': ('tipo_objetivo', 'area_aplicacion')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Metas e Indicadores', {
            'fields': (
                'meta_descripcion', 'meta_cuantitativa', 'unidad_medida',
                'indicador_nombre', 'formula_calculo'
            )
        }),
        ('Avance y Cumplimiento', {
            'fields': ('valor_actual', 'porcentaje_cumplimiento', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_meta')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProgramaGestion)
class ProgramaGestionAdmin(admin.ModelAdmin):
    """Admin para Programas de Gestion"""
    list_display = [
        'codigo', 'nombre', 'plan_trabajo', 'tipo_programa',
        'responsable', 'estado', 'porcentaje_avance',
        'fecha_inicio', 'fecha_fin'
    ]
    list_filter = ['tipo_programa', 'estado', 'created_at']
    search_fields = ['codigo', 'nombre']
    ordering = ['tipo_programa', 'codigo']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion Basica', {
            'fields': ('plan_trabajo', 'codigo', 'nombre', 'descripcion')
        }),
        ('Tipo de Programa', {
            'fields': ('tipo_programa',)
        }),
        ('Alcance y Objetivos', {
            'fields': ('alcance', 'objetivos')
        }),
        ('Responsables', {
            'fields': ('responsable', 'coordinadores')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
        ('Recursos', {
            'fields': ('recursos_asignados', 'presupuesto')
        }),
        ('Estado y Avance', {
            'fields': ('estado', 'porcentaje_avance')
        }),
        ('Indicadores', {
            'fields': ('indicadores_medicion',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ActividadPrograma)
class ActividadProgramaAdmin(admin.ModelAdmin):
    """Admin para Actividades del Programa"""
    list_display = [
        'codigo', 'nombre', 'programa', 'responsable',
        'fecha_programada', 'fecha_ejecucion', 'estado'
    ]
    list_filter = ['estado', 'programa', 'created_at']
    search_fields = ['codigo', 'nombre']
    ordering = ['fecha_programada']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion Basica', {
            'fields': ('programa', 'codigo', 'nombre', 'descripcion')
        }),
        ('Fechas', {
            'fields': ('fecha_programada', 'fecha_ejecucion')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Resultados', {
            'fields': ('resultado', 'evidencias', 'observaciones')
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SeguimientoCronograma)
class SeguimientoCronogramaAdmin(admin.ModelAdmin):
    """Admin para Seguimiento de Cronograma"""
    list_display = [
        'plan_trabajo', 'periodo', 'fecha_seguimiento',
        'porcentaje_avance_general', 'nivel_cumplimiento',
        'actividades_totales', 'actividades_completadas',
        'realizado_por'
    ]
    list_filter = ['nivel_cumplimiento', 'plan_trabajo', 'fecha_seguimiento']
    search_fields = ['periodo']
    ordering = ['-fecha_seguimiento']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Informacion del Seguimiento', {
            'fields': ('plan_trabajo', 'periodo', 'fecha_seguimiento', 'realizado_por')
        }),
        ('Metricas Generales', {
            'fields': (
                'actividades_totales', 'actividades_completadas',
                'actividades_en_proceso', 'actividades_retrasadas',
                'actividades_pendientes'
            )
        }),
        ('Avance', {
            'fields': ('porcentaje_avance_general',)
        }),
        ('Presupuesto', {
            'fields': ('presupuesto_planificado', 'presupuesto_ejecutado')
        }),
        ('Desviaciones', {
            'fields': ('desviaciones_identificadas', 'causas_desviacion')
        }),
        ('Acciones', {
            'fields': ('acciones_correctivas', 'acciones_preventivas')
        }),
        ('Evaluacion', {
            'fields': ('nivel_cumplimiento',)
        }),
        ('Observaciones y Recomendaciones', {
            'fields': ('observaciones', 'recomendaciones')
        }),
        ('Multi-Tenant', {
            'fields': ('empresa_id',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
