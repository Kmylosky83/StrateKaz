"""
Admin para Activos Fijos - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte

Configuración de Django Admin para:
- Categoría de Activo
- Activo Fijo
- Hoja de Vida de Activo
- Programa de Mantenimiento
- Depreciación
- Baja de Activo

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CategoriaActivo, ActivoFijo, HojaVidaActivo,
    ProgramaMantenimiento, Depreciacion, Baja
)


# ==============================================================================
# ADMIN: CATEGORÍA DE ACTIVO
# ==============================================================================

@admin.register(CategoriaActivo)
class CategoriaActivoAdmin(admin.ModelAdmin):
    """Admin para CategoriaActivo."""

    list_display = [
        'codigo', 'nombre', 'vida_util_anios', 'metodo_depreciacion',
        'cantidad_activos', 'is_active'
    ]
    list_filter = ['metodo_depreciacion', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['vida_util_meses', 'created_at', 'updated_at']
    ordering = ['codigo']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Depreciación', {
            'fields': ('vida_util_anios', 'vida_util_meses', 'metodo_depreciacion')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def cantidad_activos(self, obj):
        """Cantidad de activos activos en esta categoría."""
        return obj.activos.filter(is_active=True, estado__in=['activo', 'en_mantenimiento']).count()
    cantidad_activos.short_description = 'Activos'


# ==============================================================================
# ADMIN: ACTIVO FIJO
# ==============================================================================

@admin.register(ActivoFijo)
class ActivoFijoAdmin(admin.ModelAdmin):
    """Admin para ActivoFijo."""

    list_display = [
        'codigo', 'nombre', 'categoria', 'fecha_adquisicion',
        'valor_adquisicion', 'valor_en_libros_display', 'estado_badge', 'ubicacion'
    ]
    list_filter = ['categoria', 'estado', 'area', 'fecha_adquisicion']
    search_fields = ['codigo', 'nombre', 'numero_serie', 'marca', 'modelo', 'ubicacion']
    readonly_fields = [
        'codigo', 'valor_depreciable', 'depreciacion_mensual',
        'depreciacion_acumulada', 'valor_en_libros', 'meses_desde_adquisicion',
        'porcentaje_depreciacion', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_adquisicion'
    raw_id_fields = ['categoria', 'area', 'responsable']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'categoria', 'descripcion')
        }),
        ('Características', {
            'fields': ('numero_serie', 'marca', 'modelo')
        }),
        ('Valores', {
            'fields': (
                'fecha_adquisicion', 'valor_adquisicion', 'valor_residual',
                'valor_depreciable', 'depreciacion_mensual'
            )
        }),
        ('Depreciación Calculada', {
            'fields': (
                'meses_desde_adquisicion', 'depreciacion_acumulada',
                'valor_en_libros', 'porcentaje_depreciacion'
            )
        }),
        ('Ubicación y Responsable', {
            'fields': ('ubicacion', 'area', 'responsable')
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def valor_en_libros_display(self, obj):
        """Muestra el valor en libros formateado."""
        return f"${obj.valor_en_libros:,.2f}"
    valor_en_libros_display.short_description = 'Valor en Libros'

    def estado_badge(self, obj):
        """Badge de estado con color."""
        colors = {
            'activo': 'green',
            'en_mantenimiento': 'orange',
            'dado_baja': 'red',
        }
        color = colors.get(obj.estado, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN: HOJA DE VIDA DE ACTIVO
# ==============================================================================

@admin.register(HojaVidaActivo)
class HojaVidaActivoAdmin(admin.ModelAdmin):
    """Admin para HojaVidaActivo."""

    list_display = [
        'codigo', 'activo', 'tipo_evento_badge', 'fecha', 'descripcion_corta',
        'costo', 'realizado_por'
    ]
    list_filter = ['tipo_evento', 'fecha', 'activo__categoria']
    search_fields = ['codigo', 'activo__codigo', 'activo__nombre', 'descripcion']
    readonly_fields = ['codigo', 'created_at', 'updated_at']
    date_hierarchy = 'fecha'
    raw_id_fields = ['activo', 'realizado_por']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'activo', 'tipo_evento', 'fecha')
        }),
        ('Detalle', {
            'fields': ('descripcion', 'costo', 'realizado_por', 'documento_soporte')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        """Descripción truncada."""
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'

    def tipo_evento_badge(self, obj):
        """Badge de tipo de evento con color."""
        colors = {
            'adquisicion': 'blue',
            'mantenimiento_preventivo': 'green',
            'mantenimiento_correctivo': 'orange',
            'reparacion': 'yellow',
            'mejora': 'cyan',
            'traslado': 'purple',
            'reactivacion': 'teal',
            'baja': 'red',
        }
        color = colors.get(obj.tipo_evento, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_tipo_evento_display()
        )
    tipo_evento_badge.short_description = 'Tipo'


# ==============================================================================
# ADMIN: PROGRAMA DE MANTENIMIENTO
# ==============================================================================

@admin.register(ProgramaMantenimiento)
class ProgramaMantenimientoAdmin(admin.ModelAdmin):
    """Admin para ProgramaMantenimiento."""

    list_display = [
        'activo', 'tipo_badge', 'frecuencia_dias', 'ultima_fecha',
        'proxima_fecha', 'dias_para_mantenimiento_display', 'estado_badge'
    ]
    list_filter = ['tipo', 'estado', 'activo__categoria']
    search_fields = ['activo__codigo', 'activo__nombre', 'descripcion']
    readonly_fields = ['esta_vencido', 'dias_para_mantenimiento', 'created_at', 'updated_at']
    date_hierarchy = 'proxima_fecha'
    raw_id_fields = ['activo', 'responsable']

    fieldsets = (
        ('Activo', {
            'fields': ('activo',)
        }),
        ('Programa', {
            'fields': ('tipo', 'descripcion', 'frecuencia_dias')
        }),
        ('Fechas', {
            'fields': ('ultima_fecha', 'proxima_fecha', 'dias_para_mantenimiento', 'esta_vencido')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def tipo_badge(self, obj):
        """Badge de tipo con color."""
        colors = {
            'preventivo': 'green',
            'correctivo': 'orange',
            'predictivo': 'blue',
        }
        color = colors.get(obj.tipo, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_tipo_display()
        )
    tipo_badge.short_description = 'Tipo'

    def estado_badge(self, obj):
        """Badge de estado con color."""
        colors = {
            'activo': 'green',
            'suspendido': 'orange',
            'completado': 'blue',
        }
        color = colors.get(obj.estado, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def dias_para_mantenimiento_display(self, obj):
        """Muestra días con color según urgencia."""
        dias = obj.dias_para_mantenimiento
        if dias is None:
            return '-'
        if dias < 0:
            return format_html('<span style="color: red; font-weight: bold;">Vencido ({})</span>', dias)
        elif dias <= 7:
            return format_html('<span style="color: orange; font-weight: bold;">{} días</span>', dias)
        return f'{dias} días'
    dias_para_mantenimiento_display.short_description = 'Días'


# ==============================================================================
# ADMIN: DEPRECIACIÓN
# ==============================================================================

@admin.register(Depreciacion)
class DepreciacionAdmin(admin.ModelAdmin):
    """Admin para Depreciacion."""

    list_display = [
        'activo', 'periodo_display', 'valor_inicial',
        'depreciacion_periodo', 'depreciacion_acumulada', 'valor_en_libros'
    ]
    list_filter = ['periodo_anio', 'periodo_mes', 'activo__categoria']
    search_fields = ['activo__codigo', 'activo__nombre']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['activo']

    fieldsets = (
        ('Activo', {
            'fields': ('activo',)
        }),
        ('Período', {
            'fields': ('periodo_mes', 'periodo_anio')
        }),
        ('Valores', {
            'fields': ('valor_inicial', 'depreciacion_periodo', 'depreciacion_acumulada', 'valor_en_libros')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def periodo_display(self, obj):
        """Muestra período en formato MM/YYYY."""
        return f"{obj.periodo_mes:02d}/{obj.periodo_anio}"
    periodo_display.short_description = 'Período'


# ==============================================================================
# ADMIN: BAJA DE ACTIVO
# ==============================================================================

@admin.register(Baja)
class BajaAdmin(admin.ModelAdmin):
    """Admin para Baja."""

    list_display = [
        'activo', 'fecha_baja', 'motivo_badge', 'valor_residual_real',
        'diferencia_display', 'aprobado_por', 'fecha_aprobacion'
    ]
    list_filter = ['motivo', 'fecha_baja', 'aprobado_por']
    search_fields = ['activo__codigo', 'activo__nombre', 'observaciones']
    readonly_fields = ['diferencia_valor_residual', 'created_at', 'updated_at']
    date_hierarchy = 'fecha_baja'
    raw_id_fields = ['activo', 'aprobado_por']

    fieldsets = (
        ('Activo', {
            'fields': ('activo',)
        }),
        ('Baja', {
            'fields': ('fecha_baja', 'motivo', 'valor_residual_real', 'diferencia_valor_residual')
        }),
        ('Documentación', {
            'fields': ('acta_baja', 'observaciones')
        }),
        ('Aprobación', {
            'fields': ('aprobado_por', 'fecha_aprobacion')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def motivo_badge(self, obj):
        """Badge de motivo con color."""
        colors = {
            'obsolescencia': 'gray',
            'deterioro': 'orange',
            'venta': 'green',
            'donacion': 'blue',
            'robo': 'red',
            'siniestro': 'darkred',
            'otro': 'purple',
        }
        color = colors.get(obj.motivo, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_motivo_display()
        )
    motivo_badge.short_description = 'Motivo'

    def diferencia_display(self, obj):
        """Muestra la diferencia con color."""
        diferencia = obj.diferencia_valor_residual
        if diferencia > 0:
            return format_html('<span style="color: green;">+${:,.2f}</span>', diferencia)
        elif diferencia < 0:
            return format_html('<span style="color: red;">${:,.2f}</span>', diferencia)
        return '$0.00'
    diferencia_display.short_description = 'Diferencia'
