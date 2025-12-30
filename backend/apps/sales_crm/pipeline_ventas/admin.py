"""
Admin para Pipeline de Ventas - Sales CRM
Configuración del admin de Django para gestión visual de pipeline
"""

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    EtapaVenta,
    MotivoPerdida,
    FuenteOportunidad,
    Oportunidad,
    SeguimientoOportunidad,
    Cotizacion,
    DetalleCotizacion,
    HistorialEtapa
)


# ==================== INLINES ====================

class SeguimientoOportunidadInline(admin.TabularInline):
    """Inline para seguimientos de oportunidad"""
    model = SeguimientoOportunidad
    extra = 0
    fields = ['fecha', 'tipo_actividad', 'descripcion', 'resultado', 'fecha_proxima']
    readonly_fields = ['created_at']
    classes = ['collapse']


class HistorialEtapaInline(admin.TabularInline):
    """Inline para historial de cambios de etapa"""
    model = HistorialEtapa
    extra = 0
    fields = ['fecha_cambio', 'etapa_anterior', 'etapa_nueva', 'cambiado_por', 'observaciones']
    readonly_fields = ['fecha_cambio', 'etapa_anterior', 'etapa_nueva', 'cambiado_por']
    can_delete = False
    classes = ['collapse']


class DetalleCotizacionInline(admin.TabularInline):
    """Inline para detalles de cotización"""
    model = DetalleCotizacion
    extra = 1
    fields = ['orden', 'producto', 'descripcion_producto', 'cantidad', 'unidad_medida',
              'precio_unitario', 'descuento_linea', 'subtotal']
    readonly_fields = ['subtotal']


# ==================== CATÁLOGOS ====================

