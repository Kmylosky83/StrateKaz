"""
Admin para Dashboard Gerencial - Analytics
"""
from django.contrib import admin
from .models import VistaDashboard, WidgetDashboard, FavoritoDashboard


@admin.register(VistaDashboard)
class VistaDashboardAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'perspectiva_bsc', 'es_publica', 'orden', 'is_active']
    list_filter = ['perspectiva_bsc', 'es_publica', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    filter_horizontal = ['roles_permitidos']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WidgetDashboard)
class WidgetDashboardAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'vista', 'tipo_widget', 'orden', 'is_active']
    list_filter = ['tipo_widget', 'is_active']
    search_fields = ['titulo', 'vista__nombre']
    ordering = ['vista', 'orden']
    filter_horizontal = ['kpis']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FavoritoDashboard)
class FavoritoDashboardAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'vista', 'es_default', 'fecha_agregado']
    list_filter = ['es_default']
    search_fields = ['usuario__email', 'vista__nombre']
    ordering = ['-es_default', '-fecha_agregado']
    readonly_fields = ['fecha_agregado']
