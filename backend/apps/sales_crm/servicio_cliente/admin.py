"""
Admin para Servicio al Cliente - Sales CRM
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    TipoPQRS, EstadoPQRS, PrioridadPQRS, CanalRecepcion, NivelSatisfaccion,
    PQRS, SeguimientoPQRS,
    EncuestaSatisfaccion, PreguntaEncuesta, RespuestaEncuesta,
    ProgramaFidelizacion, PuntosFidelizacion, MovimientoPuntos
)


# ==============================================================================
# ADMIN DE CATÁLOGOS
# ==============================================================================

@admin.register(TipoPQRS)
class TipoPQRSAdmin(admin.ModelAdmin):
    """Admin para Tipo de PQRS"""
    list_display = [
        'codigo', 'nombre', 'tiempo_respuesta_dias',
        'requiere_investigacion', 'color_badge', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'requiere_investigacion']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración', {
            'fields': (
                'tiempo_respuesta_dias',
                'requiere_investigacion',
                'color_hex',
                'orden'
            )
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )

    def color_badge(self, obj):
        if obj.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
                obj.color_hex,
                obj.nombre
            )
        return obj.nombre
    color_badge.short_description = 'Color'


@admin.register(EstadoPQRS)
class EstadoPQRSAdmin(admin.ModelAdmin):
    """Admin para Estado de PQRS"""
    list_display = [
        'codigo', 'nombre', 'es_inicial', 'es_final',
        'color_badge', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'es_inicial', 'es_final']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('es_inicial', 'es_final', 'color_hex', 'orden')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )

    def color_badge(self, obj):
        if obj.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
                obj.color_hex,
                obj.nombre
            )
        return obj.nombre
    color_badge.short_description = 'Color'


@admin.register(PrioridadPQRS)
class PrioridadPQRSAdmin(admin.ModelAdmin):
    """Admin para Prioridad de PQRS"""
    list_display = [
        'codigo', 'nombre', 'nivel', 'tiempo_sla_horas',
        'color_badge', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'nivel']
    search_fields = ['codigo', 'nombre']
    ordering = ['-nivel', 'orden']
    list_editable = ['orden', 'is_active']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('nivel', 'tiempo_sla_horas', 'color_hex', 'orden')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )

    def color_badge(self, obj):
        if obj.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">Nivel {}</span>',
                obj.color_hex,
                obj.nivel
            )
        return f'Nivel {obj.nivel}'
    color_badge.short_description = 'Prioridad'


@admin.register(CanalRecepcion)
class CanalRecepcionAdmin(admin.ModelAdmin):
    """Admin para Canal de Recepción"""
    list_display = ['codigo', 'nombre', 'icono', 'orden', 'is_active']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(NivelSatisfaccion)
class NivelSatisfaccionAdmin(admin.ModelAdmin):
    """Admin para Nivel de Satisfacción"""
    list_display = ['codigo', 'nombre', 'valor_numerico', 'emoji', 'color_badge', 'orden', 'is_active']
    list_filter = ['is_active', 'valor_numerico']
    search_fields = ['codigo', 'nombre']
    ordering = ['valor_numerico', 'orden']
    list_editable = ['orden', 'is_active']

    def color_badge(self, obj):
        if obj.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{} {}</span>',
                obj.color_hex,
                obj.emoji or '',
                obj.nombre
            )
        return f'{obj.emoji or ""} {obj.nombre}'
    color_badge.short_description = 'Vista'


# ==============================================================================
# ADMIN DE PQRS
# ==============================================================================

class SeguimientoPQRSInline(admin.TabularInline):
    """Inline para Seguimientos de PQRS"""
    model = SeguimientoPQRS
    extra = 0
    fields = ['fecha', 'tipo_accion', 'descripcion', 'es_visible_cliente', 'registrado_por']
    readonly_fields = ['fecha', 'registrado_por']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(PQRS)
class PQRSAdmin(admin.ModelAdmin):
    """Admin para PQRS"""
    list_display = [
        'codigo', 'asunto', 'tipo_badge', 'estado_badge',
        'prioridad_badge', 'contacto_nombre', 'asignado_a',
        'fecha_radicacion', 'sla_badge', 'fecha_respuesta'
    ]
    list_filter = [
        'tipo', 'estado', 'prioridad', 'canal_recepcion',
        'fecha_radicacion', 'requiere_accion_correctiva'
    ]
    search_fields = ['codigo', 'asunto', 'descripcion', 'contacto_nombre', 'contacto_email']
    readonly_fields = [
        'codigo', 'fecha_radicacion', 'fecha_vencimiento_sla',
        'dias_respuesta', 'created_by', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_radicacion'
    ordering = ['-fecha_radicacion']
    inlines = [SeguimientoPQRSInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa', 'fecha_radicacion')
        }),
        ('Información del Cliente', {
            'fields': (
                'cliente', 'contacto_nombre', 'contacto_email', 'contacto_telefono'
            )
        }),
        ('Clasificación', {
            'fields': ('tipo', 'estado', 'prioridad', 'canal_recepcion')
        }),
        ('Contenido', {
            'fields': ('asunto', 'descripcion')
        }),
        ('Gestión', {
            'fields': (
                'asignado_a', 'escalado_a',
                'fecha_vencimiento_sla', 'fecha_respuesta', 'dias_respuesta'
            )
        }),
        ('Relaciones', {
            'fields': ('producto_relacionado', 'pedido_relacionado'),
            'classes': ('collapse',)
        }),
        ('Solución', {
            'fields': ('solucion', 'satisfaccion_cliente'),
            'classes': ('collapse',)
        }),
        ('Mejora Continua', {
            'fields': ('requiere_accion_correctiva', 'accion_correctiva_generada'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('observaciones', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def tipo_badge(self, obj):
        if obj.tipo and obj.tipo.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
                obj.tipo.color_hex,
                obj.tipo.nombre
            )
        return obj.tipo.nombre if obj.tipo else '-'
    tipo_badge.short_description = 'Tipo'

    def estado_badge(self, obj):
        if obj.estado and obj.estado.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
                obj.estado.color_hex,
                obj.estado.nombre
            )
        return obj.estado.nombre if obj.estado else '-'
    estado_badge.short_description = 'Estado'

    def prioridad_badge(self, obj):
        if obj.prioridad and obj.prioridad.color_hex:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
                obj.prioridad.color_hex,
                obj.prioridad.nombre
            )
        return obj.prioridad.nombre if obj.prioridad else '-'
    prioridad_badge.short_description = 'Prioridad'

    def sla_badge(self, obj):
        if obj.esta_vencida:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">VENCIDA</span>'
            )
        elif obj.horas_restantes_sla is not None:
            if obj.horas_restantes_sla <= 24:
                color = '#ffc107'  # Amarillo - Próxima a vencer
            else:
                color = '#28a745'  # Verde - OK
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}h</span>',
                color,
                obj.horas_restantes_sla
            )
        return '-'
    sla_badge.short_description = 'SLA'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related(
            'tipo', 'estado', 'prioridad', 'canal_recepcion',
            'asignado_a', 'cliente', 'created_by'
        ).filter(deleted_at__isnull=True)


@admin.register(SeguimientoPQRS)
class SeguimientoPQRSAdmin(admin.ModelAdmin):
    """Admin para Seguimiento de PQRS"""
    list_display = [
        'pqrs', 'fecha', 'tipo_accion', 'descripcion_corta',
        'es_visible_cliente', 'registrado_por'
    ]
    list_filter = ['tipo_accion', 'es_visible_cliente', 'fecha']
    search_fields = ['pqrs__codigo', 'descripcion']
    readonly_fields = ['fecha', 'registrado_por']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']

    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + '...' if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


# ==============================================================================
# ADMIN DE ENCUESTAS
# ==============================================================================

class RespuestaEncuestaInline(admin.TabularInline):
    """Inline para Respuestas de Encuesta"""
    model = RespuestaEncuesta
    extra = 0
    fields = ['pregunta', 'respuesta_texto', 'respuesta_valor']
    readonly_fields = ['pregunta']


@admin.register(EncuestaSatisfaccion)
class EncuestaSatisfaccionAdmin(admin.ModelAdmin):
    """Admin para Encuesta de Satisfacción"""
    list_display = [
        'codigo', 'cliente', 'estado_badge', 'nps_badge',
        'satisfaccion_badge', 'fecha_envio', 'fecha_respuesta'
    ]
    list_filter = ['estado', 'fecha_envio', 'nps_score']
    search_fields = ['codigo', 'cliente__nombre']
    readonly_fields = [
        'codigo', 'fecha_envio', 'fecha_respuesta',
        'enviada_por', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_envio'
    ordering = ['-fecha_envio']
    inlines = [RespuestaEncuestaInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'empresa', 'cliente')
        }),
        ('Relaciones', {
            'fields': ('pedido', 'factura')
        }),
        ('Fechas', {
            'fields': ('fecha_envio', 'fecha_respuesta', 'fecha_vencimiento')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Resultados', {
            'fields': ('satisfaccion_general', 'nps_score', 'comentarios', 'sugerencias'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('enviada_por', 'observaciones', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        colores = {
            'ENVIADA': '#17a2b8',
            'RESPONDIDA': '#28a745',
            'VENCIDA': '#dc3545',
            'CANCELADA': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            colores.get(obj.estado, '#6c757d'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def nps_badge(self, obj):
        if obj.nps_score is None:
            return '-'

        categoria = obj.categoria_nps
        colores = {
            'PROMOTOR': '#28a745',
            'PASIVO': '#ffc107',
            'DETRACTOR': '#dc3545',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{} ({})</span>',
            colores.get(categoria, '#6c757d'),
            obj.nps_score,
            categoria
        )
    nps_badge.short_description = 'NPS'

    def satisfaccion_badge(self, obj):
        if obj.satisfaccion_general:
            emoji = obj.satisfaccion_general.emoji or ''
            return f'{emoji} {obj.satisfaccion_general.nombre}'
        return '-'
    satisfaccion_badge.short_description = 'Satisfacción'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related(
            'cliente', 'pedido', 'factura', 'satisfaccion_general', 'enviada_por'
        ).filter(deleted_at__isnull=True)


@admin.register(PreguntaEncuesta)
class PreguntaEncuestaAdmin(admin.ModelAdmin):
    """Admin para Pregunta de Encuesta"""
    list_display = [
        'codigo', 'pregunta_corta', 'tipo_respuesta',
        'es_obligatoria', 'orden', 'is_active'
    ]
    list_filter = ['tipo_respuesta', 'es_obligatoria', 'is_active']
    search_fields = ['codigo', 'pregunta']
    ordering = ['orden', 'pregunta']
    list_editable = ['orden', 'is_active']

    def pregunta_corta(self, obj):
        return obj.pregunta[:80] + '...' if len(obj.pregunta) > 80 else obj.pregunta
    pregunta_corta.short_description = 'Pregunta'


# ==============================================================================
# ADMIN DE FIDELIZACIÓN
# ==============================================================================

@admin.register(ProgramaFidelizacion)
class ProgramaFidelizacionAdmin(admin.ModelAdmin):
    """Admin para Programa de Fidelización"""
    list_display = [
        'codigo', 'nombre', 'puntos_por_compra', 'valor_punto',
        'fecha_inicio', 'fecha_fin', 'vigente_badge', 'is_active'
    ]
    list_filter = ['is_active', 'fecha_inicio', 'fecha_fin']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'empresa', 'nombre', 'descripcion')
        }),
        ('Configuración de Puntos', {
            'fields': ('puntos_por_compra', 'valor_punto')
        }),
        ('Niveles', {
            'fields': (
                'nivel_bronce_puntos', 'nivel_plata_puntos', 'nivel_oro_puntos'
            )
        }),
        ('Beneficios', {
            'fields': ('beneficios_bronce', 'beneficios_plata', 'beneficios_oro'),
            'classes': ('collapse',)
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def vigente_badge(self, obj):
        if obj.esta_vigente:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">VIGENTE</span>'
            )
        return format_html(
            '<span style="background-color: #6c757d; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">NO VIGENTE</span>'
        )
    vigente_badge.short_description = 'Estado'


class MovimientoPuntosInline(admin.TabularInline):
    """Inline para Movimientos de Puntos"""
    model = MovimientoPuntos
    extra = 0
    fields = ['fecha', 'tipo', 'puntos', 'factura', 'descripcion']
    readonly_fields = ['fecha']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(PuntosFidelizacion)
class PuntosFidelizacionAdmin(admin.ModelAdmin):
    """Admin para Puntos de Fidelización"""
    list_display = [
        'cliente', 'programa', 'nivel_badge',
        'puntos_acumulados', 'puntos_canjeados', 'puntos_disponibles',
        'fecha_nivel'
    ]
    list_filter = ['nivel_actual', 'programa']
    search_fields = ['cliente__nombre']
    readonly_fields = [
        'puntos_acumulados', 'puntos_canjeados', 'puntos_disponibles',
        'nivel_actual', 'fecha_nivel', 'ultima_actualizacion'
    ]
    ordering = ['-puntos_disponibles']
    inlines = [MovimientoPuntosInline]

    fieldsets = (
        ('Cliente y Programa', {
            'fields': ('cliente', 'programa')
        }),
        ('Puntos', {
            'fields': (
                'puntos_acumulados', 'puntos_canjeados', 'puntos_disponibles'
            )
        }),
        ('Nivel', {
            'fields': ('nivel_actual', 'fecha_nivel')
        }),
        ('Auditoría', {
            'fields': ('ultima_actualizacion',),
            'classes': ('collapse',)
        }),
    )

    def nivel_badge(self, obj):
        colores = {
            'BRONCE': '#cd7f32',
            'PLATA': '#c0c0c0',
            'ORO': '#ffd700',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            colores.get(obj.nivel_actual, '#6c757d'),
            obj.get_nivel_actual_display()
        )
    nivel_badge.short_description = 'Nivel'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('cliente', 'programa')


@admin.register(MovimientoPuntos)
class MovimientoPuntosAdmin(admin.ModelAdmin):
    """Admin para Movimiento de Puntos"""
    list_display = [
        'puntos_cliente', 'fecha', 'tipo', 'puntos_badge',
        'factura', 'registrado_por'
    ]
    list_filter = ['tipo', 'fecha']
    search_fields = ['puntos_cliente__cliente__nombre', 'descripcion']
    readonly_fields = ['fecha', 'registrado_por']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']

    def puntos_badge(self, obj):
        if obj.puntos > 0:
            color = '#28a745'
            signo = '+'
        else:
            color = '#dc3545'
            signo = ''
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}{}</span>',
            color,
            signo,
            obj.puntos
        )
    puntos_badge.short_description = 'Puntos'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('puntos_cliente', 'factura', 'registrado_por')
