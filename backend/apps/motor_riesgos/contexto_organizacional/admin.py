"""
Admin para Contexto Organizacional - Motor de Riesgos
=====================================================

Configuración del admin Django para los modelos de contexto organizacional.
"""
from django.contrib import admin
from .models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter
)


class FactorDOFAInline(admin.TabularInline):
    """Inline para factores DOFA dentro de un análisis."""
    model = FactorDOFA
    extra = 1
    fields = ['tipo', 'descripcion', 'impacto', 'area_afectada', 'orden']


class EstrategiaTOWSInline(admin.TabularInline):
    """Inline para estrategias TOWS dentro de un análisis."""
    model = EstrategiaTOWS
    extra = 1
    fields = ['tipo', 'descripcion', 'prioridad', 'estado', 'responsable']


@admin.register(AnalisisDOFA)
class AnalisisDOFAAdmin(admin.ModelAdmin):
    """Admin para Análisis DOFA."""
    list_display = [
        'id', 'nombre', 'periodo', 'fecha_analisis', 'estado',
        'responsable', 'empresa', 'created_at'
    ]
    list_filter = ['estado', 'fecha_analisis', 'periodo']
    search_fields = ['nombre', 'periodo', 'observaciones']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_analisis'
    inlines = [FactorDOFAInline, EstrategiaTOWSInline]

    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'periodo', 'fecha_analisis', 'empresa')
        }),
        ('Estado y Responsables', {
            'fields': ('estado', 'responsable', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FactorDOFA)
class FactorDOFAAdmin(admin.ModelAdmin):
    """Admin para Factores DOFA individuales."""
    list_display = [
        'id', 'analisis', 'tipo', 'descripcion_corta', 'impacto',
        'area_afectada', 'orden', 'empresa', 'created_at'
    ]
    list_filter = ['tipo', 'impacto', 'is_active']
    search_fields = ['descripcion', 'area_afectada', 'evidencias']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('analisis', 'tipo', 'descripcion', 'empresa')
        }),
        ('Evaluación', {
            'fields': ('area_afectada', 'impacto', 'evidencias', 'orden')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(EstrategiaTOWS)
class EstrategiaTOWSAdmin(admin.ModelAdmin):
    """Admin para Estrategias TOWS."""
    list_display = [
        'id', 'analisis', 'tipo', 'descripcion_corta', 'prioridad', 'estado',
        'responsable', 'fecha_limite', 'progreso_porcentaje', 'empresa'
    ]
    list_filter = ['tipo', 'estado', 'prioridad', 'fecha_limite']
    search_fields = ['descripcion', 'objetivo', 'recursos_necesarios']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_limite'

    fieldsets = (
        ('Información General', {
            'fields': ('analisis', 'tipo', 'descripcion', 'objetivo', 'empresa')
        }),
        ('Planificación', {
            'fields': ('responsable', 'fecha_implementacion', 'fecha_limite', 'prioridad', 'estado', 'progreso_porcentaje')
        }),
        ('Recursos', {
            'fields': ('recursos_necesarios', 'indicadores_exito')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


class FactorPESTELInline(admin.TabularInline):
    """Inline para factores PESTEL dentro de un análisis."""
    model = FactorPESTEL
    extra = 1
    fields = ['tipo', 'descripcion', 'tendencia', 'impacto', 'probabilidad', 'orden']


@admin.register(AnalisisPESTEL)
class AnalisisPESTELAdmin(admin.ModelAdmin):
    """Admin para Análisis PESTEL."""
    list_display = [
        'id', 'nombre', 'periodo', 'fecha_analisis', 'estado',
        'responsable', 'empresa', 'created_at'
    ]
    list_filter = ['estado', 'fecha_analisis', 'periodo']
    search_fields = ['nombre', 'periodo', 'conclusiones']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_analisis'
    inlines = [FactorPESTELInline]

    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'periodo', 'fecha_analisis', 'empresa')
        }),
        ('Estado y Responsables', {
            'fields': ('estado', 'responsable')
        }),
        ('Conclusiones', {
            'fields': ('conclusiones',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FactorPESTEL)
class FactorPESTELAdmin(admin.ModelAdmin):
    """Admin para Factores PESTEL individuales."""
    list_display = [
        'id', 'analisis', 'tipo', 'descripcion_corta', 'tendencia',
        'impacto', 'probabilidad', 'orden', 'empresa'
    ]
    list_filter = ['tipo', 'tendencia', 'impacto', 'probabilidad', 'is_active']
    search_fields = ['descripcion', 'implicaciones', 'fuentes']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('analisis', 'tipo', 'descripcion', 'empresa')
        }),
        ('Evaluación', {
            'fields': ('tendencia', 'impacto', 'probabilidad', 'orden')
        }),
        ('Análisis', {
            'fields': ('implicaciones', 'fuentes')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(FuerzaPorter)
class FuerzaPorterAdmin(admin.ModelAdmin):
    """Admin para Fuerzas de Porter."""
    list_display = [
        'id', 'tipo', 'nivel', 'descripcion_corta', 'periodo',
        'fecha_analisis', 'empresa', 'created_at'
    ]
    list_filter = ['tipo', 'nivel', 'periodo', 'fecha_analisis']
    search_fields = ['descripcion', 'implicaciones_estrategicas']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_analisis'

    fieldsets = (
        ('Información General', {
            'fields': ('tipo', 'periodo', 'fecha_analisis', 'empresa')
        }),
        ('Análisis', {
            'fields': ('nivel', 'descripcion', 'factores', 'implicaciones_estrategicas')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'
