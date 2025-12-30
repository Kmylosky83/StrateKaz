"""
Admin de Novedades - Talent Hub

Configuración del panel de administración para incapacidades, licencias, permisos y vacaciones.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    TipoIncapacidad,
    Incapacidad,
    TipoLicencia,
    Licencia,
    Permiso,
    PeriodoVacaciones,
    SolicitudVacaciones
)


# =============================================================================
# TIPOS DE INCAPACIDAD Y LICENCIA
# =============================================================================

@admin.register(TipoIncapacidad)
class TipoIncapacidadAdmin(admin.ModelAdmin):
    """Admin para tipos de incapacidad"""
    list_display = [
        'codigo', 'nombre', 'origen', 'porcentaje_pago',
        'dias_maximos', 'requiere_prorroga', 'is_active'
    ]
    list_filter = ['origen', 'requiere_prorroga', 'is_active', 'empresa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'empresa')
        }),
        ('Configuración', {
            'fields': ('origen', 'porcentaje_pago', 'dias_maximos', 'requiere_prorroga')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TipoLicencia)
class TipoLicenciaAdmin(admin.ModelAdmin):
    """Admin para tipos de licencia"""
    list_display = [
        'codigo', 'nombre', 'categoria', 'dias_permitidos',
        'requiere_aprobacion', 'is_active'
    ]
    list_filter = ['categoria', 'requiere_aprobacion', 'is_active', 'empresa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'empresa')
        }),
        ('Configuración', {
            'fields': ('categoria', 'dias_permitidos', 'requiere_aprobacion')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# INCAPACIDADES
# =============================================================================

@admin.register(Incapacidad)
class IncapacidadAdmin(admin.ModelAdmin):
    """Admin para incapacidades"""
    list_display = [
        'numero_incapacidad', 'colaborador', 'tipo_incapacidad',
        'fecha_inicio', 'fecha_fin', 'dias_totales', 'estado',
        'eps_arl', 'estado_badge'
    ]
    list_filter = [
        'estado', 'tipo_incapacidad', 'fecha_inicio',
        'empresa', 'is_active'
    ]
    search_fields = [
        'numero_incapacidad', 'colaborador__primer_nombre',
        'colaborador__primer_apellido', 'diagnostico', 'codigo_cie10'
    ]
    date_hierarchy = 'fecha_inicio'
    ordering = ['-fecha_inicio']
    readonly_fields = [
        'dias_incapacidad', 'es_prorroga', 'tiene_prorrogas',
        'dias_totales_con_prorrogas', 'created_at', 'updated_at',
        'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empresa', 'colaborador', 'tipo_incapacidad',
                'numero_incapacidad'
            )
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin', 'dias_incapacidad')
        }),
        ('Información Médica', {
            'fields': ('diagnostico', 'codigo_cie10', 'archivo_soporte')
        }),
        ('Entidad y Cobro', {
            'fields': (
                'eps_arl', 'estado', 'fecha_radicacion_cobro',
                'valor_cobrado'
            )
        }),
        ('Prórroga', {
            'fields': (
                'prorroga_de', 'es_prorroga', 'tiene_prorrogas',
                'dias_totales_con_prorrogas'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def dias_totales(self, obj):
        """Días totales de incapacidad"""
        return obj.dias_incapacidad
    dias_totales.short_description = 'Días'

    def estado_badge(self, obj):
        """Badge de estado con color"""
        colors = {
            'pendiente': '#FFA500',
            'aprobada': '#28A745',
            'en_cobro': '#17A2B8',
            'pagada': '#6C757D',
            'rechazada': '#DC3545',
        }
        color = colors.get(obj.estado, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# LICENCIAS
# =============================================================================

@admin.register(Licencia)
class LicenciaAdmin(admin.ModelAdmin):
    """Admin para licencias"""
    list_display = [
        'colaborador', 'tipo_licencia', 'fecha_inicio',
        'fecha_fin', 'dias_solicitados', 'estado', 'estado_badge'
    ]
    list_filter = [
        'estado', 'tipo_licencia', 'fecha_inicio',
        'empresa', 'is_active'
    ]
    search_fields = [
        'colaborador__primer_nombre', 'colaborador__primer_apellido',
        'motivo'
    ]
    date_hierarchy = 'fecha_inicio'
    ordering = ['-fecha_inicio']
    readonly_fields = [
        'dias_solicitados', 'esta_aprobada', 'esta_vigente',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'colaborador', 'tipo_licencia')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin', 'dias_solicitados')
        }),
        ('Motivo y Soporte', {
            'fields': ('motivo', 'archivo_soporte')
        }),
        ('Aprobación', {
            'fields': (
                'estado', 'aprobado_por', 'fecha_aprobacion',
                'observaciones_aprobacion'
            )
        }),
        ('Estado Actual', {
            'fields': ('esta_aprobada', 'esta_vigente')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge de estado con color"""
        colors = {
            'solicitada': '#FFA500',
            'aprobada': '#28A745',
            'rechazada': '#DC3545',
            'cancelada': '#6C757D',
        }
        color = colors.get(obj.estado, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# PERMISOS
# =============================================================================

@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    """Admin para permisos"""
    list_display = [
        'colaborador', 'fecha', 'hora_salida', 'hora_regreso',
        'horas', 'tipo', 'compensable', 'estado', 'estado_badge'
    ]
    list_filter = [
        'estado', 'tipo', 'compensable', 'fecha',
        'empresa', 'is_active'
    ]
    search_fields = [
        'colaborador__primer_nombre', 'colaborador__primer_apellido',
        'motivo'
    ]
    date_hierarchy = 'fecha'
    ordering = ['-fecha', '-hora_salida']
    readonly_fields = [
        'horas_permiso', 'esta_aprobado',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'colaborador', 'fecha')
        }),
        ('Horario', {
            'fields': ('hora_salida', 'hora_regreso', 'horas_permiso')
        }),
        ('Detalles', {
            'fields': ('tipo', 'motivo', 'compensable')
        }),
        ('Aprobación', {
            'fields': ('estado', 'aprobado_por', 'observaciones')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def horas(self, obj):
        """Horas del permiso"""
        return f"{obj.horas_permiso}h"
    horas.short_description = 'Horas'

    def estado_badge(self, obj):
        """Badge de estado con color"""
        colors = {
            'solicitado': '#FFA500',
            'aprobado': '#28A745',
            'rechazado': '#DC3545',
        }
        color = colors.get(obj.estado, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# VACACIONES
# =============================================================================

@admin.register(PeriodoVacaciones)
class PeriodoVacacionesAdmin(admin.ModelAdmin):
    """Admin para períodos de vacaciones"""
    list_display = [
        'colaborador', 'fecha_ingreso', 'dias_derecho_anual',
        'acumulados', 'disfrutados', 'pendientes', 'ultimo_corte'
    ]
    list_filter = ['ultimo_corte', 'empresa', 'is_active']
    search_fields = [
        'colaborador__primer_nombre', 'colaborador__primer_apellido'
    ]
    ordering = ['-ultimo_corte']
    readonly_fields = [
        'dias_pendientes', 'dias_acumulados_actualizados',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'colaborador', 'fecha_ingreso')
        }),
        ('Configuración', {
            'fields': ('dias_derecho_anual',)
        }),
        ('Contador', {
            'fields': (
                'dias_acumulados', 'dias_disfrutados', 'dias_pendientes',
                'dias_acumulados_actualizados', 'ultimo_corte'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def acumulados(self, obj):
        """Días acumulados"""
        return f"{obj.dias_acumulados} días"
    acumulados.short_description = 'Acumulados'

    def disfrutados(self, obj):
        """Días disfrutados"""
        return f"{obj.dias_disfrutados} días"
    disfrutados.short_description = 'Disfrutados'

    def pendientes(self, obj):
        """Días pendientes"""
        return f"{obj.dias_pendientes} días"
    pendientes.short_description = 'Pendientes'


@admin.register(SolicitudVacaciones)
class SolicitudVacacionesAdmin(admin.ModelAdmin):
    """Admin para solicitudes de vacaciones"""
    list_display = [
        'colaborador', 'fecha_inicio', 'fecha_fin',
        'dias_habiles', 'incluye_prima', 'estado', 'estado_badge'
    ]
    list_filter = [
        'estado', 'incluye_prima', 'fecha_inicio',
        'empresa', 'is_active'
    ]
    search_fields = [
        'colaborador__primer_nombre', 'colaborador__primer_apellido',
        'observaciones'
    ]
    date_hierarchy = 'fecha_inicio'
    ordering = ['-fecha_inicio']
    readonly_fields = [
        'dias_habiles', 'dias_calendario', 'esta_aprobada', 'esta_vigente',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa', 'colaborador', 'periodo')
        }),
        ('Fechas', {
            'fields': (
                'fecha_inicio', 'fecha_fin', 'dias_habiles',
                'dias_calendario'
            )
        }),
        ('Configuración', {
            'fields': ('incluye_prima',)
        }),
        ('Aprobación', {
            'fields': (
                'estado', 'aprobado_por', 'fecha_aprobacion',
                'observaciones'
            )
        }),
        ('Estado Actual', {
            'fields': ('esta_aprobada', 'esta_vigente')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge de estado con color"""
        colors = {
            'solicitada': '#FFA500',
            'aprobada': '#28A745',
            'rechazada': '#DC3545',
            'disfrutada': '#6C757D',
            'cancelada': '#6C757D',
        }
        color = colors.get(obj.estado, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
