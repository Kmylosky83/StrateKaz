"""
Admin para Desempeño - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from .models import (
    CicloEvaluacion, CompetenciaEvaluacion, CriterioEvaluacion, EscalaCalificacion,
    EvaluacionDesempeno, DetalleEvaluacion, EvaluadorPar,
    PlanMejora, ActividadPlanMejora, SeguimientoPlanMejora,
    TipoReconocimiento, Reconocimiento, MuroReconocimientos,
)


# =============================================================================
# CONFIGURACIÓN DE EVALUACIÓN
# =============================================================================

class EscalaCalificacionInline(admin.TabularInline):
    model = EscalaCalificacion
    extra = 0
    fields = ['valor', 'etiqueta', 'descripcion', 'color']


@admin.register(CicloEvaluacion)
class CicloEvaluacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_ciclo', 'anio', 'periodo', 'fecha_inicio', 'fecha_fin', 'estado', 'is_active']
    list_filter = ['tipo_ciclo', 'anio', 'estado', 'is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['-anio', '-periodo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_inicio'
    inlines = [EscalaCalificacionInline]
    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'tipo_ciclo', 'anio', 'periodo')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin', 'fecha_inicio_evaluacion', 'fecha_fin_evaluacion', 'fecha_revision', 'fecha_cierre')
        }),
        ('Configuración de Evaluación', {
            'fields': ('incluye_autoevaluacion', 'incluye_evaluacion_jefe', 'incluye_evaluacion_pares', 'incluye_evaluacion_subordinados', 'numero_pares_requeridos')
        }),
        ('Pesos', {
            'fields': ('peso_autoevaluacion', 'peso_evaluacion_jefe', 'peso_evaluacion_pares', 'peso_evaluacion_subordinados')
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


class CriterioEvaluacionInline(admin.TabularInline):
    model = CriterioEvaluacion
    extra = 0
    fields = ['descripcion', 'peso', 'orden']


@admin.register(CompetenciaEvaluacion)
class CompetenciaEvaluacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_competencia', 'nivel_esperado', 'peso', 'orden', 'aplica_a_todos', 'is_active']
    list_filter = ['tipo_competencia', 'nivel_esperado', 'aplica_a_todos', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    filter_horizontal = ['cargos_aplicables']
    inlines = [CriterioEvaluacionInline]


# =============================================================================
# EVALUACIÓN DE DESEMPEÑO
# =============================================================================

class DetalleEvaluacionInline(admin.TabularInline):
    model = DetalleEvaluacion
    extra = 0
    fields = ['competencia', 'criterio', 'tipo_evaluador', 'calificacion', 'comentario']
    raw_id_fields = ['competencia', 'criterio', 'evaluador']
    readonly_fields = ['fecha_evaluacion']


class EvaluadorParInline(admin.TabularInline):
    model = EvaluadorPar
    extra = 0
    fields = ['evaluador', 'es_subordinado', 'fecha_limite', 'estado', 'calificacion_otorgada']
    raw_id_fields = ['evaluador']
    readonly_fields = ['fecha_asignacion', 'fecha_evaluacion']


@admin.register(EvaluacionDesempeno)
class EvaluacionDesempenoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'ciclo', 'jefe_evaluador', 'estado', 'calificacion_final', 'calificacion_calibrada', 'firma_colaborador']
    list_filter = ['ciclo', 'estado', 'firma_colaborador']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'ciclo__codigo']
    ordering = ['-ciclo__anio', 'colaborador']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by', 'fecha_asignacion']
    raw_id_fields = ['ciclo', 'colaborador', 'jefe_evaluador', 'calibrado_por']
    inlines = [DetalleEvaluacionInline, EvaluadorParInline]
    fieldsets = (
        ('Información General', {
            'fields': ('ciclo', 'colaborador', 'jefe_evaluador', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_asignacion', 'fecha_inicio_autoevaluacion', 'fecha_fin_autoevaluacion', 'fecha_evaluacion_jefe', 'fecha_revision', 'fecha_retroalimentacion', 'fecha_cierre')
        }),
        ('Calificaciones', {
            'fields': ('calificacion_autoevaluacion', 'calificacion_jefe', 'calificacion_pares', 'calificacion_subordinados', 'calificacion_final')
        }),
        ('Calibración', {
            'fields': ('calificacion_calibrada', 'motivo_calibracion', 'calibrado_por')
        }),
        ('Retroalimentación', {
            'fields': ('fortalezas', 'areas_mejora', 'compromisos', 'comentarios_colaborador', 'firma_colaborador', 'fecha_firma_colaborador')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# PLAN DE MEJORA
# =============================================================================

class ActividadPlanMejoraInline(admin.TabularInline):
    model = ActividadPlanMejora
    extra = 0
    fields = ['tipo_actividad', 'descripcion', 'fecha_inicio', 'fecha_fin', 'responsable', 'prioridad', 'estado']
    raw_id_fields = ['responsable']


class SeguimientoPlanMejoraInline(admin.TabularInline):
    model = SeguimientoPlanMejora
    extra = 0
    fields = ['fecha_seguimiento', 'realizado_por', 'porcentaje_avance', 'logros', 'dificultades']
    raw_id_fields = ['realizado_por']
    readonly_fields = ['created_at']


@admin.register(PlanMejora)
class PlanMejoraAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'colaborador', 'tipo_plan', 'fecha_inicio', 'fecha_fin', 'estado', 'porcentaje_avance']
    list_filter = ['tipo_plan', 'estado']
    search_fields = ['codigo', 'titulo', 'colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-fecha_inicio']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['evaluacion', 'colaborador', 'responsable', 'aprobado_por']
    date_hierarchy = 'fecha_inicio'
    inlines = [ActividadPlanMejoraInline, SeguimientoPlanMejoraInline]


# =============================================================================
# RECONOCIMIENTOS
# =============================================================================

@admin.register(TipoReconocimiento)
class TipoReconocimientoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'puntos_otorgados', 'tiene_premio', 'valor_premio', 'orden', 'is_active']
    list_filter = ['categoria', 'tiene_premio', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(Reconocimiento)
class ReconocimientoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_reconocimiento', 'fecha_reconocimiento', 'nominado_por', 'estado', 'puntos_otorgados', 'publicado_en_muro']
    list_filter = ['tipo_reconocimiento', 'estado', 'publicado_en_muro']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'motivo']
    ordering = ['-fecha_reconocimiento']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['colaborador', 'tipo_reconocimiento', 'evaluacion', 'nominado_por', 'aprobado_por']
    date_hierarchy = 'fecha_reconocimiento'
    fieldsets = (
        ('Información General', {
            'fields': ('colaborador', 'tipo_reconocimiento', 'evaluacion', 'fecha_reconocimiento')
        }),
        ('Detalle', {
            'fields': ('motivo', 'logro_especifico')
        }),
        ('Flujo de Aprobación', {
            'fields': ('nominado_por', 'aprobado_por', 'fecha_aprobacion', 'estado')
        }),
        ('Entrega', {
            'fields': ('puntos_otorgados', 'premio_entregado', 'fecha_entrega_premio')
        }),
        ('Publicación', {
            'fields': ('es_publico', 'publicado_en_muro', 'fecha_publicacion')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MuroReconocimientos)
class MuroReconocimientosAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'get_colaborador', 'fecha_publicacion', 'likes', 'comentarios_count', 'es_destacado']
    list_filter = ['es_destacado', 'fecha_publicacion']
    search_fields = ['titulo', 'mensaje']
    ordering = ['-fecha_publicacion']
    readonly_fields = ['created_at', 'updated_at', 'fecha_publicacion', 'likes', 'comentarios_count']
    raw_id_fields = ['reconocimiento']

    @admin.display(description='Colaborador')
    def get_colaborador(self, obj):
        return obj.reconocimiento.colaborador.get_nombre_corto() if obj.reconocimiento else '-'
