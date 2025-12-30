"""
Admin para Producto Terminado - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

Configuración del panel de administración para gestión de producto terminado.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TipoProducto,
    EstadoLote,
    ProductoTerminado,
    StockProducto,
    Liberacion,
    CertificadoCalidad
)


# ==============================================================================
# ADMIN PARA CATÁLOGOS
# ==============================================================================

@admin.register(TipoProducto)
class TipoProductoAdmin(admin.ModelAdmin):
    """Admin para tipos de producto terminado."""

    list_display = [
        'codigo',
        'nombre',
        'unidad_medida',
        'requiere_certificado_badge',
        'vida_util_dias',
        'temperatura_badge',
        'activo_badge',
        'orden',
    ]
    list_filter = ['activo', 'requiere_certificado', 'requiere_ficha_tecnica']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'unidad_medida')
        }),
        ('Certificación', {
            'fields': ('requiere_certificado', 'requiere_ficha_tecnica')
        }),
        ('Almacenamiento', {
            'fields': (
                'vida_util_dias',
                'temperatura_almacenamiento_min',
                'temperatura_almacenamiento_max'
            )
        }),
        ('Configuración', {
            'fields': ('activo', 'orden')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def requiere_certificado_badge(self, obj):
        """Badge para certificado requerido."""
        if obj.requiere_certificado:
            return format_html('<span style="color: green;">✓ Sí</span>')
        return format_html('<span style="color: gray;">✗ No</span>')
    requiere_certificado_badge.short_description = 'Certificado'

    def temperatura_badge(self, obj):
        """Badge para rango de temperatura."""
        if obj.temperatura_almacenamiento_min and obj.temperatura_almacenamiento_max:
            return f"{obj.temperatura_almacenamiento_min}°C - {obj.temperatura_almacenamiento_max}°C"
        return '-'
    temperatura_badge.short_description = 'Temperatura'

    def activo_badge(self, obj):
        """Badge para estado activo."""
        if obj.activo:
            return format_html('<span style="color: green;">●</span> Activo')
        return format_html('<span style="color: red;">●</span> Inactivo')
    activo_badge.short_description = 'Estado'


@admin.register(EstadoLote)
class EstadoLoteAdmin(admin.ModelAdmin):
    """Admin para estados de lote PT."""

    list_display = [
        'codigo',
        'nombre',
        'color_badge',
        'permite_despacho_badge',
        'requiere_liberacion_badge',
        'activo_badge',
        'orden',
    ]
    list_filter = ['activo', 'permite_despacho', 'requiere_liberacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'color', 'descripcion')
        }),
        ('Reglas de Negocio', {
            'fields': ('permite_despacho', 'requiere_liberacion')
        }),
        ('Configuración', {
            'fields': ('activo', 'orden')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def color_badge(self, obj):
        """Badge de color visual."""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d',
        }
        color = colors.get(obj.color, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.nombre
        )
    color_badge.short_description = 'Vista'

    def permite_despacho_badge(self, obj):
        """Badge para permiso de despacho."""
        if obj.permite_despacho:
            return format_html('<span style="color: green;">✓ Sí</span>')
        return format_html('<span style="color: red;">✗ No</span>')
    permite_despacho_badge.short_description = 'Despacho'

    def requiere_liberacion_badge(self, obj):
        """Badge para liberación requerida."""
        if obj.requiere_liberacion:
            return format_html('<span style="color: orange;">✓ Sí</span>')
        return format_html('<span style="color: gray;">✗ No</span>')
    requiere_liberacion_badge.short_description = 'Liberación'

    def activo_badge(self, obj):
        """Badge para estado activo."""
        if obj.activo:
            return format_html('<span style="color: green;">●</span> Activo')
        return format_html('<span style="color: red;">●</span> Inactivo')
    activo_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN PRINCIPALES
# ==============================================================================

@admin.register(ProductoTerminado)
class ProductoTerminadoAdmin(admin.ModelAdmin):
    """Admin para productos terminados."""

    list_display = [
        'codigo',
        'nombre',
        'tipo_producto',
        'precio_base_badge',
        'stock_total_badge',
        'activo_badge',
    ]
    list_filter = ['tipo_producto', 'is_active', 'moneda', 'empresa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'tipo_producto')
        }),
        ('Especificaciones', {
            'fields': ('especificaciones_tecnicas',)
        }),
        ('Precio', {
            'fields': ('precio_base', 'moneda')
        }),
        ('Documentación', {
            'fields': ('ficha_tecnica_url', 'imagen_url')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def precio_base_badge(self, obj):
        """Badge para precio base."""
        if obj.precio_base:
            return f"${obj.precio_base:,.2f} {obj.moneda}"
        return '-'
    precio_base_badge.short_description = 'Precio'

    def stock_total_badge(self, obj):
        """Badge para stock total."""
        stock = obj.get_stock_total()
        if stock > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{} {}</span>',
                stock,
                obj.tipo_producto.unidad_medida
            )
        return format_html('<span style="color: gray;">Sin stock</span>')
    stock_total_badge.short_description = 'Stock Total'

    def activo_badge(self, obj):
        """Badge para estado activo."""
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Activo')
        return format_html('<span style="color: red;">●</span> Inactivo')
    activo_badge.short_description = 'Estado'


@admin.register(StockProducto)
class StockProductoAdmin(admin.ModelAdmin):
    """Admin para stock de producto terminado."""

    list_display = [
        'codigo_lote_pt',
        'producto',
        'estado_lote_badge',
        'cantidad_disponible_badge',
        'cantidad_reservada_badge',
        'fecha_produccion',
        'vencimiento_badge',
        'valor_total_badge',
    ]
    list_filter = ['estado_lote', 'producto', 'is_active', 'empresa', 'fecha_produccion']
    search_fields = ['codigo_lote_pt', 'producto__nombre', 'producto__codigo', 'ubicacion_almacen']
    ordering = ['-fecha_produccion']
    readonly_fields = [
        'codigo_lote_pt',
        'valor_total',
        'dias_para_vencer',
        'esta_vencido',
        'porcentaje_consumido',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by'
    ]
    date_hierarchy = 'fecha_produccion'

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa',
                'producto',
                'estado_lote',
                'lote_produccion',
                'codigo_lote_pt'
            )
        }),
        ('Cantidades', {
            'fields': (
                'cantidad_inicial',
                'cantidad_disponible',
                'cantidad_reservada',
                'porcentaje_consumido'
            )
        }),
        ('Fechas', {
            'fields': (
                'fecha_produccion',
                'fecha_vencimiento',
                'dias_para_vencer',
                'esta_vencido'
            )
        }),
        ('Ubicación y Costos', {
            'fields': ('ubicacion_almacen', 'costo_unitario', 'valor_total')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_lote_badge(self, obj):
        """Badge para estado del lote."""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d',
        }
        color = colors.get(obj.estado_lote.color, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.estado_lote.nombre
        )
    estado_lote_badge.short_description = 'Estado'

    def cantidad_disponible_badge(self, obj):
        """Badge para cantidad disponible."""
        unidad = obj.producto.tipo_producto.unidad_medida
        return format_html(
            '<span style="color: green; font-weight: bold;">{} {}</span>',
            obj.cantidad_disponible,
            unidad
        )
    cantidad_disponible_badge.short_description = 'Disponible'

    def cantidad_reservada_badge(self, obj):
        """Badge para cantidad reservada."""
        if obj.cantidad_reservada > 0:
            unidad = obj.producto.tipo_producto.unidad_medida
            return format_html(
                '<span style="color: orange;">{} {}</span>',
                obj.cantidad_reservada,
                unidad
            )
        return '-'
    cantidad_reservada_badge.short_description = 'Reservada'

    def vencimiento_badge(self, obj):
        """Badge para vencimiento."""
        if not obj.fecha_vencimiento:
            return '-'

        dias = obj.dias_para_vencer
        if obj.esta_vencido:
            return format_html(
                '<span style="color: red; font-weight: bold;">VENCIDO ({})</span>',
                obj.fecha_vencimiento
            )
        elif dias and dias <= 30:
            return format_html(
                '<span style="color: orange;">Próximo ({} días)</span>',
                dias
            )
        return format_html('<span style="color: green;">{}</span>', obj.fecha_vencimiento)
    vencimiento_badge.short_description = 'Vencimiento'

    def valor_total_badge(self, obj):
        """Badge para valor total."""
        if obj.valor_total:
            return format_html(
                '<span style="font-weight: bold;">${:,.2f}</span>',
                obj.valor_total
            )
        return '-'
    valor_total_badge.short_description = 'Valor Total'


@admin.register(Liberacion)
class LiberacionAdmin(admin.ModelAdmin):
    """Admin para liberaciones de calidad."""

    list_display = [
        'id',
        'stock_codigo',
        'producto_nombre',
        'resultado_badge',
        'fecha_solicitud',
        'solicitado_por',
        'aprobado_por',
        'permite_despacho_badge',
    ]
    list_filter = ['resultado', 'is_active', 'empresa', 'fecha_solicitud']
    search_fields = [
        'stock_producto__codigo_lote_pt',
        'stock_producto__producto__nombre',
        'observaciones'
    ]
    ordering = ['-fecha_solicitud']
    readonly_fields = ['fecha_solicitud', 'created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_solicitud'

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'stock_producto', 'resultado')
        }),
        ('Fechas', {
            'fields': ('fecha_solicitud', 'fecha_liberacion')
        }),
        ('Personal', {
            'fields': ('solicitado_por', 'aprobado_por')
        }),
        ('Evaluación', {
            'fields': ('parametros_evaluados', 'observaciones')
        }),
        ('Certificado', {
            'fields': ('certificado_url',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def stock_codigo(self, obj):
        """Código del lote."""
        return obj.stock_producto.codigo_lote_pt
    stock_codigo.short_description = 'Código Lote'

    def producto_nombre(self, obj):
        """Nombre del producto."""
        return obj.stock_producto.producto.nombre
    producto_nombre.short_description = 'Producto'

    def resultado_badge(self, obj):
        """Badge para resultado."""
        colors = {
            'PENDIENTE': 'orange',
            'APROBADO': 'green',
            'APROBADO_CON_OBSERVACIONES': 'blue',
            'RECHAZADO': 'red',
        }
        color = colors.get(obj.resultado, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_resultado_display()
        )
    resultado_badge.short_description = 'Resultado'

    def permite_despacho_badge(self, obj):
        """Badge para permiso de despacho."""
        if obj.permite_despacho:
            return format_html('<span style="color: green;">✓ Sí</span>')
        return format_html('<span style="color: red;">✗ No</span>')
    permite_despacho_badge.short_description = 'Despacho'


@admin.register(CertificadoCalidad)
class CertificadoCalidadAdmin(admin.ModelAdmin):
    """Admin para certificados de calidad."""

    list_display = [
        'numero_certificado',
        'cliente_nombre',
        'producto_nombre',
        'fecha_emision',
        'fecha_vencimiento',
        'emitido_por',
        'pdf_badge',
    ]
    list_filter = ['is_active', 'empresa', 'fecha_emision']
    search_fields = ['numero_certificado', 'cliente_nombre', 'observaciones']
    ordering = ['-fecha_emision']
    readonly_fields = ['numero_certificado', 'fecha_emision', 'created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'fecha_emision'

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'numero_certificado', 'liberacion', 'cliente_nombre')
        }),
        ('Fechas', {
            'fields': ('fecha_emision', 'fecha_vencimiento')
        }),
        ('Parámetros y Observaciones', {
            'fields': ('parametros_certificados', 'observaciones')
        }),
        ('Emisión', {
            'fields': ('emitido_por', 'pdf_url')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def producto_nombre(self, obj):
        """Nombre del producto."""
        return obj.liberacion.stock_producto.producto.nombre
    producto_nombre.short_description = 'Producto'

    def pdf_badge(self, obj):
        """Badge para PDF."""
        if obj.pdf_url:
            return format_html(
                '<a href="{}" target="_blank" style="color: blue;">📄 Ver PDF</a>',
                obj.pdf_url
            )
        return '-'
    pdf_badge.short_description = 'PDF'
