"""
Admin para Accidentalidad (ATEL) - HSEQ Management
"""
from django.contrib import admin
from .models import (
    AccidenteTrabajo,
    EnfermedadLaboral,
    IncidenteTrabajo,
    InvestigacionATEL,
    CausaRaiz,
    LeccionAprendida,
    PlanAccionATEL,
    AccionPlan
)


@admin.register(AccidenteTrabajo)
class AccidenteTrabajoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_at',
        'fecha_evento',
        'trabajador',
        'tipo_evento',
        'gravedad',
        'dias_incapacidad',
        'mortal',
        'reportado_arl'
    ]
    list_filter = ['gravedad', 'tipo_evento', 'mortal', 'reportado_arl', 'fecha_evento']
    search_fields = ['codigo_at', 'trabajador__first_name', 'trabajador__last_name', 'lugar_evento']
    date_hierarchy = 'fecha_evento'
    readonly_fields = ['codigo_at', 'fecha_reporte_interno', 'fecha_actualizacion']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo_at', 'empresa_id')
        }),
        ('Evento', {
            'fields': (
                'fecha_evento',
                'lugar_evento',
                'tipo_evento',
                'descripcion_evento',
                'testigos'
            )
        }),
        ('Trabajador', {
            'fields': ('trabajador', 'cargo_trabajador')
        }),
        ('Lesión', {
            'fields': (
                'tipo_lesion',
                'parte_cuerpo',
                'descripcion_lesion',
                'gravedad',
                'dias_incapacidad'
            )
        }),
        ('Mortalidad', {
            'fields': ('mortal', 'fecha_muerte'),
            'classes': ('collapse',)
        }),
        ('Atención Médica', {
            'fields': ('centro_atencion', 'diagnostico_medico')
        }),
        ('Reporte ARL', {
            'fields': (
                'reportado_arl',
                'fecha_reporte_arl',
                'numero_caso_arl',
                'calificacion_origen'
            )
        }),
        ('Investigación', {
            'fields': ('requiere_investigacion',)
        }),
        ('Auditoría', {
            'fields': (
                'reportado_por',
                'fecha_reporte_interno',
                'actualizado_por',
                'fecha_actualizacion'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(EnfermedadLaboral)
class EnfermedadLaboralAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_el',
        'fecha_diagnostico',
        'trabajador',
        'tipo_enfermedad',
        'estado_calificacion',
        'porcentaje_pcl'
    ]
    list_filter = ['tipo_enfermedad', 'estado_calificacion', 'reportado_arl']
    search_fields = ['codigo_el', 'trabajador__first_name', 'trabajador__last_name', 'diagnostico_cie10']
    date_hierarchy = 'fecha_diagnostico'
    readonly_fields = ['codigo_el', 'fecha_reporte_interno', 'fecha_actualizacion']


@admin.register(IncidenteTrabajo)
class IncidenteTrabajoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_incidente',
        'fecha_evento',
        'tipo_incidente',
        'potencial_gravedad',
        'hubo_danos_materiales',
        'reportado_por'
    ]
    list_filter = ['tipo_incidente', 'potencial_gravedad', 'hubo_danos_materiales']
    search_fields = ['codigo_incidente', 'lugar_evento', 'descripcion_evento']
    date_hierarchy = 'fecha_evento'
    readonly_fields = ['codigo_incidente', 'fecha_reporte', 'fecha_actualizacion']


@admin.register(InvestigacionATEL)
class InvestigacionATELAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_investigacion',
        'fecha_inicio',
        'lider_investigacion',
        'metodologia',
        'estado',
        'aprobada'
    ]
    list_filter = ['estado', 'metodologia', 'aprobada']
    search_fields = ['codigo_investigacion', 'descripcion_hechos']
    date_hierarchy = 'fecha_inicio'
    readonly_fields = ['codigo_investigacion', 'fecha_creacion', 'fecha_actualizacion']
    filter_horizontal = ['equipo_investigacion']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo_investigacion', 'empresa_id')
        }),
        ('Evento Relacionado', {
            'fields': ('accidente_trabajo', 'enfermedad_laboral', 'incidente_trabajo')
        }),
        ('Investigación', {
            'fields': (
                'metodologia',
                'lider_investigacion',
                'equipo_investigacion',
                'fecha_inicio',
                'fecha_limite',
                'fecha_completada',
                'estado'
            )
        }),
        ('Análisis', {
            'fields': ('descripcion_hechos', 'analisis_datos')
        }),
        ('Conclusiones', {
            'fields': ('conclusiones', 'recomendaciones')
        }),
        ('Aprobación', {
            'fields': ('aprobada', 'aprobada_por', 'fecha_aprobacion')
        }),
    )


@admin.register(CausaRaiz)
class CausaRaizAdmin(admin.ModelAdmin):
    list_display = ['investigacion', 'tipo_causa', 'prioridad', 'descripcion']
    list_filter = ['tipo_causa', 'prioridad']
    search_fields = ['descripcion', 'evidencia']
    ordering = ['investigacion', 'prioridad']


@admin.register(LeccionAprendida)
class LeccionAprendidaAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_leccion',
        'titulo',
        'categoria',
        'estado_divulgacion',
        'fecha_divulgacion'
    ]
    list_filter = ['categoria', 'estado_divulgacion']
    search_fields = ['codigo_leccion', 'titulo', 'situacion', 'leccion']
    readonly_fields = ['codigo_leccion', 'fecha_creacion', 'fecha_actualizacion']


@admin.register(PlanAccionATEL)
class PlanAccionATELAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_plan',
        'nombre_plan',
        'responsable',
        'fecha_inicio',
        'fecha_compromiso',
        'estado',
        'porcentaje_avance',
        'verificado'
    ]
    list_filter = ['estado', 'verificado']
    search_fields = ['codigo_plan', 'nombre_plan']
    date_hierarchy = 'fecha_inicio'
    readonly_fields = ['codigo_plan', 'fecha_creacion', 'fecha_actualizacion']


@admin.register(AccionPlan)
class AccionPlanAdmin(admin.ModelAdmin):
    list_display = [
        'plan_accion',
        'orden',
        'tipo_accion',
        'responsable',
        'fecha_compromiso',
        'estado',
        'verificado'
    ]
    list_filter = ['tipo_accion', 'estado', 'verificado']
    search_fields = ['descripcion']
    ordering = ['plan_accion', 'orden']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
