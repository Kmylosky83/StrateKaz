"""Admin para config_alertas"""
from django.contrib import admin
from .models import TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta

@admin.register(TipoAlerta)
class TipoAlertaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'severidad_default', 'modulo_origen', 'is_active']
    list_filter = ['categoria', 'severidad_default', 'is_active']
    search_fields = ['nombre', 'codigo']

@admin.register(ConfiguracionAlerta)
class ConfiguracionAlertaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_alerta', 'frecuencia_verificacion', 'notificar_a', 'is_active']
    list_filter = ['frecuencia_verificacion', 'is_active']
    filter_horizontal = ['roles', 'usuarios']

@admin.register(AlertaGenerada)
class AlertaGeneradaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'severidad', 'esta_atendida', 'fecha_vencimiento', 'created_at']
    list_filter = ['severidad', 'esta_atendida', 'created_at']
    search_fields = ['titulo', 'mensaje']

@admin.register(EscalamientoAlerta)
class EscalamientoAlertaAdmin(admin.ModelAdmin):
    list_display = ['configuracion_alerta', 'nivel', 'horas_espera', 'notificar_a']
    list_filter = ['nivel', 'notificar_a']
    filter_horizontal = ['usuarios_adicionales']
