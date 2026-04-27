"""Admin para Recolección en Ruta — H-SC-RUTA-02 refactor 2 + H-SC-TALONARIO."""
from django.contrib import admin

from .models import VoucherRecoleccion


@admin.register(VoucherRecoleccion)
class VoucherRecoleccionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'ruta', 'fecha_recoleccion', 'proveedor', 'producto',
        'cantidad', 'estado', 'origen_registro', 'operador',
        'registrado_por_planta', 'is_deleted',
    ]
    list_filter = [
        'estado', 'origen_registro', 'ruta', 'fecha_recoleccion', 'is_deleted',
    ]
    search_fields = [
        'codigo', 'numero_talonario',
        'ruta__codigo', 'ruta__nombre',
        'proveedor__nombre_comercial', 'proveedor__codigo_interno',
        'producto__nombre', 'notas',
    ]
    autocomplete_fields = [
        'ruta', 'proveedor', 'producto', 'operador', 'registrado_por_planta',
    ]
    ordering = ['-fecha_recoleccion', '-created_at']
    readonly_fields = ['codigo', 'created_at', 'updated_at']
