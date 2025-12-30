"""
Admin para Servicios Generales - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte

Configuración de Django Admin para:
- Mantenimiento Locativo
- Servicios Públicos
- Contratos de Servicio

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import MantenimientoLocativo, ServicioPublico, ContratoServicio


# ==============================================================================
# ADMIN: MANTENIMIENTO LOCATIVO
# ==============================================================================

@admin.register(MantenimientoLocativo)
class MantenimientoLocativoAdmin(admin.ModelAdmin):
    """Admin para MantenimientoLocativo."""

    list_display = [
        'codigo', 'tipo', 'ubicacion', 'fecha_solicitud',
        'fecha_programada', 'responsable', 'proveedor',
        'costo_estimado', 'costo_real', 'estado_badge'
    ]
    list_filter = ['tipo', 'estado', 'responsable', 'fecha_solicitud']
    search_fields = ['codigo', 'ubicacion', 'descripcion_trabajo']
    readonly_fields = [
        'codigo', 'variacion_costo', 'porcentaje_variacion',
        'dias_hasta_programacion', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_solicitud'

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'tipo', 'ubicacion', 'descripcion_trabajo')
        }),
        ('Fechas', {
            'fields': (
                'fecha_solicitud', 'fecha_programada', 'fecha_ejecucion',
                'dias_hasta_programacion'
            )
        }),
        ('Responsables', {
            'fields': ('responsable', 'proveedor')
        }),
        ('Costos', {
            'fields': (
                'costo_estimado', 'costo_real',
                'variacion_costo', 'porcentaje_variacion'
            )
        }),
        ('Estado y Observaciones', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge de estado con color."""
        colors = {
            'solicitado': 'gray',
            'programado': 'blue',
            'en_ejecucion': 'orange',
            'completado': 'green',
            'cancelado': 'red',
        }
        color = colors.get(obj.estado, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN: SERVICIO PÚBLICO
# ==============================================================================

@admin.register(ServicioPublico)
class ServicioPublicoAdmin(admin.ModelAdmin):
    """Admin para ServicioPublico."""

    list_display = [
        'codigo', 'tipo_servicio', 'proveedor_nombre',
        'periodo_display', 'fecha_vencimiento', 'valor',
        'estado_pago_badge', 'alerta_vencimiento'
    ]
    list_filter = ['tipo_servicio', 'estado_pago', 'periodo_anio', 'periodo_mes']
    search_fields = ['codigo', 'proveedor_nombre', 'numero_cuenta', 'ubicacion']
    readonly_fields = [
        'codigo', 'dias_para_vencimiento', 'esta_vencido',
        'proximo_a_vencer', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_vencimiento'

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'tipo_servicio', 'proveedor_nombre', 'numero_cuenta', 'ubicacion')
        }),
        ('Período', {
            'fields': ('periodo_mes', 'periodo_anio', 'fecha_vencimiento', 'dias_para_vencimiento')
        }),
        ('Valor y Estado', {
            'fields': ('valor', 'estado_pago', 'esta_vencido', 'proximo_a_vencer')
        }),
        ('Consumo', {
            'fields': ('consumo', 'unidad_medida')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def periodo_display(self, obj):
        """Muestra período en formato MM/YYYY."""
        return f"{obj.periodo_mes:02d}/{obj.periodo_anio}"
    periodo_display.short_description = 'Período'

    def estado_pago_badge(self, obj):
        """Badge de estado de pago con color."""
        colors = {
            'pendiente': 'orange',
            'pagado': 'green',
            'vencido': 'red',
        }
        color = colors.get(obj.estado_pago, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_pago_display()
        )
    estado_pago_badge.short_description = 'Estado Pago'

    def alerta_vencimiento(self, obj):
        """Muestra alerta si está próximo a vencer o vencido."""
        if obj.esta_vencido:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠ VENCIDO</span>'
            )
        elif obj.proximo_a_vencer:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠ Próximo a vencer</span>'
            )
        return '-'
    alerta_vencimiento.short_description = 'Alerta'


# ==============================================================================
# ADMIN: CONTRATO DE SERVICIO
# ==============================================================================

@admin.register(ContratoServicio)
class ContratoServicioAdmin(admin.ModelAdmin):
    """Admin para ContratoServicio."""

    list_display = [
        'codigo', 'proveedor', 'tipo_servicio', 'fecha_inicio',
        'fecha_fin', 'valor_mensual', 'valor_total',
        'estado_badge', 'alerta_vencimiento'
    ]
    list_filter = ['tipo_servicio', 'estado', 'frecuencia_pago']
    search_fields = ['codigo', 'proveedor__razon_social', 'objeto']
    readonly_fields = [
        'codigo', 'dias_para_vencimiento', 'contrato_vigente',
        'contrato_vencido', 'proximo_a_vencer', 'duracion_dias',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_inicio'

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'proveedor', 'tipo_servicio', 'objeto')
        }),
        ('Vigencia', {
            'fields': (
                'fecha_inicio', 'fecha_fin', 'duracion_dias',
                'dias_para_vencimiento', 'contrato_vigente',
                'contrato_vencido', 'proximo_a_vencer'
            )
        }),
        ('Valores', {
            'fields': ('valor_mensual', 'valor_total', 'frecuencia_pago')
        }),
        ('Estado y Observaciones', {
            'fields': ('estado', 'observaciones')
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge de estado con color."""
        colors = {
            'vigente': 'green',
            'vencido': 'red',
            'terminado': 'gray',
        }
        color = colors.get(obj.estado, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def alerta_vencimiento(self, obj):
        """Muestra alerta si está próximo a vencer."""
        if obj.contrato_vencido:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠ VENCIDO</span>'
            )
        elif obj.proximo_a_vencer:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠ Próximo a vencer</span>'
            )
        return '-'
    alerta_vencimiento.short_description = 'Alerta'
