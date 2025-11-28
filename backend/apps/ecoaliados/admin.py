"""
Admin del módulo Ecoaliados
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Ecoaliado, HistorialPrecioEcoaliado


@admin.register(Ecoaliado)
class EcoaliadoAdmin(admin.ModelAdmin):
    """Admin para el modelo Ecoaliado"""

    list_display = [
        'codigo',
        'razon_social',
        'documento_numero',
        'unidad_negocio_display',
        'comercial_asignado_display',
        'ciudad',
        'precio_compra_kg',
        'is_active_display',
        'created_at',
    ]

    list_filter = [
        'is_active',
        'documento_tipo',
        'unidad_negocio',
        'comercial_asignado',
        'ciudad',
        'departamento',
        'deleted_at',
    ]

    search_fields = [
        'codigo',
        'razon_social',
        'documento_numero',
        'telefono',
        'email',
    ]

    readonly_fields = [
        'codigo',
        'created_by',
        'created_at',
        'updated_at',
        'deleted_at',
        'is_deleted',
        'tiene_geolocalizacion',
    ]

    fieldsets = (
        ('Identificación', {
            'fields': (
                'codigo',
                'razon_social',
                'documento_tipo',
                'documento_numero',
            )
        }),
        ('Relación con Unidad de Negocio', {
            'fields': (
                'unidad_negocio',
                'comercial_asignado',
            )
        }),
        ('Información de Contacto', {
            'fields': (
                'telefono',
                'email',
                'direccion',
                'ciudad',
                'departamento',
            )
        }),
        ('Geolocalización', {
            'fields': (
                'latitud',
                'longitud',
                'tiene_geolocalizacion',
            ),
            'classes': ('collapse',),
        }),
        ('Precio', {
            'fields': (
                'precio_compra_kg',
            )
        }),
        ('Información Adicional', {
            'fields': (
                'observaciones',
            ),
            'classes': ('collapse',),
        }),
        ('Estado', {
            'fields': (
                'is_active',
                'is_deleted',
            )
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

    ordering = ['-created_at']

    def unidad_negocio_display(self, obj):
        """Mostrar nombre de la unidad de negocio"""
        return obj.unidad_negocio.nombre_comercial if obj.unidad_negocio else '-'
    unidad_negocio_display.short_description = 'Unidad de Negocio'

    def comercial_asignado_display(self, obj):
        """Mostrar nombre del comercial asignado"""
        return obj.comercial_asignado.get_full_name() if obj.comercial_asignado else '-'
    comercial_asignado_display.short_description = 'Comercial Asignado'

    def is_active_display(self, obj):
        """Mostrar estado activo/inactivo con colores"""
        if obj.is_deleted:
            return format_html(
                '<span style="color: red; font-weight: bold;">ELIMINADO</span>'
            )
        elif obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ ACTIVO</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">✗ INACTIVO</span>'
            )
    is_active_display.short_description = 'Estado'

    def get_queryset(self, request):
        """Incluir relaciones para optimizar consultas"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'unidad_negocio',
            'comercial_asignado',
            'created_by'
        )

    def has_delete_permission(self, request, obj=None):
        """Deshabilitar eliminación dura - usar soft delete"""
        return False


@admin.register(HistorialPrecioEcoaliado)
class HistorialPrecioEcoaliadoAdmin(admin.ModelAdmin):
    """Admin para el modelo HistorialPrecioEcoaliado"""

    list_display = [
        'fecha_modificacion',
        'ecoaliado_codigo',
        'ecoaliado_razon_social',
        'precio_anterior',
        'precio_nuevo',
        'diferencia_display',
        'tipo_cambio_display',
        'modificado_por_display',
    ]

    list_filter = [
        'tipo_cambio',
        'fecha_modificacion',
        'ecoaliado__unidad_negocio',
        'modificado_por',
    ]

    search_fields = [
        'ecoaliado__codigo',
        'ecoaliado__razon_social',
        'justificacion',
    ]

    readonly_fields = [
        'ecoaliado',
        'precio_anterior',
        'precio_nuevo',
        'tipo_cambio',
        'justificacion',
        'modificado_por',
        'fecha_modificacion',
        'diferencia_precio',
        'porcentaje_cambio',
    ]

    fieldsets = (
        ('Ecoaliado', {
            'fields': (
                'ecoaliado',
            )
        }),
        ('Cambio de Precio', {
            'fields': (
                'precio_anterior',
                'precio_nuevo',
                'diferencia_precio',
                'porcentaje_cambio',
                'tipo_cambio',
            )
        }),
        ('Justificación', {
            'fields': (
                'justificacion',
            )
        }),
        ('Auditoría', {
            'fields': (
                'modificado_por',
                'fecha_modificacion',
            )
        }),
    )

    ordering = ['-fecha_modificacion']

    def ecoaliado_codigo(self, obj):
        """Mostrar código del ecoaliado"""
        return obj.ecoaliado.codigo
    ecoaliado_codigo.short_description = 'Código'

    def ecoaliado_razon_social(self, obj):
        """Mostrar razón social del ecoaliado"""
        return obj.ecoaliado.razon_social
    ecoaliado_razon_social.short_description = 'Razón Social'

    def diferencia_display(self, obj):
        """Mostrar diferencia de precio con colores"""
        diff = obj.diferencia_precio
        if diff is None:
            return '-'

        if diff > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">+${:.2f}</span>',
                diff
            )
        elif diff < 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">-${:.2f}</span>',
                abs(diff)
            )
        else:
            return '$0.00'
    diferencia_display.short_description = 'Diferencia'

    def tipo_cambio_display(self, obj):
        """Mostrar tipo de cambio con colores"""
        tipo_map = {
            'CREACION': ('blue', '🆕'),
            'AUMENTO': ('green', '↑'),
            'DISMINUCION': ('red', '↓'),
            'AJUSTE': ('orange', '↔'),
        }
        color, icono = tipo_map.get(obj.tipo_cambio, ('black', ''))
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {}</span>',
            color,
            icono,
            obj.get_tipo_cambio_display()
        )
    tipo_cambio_display.short_description = 'Tipo de Cambio'

    def modificado_por_display(self, obj):
        """Mostrar nombre del usuario que modificó"""
        return obj.modificado_por.get_full_name() if obj.modificado_por else '-'
    modificado_por_display.short_description = 'Modificado Por'

    def get_queryset(self, request):
        """Incluir relaciones para optimizar consultas"""
        qs = super().get_queryset(request)
        return qs.select_related(
            'ecoaliado',
            'modificado_por'
        )

    def has_add_permission(self, request):
        """Deshabilitar creación manual - se crea automáticamente"""
        return False

    def has_change_permission(self, request, obj=None):
        """Deshabilitar edición - es un registro de auditoría"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Deshabilitar eliminación - es un registro de auditoría"""
        return False
