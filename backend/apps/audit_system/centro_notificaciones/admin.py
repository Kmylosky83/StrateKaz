"""Admin para centro_notificaciones"""
from django.contrib import admin
from .models import TipoNotificacion, Notificacion, PreferenciaNotificacion, NotificacionMasiva

@admin.register(TipoNotificacion)
class TipoNotificacionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'es_email', 'es_push', 'is_active']
    list_filter = ['categoria', 'is_active']
    search_fields = ['nombre', 'codigo']

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'usuario', 'prioridad', 'esta_leida', 'created_at']
    list_filter = ['prioridad', 'esta_leida', 'created_at']
    search_fields = ['titulo', 'mensaje']

@admin.register(PreferenciaNotificacion)
class PreferenciaNotificacionAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tipo_notificacion', 'recibir_app', 'recibir_email']

@admin.register(NotificacionMasiva)
class NotificacionMasivaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'destinatarios_tipo', 'total_enviadas', 'total_leidas', 'created_at']
    list_filter = ['destinatarios_tipo', 'created_at']
