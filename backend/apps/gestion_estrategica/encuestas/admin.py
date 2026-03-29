"""
Admin para Encuestas Colaborativas DOFA
========================================
"""
from django.contrib import admin
from .models import (
    EncuestaDofa,
    TemaEncuesta,
    ParticipanteEncuesta,
    RespuestaEncuesta
)


class TemaEncuestaInline(admin.TabularInline):
    model = TemaEncuesta
    extra = 1
    fields = ['titulo', 'descripcion', 'area', 'orden']


class ParticipanteEncuestaInline(admin.TabularInline):
    model = ParticipanteEncuesta
    extra = 1
    fields = ['tipo', 'usuario', 'area', 'cargo', 'estado']
    readonly_fields = ['estado']


@admin.register(EncuestaDofa)
class EncuestaDofaAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'analisis_dofa', 'estado',
        'fecha_inicio', 'fecha_cierre',
        'total_invitados', 'total_respondidos', 'porcentaje_participacion'
    ]
    list_filter = ['estado', 'empresa']
    search_fields = ['titulo', 'descripcion']
    date_hierarchy = 'fecha_inicio'
    readonly_fields = [
        'total_invitados', 'total_respondidos',
        'notificacion_enviada', 'fecha_notificacion',
        'created_at', 'updated_at'
    ]
    inlines = [TemaEncuestaInline, ParticipanteEncuestaInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('analisis_dofa', 'titulo', 'descripcion', 'responsable')
        }),
        ('Configuración', {
            'fields': ('requiere_justificacion',)
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_cierre', 'estado')
        }),
        ('Estadísticas', {
            'fields': (
                'total_invitados', 'total_respondidos',
                'notificacion_enviada', 'fecha_notificacion'
            )
        }),
        ('Auditoría', {
            'fields': ('empresa', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TemaEncuesta)
class TemaEncuestaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'encuesta', 'area', 'orden']
    list_filter = ['encuesta', 'area']
    search_fields = ['titulo', 'descripcion']


@admin.register(ParticipanteEncuesta)
class ParticipanteEncuestaAdmin(admin.ModelAdmin):
    list_display = [
        'encuesta', 'tipo', 'usuario', 'area', 'cargo',
        'estado', 'fecha_notificacion', 'fecha_completado'
    ]
    list_filter = ['tipo', 'estado', 'encuesta']
    search_fields = ['usuario__email', 'usuario__first_name']


@admin.register(RespuestaEncuesta)
class RespuestaEncuestaAdmin(admin.ModelAdmin):
    list_display = [
        'tema', 'respondente', 'clasificacion',
        'impacto_percibido', 'created_at'
    ]
    list_filter = ['clasificacion', 'impacto_percibido', 'tema__encuesta']
    search_fields = ['tema__titulo', 'justificacion']
    readonly_fields = ['created_at']
