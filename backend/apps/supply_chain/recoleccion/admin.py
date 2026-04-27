"""Admin para Recolección en Ruta — H-SC-RUTA-02 refactor 2."""
from django.contrib import admin

from .models import VoucherRecoleccion


@admin.register(VoucherRecoleccion)
class VoucherRecoleccionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'ruta', 'fecha_recoleccion', 'proveedor', 'producto',
        'cantidad', 'estado', 'operador', 'is_deleted',
    ]
    list_filter = ['estado', 'ruta', 'fecha_recoleccion', 'is_deleted']
    search_fields = [
        'codigo', 'ruta__codigo', 'ruta__nombre',
        'proveedor__nombre_comercial', 'proveedor__codigo_interno',
        'producto__nombre', 'notas',
    ]
    autocomplete_fields = ['ruta', 'proveedor', 'producto', 'operador']
    ordering = ['-fecha_recoleccion', '-created_at']
    readonly_fields = ['codigo', 'created_at', 'updated_at']
