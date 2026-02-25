"""
Admin para Recepción de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: Admin configurado para modelos de catálogo dinámicos.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from decimal import Decimal

from .models import (
    TipoRecepcion,
    EstadoRecepcion,
    PuntoRecepcion,
    Recepcion,
    DetalleRecepcion,
    ControlCalidadRecepcion,
)


# ==============================================================================
# ADMIN PARA CATÁLOGOS DINÁMICOS
# ==============================================================================

class CatalogoBaseAdmin(admin.ModelAdmin):
    """Admin base para catálogos dinámicos."""
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TipoRecepcion)
class TipoRecepcionAdmin(CatalogoBaseAdmin):
    """Admin para Tipos de Recepción."""
    list_display = [
        'codigo', 'nombre', 'requiere_pesaje', 'requiere_acidez',
        'requiere_temperatura', 'requiere_control_calidad',
        'orden', 'is_active'
    ]
    list_filter = [
        'is_active', 'requiere_pesaje', 'requiere_acidez',
        'requiere_temperatura', 'requiere_control_calidad'
    ]
    list_editable = [
        'requiere_pesaje', 'requiere_acidez', 'requiere_temperatura',
        'requiere_control_calidad', 'orden', 'is_active'
    ]
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden')
        }),
        ('Controles Requeridos', {
            'fields': (
                'requiere_pesaje', 'requiere_acidez',
                'requiere_temperatura', 'requiere_control_calidad'
            )
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EstadoRecepcion)
class EstadoRecepcionAdmin(CatalogoBaseAdmin):
    """Admin para Estados de Recepción."""
    list_display = [
        'codigo', 'nombre', 'color_badge', 'es_inicial', 'es_final',
        'permite_edicion', 'genera_inventario', 'orden', 'is_active'
    ]
    list_filter = [
        'is_active', 'es_inicial', 'es_final',
        'permite_edicion', 'genera_inventario'
    ]
    list_editable = [
        'es_inicial', 'es_final', 'permite_edicion',
        'genera_inventario', 'orden', 'is_active'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color', 'orden')
        }),
        ('Configuración de Flujo', {
            'fields': (
                'es_inicial', 'es_final', 'permite_edicion', 'genera_inventario'
            ),
            'description': 'Define el comportamiento del estado en el flujo de recepción'
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def color_badge(self, obj):
        """Mostrar color como badge."""
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            obj.color,
            obj.nombre
        )
    color_badge.short_description = 'Color'


@admin.register(PuntoRecepcion)
class PuntoRecepcionAdmin(admin.ModelAdmin):
    """Admin para Puntos de Recepción."""
    list_display = [
        'codigo', 'nombre', 'empresa', 'ubicacion',
        'capacidad_kg', 'bascula_asignada', 'orden', 'is_active'
    ]
    list_filter = ['empresa', 'is_active', 'created_at']
    search_fields = ['codigo', 'nombre', 'ubicacion', 'bascula_asignada']
    ordering = ['empresa', 'orden', 'nombre']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['empresa', 'created_by', 'updated_by']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'ubicacion', 'orden')
        }),
        ('Capacidad y Recursos', {
            'fields': ('capacidad_kg', 'bascula_asignada')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ==============================================================================
# INLINES PARA RECEPCIÓN
# ==============================================================================

class DetalleRecepcionInline(admin.TabularInline):
    """Inline para detalles de recepción."""
    model = DetalleRecepcion
    extra = 0
    readonly_fields = ['subtotal', 'cumple_acidez', 'created_at']
    fields = [
        'tipo_materia_prima_id', 'tipo_materia_prima_nombre', 'cantidad', 'unidad_medida',
        'acidez_medida', 'cumple_acidez', 'temperatura',
        'precio_unitario', 'subtotal', 'lote_asignado', 'observaciones'
    ]

    def cumple_acidez(self, obj):
        """Mostrar si cumple acidez."""
        if obj.cumple_acidez is None:
            return '-'
        elif obj.cumple_acidez:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Cumple</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ No Cumple</span>'
            )
    cumple_acidez.short_description = 'Acidez'


class ControlCalidadRecepcionInline(admin.TabularInline):
    """Inline para controles de calidad."""
    model = ControlCalidadRecepcion
    extra = 0
    readonly_fields = ['fecha_verificacion', 'estado_cumplimiento_badge', 'created_at']
    raw_id_fields = ['verificado_por']
    fields = [
        'parametro', 'valor_esperado', 'valor_obtenido',
        'cumple', 'estado_cumplimiento_badge', 'observaciones',
        'verificado_por', 'fecha_verificacion'
    ]

    def estado_cumplimiento_badge(self, obj):
        """Mostrar estado de cumplimiento como badge."""
        if obj.cumple:
            return format_html(
                '<span style="background-color: #28A745; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-weight: bold;">✓ CUMPLE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #DC3545; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-weight: bold;">✗ NO CUMPLE</span>'
            )
    estado_cumplimiento_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN PARA RECEPCIÓN
# ==============================================================================

@admin.register(Recepcion)
class RecepcionAdmin(admin.ModelAdmin):
    """Admin para Recepciones de Materia Prima."""
    list_display = [
        'codigo', 'fecha', 'proveedor_nombre', 'tipo_recepcion', 'estado_badge',
        'peso_neto', 'tiene_detalles_badge', 'recibido_por', 'created_at'
    ]
    list_filter = [
        'estado', 'tipo_recepcion', 'punto_recepcion', 'fecha',
        'is_active', 'created_at'
    ]
    search_fields = [
        'codigo', 'proveedor_nombre',
        'vehiculo_proveedor', 'conductor_proveedor'
    ]
    ordering = ['-fecha', '-created_at']
    date_hierarchy = 'fecha'
    raw_id_fields = [
        'empresa', 'recibido_por',
        'created_by', 'updated_by'
    ]
    readonly_fields = [
        'codigo', 'peso_neto', 'peso_neto_calculado', 'duracion_recepcion',
        'tiene_detalles', 'total_cantidad_detalles', 'total_valor_detalles',
        'created_at', 'updated_at'
    ]
    inlines = [DetalleRecepcionInline, ControlCalidadRecepcionInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa', 'fecha')
        }),
        ('Fechas y Horas', {
            'fields': (
                'hora_llegada', 'hora_salida', 'duracion_recepcion'
            )
        }),
        ('Proveedor y Programación', {
            'fields': ('proveedor_id', 'proveedor_nombre', 'programacion_id')
        }),
        ('Configuración de Recepción', {
            'fields': ('tipo_recepcion', 'punto_recepcion', 'estado')
        }),
        ('Información del Transporte', {
            'fields': ('vehiculo_proveedor', 'conductor_proveedor')
        }),
        ('Pesaje', {
            'fields': (
                'peso_bruto', 'peso_tara', 'peso_neto', 'peso_neto_calculado'
            ),
            'description': 'El peso neto se calcula automáticamente: peso_bruto - peso_tara'
        }),
        ('Control de Temperatura', {
            'fields': ('temperatura_llegada',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Responsable', {
            'fields': ('recibido_por',)
        }),
        ('Resumen de Detalles', {
            'fields': (
                'tiene_detalles', 'total_cantidad_detalles', 'total_valor_detalles'
            ),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Mostrar estado como badge con color."""
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            obj.estado.color,
            obj.estado.nombre
        )
    estado_badge.short_description = 'Estado'

    def tiene_detalles_badge(self, obj):
        """Mostrar si tiene detalles."""
        if obj.tiene_detalles:
            count = obj.detalles.count()
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ {} item(s)</span>',
                count
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Sin detalles</span>'
            )
    tiene_detalles_badge.short_description = 'Detalles'

    def get_queryset(self, request):
        """Optimizar consultas."""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'empresa', 'tipo_recepcion',
            'punto_recepcion', 'estado',
            'recibido_por', 'created_by'
        ).prefetch_related('detalles', 'controles_calidad')


