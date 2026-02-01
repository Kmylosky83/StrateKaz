"""
Admin para Presupuesto - Admin Finance
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import (
    CentroCosto, Rubro, PresupuestoPorArea,
    Aprobacion, Ejecucion
)


@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    """Admin para Centro de Costo."""
    list_display = [
        'codigo', 'nombre', 'area', 'responsable', 'estado', 'is_active'
    ]
    list_filter = ['estado', 'is_active', 'area']
    search_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'area', 'responsable', 'estado')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Rubro)
class RubroAdmin(admin.ModelAdmin):
    """Admin para Rubro Presupuestal."""
    list_display = [
        'codigo', 'nombre', 'tipo', 'categoria', 'rubro_padre', 'is_active'
    ]
    list_filter = ['tipo', 'categoria', 'is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['tipo', 'codigo']
    readonly_fields = ['codigo', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'tipo', 'categoria', 'descripcion')
        }),
        ('Jerarquía', {
            'fields': ('rubro_padre',)
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PresupuestoPorArea)
class PresupuestoPorAreaAdmin(admin.ModelAdmin):
    """Admin para Presupuesto Por Área."""
    list_display = [
        'codigo', 'area', 'centro_costo', 'rubro', 'anio',
        'monto_asignado', 'monto_ejecutado', 'estado', 'is_active'
    ]
    list_filter = ['estado', 'anio', 'area', 'is_active']
    search_fields = ['codigo']
    ordering = ['-anio', 'area']
    readonly_fields = [
        'codigo', 'saldo_disponible', 'porcentaje_ejecucion',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'area', 'centro_costo', 'rubro', 'anio')
        }),
        ('Montos', {
            'fields': (
                'monto_asignado', 'monto_ejecutado',
                'saldo_disponible', 'porcentaje_ejecucion'
            )
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def saldo_disponible(self, obj):
        """Mostrar saldo disponible."""
        return f"${obj.saldo_disponible:,.2f}"
    saldo_disponible.short_description = 'Saldo Disponible'

    def porcentaje_ejecucion(self, obj):
        """Mostrar porcentaje de ejecución."""
        return f"{obj.porcentaje_ejecucion:.2f}%"
    porcentaje_ejecucion.short_description = '% Ejecución'


@admin.register(Aprobacion)
class AprobacionAdmin(admin.ModelAdmin):
    """Admin para Aprobación de Presupuesto."""
    list_display = [
        'presupuesto', 'nivel_aprobacion', 'orden', 'estado',
        'aprobado_por', 'fecha_aprobacion', 'is_active'
    ]
    list_filter = ['estado', 'nivel_aprobacion', 'is_active']
    search_fields = ['presupuesto__codigo']
    ordering = ['presupuesto', 'orden']
    readonly_fields = [
        'aprobado_por', 'fecha_aprobacion',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Presupuesto', {
            'fields': ('presupuesto',)
        }),
        ('Aprobación', {
            'fields': ('nivel_aprobacion', 'orden', 'estado')
        }),
        ('Resultado', {
            'fields': ('aprobado_por', 'fecha_aprobacion', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Ejecucion)
class EjecucionAdmin(admin.ModelAdmin):
    """Admin para Ejecución Presupuestal."""
    list_display = [
        'codigo', 'presupuesto', 'fecha', 'monto',
        'concepto', 'estado', 'is_active'
    ]
    list_filter = ['estado', 'fecha', 'is_active']
    search_fields = ['codigo', 'concepto', 'numero_documento']
    ordering = ['-fecha', '-created_at']
    readonly_fields = ['codigo', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'presupuesto', 'fecha', 'monto', 'concepto')
        }),
        ('Documento Soporte', {
            'fields': ('documento_soporte', 'numero_documento')
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
