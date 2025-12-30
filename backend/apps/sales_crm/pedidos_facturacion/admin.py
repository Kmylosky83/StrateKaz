"""
Admin para Pedidos y Facturación - Sales CRM
Interface administrativa con inlines y badges
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    EstadoPedido,
    MetodoPago,
    CondicionPago,
    Pedido,
    DetallePedido,
    Factura,
    PagoFactura
)


# ==================== CATÁLOGOS ====================

@admin.register(EstadoPedido)
class EstadoPedidoAdmin(admin.ModelAdmin):
    """Admin para estados de pedido"""

    list_display = [
        'codigo', 'nombre', 'color_badge', 'es_inicial', 'es_final',
        'permite_modificacion', 'permite_facturar', 'activo', 'orden'
    ]
    list_filter = ['activo', 'es_inicial', 'es_final', 'permite_modificacion', 'permite_facturar']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'color', 'descripcion')
        }),
        ('Reglas de Negocio', {
            'fields': (
                'es_inicial', 'es_final',
                'permite_modificacion', 'permite_facturar'
            )
        }),
        ('Configuración', {
            'fields': ('orden', 'activo')
        }),
    )

    def color_badge(self, obj):
        """Badge con el color del estado"""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d'
        }
        color_code = colors.get(obj.color, obj.color)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color_code, obj.nombre
        )
    color_badge.short_description = 'Estado'


@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    """Admin para métodos de pago"""

    list_display = [
        'codigo', 'nombre', 'requiere_referencia',
        'requiere_autorizacion', 'activo', 'orden'
    ]
    list_filter = ['activo', 'requiere_referencia', 'requiere_autorizacion']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Reglas de Negocio', {
            'fields': ('requiere_referencia', 'requiere_autorizacion')
        }),
        ('Configuración', {
            'fields': ('orden', 'activo')
        }),
    )


@admin.register(CondicionPago)
class CondicionPagoAdmin(admin.ModelAdmin):
    """Admin para condiciones de pago"""

    list_display = [
        'codigo', 'nombre', 'dias_plazo', 'aplica_descuento',
        'porcentaje_descuento', 'activo', 'orden'
    ]
    list_filter = ['activo', 'aplica_descuento']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración de Plazo', {
            'fields': ('dias_plazo',)
        }),
        ('Descuentos', {
            'fields': ('aplica_descuento', 'porcentaje_descuento')
        }),
        ('Configuración', {
            'fields': ('orden', 'activo')
        }),
    )


# ==================== INLINES ====================

class DetallePedidoInline(admin.TabularInline):
    """Inline para detalles de pedido"""
    model = DetallePedido
    extra = 1
    fields = [
        'producto', 'descripcion', 'cantidad', 'unidad_medida',
        'precio_unitario', 'descuento_linea', 'subtotal', 'orden'
    ]
    readonly_fields = ['subtotal']


class PagoFacturaInline(admin.TabularInline):
    """Inline para pagos de factura"""
    model = PagoFactura
    extra = 0
    fields = [
        'codigo', 'fecha_pago', 'monto', 'metodo_pago',
        'referencia_pago', 'registrado_por'
    ]
    readonly_fields = ['codigo', 'registrado_por']

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar pagos"""
        return False


