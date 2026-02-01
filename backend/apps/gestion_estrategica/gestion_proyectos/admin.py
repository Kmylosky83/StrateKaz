"""
Admin para Gestión de Proyectos (PMI)
"""
from django.contrib import admin
from .models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    InteresadoProyecto, FaseProyecto, ActividadProyecto,
    RecursoProyecto, RiesgoProyecto, SeguimientoProyecto,
    LeccionAprendida, ActaCierre
)


@admin.register(Portafolio)
class PortafolioAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'responsable', 'presupuesto_asignado', 'is_active']
    list_filter = ['is_active', 'empresa_id']
    search_fields = ['codigo', 'nombre']


@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'portafolio', 'responsable', 'is_active']
    list_filter = ['is_active', 'portafolio']
    search_fields = ['codigo', 'nombre']


class ProjectCharterInline(admin.StackedInline):
    model = ProjectCharter
    extra = 0


class FaseInline(admin.TabularInline):
    model = FaseProyecto
    extra = 0


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo', 'estado', 'prioridad',
        'gerente_proyecto', 'porcentaje_avance', 'is_active'
    ]
    list_filter = ['estado', 'tipo', 'prioridad', 'is_active', 'empresa_id']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['fecha_propuesta', 'created_at', 'updated_at']
    inlines = [ProjectCharterInline, FaseInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'tipo', 'programa')
        }),
        ('Estado y Prioridad', {
            'fields': ('estado', 'prioridad', 'porcentaje_avance')
        }),
        ('Fechas', {
            'fields': (
                ('fecha_inicio_plan', 'fecha_fin_plan'),
                ('fecha_inicio_real', 'fecha_fin_real'),
            )
        }),
        ('Presupuesto', {
            'fields': (
                ('presupuesto_estimado', 'presupuesto_aprobado'),
                'costo_real',
            )
        }),
        ('Responsables', {
            'fields': ('sponsor', 'gerente_proyecto')
        }),
        ('Justificación', {
            'fields': ('justificacion', 'beneficios_esperados')
        }),
        ('Auditoría', {
            'fields': ('is_active', 'empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InteresadoProyecto)
class InteresadoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'proyecto', 'nivel_influencia', 'nivel_interes', 'is_internal']
    list_filter = ['nivel_influencia', 'nivel_interes', 'is_internal']
    search_fields = ['nombre', 'cargo_rol']


@admin.register(ActividadProyecto)
class ActividadAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_wbs', 'nombre', 'proyecto', 'fase',
        'estado', 'responsable', 'porcentaje_avance'
    ]
    list_filter = ['estado', 'proyecto', 'fase']
    search_fields = ['codigo_wbs', 'nombre']


@admin.register(RecursoProyecto)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'proyecto', 'tipo', 'usuario', 'costo_total']
    list_filter = ['tipo', 'proyecto']


@admin.register(RiesgoProyecto)
class RiesgoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'proyecto', 'tipo', 'probabilidad',
        'impacto', 'estrategia', 'is_materializado'
    ]
    list_filter = ['tipo', 'probabilidad', 'impacto', 'is_materializado']
    search_fields = ['codigo', 'descripcion']


@admin.register(SeguimientoProyecto)
class SeguimientoAdmin(admin.ModelAdmin):
    list_display = [
        'proyecto', 'fecha', 'porcentaje_avance',
        'estado_general', 'registrado_por'
    ]
    list_filter = ['estado_general', 'proyecto']
    date_hierarchy = 'fecha'


@admin.register(LeccionAprendida)
class LeccionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'proyecto', 'tipo', 'registrado_por', 'fecha_registro']
    list_filter = ['tipo', 'proyecto']
    search_fields = ['titulo', 'recomendacion']


@admin.register(ActaCierre)
class ActaCierreAdmin(admin.ModelAdmin):
    list_display = [
        'proyecto', 'fecha_cierre', 'presupuesto_final',
        'costo_final', 'aprobado_por_sponsor'
    ]
    list_filter = ['aprobado_por_sponsor']
