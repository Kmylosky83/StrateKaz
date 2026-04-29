"""
Admin para ejecucion - workflow_engine

Registro de modelos de ejecución de workflows:
InstanciaFlujo, TareaActiva, HistorialTarea, ArchivoAdjunto, NotificacionFlujo
"""
from django.contrib import admin
from .models import (
    InstanciaFlujo,
    TareaActiva,
    HistorialTarea,
    ArchivoAdjunto,
    NotificacionFlujo,
)


# ============================================================
# INLINES
# ============================================================

class TareaActivaInline(admin.TabularInline):
    model = TareaActiva
    extra = 0
    fields = [
        'codigo_tarea', 'nombre_tarea', 'tipo_tarea',
        'estado', 'asignado_a', 'fecha_vencimiento'
    ]
    readonly_fields = ['codigo_tarea', 'fecha_creacion']
    show_change_link = True


class HistorialTareaInline(admin.TabularInline):
    model = HistorialTarea
    extra = 0
    fields = ['accion', 'descripcion', 'usuario', 'fecha_accion']
    readonly_fields = ['fecha_accion']
    fk_name = 'tarea'


class ArchivoAdjuntoInstanciaInline(admin.TabularInline):
    model = ArchivoAdjunto
    extra = 0
    fields = ['nombre_original', 'tipo_archivo', 'archivo', 'subido_por', 'fecha_subida']
    readonly_fields = ['fecha_subida']
    fk_name = 'instancia'


# ============================================================
# ADMIN CLASSES
# ============================================================

