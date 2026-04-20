"""
Admin para el módulo de Organización
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import Area
from .models_caracterizacion import CaracterizacionProceso
from .models_consecutivos import ConsecutivoConfig


@admin.register(CaracterizacionProceso)
class CaracterizacionProcesoAdmin(admin.ModelAdmin):
    list_display = ['area', 'estado', 'version', 'lider_proceso', 'is_active', 'created_at']
    list_filter = ['estado', 'is_active']
    search_fields = ['area__name', 'area__code', 'objetivo']
    raw_id_fields = ['area', 'lider_proceso', 'created_by']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'parent', 'cost_center', 'manager', 'is_active', 'orden']
    list_filter = ['is_active', 'parent']
    search_fields = ['code', 'name', 'description', 'cost_center']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['parent', 'manager', 'created_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Jerarquía', {
            'fields': ('parent', 'orden')
        }),
        ('Apariencia', {
            'fields': ('icon', 'color')
        }),
        ('Gestión', {
            'fields': ('cost_center', 'manager', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ConsecutivoConfig)
class ConsecutivoConfigAdmin(admin.ModelAdmin):
    """Admin para configuración de consecutivos"""
    list_display = ['codigo', 'nombre', 'categoria', 'current_number', 'es_sistema', 'is_active']
    list_filter = ['categoria', 'es_sistema', 'is_active', 'reset_yearly', 'reset_monthly']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['categoria', 'codigo']
    list_editable = ['is_active']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'descripcion', 'categoria')
        }),
        ('Formato', {
            'fields': ('prefix', 'suffix', 'padding', 'include_year', 'include_month', 'include_day', 'separator')
        }),
        ('Numeración', {
            'fields': ('current_number', 'numero_inicial', 'reset_yearly', 'reset_monthly', 'last_reset_date')
        }),
        ('Metadatos', {
            'fields': ('es_sistema', 'is_active')
        }),
    )


# UnidadMedidaAdmin: administrado exclusivamente desde catalogo_productos
# (source-of-truth unico CT-layer post-consolidacion S7).
