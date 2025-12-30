"""
Admin para Programación de Abastecimiento - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from apps.supply_chain.catalogos.models import UnidadMedida
from .models import (
    # Catálogos dinámicos
    TipoOperacion,
    EstadoProgramacion,
    EstadoEjecucion,
    EstadoLiquidacion,
    # Modelos principales
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)


# ==============================================================================
# ADMIN DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@admin.register(TipoOperacion)
class TipoOperacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'requiere_vehiculo', 'requiere_conductor', 'orden', 'is_active']
    list_filter = ['is_active', 'requiere_vehiculo', 'requiere_conductor']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


@admin.register(EstadoProgramacion)
class EstadoProgramacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'es_estado_inicial', 'es_estado_final', 'orden', 'is_active']
    list_filter = ['is_active', 'es_estado_inicial', 'es_estado_final']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


# UnidadMedida se administra desde catalogos.admin


@admin.register(EstadoEjecucion)
class EstadoEjecucionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'es_estado_inicial', 'es_estado_final', 'orden', 'is_active']
    list_filter = ['is_active', 'es_estado_inicial', 'es_estado_final']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


@admin.register(EstadoLiquidacion)
class EstadoLiquidacionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'permite_edicion', 'es_estado_inicial', 'es_estado_final', 'orden', 'is_active']
    list_filter = ['is_active', 'permite_edicion', 'es_estado_inicial', 'es_estado_final']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


# ==============================================================================
# ADMIN DE MODELOS PRINCIPALES
# ==============================================================================

@admin.register(Programacion)
class ProgramacionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'fecha_programada', 'tipo_operacion', 'proveedor',
        'sede', 'responsable', 'estado', 'created_at'
    ]
    list_filter = ['estado', 'tipo_operacion', 'sede', 'fecha_programada']
    search_fields = ['codigo', 'proveedor__nombre_comercial', 'observaciones']
    readonly_fields = ['codigo', 'created_at', 'updated_at', 'deleted_at']
    ordering = ['-fecha_programada', '-created_at']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'empresa', 'sede')
        }),
        ('Operación', {
            'fields': ('tipo_operacion', 'fecha_programada', 'fecha_ejecucion')
        }),
        ('Proveedor y Responsable', {
            'fields': ('proveedor', 'responsable')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AsignacionRecurso)
class AsignacionRecursoAdmin(admin.ModelAdmin):
    list_display = ['programacion', 'vehiculo', 'conductor', 'fecha_asignacion', 'asignado_por']
    list_filter = ['fecha_asignacion']
    search_fields = ['programacion__codigo', 'vehiculo', 'conductor__first_name', 'conductor__last_name']
    readonly_fields = ['fecha_asignacion', 'created_at', 'updated_at']
    ordering = ['-fecha_asignacion']


@admin.register(Ejecucion)
class EjecucionAdmin(admin.ModelAdmin):
    list_display = [
        'programacion', 'fecha_inicio', 'fecha_fin', 'cantidad_recolectada',
        'unidad_medida', 'estado', 'ejecutado_por'
    ]
    list_filter = ['estado', 'unidad_medida', 'fecha_inicio']
    search_fields = ['programacion__codigo', 'observaciones']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-fecha_inicio']

    fieldsets = (
        ('Programación', {
            'fields': ('programacion',)
        }),
        ('Ejecución', {
            'fields': (
                'fecha_inicio', 'fecha_fin', 'kilometraje_inicial',
                'kilometraje_final'
            )
        }),
        ('Cantidad Recolectada', {
            'fields': ('cantidad_recolectada', 'unidad_medida')
        }),
        ('Estado y Responsable', {
            'fields': ('estado', 'ejecutado_por')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Liquidacion)
class LiquidacionAdmin(admin.ModelAdmin):
    list_display = [
        'ejecucion', 'fecha_liquidacion', 'precio_unitario', 'cantidad',
        'subtotal', 'valor_total', 'estado', 'aprobado_por'
    ]
    list_filter = ['estado', 'fecha_liquidacion', 'genera_cxp']
    search_fields = ['ejecucion__programacion__codigo', 'numero_cxp', 'observaciones']
    readonly_fields = ['fecha_liquidacion', 'subtotal', 'valor_total', 'created_at', 'updated_at']
    ordering = ['-fecha_liquidacion']

    fieldsets = (
        ('Ejecución', {
            'fields': ('ejecucion',)
        }),
        ('Datos de Liquidación', {
            'fields': ('precio_unitario', 'cantidad', 'subtotal')
        }),
        ('Deducciones', {
            'fields': ('deducciones', 'detalle_deducciones')
        }),
        ('Total', {
            'fields': ('valor_total',)
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Responsables', {
            'fields': ('liquidado_por', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Integración Contable', {
            'fields': ('genera_cxp', 'numero_cxp')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('fecha_liquidacion', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
