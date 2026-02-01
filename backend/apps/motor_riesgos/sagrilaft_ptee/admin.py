from django.contrib import admin
from .models import FactorRiesgoLAFT, SegmentoCliente, MatrizRiesgoLAFT, SeñalAlerta, ReporteOperacionSospechosa, DebidaDiligencia

@admin.register(FactorRiesgoLAFT)
class FactorRiesgoLAFTAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_factor', 'is_active']
    search_fields = ['codigo', 'nombre']

@admin.register(SegmentoCliente)
class SegmentoClienteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_cliente', 'nivel_riesgo']
    search_fields = ['codigo', 'nombre']

@admin.register(MatrizRiesgoLAFT)
class MatrizRiesgoLAFTAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre_evaluado', 'estado']
    search_fields = ['codigo', 'nombre_evaluado']

@admin.register(SeñalAlerta)
class SeñalAlertaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'severidad']
    search_fields = ['codigo', 'nombre']

@admin.register(ReporteOperacionSospechosa)
class ReporteOperacionSospechosaAdmin(admin.ModelAdmin):
    list_display = ['numero_ros', 'tipo_operacion', 'estado']
    search_fields = ['numero_ros', 'nombre_reportado']

@admin.register(DebidaDiligencia)
class DebidaDiligenciaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo_diligencia', 'estado']
    search_fields = ['codigo']