# ==============================================================================
# ADMIN PARA DETALLE DE RECEPCIÓN
# ==============================================================================

@admin.register(DetalleRecepcion)
class DetalleRecepcionAdmin(admin.ModelAdmin):
    """Admin para Detalles de Recepción."""
    list_display = [
        'recepcion_codigo', 'tipo_materia_prima_nombre', 'cantidad', 'unidad_medida',
        'acidez_medida', 'cumple_acidez_badge', 'precio_unitario',
        'subtotal', 'lote_asignado', 'created_at'
    ]
    list_filter = [
        'unidad_medida', 'created_at'
    ]
    search_fields = [
        'recepcion__codigo', 'tipo_materia_prima_nombre',
        'lote_asignado', 'observaciones'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['recepcion']
    readonly_fields = ['subtotal', 'cumple_acidez', 'created_at', 'updated_at']

    fieldsets = (
        ('Recepción', {
            'fields': ('recepcion',)
        }),
        ('Materia Prima', {
            'fields': ('tipo_materia_prima_id', 'tipo_materia_prima_nombre', 'cantidad', 'unidad_medida')
        }),
        ('Controles de Calidad', {
            'fields': ('acidez_medida', 'cumple_acidez', 'temperatura')
        }),
        ('Precios', {
            'fields': ('precio_unitario', 'subtotal')
        }),
        ('Trazabilidad', {
            'fields': ('lote_asignado',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def recepcion_codigo(self, obj):
        """Mostrar código de recepción con link."""
        url = reverse('admin:recepcion_recepcion_change', args=[obj.recepcion.id])
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.recepcion.codigo
        )
    recepcion_codigo.short_description = 'Recepción'

    def cumple_acidez_badge(self, obj):
        """Mostrar cumplimiento de acidez."""
        cumple = obj.cumple_acidez
        if cumple is None:
            return '-'
        elif cumple:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Cumple</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ No Cumple</span>'
            )
    cumple_acidez_badge.short_description = 'Acidez'

    def get_queryset(self, request):
        """Optimizar consultas."""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'recepcion'
        )


# ==============================================================================
# ADMIN PARA CONTROL DE CALIDAD
# ==============================================================================

@admin.register(ControlCalidadRecepcion)
class ControlCalidadRecepcionAdmin(admin.ModelAdmin):
    """Admin para Controles de Calidad de Recepción."""
    list_display = [
        'recepcion_codigo', 'parametro', 'valor_esperado', 'valor_obtenido',
        'cumple_badge', 'verificado_por', 'fecha_verificacion'
    ]
    list_filter = ['cumple', 'parametro', 'fecha_verificacion', 'created_at']
    search_fields = [
        'recepcion__codigo', 'recepcion__proveedor_nombre',
        'parametro', 'valor_esperado', 'valor_obtenido', 'observaciones'
    ]
    ordering = ['-fecha_verificacion']
    date_hierarchy = 'fecha_verificacion'
    raw_id_fields = ['recepcion', 'verificado_por']
    readonly_fields = [
        'estado_cumplimiento', 'fecha_verificacion', 'created_at', 'updated_at'
    ]

    fieldsets = (
        ('Recepción', {
            'fields': ('recepcion',)
        }),
        ('Control de Calidad', {
            'fields': (
                'parametro', 'valor_esperado', 'valor_obtenido',
                'cumple', 'estado_cumplimiento'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Verificación', {
            'fields': ('verificado_por', 'fecha_verificacion')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def recepcion_codigo(self, obj):
        """Mostrar código de recepción con link."""
        url = reverse('admin:recepcion_recepcion_change', args=[obj.recepcion.id])
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.recepcion.codigo
        )
    recepcion_codigo.short_description = 'Recepción'

    def cumple_badge(self, obj):
        """Mostrar estado de cumplimiento como badge."""
        if obj.cumple:
            return format_html(
                '<span style="background-color: #28A745; color: white; padding: 5px 10px; '
                'border-radius: 3px; font-weight: bold;">✓ CUMPLE</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #DC3545; color: white; padding: 5px 10px; '
                'border-radius: 3px; font-weight: bold;">✗ NO CUMPLE</span>'
            )
    cumple_badge.short_description = 'Estado'

    def get_queryset(self, request):
        """Optimizar consultas."""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'recepcion', 'verificado_por'
        )
