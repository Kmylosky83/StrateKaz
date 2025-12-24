"""
Admin para matriz_legal - motor_cumplimiento
"""
from django.contrib import admin
from .models import TipoNorma, NormaLegal, EmpresaNorma


@admin.register(TipoNorma)
class TipoNormaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['nombre']


@admin.register(NormaLegal)
class NormaLegalAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_completo', 'titulo', 'entidad_emisora',
        'fecha_expedicion', 'vigente',
        'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv'
    ]
    list_filter = [
        'tipo_norma', 'vigente', 'anio',
        'aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv'
    ]
    search_fields = ['numero', 'titulo', 'entidad_emisora', 'resumen']
    ordering = ['-fecha_expedicion']
    date_hierarchy = 'fecha_expedicion'

    fieldsets = (
        ('Información General', {
            'fields': ('tipo_norma', 'numero', 'anio', 'titulo', 'entidad_emisora')
        }),
        ('Fechas', {
            'fields': ('fecha_expedicion', 'fecha_vigencia', 'vigente')
        }),
        ('Contenido', {
            'fields': ('url_original', 'resumen', 'contenido'),
            'classes': ('collapse',)
        }),
        ('Sistemas Aplicables', {
            'fields': ('aplica_sst', 'aplica_ambiental', 'aplica_calidad', 'aplica_pesv')
        }),
    )

    def codigo_completo(self, obj):
        return obj.codigo_completo
    codigo_completo.short_description = 'Código'


@admin.register(EmpresaNorma)
class EmpresaNormaAdmin(admin.ModelAdmin):
    list_display = [
        'empresa_id', 'norma', 'aplica', 'porcentaje_cumplimiento',
        'responsable', 'fecha_evaluacion'
    ]
    list_filter = ['aplica', 'porcentaje_cumplimiento', 'empresa_id']
    search_fields = ['norma__numero', 'norma__titulo', 'observaciones']
    ordering = ['-fecha_evaluacion']
    raw_id_fields = ['norma', 'responsable', 'created_by']
    date_hierarchy = 'fecha_evaluacion'
