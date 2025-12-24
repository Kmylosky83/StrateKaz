from django.contrib import admin
from .models import FactorExterno, FactorInterno, AnalisisDOFA, EstrategiaDOFA


@admin.register(FactorExterno)
class FactorExternoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tipo', 'descripcion_corta', 'impacto', 'probabilidad',
        'relevancia', 'is_active', 'empresa_id', 'created_at'
    ]
    list_filter = ['tipo', 'impacto', 'probabilidad', 'relevancia', 'is_active']
    search_fields = ['descripcion']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    fieldsets = (
        ('Información General', {
            'fields': ('tipo', 'descripcion', 'empresa_id')
        }),
        ('Evaluación', {
            'fields': ('impacto', 'probabilidad', 'relevancia', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(FactorInterno)
class FactorInternoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tipo', 'descripcion_corta', 'area_afectada', 'relevancia',
        'is_active', 'empresa_id', 'created_at'
    ]
    list_filter = ['tipo', 'relevancia', 'is_active']
    search_fields = ['descripcion', 'area_afectada']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    fieldsets = (
        ('Información General', {
            'fields': ('tipo', 'descripcion', 'area_afectada', 'empresa_id')
        }),
        ('Evaluación', {
            'fields': ('impacto', 'relevancia', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(AnalisisDOFA)
class AnalisisDOFAAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'periodo', 'fecha_analisis', 'empresa_id', 'elaborado_por',
        'aprobado_por', 'created_at'
    ]
    list_filter = ['fecha_analisis', 'periodo']
    search_fields = ['periodo', 'conclusiones']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información General', {
            'fields': ('periodo', 'fecha_analisis', 'empresa_id')
        }),
        ('Análisis DOFA', {
            'fields': ('fortalezas', 'debilidades', 'oportunidades', 'amenazas', 'conclusiones')
        }),
        ('Responsables', {
            'fields': ('elaborado_por', 'aprobado_por')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EstrategiaDOFA)
class EstrategiaDOFAAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'tipo', 'descripcion_corta', 'prioridad', 'estado',
        'responsable', 'fecha_limite', 'empresa_id', 'created_at'
    ]
    list_filter = ['tipo', 'estado', 'prioridad', 'fecha_limite']
    search_fields = ['descripcion', 'objetivo']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    
    fieldsets = (
        ('Información General', {
            'fields': ('analisis_dofa', 'tipo', 'descripcion', 'objetivo', 'empresa_id')
        }),
        ('Planificación', {
            'fields': ('responsable', 'fecha_limite', 'prioridad', 'estado')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'
