from django.contrib import admin
from .models import CategoriaRiesgo, RiesgoProceso, TratamientoRiesgo, MonitoreoRiesgo, MapaCalor

@admin.register(CategoriaRiesgo)
class CategoriaRiesgoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'is_active']
    search_fields = ['codigo', 'nombre']

@admin.register(RiesgoProceso)
class RiesgoProcesoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(TratamientoRiesgo)
class TratamientoRiesgoAdmin(admin.ModelAdmin):
    list_display = ['riesgo', 'estado']
    search_fields = ['descripcion']

@admin.register(MonitoreoRiesgo)
class MonitoreoRiesgoAdmin(admin.ModelAdmin):
    list_display = ['riesgo', 'fecha_monitoreo', 'nivel_actual']
    search_fields = ['observaciones']

@admin.register(MapaCalor)
class MapaCalorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_mapa', 'fecha_snapshot']
    search_fields = ['nombre']
