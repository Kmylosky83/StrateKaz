"""
Admin para Gestión de Emergencias
"""
from django.contrib import admin
from .models import (
    AnalisisVulnerabilidad, Amenaza, PlanEmergencia, ProcedimientoEmergencia,
    PlanoEvacuacion, TipoBrigada, Brigada, BrigadistaActivo,
    Simulacro, EvaluacionSimulacro, RecursoEmergencia, InspeccionRecurso
)


@admin.register(AnalisisVulnerabilidad)
class AnalisisVulnerabilidadAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_amenaza', 'nivel_vulnerabilidad', 'estado', 'fecha_analisis']
    list_filter = ['tipo_amenaza', 'nivel_vulnerabilidad', 'estado', 'activo']
    search_fields = ['codigo', 'nombre', 'responsable_analisis']
    ordering = ['-fecha_analisis']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(Amenaza)
class AmenazaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'nivel_riesgo', 'nivel_riesgo_texto', 'analisis_vulnerabilidad']
    list_filter = ['categoria', 'probabilidad', 'severidad', 'activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['-nivel_riesgo']
    readonly_fields = ['nivel_riesgo', 'creado_en', 'actualizado_en']


@admin.register(PlanEmergencia)
class PlanEmergenciaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'version', 'estado', 'fecha_elaboracion', 'fecha_vigencia']
    list_filter = ['estado', 'activo']
    search_fields = ['codigo', 'nombre', 'director_emergencias']
    ordering = ['-fecha_elaboracion']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(ProcedimientoEmergencia)
class ProcedimientoEmergenciaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_emergencia', 'estado', 'plan_emergencia']
    list_filter = ['tipo_emergencia', 'estado', 'activo']
    search_fields = ['codigo', 'nombre']
    ordering = ['tipo_emergencia', 'codigo']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(PlanoEvacuacion)
class PlanoEvacuacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'edificio', 'piso', 'publicado', 'plan_emergencia']
    list_filter = ['edificio', 'publicado', 'activo']
    search_fields = ['codigo', 'nombre', 'area']
    ordering = ['edificio', 'piso']
    readonly_fields = ['fecha_actualizacion', 'creado_en', 'actualizado_en']


@admin.register(TipoBrigada)
class TipoBrigadaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'nivel_prioridad', 'certificacion_requerida', 'horas_capacitacion_minimas']
    list_filter = ['certificacion_requerida', 'nivel_prioridad', 'activo']
    search_fields = ['codigo', 'nombre']
    ordering = ['nivel_prioridad']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(Brigada)
class BrigadaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_brigada', 'lider_brigada', 'estado', 'numero_brigadistas_actuales']
    list_filter = ['tipo_brigada', 'estado', 'activo']
    search_fields = ['codigo', 'nombre', 'lider_brigada']
    ordering = ['tipo_brigada', 'nombre']
    readonly_fields = ['numero_brigadistas_actuales', 'creado_en', 'actualizado_en']


@admin.register(BrigadistaActivo)
class BrigadistaActivoAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'brigada', 'rol', 'estado', 'grupo_sanguineo', 'certificado_vigente']
    list_filter = ['brigada', 'estado', 'rol', 'grupo_sanguineo', 'activo']
    search_fields = ['nombre_completo', 'documento_identidad', 'codigo_empleado']
    ordering = ['brigada', 'nombre_completo']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(Simulacro)
class SimulacroAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_simulacro', 'estado', 'fecha_programada', 'fue_exitoso']
    list_filter = ['tipo_simulacro', 'estado', 'alcance', 'fue_exitoso', 'activo']
    search_fields = ['codigo', 'nombre', 'coordinador']
    ordering = ['-fecha_programada']
    readonly_fields = ['creado_en', 'actualizado_en']
    filter_horizontal = ['brigadas_participantes']


@admin.register(EvaluacionSimulacro)
class EvaluacionSimulacroAdmin(admin.ModelAdmin):
    list_display = ['simulacro', 'fecha_evaluacion', 'evaluador', 'calificacion_porcentaje', 'aprobado']
    list_filter = ['aprobado', 'requiere_acciones_correctivas', 'activo']
    search_fields = ['evaluador', 'cargo_evaluador']
    ordering = ['-fecha_evaluacion']
    readonly_fields = ['calificacion_general', 'calificacion_porcentaje', 'creado_en', 'actualizado_en']


@admin.register(RecursoEmergencia)
class RecursoEmergenciaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_recurso', 'area', 'estado', 'fecha_proxima_inspeccion', 'requiere_inspeccion']
    list_filter = ['tipo_recurso', 'estado', 'edificio', 'activo']
    search_fields = ['codigo', 'nombre', 'ubicacion_especifica']
    ordering = ['tipo_recurso', 'area']
    readonly_fields = ['creado_en', 'actualizado_en']


@admin.register(InspeccionRecurso)
class InspeccionRecursoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'recurso', 'fecha_inspeccion', 'inspector', 'resultado', 'requiere_mantenimiento']
    list_filter = ['resultado', 'requiere_mantenimiento', 'requiere_recarga', 'requiere_reemplazo', 'activo']
    search_fields = ['codigo', 'inspector', 'observaciones_generales']
    ordering = ['-fecha_inspeccion']
    readonly_fields = ['creado_en', 'actualizado_en']
