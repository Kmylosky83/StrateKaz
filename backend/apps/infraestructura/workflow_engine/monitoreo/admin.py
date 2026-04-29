from django.contrib import admin
from .models import (
    MetricaFlujo,
    AlertaFlujo,
    ReglaSLA,
    DashboardWidget,
    ReporteAutomatico
)


@admin.register(MetricaFlujo)
class MetricaFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'plantilla',
        'periodo',
        'fecha_inicio',
        'fecha_fin',
        'total_instancias',
        'instancias_completadas',
        'tiempo_promedio_dias'
    ]
    list_filter = ['periodo', 'fecha_inicio', 'plantilla']
    search_fields = ['plantilla__nombre']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'fecha_inicio'
    
    fieldsets = (
        ('Información General', {
            'fields': ('plantilla', 'periodo', 'fecha_inicio', 'fecha_fin')
        }),
        ('Métricas de Instancias', {
            'fields': (
                'total_instancias',
                'instancias_completadas',
                'instancias_canceladas',
                'tiempo_promedio_dias'
            )
        }),
        ('Métricas de Tareas', {
            'fields': (
                'tareas_totales',
                'tareas_completadas',
                'tareas_rechazadas'
            )
        }),
        ('Análisis', {
            'fields': ('cuellos_botella',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AlertaFlujo)
class AlertaFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'titulo',
        'tipo',
        'severidad',
        'estado',
        'instancia',
        'fecha_generacion',
        'atendida_por'
    ]
    list_filter = ['tipo', 'severidad', 'estado', 'fecha_generacion']
    search_fields = ['titulo', 'descripcion', 'instancia__nombre']
    readonly_fields = ['fecha_generacion']
    date_hierarchy = 'fecha_generacion'
    
    fieldsets = (
        ('Información General', {
            'fields': ('tipo', 'severidad', 'titulo', 'descripcion')
        }),
        ('Relaciones', {
            'fields': ('instancia', 'tarea')
        }),
        ('Atención', {
            'fields': (
                'estado',
                'fecha_atencion',
                'atendida_por',
                'acciones_tomadas'
            )
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'fecha_generacion'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReglaSLA)
class ReglaSLAAdmin(admin.ModelAdmin):
    list_display = [
        'nombre',
        'plantilla',
        'nodo',
        'tiempo_limite_horas',
        'tiempo_alerta_horas',
        'accion_vencimiento',
        'is_active'
    ]
    list_filter = ['is_active', 'accion_vencimiento', 'plantilla']
    search_fields = ['nombre', 'plantilla__nombre']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'plantilla', 'nodo', 'is_active')
        }),
        ('Configuración de Tiempos', {
            'fields': ('tiempo_limite_horas', 'tiempo_alerta_horas')
        }),
        ('Acciones', {
            'fields': ('accion_vencimiento', 'destinatarios_alerta')
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = [
        'titulo',
        'usuario',
        'tipo_widget',
        'posicion_x',
        'posicion_y',
        'ancho',
        'alto',
        'is_visible'
    ]
    list_filter = ['tipo_widget', 'is_visible', 'usuario']
    search_fields = ['titulo', 'usuario__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información General', {
            'fields': ('usuario', 'tipo_widget', 'titulo', 'is_visible')
        }),
        ('Configuración', {
            'fields': ('configuracion',)
        }),
        ('Posición y Tamaño', {
            'fields': (
                ('posicion_x', 'posicion_y'),
                ('ancho', 'alto')
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReporteAutomatico)
class ReporteAutomaticoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre',
        'frecuencia',
        'formato',
        'ultimo_envio',
        'proximo_envio',
        'is_active'
    ]
    list_filter = ['frecuencia', 'formato', 'is_active']
    search_fields = ['nombre', 'descripcion']
    filter_horizontal = ['plantillas_incluidas']
    readonly_fields = ['ultimo_envio', 'created_at', 'updated_at']
    date_hierarchy = 'proximo_envio'
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'descripcion', 'is_active')
        }),
        ('Configuración', {
            'fields': (
                'plantillas_incluidas',
                'frecuencia',
                'formato',
                'destinatarios'
            )
        }),
        ('Programación', {
            'fields': ('ultimo_envio', 'proximo_envio')
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
