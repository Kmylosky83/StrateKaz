"""
Admin para integracion - accounting
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from .models import ParametrosIntegracion, LogIntegracion, ColaContabilizacion


@admin.register(ParametrosIntegracion)
class ParametrosIntegracionAdmin(admin.ModelAdmin):
    list_display = ['modulo_badge', 'clave', 'descripcion_corta', 'cuenta_contable', 'activo_badge', 'empresa']
    list_filter = ['modulo', 'activo', 'empresa']
    search_fields = ['clave', 'descripcion', 'cuenta_contable__codigo', 'cuenta_contable__nombre']
    ordering = ['modulo', 'clave']
    raw_id_fields = ['cuenta_contable']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def modulo_badge(self, obj):
        colores = {'tesoreria': '#3498db', 'nomina': '#27ae60', 'inventarios': '#9b59b6', 'activos_fijos': '#f39c12', 'ventas': '#1abc9c', 'compras': '#e74c3c'}
        color = colores.get(obj.modulo, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_modulo_display())
    modulo_badge.short_description = 'Módulo'

    def descripcion_corta(self, obj):
        return obj.descripcion[:40] + '...' if len(obj.descripcion) > 40 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'

    def activo_badge(self, obj):
        if obj.activo:
            return format_html('<span style="color: #27ae60;">✓ Activo</span>')
        return format_html('<span style="color: #e74c3c;">✗ Inactivo</span>')
    activo_badge.short_description = 'Estado'


@admin.register(LogIntegracion)
class LogIntegracionAdmin(admin.ModelAdmin):
    list_display = ['modulo_badge', 'documento_origen_tipo', 'documento_origen_id', 'estado_badge', 'comprobante', 'created_at', 'empresa']
    list_filter = ['modulo_origen', 'estado', 'empresa']
    search_fields = ['descripcion', 'documento_origen_tipo']
    ordering = ['-created_at']
    raw_id_fields = ['comprobante']
    readonly_fields = ['empresa', 'modulo_origen', 'documento_origen_tipo', 'documento_origen_id', 'comprobante', 'estado', 'descripcion', 'datos_json', 'mensaje_error', 'created_at', 'procesado_at', 'created_by']

    def modulo_badge(self, obj):
        colores = {'tesoreria': '#3498db', 'nomina': '#27ae60', 'inventarios': '#9b59b6', 'activos_fijos': '#f39c12', 'ventas': '#1abc9c', 'compras': '#e74c3c'}
        color = colores.get(obj.modulo_origen, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.modulo_origen)
    modulo_badge.short_description = 'Módulo'

    def estado_badge(self, obj):
        colores = {'pendiente': '#f39c12', 'procesando': '#3498db', 'exitoso': '#27ae60', 'error': '#e74c3c', 'revertido': '#9b59b6'}
        color = colores.get(obj.estado, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_estado_display())
    estado_badge.short_description = 'Estado'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ColaContabilizacion)
class ColaContabilizacionAdmin(admin.ModelAdmin):
    list_display = ['modulo_badge', 'documento_origen_tipo', 'documento_origen_id', 'prioridad_badge', 'estado_badge', 'intentos_badge', 'comprobante_generado', 'created_at', 'empresa']
    list_filter = ['modulo_origen', 'estado', 'prioridad', 'empresa']
    search_fields = ['documento_origen_tipo']
    ordering = ['prioridad', 'created_at']
    raw_id_fields = ['comprobante_generado']
    readonly_fields = ['estado', 'comprobante_generado', 'mensaje_error', 'intentos', 'created_at', 'procesado_at', 'proximo_intento_at']

    def modulo_badge(self, obj):
        colores = {'tesoreria': '#3498db', 'nomina': '#27ae60', 'inventarios': '#9b59b6', 'activos_fijos': '#f39c12', 'ventas': '#1abc9c', 'compras': '#e74c3c'}
        color = colores.get(obj.modulo_origen, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.modulo_origen)
    modulo_badge.short_description = 'Módulo'

    def prioridad_badge(self, obj):
        colores = {1: '#e74c3c', 3: '#f39c12', 5: '#3498db', 7: '#95a5a6', 9: '#bdc3c7'}
        color = colores.get(obj.prioridad, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_prioridad_display())
    prioridad_badge.short_description = 'Prioridad'

    def estado_badge(self, obj):
        colores = {'pendiente': '#f39c12', 'procesando': '#3498db', 'completado': '#27ae60', 'error': '#e74c3c'}
        color = colores.get(obj.estado, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_estado_display())
    estado_badge.short_description = 'Estado'

    def intentos_badge(self, obj):
        if obj.intentos >= obj.max_intentos:
            return format_html('<span style="color: #e74c3c; font-weight: bold;">{}/{}</span>', obj.intentos, obj.max_intentos)
        return format_html('<span>{}/{}</span>', obj.intentos, obj.max_intentos)
    intentos_badge.short_description = 'Intentos'

    actions = ['reintentar_seleccionados', 'cancelar_seleccionados']

    @admin.action(description='Reintentar elementos seleccionados')
    def reintentar_seleccionados(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(estado__in=['error', 'pendiente']).exclude(intentos__gte=models.F('max_intentos')).update(
            estado='pendiente',
            mensaje_error='',
            proximo_intento_at=timezone.now()
        )
        self.message_user(request, f'{updated} elementos marcados para reintentar.')

    @admin.action(description='Cancelar elementos seleccionados')
    def cancelar_seleccionados(self, request, queryset):
        deleted = queryset.exclude(estado__in=['completado', 'procesando']).delete()[0]
        self.message_user(request, f'{deleted} elementos cancelados.')
