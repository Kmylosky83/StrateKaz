"""Admin para Acciones por Indicador"""
from django.contrib import admin
from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva

@admin.register(PlanAccionKPI)
class PlanAccionKPIAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'kpi', 'estado', 'prioridad', 'fecha_meta', 'is_active']
    list_filter = ['estado', 'prioridad', 'is_active']
    search_fields = ['nombre', 'objetivo']
    ordering = ['-prioridad', 'fecha_meta']

@admin.register(ActividadPlanKPI)
class ActividadPlanKPIAdmin(admin.ModelAdmin):
    list_display = ['plan', 'numero_actividad', 'estado', 'porcentaje_avance', 'is_active']
    list_filter = ['estado', 'is_active']
    ordering = ['plan', 'numero_actividad']

@admin.register(SeguimientoPlanKPI)
class SeguimientoPlanKPIAdmin(admin.ModelAdmin):
    list_display = ['plan', 'fecha_seguimiento', 'avance_general', 'is_active']
    list_filter = ['is_active']
    ordering = ['-fecha_seguimiento']

@admin.register(IntegracionAccionCorrectiva)
class IntegracionAccionCorrectivaAdmin(admin.ModelAdmin):
    list_display = ['plan_kpi', 'accion_correctiva', 'tipo_vinculo', 'is_active']
    list_filter = ['tipo_vinculo', 'is_active']
    ordering = ['-fecha_vinculacion']
