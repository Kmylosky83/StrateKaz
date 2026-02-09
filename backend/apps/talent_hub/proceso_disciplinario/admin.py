"""
Admin para Proceso Disciplinario - Talent Hub
"""
from django.contrib import admin
from .models import (
    TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario,
    NotificacionDisciplinaria, PruebaDisciplinaria, DenunciaAcosoLaboral,
)


@admin.register(TipoFalta)
class TipoFaltaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'gravedad', 'sancion_sugerida', 'dias_prescripcion', 'is_active']
    list_filter = ['gravedad', 'sancion_sugerida', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['gravedad', 'codigo']
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'articulo_reglamento')
        }),
        ('Clasificación', {
            'fields': ('gravedad', 'sancion_sugerida', 'reincidencia_agrava', 'dias_prescripcion')
        }),
        ('Empresa', {
            'fields': ('empresa',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )


@admin.register(LlamadoAtencion)
class LlamadoAtencionAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_falta', 'fecha_falta', 'tipo', 'firmado_colaborador', 'realizado_por']
    list_filter = ['tipo', 'firmado_colaborador', 'fecha_falta', 'is_active']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'descripcion_hechos']
    date_hierarchy = 'fecha_falta'
    ordering = ['-fecha_llamado']
    raw_id_fields = ['colaborador', 'tipo_falta', 'realizado_por']


@admin.register(Descargo)
class DescargoAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'tipo_falta', 'fecha_citacion', 'estado', 'decision', 'decidido_por']
    list_filter = ['estado', 'decision', 'fecha_citacion', 'is_active']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'descripcion_cargos']
    date_hierarchy = 'fecha_citacion'
    ordering = ['-fecha_citacion']
    raw_id_fields = ['colaborador', 'tipo_falta', 'llamado_atencion_previo', 'decidido_por']


@admin.register(Memorando)
class MemorandoAdmin(admin.ModelAdmin):
    list_display = ['numero_memorando', 'colaborador', 'fecha_memorando', 'sancion_aplicada', 'dias_suspension', 'apelado', 'firmado_colaborador']
    list_filter = ['sancion_aplicada', 'apelado', 'firmado_colaborador', 'fecha_memorando', 'is_active']
    search_fields = ['numero_memorando', 'colaborador__primer_nombre', 'colaborador__primer_apellido', 'descripcion']
    date_hierarchy = 'fecha_memorando'
    ordering = ['-fecha_memorando']
    raw_id_fields = ['colaborador', 'tipo_falta', 'descargo', 'elaborado_por']


@admin.register(HistorialDisciplinario)
class HistorialDisciplinarioAdmin(admin.ModelAdmin):
    list_display = ['colaborador', 'total_llamados_atencion', 'total_descargos', 'total_memorandos', 'total_suspensiones', 'nivel_riesgo']
    list_filter = ['ultima_sancion', 'is_active']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido']
    ordering = ['-ultima_sancion']
    raw_id_fields = ['colaborador']
    readonly_fields = ['total_llamados_atencion', 'total_descargos', 'total_memorandos', 'total_suspensiones', 'dias_suspension_acumulados', 'ultima_falta', 'ultima_sancion']


@admin.register(NotificacionDisciplinaria)
class NotificacionDisciplinariaAdmin(admin.ModelAdmin):
    """Admin para Notificaciones Disciplinarias - Ley 2466/2025"""
    list_display = ['colaborador', 'tipo', 'fecha_entrega', 'acuse_recibo', 'fecha_acuse', 'is_active']
    list_filter = ['tipo', 'acuse_recibo', 'is_active']
    search_fields = ['colaborador__primer_nombre', 'colaborador__primer_apellido', 'contenido']
    ordering = ['-created_at']
    raw_id_fields = ['colaborador', 'descargo', 'memorando']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    fieldsets = (
        ('Proceso Asociado', {
            'fields': ('empresa', 'colaborador', 'descargo', 'memorando', 'tipo')
        }),
        ('Notificacion', {
            'fields': ('contenido', 'archivo_soporte')
        }),
        ('Entrega', {
            'fields': ('fecha_entrega', 'acuse_recibo', 'fecha_acuse', 'testigo_entrega')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PruebaDisciplinaria)
class PruebaDisciplinariaAdmin(admin.ModelAdmin):
    """Admin para Pruebas Disciplinarias - Ley 2466/2025"""
    list_display = ['descargo', 'tipo_prueba', 'presentada_por', 'fecha_presentacion', 'admitida', 'is_active']
    list_filter = ['tipo_prueba', 'presentada_por', 'admitida', 'is_active']
    search_fields = ['descripcion', 'observaciones_admision']
    ordering = ['-fecha_presentacion']
    raw_id_fields = ['descargo']
    readonly_fields = ['fecha_presentacion', 'created_at', 'updated_at', 'created_by', 'updated_by']
    fieldsets = (
        ('Descargo', {
            'fields': ('empresa', 'descargo')
        }),
        ('Prueba', {
            'fields': ('tipo_prueba', 'presentada_por', 'descripcion', 'archivo')
        }),
        ('Admision', {
            'fields': ('fecha_presentacion', 'admitida', 'observaciones_admision')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# DENUNCIA ACOSO LABORAL - Ley 1010/2006
# =============================================================================

@admin.register(DenunciaAcosoLaboral)
class DenunciaAcosoLaboralAdmin(admin.ModelAdmin):
    """Admin para denuncias de acoso laboral - Ley 1010/2006"""
    list_display = [
        'tipo_acoso', 'denunciado', 'es_anonima', 'fecha_hechos',
        'estado', 'comite_convivencia_notificado', 'is_active'
    ]
    list_filter = ['tipo_acoso', 'estado', 'es_anonima', 'comite_convivencia_notificado', 'empresa', 'is_active']
    search_fields = ['denunciado__primer_nombre', 'denunciado__primer_apellido', 'descripcion_hechos']
    ordering = ['-created_at']
    raw_id_fields = ['denunciante', 'denunciado', 'reglamento_aplicable']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Denuncia', {
            'fields': ('empresa', 'es_anonima', 'denunciante', 'denunciado', 'tipo_acoso')
        }),
        ('Hechos', {
            'fields': ('descripcion_hechos', 'fecha_hechos', 'lugar_hechos', 'testigos', 'evidencia')
        }),
        ('Estado y Seguimiento', {
            'fields': ('estado', 'comite_convivencia_notificado', 'fecha_notificacion_comite')
        }),
        ('Resolución', {
            'fields': ('resolucion', 'medidas_correctivas', 'fecha_cierre', 'reglamento_aplicable')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
