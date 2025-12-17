# -*- coding: utf-8 -*-
"""
Admin del módulo Recepciones - Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import RecepcionMateriaPrima, RecepcionDetalle


class RecepcionDetalleInline(admin.TabularInline):
    """Inline para detalles de recepción"""
    model = RecepcionDetalle
    extra = 0
    readonly_fields = [
        'recoleccion',
        'peso_esperado_kg',
        'precio_esperado_kg',
        'valor_esperado',
        'peso_real_kg',
        'merma_kg',
        'porcentaje_merma',
        'precio_real_kg',
        'valor_real',
        'proporcion_lote',
    ]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(RecepcionMateriaPrima)
class RecepcionMateriaPrimaAdmin(admin.ModelAdmin):
    """Admin para RecepcionMateriaPrima"""

    list_display = [
        'codigo_recepcion',
        'estado_badge',
        'recolector',
        'fecha_recepcion',
        'cantidad_recolecciones',
        'peso_esperado_kg',
        'peso_real_kg',
        'merma_info',
        'valor_esperado_total',
    ]

    list_filter = [
        'estado',
        'fecha_recepcion',
        'recolector',
        'recibido_por',
    ]

    search_fields = [
        'codigo_recepcion',
        'recolector__first_name',
        'recolector__last_name',
        'recolector__username',
        'numero_ticket_bascula',
    ]

    readonly_fields = [
        'codigo_recepcion',
        'peso_esperado_kg',
        'valor_esperado_total',
        'merma_kg',
        'porcentaje_merma',
        'valor_real_total',
        'cantidad_recolecciones',
        'created_by',
        'created_at',
        'updated_at',
    ]

    fieldsets = (
        ('Información General', {
            'fields': (
                'codigo_recepcion',
                'estado',
                'recolector',
                'recibido_por',
            )
        }),
        ('Fechas', {
            'fields': (
                'fecha_recepcion',
                'fecha_pesaje',
                'fecha_confirmacion',
            )
        }),
        ('Pesos y Merma', {
            'fields': (
                'cantidad_recolecciones',
                'peso_esperado_kg',
                'peso_real_kg',
                'merma_kg',
                'porcentaje_merma',
                'numero_ticket_bascula',
            )
        }),
        ('Valores', {
            'fields': (
                'valor_esperado_total',
                'valor_real_total',
            )
        }),
        ('Destino', {
            'fields': (
                'tanque_destino',
            )
        }),
        ('Observaciones', {
            'fields': (
                'observaciones_recepcion',
                'observaciones_merma',
            ),
            'classes': ('collapse',),
        }),
        ('Cancelación', {
            'fields': (
                'motivo_cancelacion',
                'cancelado_por',
                'fecha_cancelacion',
            ),
            'classes': ('collapse',),
        }),
        ('Auditoría', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
                'deleted_at',
            ),
            'classes': ('collapse',),
        }),
    )

    inlines = [RecepcionDetalleInline]

    def estado_badge(self, obj):
        """Badge de estado con colores"""
        colors = {
            'INICIADA': '#FFA500',     # Naranja
            'PESADA': '#2196F3',       # Azul
            'CONFIRMADA': '#4CAF50',   # Verde
            'CANCELADA': '#F44336',    # Rojo
        }
        color = colors.get(obj.estado, '#757575')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def merma_info(self, obj):
        """Información de merma con formato"""
        if obj.merma_kg and obj.porcentaje_merma:
            color = '#F44336' if obj.porcentaje_merma > 5 else '#4CAF50'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} kg ({}%)</span>',
                color,
                obj.merma_kg,
                obj.porcentaje_merma
            )
        return '-'
    merma_info.short_description = 'Merma'

    def get_queryset(self, request):
        """Optimizar queryset con select_related"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'recolector',
            'recibido_por',
            'created_by',
            'cancelado_por'
        ).prefetch_related('detalles')

    def save_model(self, request, obj, form, change):
        """Agregar usuario creador"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RecepcionDetalle)
class RecepcionDetalleAdmin(admin.ModelAdmin):
    """Admin para RecepcionDetalle"""

    list_display = [
        'recepcion',
        'recoleccion_link',
        'peso_esperado_kg',
        'peso_real_kg',
        'merma_kg',
        'porcentaje_merma',
        'proporcion_lote_percent',
        'valor_esperado',
        'valor_real',
    ]

    list_filter = [
        'recepcion__estado',
        'recepcion__fecha_recepcion',
    ]

    search_fields = [
        'recepcion__codigo_recepcion',
        'recoleccion__codigo_voucher',
        'recoleccion__ecoaliado__razon_social',
    ]

    readonly_fields = [
        'recepcion',
        'recoleccion',
        'peso_esperado_kg',
        'precio_esperado_kg',
        'valor_esperado',
        'peso_real_kg',
        'merma_kg',
        'porcentaje_merma',
        'precio_real_kg',
        'valor_real',
        'proporcion_lote',
        'created_at',
        'updated_at',
    ]

    fieldsets = (
        ('Relaciones', {
            'fields': (
                'recepcion',
                'recoleccion',
            )
        }),
        ('Datos Esperados (Original)', {
            'fields': (
                'peso_esperado_kg',
                'precio_esperado_kg',
                'valor_esperado',
            )
        }),
        ('Datos Reales (Después de Merma)', {
            'fields': (
                'peso_real_kg',
                'merma_kg',
                'porcentaje_merma',
                'precio_real_kg',
                'valor_real',
            )
        }),
        ('Proporción en Lote', {
            'fields': (
                'proporcion_lote',
            )
        }),
        ('Observaciones', {
            'fields': (
                'observaciones',
            ),
            'classes': ('collapse',),
        }),
        ('Auditoría', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    def recoleccion_link(self, obj):
        """Link a la recolección"""
        url = reverse('admin:recolecciones_recoleccion_change', args=[obj.recoleccion.pk])
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.recoleccion.codigo_voucher
        )
    recoleccion_link.short_description = 'Recolección'

    def proporcion_lote_percent(self, obj):
        """Proporción como porcentaje"""
        if obj.proporcion_lote:
            return f"{obj.proporcion_lote * 100:.2f}%"
        return '-'
    proporcion_lote_percent.short_description = '% del Lote'

    def get_queryset(self, request):
        """Optimizar queryset"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'recepcion',
            'recoleccion',
            'recoleccion__ecoaliado'
        )

    def has_add_permission(self, request):
        """No permitir agregar directamente desde admin"""
        return False

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar directamente desde admin"""
        return False
