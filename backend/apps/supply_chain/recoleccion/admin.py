"""Admin para Recolección en Ruta — H-SC-RUTA-02."""
from django.contrib import admin

from .models import VoucherRecoleccion, LineaVoucherRecoleccion


class LineaVoucherRecoleccionInline(admin.TabularInline):
    model = LineaVoucherRecoleccion
    extra = 0
    fields = ['proveedor', 'producto', 'cantidad', 'notas']
    autocomplete_fields = ['proveedor', 'producto']


@admin.register(VoucherRecoleccion)
class VoucherRecoleccionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'ruta', 'fecha_recoleccion', 'operador', 'estado',
        'total_lineas', 'total_kilos', 'is_deleted',
    ]
    list_filter = ['estado', 'ruta', 'fecha_recoleccion', 'is_deleted']
    search_fields = ['codigo', 'ruta__codigo', 'ruta__nombre', 'notas']
    autocomplete_fields = ['ruta', 'operador']
    ordering = ['-fecha_recoleccion', '-created_at']
    inlines = [LineaVoucherRecoleccionInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(LineaVoucherRecoleccion)
class LineaVoucherRecoleccionAdmin(admin.ModelAdmin):
    list_display = ['voucher', 'proveedor', 'producto', 'cantidad', 'is_deleted']
    list_filter = ['voucher__ruta', 'producto', 'is_deleted']
    search_fields = [
        'voucher__codigo', 'proveedor__nombre_comercial', 'producto__nombre',
    ]
    autocomplete_fields = ['voucher', 'proveedor', 'producto']
