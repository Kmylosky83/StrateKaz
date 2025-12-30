"""
Admin para Mantenimiento de Equipos - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Admin configurado para modelos de catálogo dinámicos.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    # Catálogos dinámicos
    TipoActivo,
    TipoMantenimiento,
    # Activos
    ActivoProduccion,
    EquipoMedicion,
    # Planificación
    PlanMantenimiento,
    # Ejecución
    OrdenTrabajo,
    Calibracion,
    Parada,
)


# ==============================================================================
# ADMIN PARA CATÁLOGOS DINÁMICOS
# ==============================================================================

@admin.register(TipoActivo)
class TipoActivoAdmin(admin.ModelAdmin):
    """Admin para Tipos de Activo."""
    list_display = [
        'codigo', 'nombre', 'vida_util_anios', 'depreciacion_anual',
        'requiere_calibracion', 'orden', 'activo'
    ]
    list_filter = ['activo', 'requiere_calibracion']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'activo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden', 'activo')
        }),
        ('Depreciación', {
            'fields': ('vida_util_anios', 'depreciacion_anual')
        }),
        ('Calibración', {
            'fields': ('requiere_calibracion', 'frecuencia_calibracion_meses')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TipoMantenimiento)
class TipoMantenimientoAdmin(admin.ModelAdmin):
    """Admin para Tipos de Mantenimiento."""
    list_display = [
        'codigo', 'nombre', 'es_preventivo', 'es_correctivo',
        'es_predictivo', 'frecuencia_dias', 'orden', 'activo'
    ]
    list_filter = ['activo', 'es_preventivo', 'es_correctivo', 'es_predictivo']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'activo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden', 'activo')
        }),
        ('Clasificación', {
            'fields': ('es_preventivo', 'es_correctivo', 'es_predictivo')
        }),
        ('Frecuencia', {
            'fields': ('frecuencia_dias',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ==============================================================================
# ADMIN PARA ACTIVOS
# ==============================================================================

@admin.register(ActivoProduccion)
class ActivoProduccionAdmin(admin.ModelAdmin):
    """Admin para Activos de Producción."""
    list_display = [
        'codigo', 'nombre', 'tipo_activo', 'linea_produccion',
        'estado_badge', 'valor_actual', 'fecha_proximo_mantenimiento',
        'mantenimiento_badge'
    ]
    list_filter = ['estado', 'tipo_activo', 'linea_produccion', 'empresa']
    search_fields = ['codigo', 'nombre', 'marca', 'modelo', 'numero_serie']
    ordering = ['codigo']
    raw_id_fields = ['empresa', 'tipo_activo', 'linea_produccion', 'created_by']
    readonly_fields = [
        'codigo', 'valor_actual', 'created_at', 'updated_at'
    ]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa', 'nombre', 'descripcion', 'tipo_activo')
        }),
        ('Clasificación', {
            'fields': ('linea_produccion', 'ubicacion', 'orden')
        }),
        ('Información Técnica', {
            'fields': ('marca', 'modelo', 'numero_serie', 'manual_url')
        }),
        ('Información Financiera', {
            'fields': ('fecha_adquisicion', 'valor_adquisicion', 'valor_actual')
        }),
        ('Mantenimiento', {
            'fields': ('fecha_ultima_revision', 'fecha_proximo_mantenimiento')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        colores = {
            'OPERATIVO': '#28a745',
            'EN_MANTENIMIENTO': '#ffc107',
            'FUERA_SERVICIO': '#dc3545',
            'DADO_DE_BAJA': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.estado, '#6c757d'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def mantenimiento_badge(self, obj):
        if obj.esta_vencido_mantenimiento():
            return format_html('<span style="color: red;">⚠ Vencido</span>')
        elif obj.requiere_mantenimiento_urgente():
            return format_html('<span style="color: orange;">⏰ Urgente</span>')
        return format_html('<span style="color: green;">✓ OK</span>')
    mantenimiento_badge.short_description = 'Mantenimiento'


@admin.register(EquipoMedicion)
class EquipoMedicionAdmin(admin.ModelAdmin):
    """Admin para Equipos de Medición."""
    list_display = [
        'codigo', 'nombre', 'unidad_medida', 'estado_badge',
        'fecha_proxima_calibracion', 'calibracion_badge'
    ]
    list_filter = ['estado', 'empresa']
    search_fields = ['codigo', 'nombre', 'marca', 'modelo', 'numero_serie']
    ordering = ['codigo']
    raw_id_fields = ['empresa', 'activo', 'created_by']
    readonly_fields = ['codigo', 'created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa', 'activo', 'nombre')
        }),
        ('Información Técnica', {
            'fields': ('marca', 'modelo', 'numero_serie')
        }),
        ('Características de Medición', {
            'fields': (
                'rango_medicion_min', 'rango_medicion_max', 'unidad_medida',
                'resolucion', 'exactitud'
            )
        }),
        ('Calibración', {
            'fields': (
                'fecha_calibracion', 'fecha_proxima_calibracion',
                'certificado_calibracion_url'
            )
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        colores = {
            'OPERATIVO': '#28a745',
            'EN_CALIBRACION': '#ffc107',
            'FUERA_SERVICIO': '#dc3545',
            'DADO_DE_BAJA': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.estado, '#6c757d'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def calibracion_badge(self, obj):
        if obj.esta_vencida_calibracion():
            return format_html('<span style="color: red;">⚠ Vencida</span>')
        elif obj.requiere_calibracion_urgente():
            return format_html('<span style="color: orange;">⏰ Próxima</span>')
        return format_html('<span style="color: green;">✓ OK</span>')
    calibracion_badge.short_description = 'Calibración'


# ==============================================================================
# ADMIN PARA PLANIFICACIÓN
# ==============================================================================

@admin.register(PlanMantenimiento)
class PlanMantenimientoAdmin(admin.ModelAdmin):
    """Admin para Planes de Mantenimiento."""
    list_display = [
        'nombre', 'activo', 'tipo_mantenimiento', 'frecuencia_dias',
        'proxima_ejecucion', 'plan_badge', 'activo_plan'
    ]
    list_filter = ['activo_plan', 'tipo_mantenimiento', 'empresa']
    search_fields = ['nombre', 'activo__codigo', 'activo__nombre']
    ordering = ['proxima_ejecucion']
    raw_id_fields = ['empresa', 'activo', 'tipo_mantenimiento', 'created_by']
    readonly_fields = ['proxima_ejecucion', 'created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'nombre', 'descripcion')
        }),
        ('Relaciones', {
            'fields': ('activo', 'tipo_mantenimiento')
        }),
        ('Frecuencia', {
            'fields': ('frecuencia_dias', 'frecuencia_horas_uso')
        }),
        ('Detalles del Mantenimiento', {
            'fields': ('tareas_realizar', 'repuestos_necesarios')
        }),
        ('Estimaciones', {
            'fields': ('tiempo_estimado_horas', 'costo_estimado')
        }),
        ('Control de Ejecución', {
            'fields': ('ultima_ejecucion', 'proxima_ejecucion', 'activo_plan')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def plan_badge(self, obj):
        if obj.esta_vencido():
            return format_html('<span style="color: red;">⚠ Vencido</span>')
        elif obj.requiere_ejecucion_urgente():
            return format_html('<span style="color: orange;">⏰ Próximo</span>')
        return format_html('<span style="color: green;">✓ OK</span>')
    plan_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN PARA EJECUCIÓN
# ==============================================================================

@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    """Admin para Órdenes de Trabajo."""
    list_display = [
        'codigo', 'activo', 'tipo_mantenimiento', 'prioridad_badge',
        'estado_badge', 'fecha_programada', 'asignado_a', 'costo_total'
    ]
    list_filter = ['estado', 'prioridad', 'tipo_mantenimiento', 'empresa']
    search_fields = ['codigo', 'descripcion_problema', 'activo__codigo', 'activo__nombre']
    ordering = ['-fecha_solicitud']
    raw_id_fields = [
        'empresa', 'activo', 'tipo_mantenimiento', 'plan_mantenimiento',
        'solicitante', 'asignado_a', 'created_by'
    ]
    readonly_fields = ['codigo', 'costo_total', 'created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa')
        }),
        ('Relaciones', {
            'fields': ('activo', 'tipo_mantenimiento', 'plan_mantenimiento')
        }),
        ('Clasificación', {
            'fields': ('prioridad', 'estado')
        }),
        ('Fechas', {
            'fields': (
                'fecha_solicitud', 'fecha_programada',
                'fecha_inicio', 'fecha_fin'
            )
        }),
        ('Descripción del Trabajo', {
            'fields': ('descripcion_problema', 'descripcion_trabajo_realizado')
        }),
        ('Personal', {
            'fields': ('solicitante', 'asignado_a')
        }),
        ('Costos', {
            'fields': (
                'horas_trabajadas', 'costo_mano_obra',
                'costo_repuestos', 'costo_total'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def prioridad_badge(self, obj):
        colores = {
            1: '#dc3545',  # Crítica
            2: '#fd7e14',  # Alta
            3: '#ffc107',  # Media
            4: '#17a2b8',  # Baja
            5: '#6c757d',  # Muy Baja
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.prioridad, '#6c757d'),
            obj.get_prioridad_display()
        )
    prioridad_badge.short_description = 'Prioridad'

    def estado_badge(self, obj):
        colores = {
            'ABIERTA': '#17a2b8',
            'EN_PROCESO': '#ffc107',
            'COMPLETADA': '#28a745',
            'CANCELADA': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.estado, '#6c757d'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


@admin.register(Calibracion)
class CalibracionAdmin(admin.ModelAdmin):
    """Admin para Calibraciones."""
    list_display = [
        'numero_certificado', 'equipo', 'fecha_calibracion',
        'fecha_vencimiento', 'resultado_badge', 'laboratorio_calibrador'
    ]
    list_filter = ['resultado', 'empresa']
    search_fields = [
        'numero_certificado', 'laboratorio_calibrador',
        'equipo__codigo', 'equipo__nombre'
    ]
    ordering = ['-fecha_calibracion']
    raw_id_fields = ['empresa', 'equipo', 'responsable', 'created_by']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'equipo')
        }),
        ('Fechas', {
            'fields': ('fecha_calibracion', 'fecha_vencimiento')
        }),
        ('Datos del Certificado', {
            'fields': ('numero_certificado', 'laboratorio_calibrador')
        }),
        ('Resultado', {
            'fields': ('resultado',)
        }),
        ('Datos Técnicos', {
            'fields': ('patron_utilizado', 'incertidumbre_medicion')
        }),
        ('Valores de Calibración', {
            'fields': ('valores_antes', 'valores_despues')
        }),
        ('Documentación', {
            'fields': ('certificado_url',)
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def resultado_badge(self, obj):
        colores = {
            'APROBADO': '#28a745',
            'AJUSTADO': '#ffc107',
            'RECHAZADO': '#dc3545',
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.resultado, '#6c757d'),
            obj.get_resultado_display()
        )
    resultado_badge.short_description = 'Resultado'


@admin.register(Parada)
class ParadaAdmin(admin.ModelAdmin):
    """Admin para Paradas No Programadas."""
    list_display = [
        'activo', 'fecha_inicio', 'fecha_fin', 'duracion_horas',
        'tipo_badge', 'impacto_produccion_kg', 'estado_parada'
    ]
    list_filter = ['tipo', 'empresa']
    search_fields = ['causa', 'descripcion_falla', 'activo__codigo', 'activo__nombre']
    ordering = ['-fecha_inicio']
    raw_id_fields = ['empresa', 'activo', 'orden_trabajo', 'reportado_por', 'created_by']
    readonly_fields = ['duracion_horas', 'created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'activo')
        }),
        ('Tiempo de Parada', {
            'fields': ('fecha_inicio', 'fecha_fin', 'duracion_horas')
        }),
        ('Clasificación', {
            'fields': ('tipo', 'causa')
        }),
        ('Descripción', {
            'fields': ('descripcion_falla',)
        }),
        ('Impacto', {
            'fields': ('impacto_produccion_kg', 'costo_estimado_parada')
        }),
        ('Orden de Trabajo', {
            'fields': ('orden_trabajo',)
        }),
        ('Acciones Correctivas', {
            'fields': ('acciones_correctivas',)
        }),
        ('Responsable', {
            'fields': ('reportado_por',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def tipo_badge(self, obj):
        colores = {
            'FALLA_MECANICA': '#dc3545',
            'FALLA_ELECTRICA': '#fd7e14',
            'FALTA_REPUESTOS': '#ffc107',
            'FALTA_OPERADOR': '#17a2b8',
            'OTRO': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white; border-radius: 3px;">{}</span>',
            colores.get(obj.tipo, '#6c757d'),
            obj.get_tipo_display()
        )
    tipo_badge.short_description = 'Tipo'

    def estado_parada(self, obj):
        if obj.esta_activa():
            return format_html('<span style="color: red;">● ACTIVA</span>')
        return format_html('<span style="color: gray;">○ Cerrada</span>')
    estado_parada.short_description = 'Estado'
