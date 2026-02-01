"""Admin para tareas_recordatorios"""
from django.contrib import admin
from .models import Tarea, Recordatorio, EventoCalendario, ComentarioTarea

@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'asignado_a', 'estado', 'prioridad', 'fecha_limite', 'porcentaje_avance']
    list_filter = ['estado', 'prioridad', 'tipo', 'created_at']
    search_fields = ['titulo', 'descripcion']
    date_hierarchy = 'fecha_limite'
    filter_horizontal = []

@admin.register(Recordatorio)
class RecordatorioAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'usuario', 'fecha_recordatorio', 'repetir', 'esta_activo']
    list_filter = ['repetir', 'esta_activo', 'created_at']
    search_fields = ['titulo', 'mensaje']

@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_inicio', 'fecha_fin', 'todo_el_dia', 'creado_por']
    list_filter = ['tipo', 'todo_el_dia', 'fecha_inicio']
    search_fields = ['titulo', 'descripcion', 'ubicacion']
    filter_horizontal = ['participantes']
    date_hierarchy = 'fecha_inicio'

@admin.register(ComentarioTarea)
class ComentarioTareaAdmin(admin.ModelAdmin):
    list_display = ['tarea', 'usuario', 'created_at']
    list_filter = ['created_at']
    search_fields = ['mensaje']
