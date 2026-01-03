"""
Admin para Procesamiento de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Sum

from .models import (
    TipoProceso,
    EstadoProceso,
    LineaProduccion,
    OrdenProduccion,
    LoteProduccion,
    ConsumoMateriaPrima,
    ControlCalidadProceso
)


# ==============================================================================
# INLINE ADMINS
# ==============================================================================

class LoteProduccionInline(admin.TabularInline):
    """Inline para Lotes de Producción en Orden de Producción."""
    model = LoteProduccion
    extra = 0
    fields = [
        'codigo', 'fecha_produccion', 'cantidad_entrada',
        'cantidad_salida', 'porcentaje_rendimiento', 'operador'
    ]
    readonly_fields = ['codigo', 'porcentaje_rendimiento']
    can_delete = False


class ConsumoMateriaPrimaInline(admin.TabularInline):
    """Inline para Consumos en Lote de Producción."""
    model = ConsumoMateriaPrima
    extra = 1
    fields = [
        'tipo_materia_prima', 'cantidad', 'unidad_medida',
        'costo_unitario', 'costo_total', 'lote_origen'
    ]
    readonly_fields = ['costo_total']


class ControlCalidadProcesoInline(admin.TabularInline):
    """Inline para Controles de Calidad en Lote de Producción."""
    model = ControlCalidadProceso
    extra = 1
    fields = [
        'parametro', 'valor_minimo', 'valor_maximo',
        'valor_obtenido', 'cumple', 'verificado_por'
    ]
    readonly_fields = ['cumple', 'fecha_verificacion']


# ==============================================================================
# MODEL ADMINS
# ==============================================================================

@admin.register(TipoProceso)
class TipoProcesoAdmin(admin.ModelAdmin):
    """Admin para Tipo de Proceso."""
    list_display = [
        'codigo', 'nombre', 'tiempo_estimado_horas',
        'requiere_temperatura', 'requiere_presion',
        'producto_resultante', 'activo_badge', 'orden'
    ]
    list_filter = [
        'activo', 'requiere_temperatura', 'requiere_presion', 'created_at'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden', 'activo')
        }),
        ('Parámetros del Proceso', {
            'fields': (
                'tiempo_estimado_horas', 'requiere_temperatura',
                'requiere_presion', 'producto_resultante'
            )
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def activo_badge(self, obj):
        """Badge visual para estado activo."""
        if obj.activo:
            return format_html(
                '<span style="background-color: #28a745; color: white; '
                'padding: 3px 10px; border-radius: 3px;">Activo</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; '
            'padding: 3px 10px; border-radius: 3px;">Inactivo</span>'
        )
    activo_badge.short_description = 'Estado'


@admin.register(EstadoProceso)
class EstadoProcesoAdmin(admin.ModelAdmin):
    """Admin para Estado de Proceso."""
    list_display = [
        'codigo', 'nombre', 'color_badge', 'es_inicial',
        'es_final', 'permite_edicion', 'activo', 'orden'
    ]
    list_filter = [
        'activo', 'es_inicial', 'es_final', 'permite_edicion', 'created_at'
    ]
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color', 'orden', 'activo')
        }),
        ('Configuración de Flujo', {
            'fields': ('es_inicial', 'es_final', 'permite_edicion')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def color_badge(self, obj):
        """Badge con el color del estado."""
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 15px; border-radius: 3px;">{}</span>',
            obj.color, obj.nombre
        )
    color_badge.short_description = 'Vista Previa'


@admin.register(LineaProduccion)
class LineaProduccionAdmin(admin.ModelAdmin):
    """Admin para Línea de Producción."""
    list_display = [
        'codigo', 'nombre', 'ubicacion', 'capacidad_kg_hora',
        'cantidad_tipos_badge', 'activo_badge', 'created_at'
    ]
    list_filter = ['empresa', 'is_active', 'created_at']
    search_fields = ['codigo', 'nombre', 'descripcion', 'ubicacion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    filter_horizontal = ['tipo_proceso_compatible']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'ubicacion', 'orden')
        }),
        ('Capacidad y Compatibilidad', {
            'fields': ('capacidad_kg_hora', 'tipo_proceso_compatible')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def cantidad_tipos_badge(self, obj):
        """Muestra la cantidad de tipos compatibles."""
        cantidad = obj.cantidad_tipos_compatibles
        return format_html(
            '<span style="background-color: #007bff; color: white; '
            'padding: 3px 10px; border-radius: 10px;">{}</span>',
            cantidad
        )
    cantidad_tipos_badge.short_description = 'Tipos Compatibles'

    def activo_badge(self, obj):
        """Badge visual para estado activo."""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; '
                'padding: 3px 10px; border-radius: 3px;">Activo</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; '
            'padding: 3px 10px; border-radius: 3px;">Inactivo</span>'
        )
    activo_badge.short_description = 'Estado'


@admin.register(OrdenProduccion)
class OrdenProduccionAdmin(admin.ModelAdmin):
    """Admin para Orden de Producción."""
    list_display = [
        'codigo', 'fecha_programada', 'tipo_proceso', 'linea_produccion',
        'estado_badge', 'prioridad_badge', 'cantidad_programada',
        'responsable', 'created_at'
    ]
    list_filter = [
        'empresa', 'tipo_proceso', 'linea_produccion', 'estado',
        'prioridad', 'fecha_programada', 'is_active', 'created_at'
    ]
    search_fields = ['codigo', 'observaciones', 'responsable__username']
    date_hierarchy = 'fecha_programada'
    ordering = ['-fecha_programada', '-prioridad', '-created_at']
    readonly_fields = [
        'codigo', 'duracion_proceso_horas', 'porcentaje_completado',
        'cantidad_lotes', 'total_cantidad_producida', 'rendimiento_promedio',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]
    inlines = [LoteProduccionInline]

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa', 'codigo', 'fecha_programada',
                'prioridad', 'responsable'
            )
        }),
        ('Configuración del Proceso', {
            'fields': (
                'tipo_proceso', 'linea_produccion', 'estado',
                'recepcion_origen'
            )
        }),
        ('Cantidades', {
            'fields': ('cantidad_programada', 'cantidad_real')
        }),
        ('Fechas de Ejecución', {
            'fields': ('fecha_inicio', 'fecha_fin', 'duracion_proceso_horas')
        }),
        ('Indicadores de Producción', {
            'fields': (
                'porcentaje_completado', 'cantidad_lotes',
                'total_cantidad_producida', 'rendimiento_promedio'
            ),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge con el color del estado."""
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            obj.estado.color, obj.estado.nombre
        )
    estado_badge.short_description = 'Estado'

    def prioridad_badge(self, obj):
        """Badge de prioridad con color."""
        colores = {
            1: '#dc3545',  # Muy Alta - Rojo
            2: '#fd7e14',  # Alta - Naranja
            3: '#ffc107',  # Media - Amarillo
            4: '#28a745',  # Baja - Verde
            5: '#6c757d',  # Muy Baja - Gris
        }
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            colores.get(obj.prioridad, '#6c757d'),
            obj.get_prioridad_display()
        )
    prioridad_badge.short_description = 'Prioridad'


