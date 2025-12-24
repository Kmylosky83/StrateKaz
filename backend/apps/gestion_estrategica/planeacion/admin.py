"""
Admin del módulo Planeación Estratégica - Dirección Estratégica
"""
from django.contrib import admin
from .models import StrategicPlan, StrategicObjective


class StrategicObjectiveInline(admin.TabularInline):
    """Inline para objetivos estratégicos"""
    model = StrategicObjective
    extra = 0
    fields = [
        'code', 'name', 'bsc_perspective',
        'progress', 'status', 'is_active'
    ]
    readonly_fields = ['progress']
    show_change_link = True


@admin.register(StrategicPlan)
class StrategicPlanAdmin(admin.ModelAdmin):
    """Admin para Plan Estratégico"""

    list_display = [
        'name', 'period_type', 'start_date', 'end_date',
        'is_active', 'progress', 'approved_by', 'created_at'
    ]
    list_filter = ['is_active', 'period_type', 'approved_by']
    search_fields = ['name', 'description']
    readonly_fields = [
        'approved_by', 'approved_at',
        'created_by', 'created_at', 'updated_at'
    ]
    inlines = [StrategicObjectiveInline]
    date_hierarchy = 'start_date'

    fieldsets = (
        ('Información General', {
            'fields': (
                'name', 'description', 'period_type',
                'start_date', 'end_date', 'is_active'
            )
        }),
        ('Mapa Estratégico', {
            'fields': ('strategic_map_image', 'strategic_map_description'),
            'classes': ('collapse',)
        }),
        ('Aprobación', {
            'fields': ('approved_by', 'approved_at'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def progress(self, obj):
        return f"{obj.progress}%"
    progress.short_description = 'Progreso'


@admin.register(StrategicObjective)
class StrategicObjectiveAdmin(admin.ModelAdmin):
    """Admin para Objetivos Estratégicos"""

    list_display = [
        'code', 'name', 'plan', 'bsc_perspective',
        'progress', 'status', 'responsible', 'is_active'
    ]
    list_filter = [
        'plan', 'bsc_perspective', 'status',
        'is_active', 'responsible_cargo'
    ]
    search_fields = ['code', 'name', 'description']
    readonly_fields = [
        'progress', 'completed_at',
        'created_by', 'created_at', 'updated_at'
    ]
    autocomplete_fields = ['responsible', 'responsible_cargo']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Identificación', {
            'fields': ('plan', 'code', 'name', 'description', 'order', 'is_active')
        }),
        ('Clasificación', {
            'fields': ('bsc_perspective', 'iso_standards')
        }),
        ('Responsabilidad', {
            'fields': ('responsible', 'responsible_cargo')
        }),
        ('Medición', {
            'fields': (
                'target_value', 'current_value', 'unit',
                'progress', 'status'
            )
        }),
        ('Fechas', {
            'fields': ('start_date', 'due_date', 'completed_at')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
