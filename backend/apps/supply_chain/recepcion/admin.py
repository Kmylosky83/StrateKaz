"""
Admin para Recepción — Supply Chain S3
"""
from django.contrib import admin

from .models import RecepcionCalidad, VoucherRecepcion


@admin.register(VoucherRecepcion)
class VoucherRecepcionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'proveedor', 'producto', 'modalidad_entrega',
        'peso_neto_kg', 'precio_kg_snapshot', 'estado', 'fecha_viaje',
    ]
    list_filter = ['estado', 'modalidad_entrega', 'fecha_viaje', 'almacen_destino']
    search_fields = ['proveedor__nombre_comercial', 'producto__nombre']
    readonly_fields = ['peso_neto_kg', 'created_at', 'updated_at', 'created_by', 'updated_by']
    autocomplete_fields = ['proveedor', 'producto', 'uneg_transportista', 'almacen_destino']


@admin.register(RecepcionCalidad)
class RecepcionCalidadAdmin(admin.ModelAdmin):
    list_display = ['id', 'voucher', 'resultado', 'analista', 'fecha_analisis']
    list_filter = ['resultado', 'fecha_analisis']
    search_fields = ['voucher__proveedor__nombre_comercial']
    readonly_fields = ['created_at', 'updated_at']
