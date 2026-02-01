"""
Admin para Análisis de Tendencias - Analytics
"""
from django.contrib import admin
from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada


@admin.register(AnalisisKPI)
class AnalisisKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'periodo_analisis', 'tipo_analisis', 'direccion', 'variacion_porcentual', 'is_active']
    list_filter = ['tipo_analisis', 'direccion', 'is_active', 'periodo_analisis']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'observaciones']
    ordering = ['-periodo_analisis']
    readonly_fields = ['variacion_absoluta', 'variacion_porcentual', 'direccion', 'created_at', 'updated_at']
    fieldsets = (
        ('Información General', {
            'fields': ('kpi', 'periodo_analisis', 'tipo_analisis', 'is_active')
        }),
        ('Valores', {
            'fields': ('valor_actual', 'valor_comparacion', 'variacion_absoluta', 'variacion_porcentual', 'direccion')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TendenciaKPI)
class TendenciaKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'periodo_inicio', 'periodo_fin', 'tipo_tendencia', 'r_cuadrado', 'is_active']
    list_filter = ['tipo_tendencia', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    ordering = ['-periodo_fin']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Información General', {
            'fields': ('kpi', 'periodo_inicio', 'periodo_fin', 'tipo_tendencia', 'is_active')
        }),
        ('Análisis Estadístico', {
            'fields': ('coeficiente_correlacion', 'r_cuadrado', 'pendiente', 'intercepto')
        }),
        ('Proyecciones', {
            'fields': ('proyeccion_3_meses', 'proyeccion_6_meses', 'proyeccion_12_meses')
        }),
        ('Datos', {
            'fields': ('datos_historicos',)
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AnomaliaDetectada)
class AnomaliaDetectadaAdmin(admin.ModelAdmin):
    list_display = [
        'valor_kpi', 'tipo_anomalia', 'severidad', 'fecha_deteccion',
        'esta_revisada', 'es_falso_positivo', 'is_active'
    ]
    list_filter = ['tipo_anomalia', 'severidad', 'esta_revisada', 'es_falso_positivo', 'is_active']
    search_fields = ['valor_kpi__kpi__codigo', 'valor_kpi__kpi__nombre', 'accion_tomada']
    ordering = ['-fecha_deteccion', '-severidad']
    readonly_fields = ['fecha_deteccion', 'created_at', 'updated_at']
    fieldsets = (
        ('Información General', {
            'fields': ('valor_kpi', 'tipo_anomalia', 'severidad', 'fecha_deteccion', 'is_active')
        }),
        ('Valores', {
            'fields': ('valor_detectado', 'valor_esperado', 'desviacion_std')
        }),
        ('Revisión', {
            'fields': ('esta_revisada', 'fecha_revision', 'usuario_revision', 'accion_tomada', 'es_falso_positivo')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