# ==================== MODELOS PRINCIPALES ====================

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    """Admin para pedidos"""

    list_display = [
        'codigo', 'fecha_pedido', 'cliente', 'vendedor',
        'estado_badge', 'condicion_pago', 'total_formatted',
        'puede_facturar', 'tiene_factura'
    ]
    list_filter = [
        'estado', 'condicion_pago', 'fecha_pedido',
        'fecha_entrega_estimada', 'empresa'
    ]
    search_fields = [
        'codigo', 'cliente__razon_social', 'cliente__numero_documento',
        'vendedor__first_name', 'vendedor__last_name'
    ]
    date_hierarchy = 'fecha_pedido'
    ordering = ['-fecha_pedido', '-codigo']

    inlines = [DetallePedidoInline]

    fieldsets = (
        ('Información del Pedido', {
            'fields': ('codigo', 'empresa', 'fecha_pedido', 'fecha_entrega_estimada')
        }),
        ('Partes Involucradas', {
            'fields': ('cliente', 'vendedor', 'cotizacion')
        }),
        ('Estado y Condiciones', {
            'fields': ('estado', 'condicion_pago')
        }),
        ('Entrega', {
            'fields': ('direccion_entrega',)
        }),
        ('Totales', {
            'fields': (
                'subtotal', 'descuento_porcentaje', 'descuento_valor',
                'impuestos', 'total'
            ),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'codigo', 'subtotal', 'descuento_valor', 'total',
        'created_by', 'updated_by', 'created_at', 'updated_at'
    ]

    def estado_badge(self, obj):
        """Badge con estado del pedido"""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d'
        }
        color_code = colors.get(obj.estado.color, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color_code, obj.estado.nombre
        )
    estado_badge.short_description = 'Estado'

    def total_formatted(self, obj):
        """Total formateado"""
        return format_html('${:,.2f}', obj.total)
    total_formatted.short_description = 'Total'
    total_formatted.admin_order_field = 'total'

    def puede_facturar(self, obj):
        """Indica si puede facturarse"""
        if obj.puede_facturar:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    puede_facturar.short_description = 'Puede Facturar'
    puede_facturar.boolean = True

    def tiene_factura(self, obj):
        """Indica si tiene factura"""
        if obj.tiene_factura:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    tiene_factura.short_description = 'Tiene Factura'
    tiene_factura.boolean = True


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    """Admin para detalles de pedido"""

    list_display = [
        'pedido', 'producto', 'cantidad', 'unidad_medida',
        'precio_unitario', 'descuento_linea', 'subtotal_formatted', 'orden'
    ]
    list_filter = ['empresa', 'pedido__estado']
    search_fields = [
        'pedido__codigo', 'producto__nombre', 'producto__codigo', 'descripcion'
    ]
    ordering = ['pedido', 'orden']

    fieldsets = (
        ('Información', {
            'fields': ('pedido', 'producto')
        }),
        ('Detalle del Producto', {
            'fields': ('descripcion', 'unidad_medida')
        }),
        ('Cantidades y Precios', {
            'fields': (
                'cantidad', 'precio_unitario', 'descuento_linea', 'subtotal'
            )
        }),
        ('Configuración', {
            'fields': ('orden',)
        }),
    )

    readonly_fields = ['subtotal']

    def subtotal_formatted(self, obj):
        """Subtotal formateado"""
        return format_html('${:,.2f}', obj.subtotal)
    subtotal_formatted.short_description = 'Subtotal'
    subtotal_formatted.admin_order_field = 'subtotal'


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    """Admin para facturas"""

    list_display = [
        'codigo', 'fecha_factura', 'cliente', 'pedido',
        'estado_badge', 'total_formatted', 'saldo_pendiente_formatted',
        'esta_vencida_badge', 'dias_vencimiento'
    ]
    list_filter = [
        'estado', 'fecha_factura', 'fecha_vencimiento', 'empresa'
    ]
    search_fields = [
        'codigo', 'cliente__razon_social', 'pedido__codigo', 'cufe'
    ]
    date_hierarchy = 'fecha_factura'
    ordering = ['-fecha_factura', '-codigo']

    inlines = [PagoFacturaInline]

    fieldsets = (
        ('Información de la Factura', {
            'fields': ('codigo', 'empresa', 'fecha_factura', 'fecha_vencimiento')
        }),
        ('Relaciones', {
            'fields': ('pedido', 'cliente')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Totales', {
            'fields': (
                'subtotal', 'descuento_valor', 'impuestos', 'total'
            )
        }),
        ('DIAN (Facturación Electrónica)', {
            'fields': ('cufe', 'xml_url', 'pdf_url'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'codigo', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]

    def estado_badge(self, obj):
        """Badge con estado de la factura"""
        colors = {
            'PENDIENTE': '#ffc107',
            'PARCIAL': '#17a2b8',
            'PAGADA': '#28a745',
            'ANULADA': '#dc3545'
        }
        color_code = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color_code, obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def total_formatted(self, obj):
        """Total formateado"""
        return format_html('${:,.2f}', obj.total)
    total_formatted.short_description = 'Total'
    total_formatted.admin_order_field = 'total'

    def saldo_pendiente_formatted(self, obj):
        """Saldo pendiente formateado"""
        saldo = obj.saldo_pendiente
        color = 'red' if saldo > 0 else 'green'
        return format_html(
            '<span style="color: {}; font-weight: bold;">${:,.2f}</span>',
            color, saldo
        )
    saldo_pendiente_formatted.short_description = 'Saldo Pendiente'

    def esta_vencida_badge(self, obj):
        """Badge de vencimiento"""
        if obj.esta_vencida:
            return format_html('<span style="color: red; font-weight: bold;">✗ VENCIDA</span>')
        return format_html('<span style="color: green;">✓ Vigente</span>')
    esta_vencida_badge.short_description = 'Vencimiento'


@admin.register(PagoFactura)
class PagoFacturaAdmin(admin.ModelAdmin):
    """Admin para pagos de facturas"""

    list_display = [
        'codigo', 'fecha_pago', 'factura', 'monto_formatted',
        'metodo_pago', 'referencia_pago', 'registrado_por'
    ]
    list_filter = [
        'metodo_pago', 'fecha_pago', 'empresa'
    ]
    search_fields = [
        'codigo', 'factura__codigo', 'referencia_pago'
    ]
    date_hierarchy = 'fecha_pago'
    ordering = ['-fecha_pago', '-codigo']

    fieldsets = (
        ('Información del Pago', {
            'fields': ('codigo', 'empresa', 'factura', 'fecha_pago')
        }),
        ('Detalles del Pago', {
            'fields': ('monto', 'metodo_pago', 'referencia_pago')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'registrado_por', 'created_by', 'updated_by',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'codigo', 'registrado_por', 'created_by',
        'updated_by', 'created_at', 'updated_at'
    ]

    def monto_formatted(self, obj):
        """Monto formateado"""
        return format_html('<span style="color: green; font-weight: bold;">${:,.2f}</span>', obj.monto)
    monto_formatted.short_description = 'Monto'
    monto_formatted.admin_order_field = 'monto'

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar pagos"""
        return False
