"""
Admin para Proceso Disciplinario - Talent Hub
"""
from django.contrib import admin
from .models import TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario


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
