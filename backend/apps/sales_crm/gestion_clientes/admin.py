"""
Admin para Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz

Configuración del panel de administración para clientes,
contactos, segmentos e interacciones.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    TipoCliente, EstadoCliente, CanalVenta, Cliente,
    ContactoCliente, SegmentoCliente, ClienteSegmento,
    InteraccionCliente, ScoringCliente
)


# ==============================================================================
# ADMIN PARA CATÁLOGOS
# ==============================================================================

@admin.register(TipoCliente)
class TipoClienteAdmin(admin.ModelAdmin):
    """Admin para Tipos de Cliente."""

    list_display = ['codigo', 'nombre', 'activo', 'orden', 'created_at']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    list_editable = ['orden', 'activo']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('activo', 'orden')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at']


@admin.register(EstadoCliente)
class EstadoClienteAdmin(admin.ModelAdmin):
    """Admin para Estados de Cliente."""

    list_display = [
        'codigo', 'nombre', 'color_badge', 'permite_ventas',
        'requiere_aprobacion', 'activo', 'orden'
    ]
    list_filter = ['activo', 'permite_ventas', 'requiere_aprobacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    list_editable = ['orden', 'activo']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'color', 'descripcion')
        }),
        ('Reglas de Negocio', {
            'fields': ('permite_ventas', 'requiere_aprobacion')
        }),
        ('Configuración', {
            'fields': ('activo', 'orden')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    def color_badge(self, obj):
        """Mostrar badge de color."""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d',
        }
        color_hex = colors.get(obj.color, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color_hex,
            obj.nombre
        )
    color_badge.short_description = 'Vista Previa'


@admin.register(CanalVenta)
class CanalVentaAdmin(admin.ModelAdmin):
    """Admin para Canales de Venta."""

    list_display = [
        'codigo', 'nombre', 'aplica_comision', 'porcentaje_comision',
        'activo', 'orden'
    ]
    list_filter = ['activo', 'aplica_comision']
    search_fields = ['codigo', 'nombre', 'descripcion']
    list_editable = ['orden', 'activo']
    ordering = ['orden', 'nombre']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Comisiones', {
            'fields': ('aplica_comision', 'porcentaje_comision')
        }),
        ('Configuración', {
            'fields': ('activo', 'orden')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at']


# ==============================================================================
# INLINES
# ==============================================================================

class ContactoClienteInline(admin.TabularInline):
    """Inline para contactos del cliente."""

    model = ContactoCliente
    extra = 1
    fields = [
        'nombre_completo', 'cargo', 'telefono', 'email',
        'es_principal', 'is_active'
    ]
    classes = ['collapse']


class ClienteSegmentoInline(admin.TabularInline):
    """Inline para segmentos del cliente."""

    model = ClienteSegmento
    extra = 0
    fields = ['segmento', 'fecha_asignacion', 'asignado_por', 'is_active']
    readonly_fields = ['fecha_asignacion', 'asignado_por']
    classes = ['collapse']


class InteraccionClienteInline(admin.TabularInline):
    """Inline para interacciones del cliente."""

    model = InteraccionCliente
    extra = 0
    fields = [
        'tipo_interaccion', 'fecha', 'descripcion',
        'fecha_proxima_accion', 'registrado_por'
    ]
    readonly_fields = ['registrado_por']
    classes = ['collapse']


# ==============================================================================
# ADMIN PRINCIPAL - CLIENTE
# ==============================================================================

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Admin para Clientes."""

    list_display = [
        'codigo_cliente', 'razon_social', 'tipo_documento', 'numero_documento',
        'tipo_cliente', 'estado_badge', 'ciudad', 'vendedor_asignado',
        'total_compras_display', 'cantidad_pedidos', 'is_active'
    ]
    list_filter = [
        'tipo_cliente', 'estado_cliente', 'canal_venta',
        'is_active', 'ciudad', 'departamento'
    ]
    search_fields = [
        'codigo_cliente', 'numero_documento', 'razon_social',
        'nombre_comercial', 'email', 'telefono'
    ]
    list_per_page = 25
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Identificación', {
            'fields': (
                'codigo_cliente', 'tipo_documento', 'numero_documento',
                'razon_social', 'nombre_comercial'
            )
        }),
        ('Clasificación', {
            'fields': (
                'tipo_cliente', 'estado_cliente', 'canal_venta', 'vendedor_asignado'
            )
        }),
        ('Información de Contacto', {
            'fields': (
                'telefono', 'email', 'direccion', 'ciudad', 'departamento', 'pais'
            )
        }),
        ('Condiciones Comerciales', {
            'fields': (
                'plazo_pago_dias', 'cupo_credito', 'descuento_comercial'
            )
        }),
        ('Estadísticas de Compra', {
            'fields': (
                'fecha_primera_compra', 'ultima_compra',
                'total_compras_acumulado', 'cantidad_pedidos'
            ),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Estado y Auditoría', {
            'fields': (
                'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'codigo_cliente', 'fecha_primera_compra', 'ultima_compra',
        'total_compras_acumulado', 'cantidad_pedidos',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    inlines = [ContactoClienteInline, ClienteSegmentoInline, InteraccionClienteInline]

    def estado_badge(self, obj):
        """Mostrar badge con color del estado."""
        colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'danger': '#dc3545',
            'info': '#17a2b8',
            'gray': '#6c757d',
        }
        color_hex = colors.get(obj.estado_cliente.color, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color_hex,
            obj.estado_cliente.nombre
        )
    estado_badge.short_description = 'Estado'

    def total_compras_display(self, obj):
        """Formatear total de compras."""
        return f"${obj.total_compras_acumulado:,.2f}"
    total_compras_display.short_description = 'Total Compras'
    total_compras_display.admin_order_field = 'total_compras_acumulado'

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.select_related(
            'tipo_cliente', 'estado_cliente', 'canal_venta',
            'vendedor_asignado', 'created_by', 'updated_by'
        )
        return qs


# ==============================================================================
# ADMIN PARA CONTACTOS
# ==============================================================================

@admin.register(ContactoCliente)
class ContactoClienteAdmin(admin.ModelAdmin):
    """Admin para Contactos de Cliente."""

    list_display = [
        'nombre_completo', 'cliente', 'cargo', 'telefono',
        'email', 'es_principal', 'is_active'
    ]
    list_filter = ['es_principal', 'is_active', 'cargo']
    search_fields = [
        'nombre_completo', 'cargo', 'email', 'telefono',
        'cliente__razon_social'
    ]
    list_per_page = 25
    ordering = ['-es_principal', 'nombre_completo']

    fieldsets = (
        ('Cliente', {
            'fields': ('cliente',)
        }),
        ('Información del Contacto', {
            'fields': (
                'nombre_completo', 'cargo', 'telefono', 'email'
            )
        }),
        ('Información Adicional', {
            'fields': ('es_principal', 'fecha_cumpleanos', 'notas')
        }),
        ('Estado y Auditoría', {
            'fields': (
                'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.select_related('cliente', 'created_by', 'updated_by')
        return qs


# ==============================================================================
# ADMIN PARA SEGMENTACIÓN
# ==============================================================================

@admin.register(SegmentoCliente)
class SegmentoClienteAdmin(admin.ModelAdmin):
    """Admin para Segmentos de Cliente."""

    list_display = [
        'codigo', 'nombre', 'color_badge', 'cantidad_clientes',
        'is_active'
    ]
    list_filter = ['is_active', 'color']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['nombre']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color')
        }),
        ('Criterios de Segmentación', {
            'fields': ('criterios',),
            'classes': ('collapse',)
        }),
        ('Estado y Auditoría', {
            'fields': (
                'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def color_badge(self, obj):
        """Mostrar badge de color."""
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            obj.color,
            obj.nombre
        )
    color_badge.short_description = 'Vista Previa'

    def cantidad_clientes(self, obj):
        """Mostrar cantidad de clientes en el segmento."""
        count = obj.clientes.filter(is_active=True).count()
        return format_html('<strong>{}</strong>', count)
    cantidad_clientes.short_description = 'Clientes'

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.prefetch_related('clientes')
        return qs


@admin.register(ClienteSegmento)
class ClienteSegmentoAdmin(admin.ModelAdmin):
    """Admin para Asignaciones Cliente-Segmento."""

    list_display = [
        'cliente', 'segmento', 'fecha_asignacion', 'asignado_por', 'is_active'
    ]
    list_filter = ['segmento', 'is_active', 'fecha_asignacion']
    search_fields = ['cliente__razon_social', 'segmento__nombre']
    date_hierarchy = 'fecha_asignacion'
    ordering = ['-fecha_asignacion']

    fieldsets = (
        ('Asignación', {
            'fields': ('cliente', 'segmento')
        }),
        ('Auditoría', {
            'fields': (
                'fecha_asignacion', 'asignado_por', 'is_active',
                'created_at', 'updated_at'
            )
        }),
    )

    readonly_fields = ['fecha_asignacion', 'asignado_por', 'created_at', 'updated_at']

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.select_related('cliente', 'segmento', 'asignado_por')
        return qs


# ==============================================================================
# ADMIN PARA INTERACCIONES
# ==============================================================================

@admin.register(InteraccionCliente)
class InteraccionClienteAdmin(admin.ModelAdmin):
    """Admin para Interacciones con Cliente."""

    list_display = [
        'cliente', 'tipo_interaccion', 'fecha', 'registrado_por',
        'proxima_accion_badge', 'is_active'
    ]
    list_filter = [
        'tipo_interaccion', 'is_active', 'fecha', 'fecha_proxima_accion'
    ]
    search_fields = [
        'cliente__razon_social', 'descripcion', 'resultado', 'proxima_accion'
    ]
    date_hierarchy = 'fecha'
    list_per_page = 25
    ordering = ['-fecha']

    fieldsets = (
        ('Cliente y Tipo', {
            'fields': ('cliente', 'tipo_interaccion')
        }),
        ('Detalles de la Interacción', {
            'fields': ('fecha', 'descripcion', 'resultado')
        }),
        ('Seguimiento', {
            'fields': ('proxima_accion', 'fecha_proxima_accion')
        }),
        ('Registro', {
            'fields': ('registrado_por',)
        }),
        ('Estado y Auditoría', {
            'fields': (
                'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'registrado_por', 'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    def proxima_accion_badge(self, obj):
        """Mostrar badge si hay próxima acción."""
        if obj.fecha_proxima_accion:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 3px 8px; '
                'border-radius: 3px;">{}</span>',
                obj.fecha_proxima_accion.strftime('%Y-%m-%d')
            )
        return format_html(
            '<span style="color: #6c757d;">-</span>'
        )
    proxima_accion_badge.short_description = 'Próxima Acción'

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.select_related('cliente', 'registrado_por', 'created_by', 'updated_by')
        return qs


# ==============================================================================
# ADMIN PARA SCORING (SOLO LECTURA)
# ==============================================================================

@admin.register(ScoringCliente)
class ScoringClienteAdmin(admin.ModelAdmin):
    """Admin para Scoring de Cliente (solo lectura)."""

    list_display = [
        'cliente', 'puntuacion_badge', 'nivel_badge',
        'frecuencia_compra', 'volumen_compra', 'puntualidad_pago',
        'antiguedad', 'ultima_actualizacion'
    ]
    list_filter = ['ultima_actualizacion']
    search_fields = ['cliente__razon_social', 'cliente__codigo_cliente']
    ordering = ['-puntuacion_total']
    list_per_page = 25

    fieldsets = (
        ('Cliente', {
            'fields': ('cliente',)
        }),
        ('Puntuación', {
            'fields': ('puntuacion_total', 'nivel_scoring', 'color_nivel')
        }),
        ('Componentes del Score', {
            'fields': (
                'frecuencia_compra', 'volumen_compra',
                'puntualidad_pago', 'antiguedad'
            )
        }),
        ('Historial', {
            'fields': ('historial_scores', 'ultima_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = [
        'cliente', 'puntuacion_total', 'nivel_scoring', 'color_nivel',
        'frecuencia_compra', 'volumen_compra', 'puntualidad_pago',
        'antiguedad', 'historial_scores', 'ultima_actualizacion'
    ]

    def has_add_permission(self, request):
        """No permitir crear scorings manualmente."""
        return False

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar scorings."""
        return False

    def puntuacion_badge(self, obj):
        """Mostrar badge con puntuación."""
        colors = {
            'EXCELENTE': '#28a745',
            'BUENO': '#17a2b8',
            'REGULAR': '#ffc107',
            'BAJO': '#dc3545',
            'MUY_BAJO': '#343a40',
        }
        color = colors.get(obj.nivel_scoring, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{:.2f}</span>',
            color,
            obj.puntuacion_total
        )
    puntuacion_badge.short_description = 'Puntuación'

    def nivel_badge(self, obj):
        """Mostrar badge con nivel."""
        colors = {
            'EXCELENTE': '#28a745',
            'BUENO': '#17a2b8',
            'REGULAR': '#ffc107',
            'BAJO': '#dc3545',
            'MUY_BAJO': '#343a40',
        }
        color = colors.get(obj.nivel_scoring, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.nivel_scoring
        )
    nivel_badge.short_description = 'Nivel'

    def get_queryset(self, request):
        """Optimizar queryset."""
        qs = super().get_queryset(request)
        qs = qs.select_related('cliente')
        return qs