@admin.register(LoteProduccion)
class LoteProduccionAdmin(admin.ModelAdmin):
    """Admin para Lote de Producción."""
    list_display = [
        'codigo', 'orden_produccion', 'fecha_produccion',
        'cantidad_entrada', 'cantidad_salida', 'porcentaje_rendimiento_badge',
        'operador', 'created_at'
    ]
    list_filter = [
        'orden_produccion__tipo_proceso', 'fecha_produccion',
        'operador', 'created_at'
    ]
    search_fields = [
        'codigo', 'orden_produccion__codigo',
        'producto_salida', 'materia_prima_entrada'
    ]
    date_hierarchy = 'fecha_produccion'
    ordering = ['-fecha_produccion', '-created_at']
    readonly_fields = [
        'codigo', 'merma_kg', 'porcentaje_rendimiento',
        'duracion_produccion_horas', 'total_costo_materia_prima',
        'created_at', 'updated_at'
    ]
    inlines = [ConsumoMateriaPrimaInline, ControlCalidadProcesoInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'orden_produccion', 'fecha_produccion', 'operador')
        }),
        ('Horario de Producción', {
            'fields': ('hora_inicio', 'hora_fin', 'duracion_produccion_horas')
        }),
        ('Materia Prima Entrada', {
            'fields': ('materia_prima_entrada', 'cantidad_entrada')
        }),
        ('Producto Salida', {
            'fields': ('producto_salida', 'cantidad_salida')
        }),
        ('Rendimiento y Merma', {
            'fields': ('merma_kg', 'porcentaje_rendimiento')
        }),
        ('Costos', {
            'fields': ('total_costo_materia_prima',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def porcentaje_rendimiento_badge(self, obj):
        """Badge de rendimiento con color según porcentaje."""
        if obj.porcentaje_rendimiento >= 90:
            color = '#28a745'  # Verde - Excelente
        elif obj.porcentaje_rendimiento >= 75:
            color = '#ffc107'  # Amarillo - Bueno
        elif obj.porcentaje_rendimiento >= 60:
            color = '#fd7e14'  # Naranja - Regular
        else:
            color = '#dc3545'  # Rojo - Bajo

        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{:.2f}%</span>',
            color, obj.porcentaje_rendimiento
        )
    porcentaje_rendimiento_badge.short_description = 'Rendimiento'


@admin.register(ConsumoMateriaPrima)
class ConsumoMateriaPrimaAdmin(admin.ModelAdmin):
    """Admin para Consumo de Materia Prima."""
    list_display = [
        'lote_produccion', 'tipo_materia_prima', 'cantidad',
        'unidad_medida', 'costo_unitario', 'costo_total', 'lote_origen'
    ]
    list_filter = ['tipo_materia_prima', 'unidad_medida', 'created_at']
    search_fields = [
        'lote_produccion__codigo', 'tipo_materia_prima__nombre', 'lote_origen'
    ]
    ordering = ['-created_at']
    readonly_fields = ['costo_total', 'created_at', 'updated_at']

    fieldsets = (
        ('Lote de Producción', {
            'fields': ('lote_produccion',)
        }),
        ('Materia Prima', {
            'fields': ('tipo_materia_prima', 'lote_origen')
        }),
        ('Cantidad Consumida', {
            'fields': ('cantidad', 'unidad_medida')
        }),
        ('Costeo', {
            'fields': ('costo_unitario', 'costo_total')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ControlCalidadProceso)
class ControlCalidadProcesoAdmin(admin.ModelAdmin):
    """Admin para Control de Calidad de Proceso."""
    list_display = [
        'lote_produccion', 'parametro', 'valor_obtenido',
        'rango_display', 'cumple_badge', 'verificado_por', 'fecha_verificacion'
    ]
    list_filter = [
        'parametro', 'cumple', 'verificado_por', 'fecha_verificacion', 'created_at'
    ]
    search_fields = [
        'lote_produccion__codigo', 'observaciones', 'verificado_por__username'
    ]
    date_hierarchy = 'fecha_verificacion'
    ordering = ['-fecha_verificacion']
    readonly_fields = ['cumple', 'fecha_verificacion', 'created_at', 'updated_at']

    fieldsets = (
        ('Lote de Producción', {
            'fields': ('lote_produccion',)
        }),
        ('Parámetro Controlado', {
            'fields': ('parametro',)
        }),
        ('Valores de Control', {
            'fields': ('valor_minimo', 'valor_maximo', 'valor_obtenido', 'cumple')
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

    def rango_display(self, obj):
        """Muestra el rango de valores esperados."""
        if obj.valor_minimo is not None and obj.valor_maximo is not None:
            return f"{obj.valor_minimo} - {obj.valor_maximo}"
        elif obj.valor_minimo is not None:
            return f">= {obj.valor_minimo}"
        elif obj.valor_maximo is not None:
            return f"<= {obj.valor_maximo}"
        return "Sin rango"
    rango_display.short_description = 'Rango Esperado'

    def cumple_badge(self, obj):
        """Badge visual para cumplimiento."""
        if obj.cumple:
            return format_html(
                '<span style="background-color: #28a745; color: white; '
                'padding: 3px 10px; border-radius: 3px;">✓ Cumple</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; '
            'padding: 3px 10px; border-radius: 3px;">✗ No Cumple</span>'
        )
    cumple_badge.short_description = 'Cumplimiento'


# ==============================================================================
# ACCIONES PERSONALIZADAS
# ==============================================================================

def marcar_como_activo(modeladmin, request, queryset):
    """Marca los registros seleccionados como activos."""
    queryset.update(is_active=True)
marcar_como_activo.short_description = "Marcar como activo"

def marcar_como_inactivo(modeladmin, request, queryset):
    """Marca los registros seleccionados como inactivos."""
    queryset.update(is_active=False)
marcar_como_inactivo.short_description = "Marcar como inactivo"

# Registrar acciones
LineaProduccionAdmin.actions = [marcar_como_activo, marcar_como_inactivo]
OrdenProduccionAdmin.actions = [marcar_como_activo, marcar_como_inactivo]
