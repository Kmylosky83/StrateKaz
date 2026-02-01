"""
Admin para Revisión por la Dirección
"""
from django.contrib import admin
from .models import (
    ProgramaRevision, ParticipanteRevision, TemaRevision,
    ActaRevision, AnalisisTemaActa, CompromisoRevision,
    SeguimientoCompromiso
)


class ParticipanteInline(admin.TabularInline):
    model = ParticipanteRevision
    extra = 1


class TemaInline(admin.TabularInline):
    model = TemaRevision
    extra = 1


@admin.register(ProgramaRevision)
class ProgramaRevisionAdmin(admin.ModelAdmin):
    list_display = [
        'periodo', 'anio', 'frecuencia', 'fecha_programada',
        'estado', 'responsable_convocatoria', 'is_active'
    ]
    list_filter = ['anio', 'estado', 'frecuencia', 'empresa_id']
    search_fields = ['periodo', 'lugar']
    date_hierarchy = 'fecha_programada'
    inlines = [ParticipanteInline, TemaInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('empresa_id', 'anio', 'periodo', 'frecuencia')
        }),
        ('Programación', {
            'fields': (
                ('fecha_programada', 'fecha_realizada'),
                ('hora_inicio', 'duracion_estimada_horas'),
                ('lugar', 'modalidad'),
                ('estado', 'responsable_convocatoria'),
            )
        }),
        ('Sistemas de Gestión', {
            'fields': (
                ('incluye_calidad', 'incluye_sst', 'incluye_ambiental'),
                ('incluye_pesv', 'incluye_seguridad_info'),
            )
        }),
        ('Otros', {
            'fields': ('observaciones', 'is_active'),
            'classes': ('collapse',)
        }),
    )


class AnalisisTemaInline(admin.StackedInline):
    model = AnalisisTemaActa
    extra = 0


class CompromisoInline(admin.TabularInline):
    model = CompromisoRevision
    extra = 1
    fields = ['consecutivo', 'tipo', 'descripcion', 'responsable', 'fecha_compromiso', 'estado']


@admin.register(ActaRevision)
class ActaRevisionAdmin(admin.ModelAdmin):
    list_display = [
        'numero_acta', 'programa', 'fecha', 'evaluacion_sistema',
        'aprobado_por', 'fecha_aprobacion'
    ]
    list_filter = ['evaluacion_sistema', 'programa__anio']
    search_fields = ['numero_acta']
    date_hierarchy = 'fecha'
    inlines = [AnalisisTemaInline, CompromisoInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('programa', 'numero_acta', 'version')
        }),
        ('Sesión', {
            'fields': (
                ('fecha', 'hora_inicio', 'hora_fin'),
                'lugar',
            )
        }),
        ('Contenido', {
            'fields': (
                'introduccion', 'orden_del_dia',
                'conclusiones_generales',
            )
        }),
        ('Decisiones de Salida', {
            'fields': (
                'decisiones_mejora',
                'necesidad_cambios',
                'necesidad_recursos',
            )
        }),
        ('Evaluación del Sistema', {
            'fields': ('evaluacion_sistema', 'observaciones_evaluacion')
        }),
        ('Firmas', {
            'fields': (
                ('elaborado_por', 'fecha_elaboracion'),
                ('revisado_por', 'fecha_revision'),
                ('aprobado_por', 'fecha_aprobacion'),
            )
        }),
        ('Documento', {
            'fields': ('documento_acta',),
            'classes': ('collapse',)
        }),
    )


class SeguimientoInline(admin.TabularInline):
    model = SeguimientoCompromiso
    extra = 0


@admin.register(CompromisoRevision)
class CompromisoRevisionAdmin(admin.ModelAdmin):
    list_display = [
        'consecutivo', 'tipo', 'descripcion_corta', 'responsable',
        'fecha_compromiso', 'estado', 'porcentaje_avance'
    ]
    list_filter = ['estado', 'tipo', 'prioridad', 'acta__programa__anio']
    search_fields = ['consecutivo', 'descripcion']
    date_hierarchy = 'fecha_compromiso'
    inlines = [SeguimientoInline]

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'

    fieldsets = (
        ('Identificación', {
            'fields': ('acta', 'tema_relacionado', 'consecutivo')
        }),
        ('Detalle', {
            'fields': ('tipo', 'descripcion', 'resultado_esperado')
        }),
        ('Asignación', {
            'fields': (
                'responsable', 'prioridad',
                ('fecha_compromiso', 'fecha_cumplimiento'),
            )
        }),
        ('Estado', {
            'fields': ('estado', 'porcentaje_avance')
        }),
        ('Evidencias', {
            'fields': ('evidencia_cumplimiento', 'documento_evidencia', 'observaciones'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SeguimientoCompromiso)
class SeguimientoAdmin(admin.ModelAdmin):
    list_display = ['compromiso', 'fecha', 'porcentaje_avance', 'registrado_por']
    list_filter = ['fecha']
    date_hierarchy = 'fecha'
