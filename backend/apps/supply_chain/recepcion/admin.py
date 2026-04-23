"""
Admin para Recepción — Supply Chain S3
"""
from django.contrib import admin

from .models import RecepcionCalidad, VoucherLineaMP, VoucherRecepcion


class VoucherLineaMPInline(admin.TabularInline):
    model = VoucherLineaMP
    extra = 0
    readonly_fields = ['peso_neto_kg', 'created_at', 'updated_at']
    fields = ['producto', 'peso_bruto_kg', 'peso_tara_kg', 'peso_neto_kg']


@admin.register(VoucherRecepcion)
class VoucherRecepcionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'proveedor', 'modalidad_entrega',
        'peso_neto_total', 'estado', 'fecha_viaje',
    ]
    list_filter = ['estado', 'modalidad_entrega', 'fecha_viaje', 'almacen_destino']
    search_fields = ['proveedor__nombre_comercial', 'observaciones']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    autocomplete_fields = ['proveedor', 'ruta_recoleccion', 'almacen_destino']
    inlines = [VoucherLineaMPInline]


@admin.register(RecepcionCalidad)
class RecepcionCalidadAdmin(admin.ModelAdmin):
    list_display = ['id', 'voucher', 'resultado', 'analista', 'fecha_analisis']
    list_filter = ['resultado', 'fecha_analisis']
    search_fields = ['voucher__proveedor__nombre_comercial']
    readonly_fields = ['created_at', 'updated_at']