@admin.register(EtapaVenta)
class EtapaVentaAdmin(admin.ModelAdmin):
    """Admin para etapas de venta"""
    list_display = [
        'codigo',
        'nombre',
        'color_badge',
        'probabilidad_cierre',
        'es_inicial',
        'es_ganada',
        'es_perdida',
        'orden',
        'oportunidades_count',
        'activo'
    ]
    list_filter = ['activo', 'es_inicial', 'es_ganada', 'es_perdida', 'es_final']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'activo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color', 'orden')
        }),
        ('Configuración de Etapa', {
            'fields': (
                'probabilidad_cierre',
                'es_inicial',
                'es_ganada',
                'es_perdida',
                'es_final',
                'permite_edicion'
            )
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def color_badge(self, obj):
        """Muestra badge con el color de la etapa"""
        return format_html(
            '<span style="display: inline-block; width: 20px; height: 20px; '
            'background-color: {}; border-radius: 3px; border: 1px solid #ccc;"></span>',
            obj.color
        )
    color_badge.short_description = 'Color'

    def oportunidades_count(self, obj):
        """Cantidad de oportunidades en esta etapa"""
        count = obj.oportunidades.count()
        if count > 0:
            url = reverse('admin:pipeline_ventas_oportunidad_changelist') + f'?etapa_actual__id__exact={obj.id}'
            return format_html('<a href="{}">{} oportunidades</a>', url, count)
        return '0 oportunidades'
    oportunidades_count.short_description = 'Oportunidades'


@admin.register(MotivoPerdida)
class MotivoPerdidaAdmin(admin.ModelAdmin):
    """Admin para motivos de pérdida"""
    list_display = ['codigo', 'nombre', 'orden', 'perdidas_count', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'activo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def perdidas_count(self, obj):
        """Cantidad de oportunidades perdidas con este motivo"""
        count = obj.oportunidades_perdidas.count()
        if count > 0:
            url = reverse('admin:pipeline_ventas_oportunidad_changelist') + f'?motivo_perdida__id__exact={obj.id}'
            return format_html('<a href="{}">{} pérdidas</a>', url, count)
        return '0 pérdidas'
    perdidas_count.short_description = 'Pérdidas'


@admin.register(FuenteOportunidad)
class FuenteOportunidadAdmin(admin.ModelAdmin):
    """Admin para fuentes de oportunidad"""
    list_display = ['codigo', 'nombre', 'orden', 'oportunidades_count', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'activo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def oportunidades_count(self, obj):
        """Cantidad de oportunidades de esta fuente"""
        count = obj.oportunidades.count()
        if count > 0:
            url = reverse('admin:pipeline_ventas_oportunidad_changelist') + f'?fuente__id__exact={obj.id}'
            return format_html('<a href="{}">{} oportunidades</a>', url, count)
        return '0 oportunidades'
    oportunidades_count.short_description = 'Oportunidades'


# ==================== OPORTUNIDADES ====================

@admin.register(Oportunidad)
class OportunidadAdmin(admin.ModelAdmin):
    """Admin para oportunidades de venta"""
    list_display = [
        'codigo',
        'nombre',
        'cliente_link',
        'vendedor',
        'etapa_badge',
        'valor_formateado',
        'probabilidad_cierre',
        'fecha_creacion',
        'dias_en_pipeline_display',
        'estado_display'
    ]
    list_filter = [
        'etapa_actual',
        'fuente',
        'vendedor',
        'fecha_creacion',
        'fecha_cierre_estimada'
    ]
    search_fields = ['codigo', 'nombre', 'cliente__razon_social', 'descripcion']
    ordering = ['-fecha_creacion']
    readonly_fields = [
        'codigo',
        'probabilidad_cierre',
        'fecha_cierre_real',
        'esta_activa',
        'dias_en_pipeline',
        'created_at',
        'updated_at'
    ]
    date_hierarchy = 'fecha_creacion'
    inlines = [SeguimientoOportunidadInline, HistorialEtapaInline]

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'notas')
        }),
        ('Relaciones', {
            'fields': ('cliente', 'vendedor', 'etapa_actual', 'fuente')
        }),
        ('Valores', {
            'fields': ('valor_estimado', 'moneda', 'probabilidad_cierre')
        }),
        ('Fechas', {
            'fields': (
                'fecha_creacion',
                'fecha_cierre_estimada',
                'fecha_cierre_real',
                'dias_en_pipeline'
            )
        }),
        ('Cierre', {
            'fields': ('motivo_perdida',),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('esta_activa',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def cliente_link(self, obj):
        """Link al cliente"""
        url = reverse('admin:gestion_clientes_cliente_change', args=[obj.cliente.id])
        return format_html('<a href="{}">{}</a>', url, obj.cliente.razon_social)
    cliente_link.short_description = 'Cliente'

    def etapa_badge(self, obj):
        """Badge colorizado con la etapa actual"""
        if obj.etapa_actual:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
                obj.etapa_actual.color,
                obj.etapa_actual.nombre
            )
        return '-'
    etapa_badge.short_description = 'Etapa'

    def valor_formateado(self, obj):
        """Formatea el valor estimado"""
        return f'${obj.valor_estimado:,.0f}'
    valor_formateado.short_description = 'Valor Estimado'
    valor_formateado.admin_order_field = 'valor_estimado'

    def dias_en_pipeline_display(self, obj):
        """Muestra días en pipeline con color según antigüedad"""
        dias = obj.dias_en_pipeline
        if dias > 90:
            color = '#dc3545'  # Rojo
        elif dias > 60:
            color = '#ffc107'  # Amarillo
        else:
            color = '#28a745'  # Verde

        return format_html(
            '<span style="color: {}; font-weight: bold;">{} días</span>',
            color,
            dias
        )
    dias_en_pipeline_display.short_description = 'Días en Pipeline'
    dias_en_pipeline_display.admin_order_field = 'fecha_creacion'

    def estado_display(self, obj):
        """Muestra estado activa/cerrada"""
        if obj.esta_activa:
            return format_html(
                '<span style="color: #28a745;">● Activa</span>'
            )
        else:
            if obj.etapa_actual.es_ganada:
                return format_html(
                    '<span style="color: #007bff;">✓ Ganada</span>'
                )
            else:
                return format_html(
                    '<span style="color: #dc3545;">✗ Perdida</span>'
                )
    estado_display.short_description = 'Estado'

    def get_queryset(self, request):
        """Optimiza consultas"""
        return super().get_queryset(request).select_related(
            'cliente',
            'vendedor',
            'etapa_actual',
            'fuente',
            'motivo_perdida'
        )


# ==================== SEGUIMIENTOS ====================

@admin.register(SeguimientoOportunidad)
class SeguimientoOportunidadAdmin(admin.ModelAdmin):
    """Admin para seguimientos de oportunidad"""
    list_display = [
        'oportunidad',
        'fecha',
        'tipo_actividad',
        'descripcion_corta',
        'registrado_por',
        'fecha_proxima'
    ]
    list_filter = ['tipo_actividad', 'fecha', 'fecha_proxima', 'registrado_por']
    search_fields = ['oportunidad__codigo', 'descripcion', 'resultado']
    ordering = ['-fecha']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'fecha'

    fieldsets = (
        ('Información General', {
            'fields': ('oportunidad', 'fecha', 'tipo_actividad', 'registrado_por')
        }),
        ('Detalle de Actividad', {
            'fields': ('descripcion', 'resultado')
        }),
        ('Próxima Acción', {
            'fields': ('proxima_accion', 'fecha_proxima'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def descripcion_corta(self, obj):
        """Muestra descripción truncada"""
        if len(obj.descripcion) > 60:
            return obj.descripcion[:60] + '...'
        return obj.descripcion
    descripcion_corta.short_description = 'Descripción'


# ==================== COTIZACIONES ====================

@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    """Admin para cotizaciones"""
    list_display = [
        'codigo',
        'cliente_link',
        'vendedor',
        'estado_badge',
        'total_formateado',
        'fecha_cotizacion',
        'fecha_vencimiento_display',
        'cantidad_lineas'
    ]
    list_filter = [
        'estado',
        'fecha_cotizacion',
        'fecha_vencimiento',
        'vendedor'
    ]
    search_fields = ['codigo', 'cliente__razon_social', 'observaciones']
    ordering = ['-fecha_cotizacion']
    readonly_fields = [
        'codigo',
        'subtotal',
        'descuento_valor',
        'impuestos',
        'total',
        'esta_vencida',
        'created_at',
        'updated_at'
    ]
    date_hierarchy = 'fecha_cotizacion'
    inlines = [DetalleCotizacionInline]

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'oportunidad', 'cliente', 'vendedor', 'estado')
        }),
        ('Fechas', {
            'fields': (
                'fecha_cotizacion',
                'dias_validez',
                'fecha_vencimiento',
                'esta_vencida'
            )
        }),
        ('Valores', {
            'fields': (
                'subtotal',
                'descuento_porcentaje',
                'descuento_valor',
                'impuestos',
                'total'
            )
        }),
        ('Información Adicional', {
            'fields': ('terminos_condiciones', 'observaciones'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def cliente_link(self, obj):
        """Link al cliente"""
        url = reverse('admin:gestion_clientes_cliente_change', args=[obj.cliente.id])
        return format_html('<a href="{}">{}</a>', url, obj.cliente.razon_social)
    cliente_link.short_description = 'Cliente'

    def estado_badge(self, obj):
        """Badge colorizado según estado"""
        colors = {
            'BORRADOR': '#6c757d',
            'ENVIADA': '#007bff',
            'APROBADA': '#28a745',
            'RECHAZADA': '#dc3545',
            'VENCIDA': '#ffc107',
            'CONVERTIDA': '#17a2b8'
        }
        color = colors.get(obj.estado, '#6c757d')

        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def total_formateado(self, obj):
        """Formatea el total"""
        return f'${obj.total:,.0f}'
    total_formateado.short_description = 'Total'
    total_formateado.admin_order_field = 'total'

    def fecha_vencimiento_display(self, obj):
        """Muestra fecha de vencimiento con color según cercanía"""
        if obj.esta_vencida:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">{} (Vencida)</span>',
                obj.fecha_vencimiento
            )
        else:
            from django.utils import timezone
            dias_restantes = (obj.fecha_vencimiento - timezone.now().date()).days

            if dias_restantes <= 3:
                color = '#ffc107'  # Amarillo
            else:
                color = '#28a745'  # Verde

            return format_html(
                '<span style="color: {};">{} ({} días)</span>',
                color,
                obj.fecha_vencimiento,
                dias_restantes
            )
    fecha_vencimiento_display.short_description = 'Vencimiento'
    fecha_vencimiento_display.admin_order_field = 'fecha_vencimiento'

    def cantidad_lineas(self, obj):
        """Cantidad de líneas de detalle"""
        count = obj.detalles.count()
        return f'{count} línea{"s" if count != 1 else ""}'
    cantidad_lineas.short_description = 'Líneas'

    def get_queryset(self, request):
        """Optimiza consultas"""
        return super().get_queryset(request).select_related(
            'cliente',
            'vendedor',
            'oportunidad'
        ).prefetch_related('detalles')


# ==================== HISTORIAL ====================

@admin.register(HistorialEtapa)
class HistorialEtapaAdmin(admin.ModelAdmin):
    """Admin para historial de cambios de etapa"""
    list_display = [
        'oportunidad',
        'fecha_cambio',
        'etapa_anterior_display',
        'etapa_nueva_display',
        'cambiado_por',
        'observaciones_cortas'
    ]
    list_filter = ['fecha_cambio', 'etapa_anterior', 'etapa_nueva', 'cambiado_por']
    search_fields = ['oportunidad__codigo', 'observaciones']
    ordering = ['-fecha_cambio']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'fecha_cambio'

    fieldsets = (
        ('Información del Cambio', {
            'fields': (
                'oportunidad',
                'fecha_cambio',
                'etapa_anterior',
                'etapa_nueva',
                'cambiado_por',
                'observaciones'
            )
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def etapa_anterior_display(self, obj):
        """Muestra etapa anterior con color"""
        if obj.etapa_anterior:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 6px; '
                'border-radius: 3px; font-size: 10px;">{}</span>',
                obj.etapa_anterior.color,
                obj.etapa_anterior.codigo
            )
        return '-'
    etapa_anterior_display.short_description = 'Desde'

    def etapa_nueva_display(self, obj):
        """Muestra etapa nueva con color"""
        if obj.etapa_nueva:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 6px; '
                'border-radius: 3px; font-size: 10px;">{}</span>',
                obj.etapa_nueva.color,
                obj.etapa_nueva.codigo
            )
        return '-'
    etapa_nueva_display.short_description = 'Hacia'

    def observaciones_cortas(self, obj):
        """Muestra observaciones truncadas"""
        if obj.observaciones:
            if len(obj.observaciones) > 50:
                return obj.observaciones[:50] + '...'
            return obj.observaciones
        return '-'
    observaciones_cortas.short_description = 'Observaciones'

    def has_add_permission(self, request):
        """No permitir agregar manualmente"""
        return False

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar"""
        return False
