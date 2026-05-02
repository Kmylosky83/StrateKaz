"""
Admin para firma_digital - workflow_engine

Registro de modelos de firma digital:
ConfiguracionFlujoFirma, FlowNode, FirmaDigital, HistorialFirma,
DelegacionFirma, ConfiguracionRevision, AlertaRevision, HistorialVersion
"""
from django.contrib import admin
from .models import (
    ConfiguracionFlujoFirma,
    FlowNode,
    FirmaDigital,
    HistorialFirma,
    DelegacionFirma,
    ConfiguracionRevision,
    AlertaRevision,
    HistorialVersion,
)


# ============================================================
# INLINES
# ============================================================

class FlowNodeInline(admin.TabularInline):
    model = FlowNode
    extra = 0
    fields = ['orden', 'rol_firma', 'cargo', 'es_requerido', 'permite_rechazo']
    show_change_link = True


class HistorialFirmaInline(admin.TabularInline):
    model = HistorialFirma
    extra = 0
    fields = ['accion', 'usuario', 'descripcion', 'created_at']
    readonly_fields = ['created_at']


# ============================================================
# ADMIN CLASSES
# ============================================================

@admin.register(ConfiguracionFlujoFirma)
class ConfiguracionFlujoFirmaAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo_flujo', 'permite_delegacion',
        'dias_max_firma', 'created_at'
    ]
    list_filter = ['tipo_flujo', 'permite_delegacion']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['aplica_a_content_types']
    inlines = [FlowNodeInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración del Flujo', {
            'fields': (
                'tipo_flujo', 'configuracion_nodos',
                'permite_delegacion', 'dias_max_firma',
                'requiere_comentario_rechazo'
            )
        }),
        ('Aplicación', {
            'fields': ('aplica_a_content_types',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FlowNode)
class FlowNodeAdmin(admin.ModelAdmin):
    list_display = [
        'configuracion_flujo', 'orden', 'rol_firma', 'cargo',
        'es_requerido', 'permite_rechazo'
    ]
    list_filter = ['rol_firma', 'es_requerido']
    search_fields = ['configuracion_flujo__nombre', 'cargo__name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Flujo', {
            'fields': ('configuracion_flujo', 'orden', 'grupo')
        }),
        ('Firma', {
            'fields': ('rol_firma', 'cargo', 'cargos_alternativos')
        }),
        ('Configuración', {
            'fields': ('es_requerido', 'permite_rechazo')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FirmaDigital)
class FirmaDigitalAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'rol_firma', 'estado', 'cargo',
        'es_delegada', 'fecha_firma'
    ]
    list_filter = ['estado', 'rol_firma', 'es_delegada']
    search_fields = ['usuario__email', 'usuario__first_name', 'usuario__last_name']
    readonly_fields = [
        'fecha_firma', 'documento_hash', 'firma_hash',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_firma'
    inlines = [HistorialFirmaInline]

    fieldsets = (
        ('Documento', {
            'fields': ('content_type', 'object_id')
        }),
        ('Flujo', {
            'fields': ('configuracion_flujo', 'nodo_flujo', 'orden')
        }),
        ('Firmante', {
            'fields': ('usuario', 'cargo', 'rol_firma', 'estado')
        }),
        ('Firma', {
            'fields': ('firma_imagen', 'comentarios'),
            'classes': ('collapse',)
        }),
        ('Integridad', {
            'fields': ('documento_hash', 'firma_hash'),
            'classes': ('collapse',)
        }),
        ('Metadatos de Firma', {
            'fields': (
                'fecha_firma', 'ip_address', 'user_agent', 'geolocalizacion'
            ),
            'classes': ('collapse',)
        }),
        ('Delegación', {
            'fields': ('es_delegada', 'delegante'),
            'classes': ('collapse',)
        }),
    )


@admin.register(HistorialFirma)
class HistorialFirmaAdmin(admin.ModelAdmin):
    list_display = ['firma', 'accion', 'usuario', 'ip_address', 'created_at']
    list_filter = ['accion']
    search_fields = ['firma__usuario__email', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Relación', {
            'fields': ('firma',)
        }),
        ('Acción', {
            'fields': ('accion', 'descripcion', 'usuario')
        }),
        ('Detalles', {
            'fields': ('metadatos', 'ip_address'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DelegacionFirma)
class DelegacionFirmaAdmin(admin.ModelAdmin):
    list_display = [
        'delegante', 'delegado', 'cargo', 'fecha_inicio',
        'fecha_fin', 'esta_activa'
    ]
    list_filter = ['esta_activa']
    search_fields = [
        'delegante__email', 'delegado__email', 'motivo'
    ]
    readonly_fields = [
        'fecha_revocacion', 'created_at', 'updated_at'
    ]
    filter_horizontal = ['tipos_documento']

    fieldsets = (
        ('Participantes', {
            'fields': ('delegante', 'delegado', 'cargo')
        }),
        ('Alcance', {
            'fields': ('roles_delegados', 'tipos_documento')
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin', 'motivo')
        }),
        ('Estado', {
            'fields': (
                'esta_activa', 'fecha_revocacion', 'motivo_revocacion'
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConfiguracionRevision)
class ConfiguracionRevisionAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'frecuencia', 'dias_alerta_1', 'dias_alerta_2',
        'dias_alerta_3', 'responsable_revision', 'created_at'
    ]
    list_filter = ['frecuencia']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['aplica_a_content_types']

    fieldsets = (
        ('Identificación', {
            'fields': ('nombre', 'descripcion')
        }),
        ('Frecuencia', {
            'fields': ('frecuencia', 'dias_personalizados')
        }),
        ('Alertas', {
            'fields': (
                'dias_alerta_1', 'dias_alerta_2', 'dias_alerta_3',
                'alerta_dia_vencimiento', 'alertas_post_vencimiento',
                'dias_escalamiento'
            )
        }),
        ('Responsables', {
            'fields': ('responsable_revision', 'responsable_escalamiento')
        }),
        ('Renovación', {
            'fields': (
                'renovacion_automatica', 'requiere_revision_contenido',
                'flujo_firma_renovacion'
            )
        }),
        ('Aplicación', {
            'fields': ('aplica_a_content_types',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AlertaRevision)
class AlertaRevisionAdmin(admin.ModelAdmin):
    list_display = [
        'tipo_alerta', 'estado', 'fecha_vencimiento',
        'fecha_programada', 'atendida_por'
    ]
    list_filter = ['estado', 'tipo_alerta']
    search_fields = ['tipo_alerta']
    readonly_fields = [
        'fecha_envio', 'created_at', 'updated_at'
    ]
    filter_horizontal = ['destinatarios']
    date_hierarchy = 'fecha_programada'

    fieldsets = (
        ('Documento', {
            'fields': ('content_type', 'object_id', 'configuracion_revision')
        }),
        ('Alerta', {
            'fields': (
                'tipo_alerta', 'estado',
                'fecha_vencimiento', 'fecha_programada', 'fecha_envio'
            )
        }),
        ('Destinatarios', {
            'fields': ('destinatarios',)
        }),
        ('Atención', {
            'fields': ('atendida_por', 'fecha_atencion', 'notas_atencion')
        }),
        ('Relaciones', {
            'fields': ('tarea', 'notificacion'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(HistorialVersion)
class HistorialVersionAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'version', 'version_anterior', 'tipo_cambio',
        'usuario_version', 'fecha_version'
    ]
    list_filter = ['tipo_cambio']
    search_fields = ['titulo', 'version', 'motivo_cambio']
    readonly_fields = [
        'contenido_hash', 'created_at', 'updated_at'
    ]
    filter_horizontal = ['firmas']
    date_hierarchy = 'fecha_version'

    fieldsets = (
        ('Documento', {
            'fields': ('content_type', 'object_id')
        }),
        ('Versión', {
            'fields': (
                'version', 'version_anterior', 'tipo_cambio',
                'titulo', 'estado_documento'
            )
        }),
        ('Cambios', {
            'fields': ('motivo_cambio', 'cambios_realizados', 'diff_texto'),
            'classes': ('collapse',)
        }),
        ('Contenido', {
            'fields': ('contenido', 'contenido_hash'),
            'classes': ('collapse',)
        }),
        ('Archivos', {
            'fields': ('archivo_pdf', 'archivo_original'),
            'classes': ('collapse',)
        }),
        ('Firmas', {
            'fields': ('firmas',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'usuario_version', 'fecha_version',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