@admin.register(InstanciaFlujo)
class InstanciaFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_instancia', 'titulo', 'plantilla', 'estado',
        'prioridad', 'responsable_actual', 'fecha_inicio'
    ]
    list_filter = ['estado', 'prioridad', 'plantilla']
    search_fields = ['codigo_instancia', 'titulo', 'descripcion']
    readonly_fields = [
        'fecha_inicio', 'tiempo_total_horas',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_inicio'
    inlines = [TareaActivaInline, ArchivoAdjuntoInstanciaInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo_instancia', 'titulo', 'descripcion')
        }),
        ('Flujo', {
            'fields': ('plantilla', 'nodo_actual', 'estado', 'prioridad')
        }),
        ('Entidad Relacionada', {
            'fields': ('entidad_tipo', 'entidad_id')
        }),
        ('Datos de Contexto', {
            'fields': ('data_contexto', 'variables_flujo'),
            'classes': ('collapse',)
        }),
        ('Fechas y Tiempos', {
            'fields': (
                'fecha_inicio', 'fecha_fin', 'fecha_limite',
                'tiempo_total_horas'
            )
        }),
        ('Participantes', {
            'fields': (
                'iniciado_por', 'responsable_actual', 'finalizado_por'
            )
        }),
        ('Motivos y Observaciones', {
            'fields': ('motivo_cancelacion', 'motivo_pausa', 'observaciones'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TareaActiva)
class TareaActivaAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_tarea', 'nombre_tarea', 'tipo_tarea', 'estado',
        'asignado_a', 'instancia', 'fecha_vencimiento', 'fecha_creacion'
    ]
    list_filter = ['estado', 'tipo_tarea']
    search_fields = [
        'codigo_tarea', 'nombre_tarea', 'instancia__codigo_instancia'
    ]
    readonly_fields = [
        'fecha_creacion', 'tiempo_ejecucion_horas',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'fecha_creacion'
    inlines = [HistorialTareaInline]

    fieldsets = (
        ('Identificación', {
            'fields': (
                'instancia', 'nodo', 'codigo_tarea',
                'nombre_tarea', 'descripcion', 'tipo_tarea'
            )
        }),
        ('Estado', {
            'fields': ('estado', 'decision')
        }),
        ('Asignación', {
            'fields': (
                'asignado_a', 'rol_asignado', 'asignado_por'
            )
        }),
        ('Fechas y Tiempos', {
            'fields': (
                'fecha_creacion', 'fecha_inicio', 'fecha_completada',
                'fecha_vencimiento', 'tiempo_ejecucion_horas'
            )
        }),
        ('Datos de Formulario', {
            'fields': ('formulario_schema', 'formulario_data'),
            'classes': ('collapse',)
        }),
        ('Escalamiento', {
            'fields': ('escalada_a', 'motivo_escalamiento'),
            'classes': ('collapse',)
        }),
        ('Rechazo', {
            'fields': ('motivo_rechazo',),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(HistorialTarea)
class HistorialTareaAdmin(admin.ModelAdmin):
    list_display = [
        'tarea', 'accion', 'estado_anterior', 'estado_nuevo',
        'usuario', 'fecha_accion'
    ]
    list_filter = ['accion']
    search_fields = [
        'tarea__codigo_tarea', 'descripcion',
        'instancia__codigo_instancia'
    ]
    readonly_fields = ['fecha_accion']
    date_hierarchy = 'fecha_accion'

    fieldsets = (
        ('Relaciones', {
            'fields': ('tarea', 'instancia')
        }),
        ('Acción', {
            'fields': ('accion', 'descripcion')
        }),
        ('Cambio de Estado', {
            'fields': ('estado_anterior', 'estado_nuevo')
        }),
        ('Cambio de Asignación', {
            'fields': ('asignado_anterior', 'asignado_nuevo')
        }),
        ('Datos del Cambio', {
            'fields': ('datos_cambio', 'observaciones'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('usuario', 'fecha_accion')
        }),
        ('Metadatos', {
            'fields': ('empresa_id',),
            'classes': ('collapse',)
        }),
    )


@admin.register(ArchivoAdjunto)
class ArchivoAdjuntoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre_original', 'tipo_archivo', 'instancia', 'tarea',
        'subido_por', 'tamano_bytes', 'fecha_subida'
    ]
    list_filter = ['tipo_archivo']
    search_fields = ['nombre_original', 'titulo', 'descripcion']
    readonly_fields = ['fecha_subida']
    date_hierarchy = 'fecha_subida'

    fieldsets = (
        ('Relaciones', {
            'fields': ('instancia', 'tarea')
        }),
        ('Archivo', {
            'fields': (
                'archivo', 'nombre_original', 'tipo_archivo',
                'mime_type', 'tamano_bytes'
            )
        }),
        ('Descripción', {
            'fields': ('titulo', 'descripcion')
        }),
        ('Metadatos', {
            'fields': ('metadatos',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('subido_por', 'fecha_subida', 'empresa_id'),
            'classes': ('collapse',)
        }),
    )


@admin.register(NotificacionFlujo)
class NotificacionFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo_notificacion', 'destinatario', 'prioridad',
        'leida', 'enviada_email', 'fecha_creacion'
    ]
    list_filter = ['tipo_notificacion', 'prioridad', 'leida', 'enviada_email']
    search_fields = ['titulo', 'mensaje', 'destinatario__email']
    readonly_fields = ['fecha_creacion']
    date_hierarchy = 'fecha_creacion'

    fieldsets = (
        ('Destinatario', {
            'fields': ('destinatario',)
        }),
        ('Contexto', {
            'fields': ('instancia', 'tarea')
        }),
        ('Contenido', {
            'fields': (
                'tipo_notificacion', 'titulo', 'mensaje',
                'prioridad', 'url_accion'
            )
        }),
        ('Datos Adicionales', {
            'fields': ('datos_contexto',),
            'classes': ('collapse',)
        }),
        ('Estado de Lectura', {
            'fields': ('leida', 'fecha_lectura')
        }),
        ('Canales de Envío', {
            'fields': (
                'enviada_app', 'enviada_email',
                'email_enviado_exitoso', 'fecha_envio_email'
            )
        }),
        ('Auditoría', {
            'fields': ('generada_por', 'fecha_creacion', 'empresa_id'),
            'classes': ('collapse',)
        }),
    )
