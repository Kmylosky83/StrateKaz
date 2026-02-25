"""
Admin para Indicadores Área - Analytics
"""
from django.contrib import admin
from .models import ValorKPI, AccionPorKPI, AlertaKPI


@admin.register(ValorKPI)
class ValorKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'periodo', 'valor', 'valor_meta', 'semaforo', 'porcentaje_cumplimiento', 'fecha_medicion']
    list_filter = ['semaforo', 'is_active', 'fecha_medicion']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'periodo']
    ordering = ['-fecha_medicion']
    readonly_fields = ['semaforo', 'porcentaje_cumplimiento', 'fecha_registro', 'created_at', 'updated_at']


@admin.register(AccionPorKPI)
class AccionPorKPIAdmin(admin.ModelAdmin):
    list_display = ['valor_kpi', 'tipo_accion', 'responsable_nombre', 'fecha_compromiso', 'estado', 'esta_vencida']
    list_filter = ['estado', 'tipo_accion', 'is_active']
    search_fields = ['descripcion', 'valor_kpi__kpi__codigo']
    ordering = ['fecha_compromiso']
    readonly_fields = ['esta_vencida', 'created_at', 'updated_at']

    def esta_vencida(self, obj):
        return obj.esta_vencida
    esta_vencida.boolean = True
    esta_vencida.short_description = '¿Vencida?'


@admin.register(AlertaKPI)
class AlertaKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'tipo_alerta', 'esta_leida', 'fecha_generacion']
    list_filter = ['tipo_alerta', 'esta_leida', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'mensaje']
    ordering = ['-fecha_generacion']
    readonly_fields = ['fecha_generacion', 'fecha_lectura', 'created_at', 'updated_at']
