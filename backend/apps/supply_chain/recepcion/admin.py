"""
Admin para Recepción — Supply Chain S3
"""
from django.contrib import admin

from .models import (
    MedicionCalidad,
    ParametroCalidad,
    RangoCalidad,
    RecepcionCalidad,
    VoucherLineaMP,
    VoucherRecepcion,
)


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


# ── QC configurable (H-SC-11 Fase 1) ──────────────────────────────────


class RangoCalidadInline(admin.TabularInline):
    model = RangoCalidad
    extra = 0
    fields = ['code', 'name', 'min_value', 'max_value', 'color_hex', 'order', 'is_active']


@admin.register(ParametroCalidad)
class ParametroCalidadAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name', 'unit', 'decimals', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    ordering = ['order', 'name']
    inlines = [RangoCalidadInline]
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(RangoCalidad)
class RangoCalidadAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'parameter', 'code', 'name',
        'min_value', 'max_value', 'color_hex', 'order', 'is_active',
    ]
    list_filter = ['parameter', 'is_active']
    search_fields = ['code', 'name', 'parameter__code']
    autocomplete_fields = ['parameter']
    ordering = ['parameter', 'order']


@admin.register(MedicionCalidad)
class MedicionCalidadAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'voucher_line', 'parameter',
        'measured_value', 'classified_range', 'measured_at',
    ]
    list_filter = ['parameter', 'classified_range', 'measured_at']
    search_fields = [
        'voucher_line__voucher__proveedor__nombre_comercial',
        'parameter__code', 'parameter__name',
    ]
    autocomplete_fields = ['parameter']
    raw_id_fields = ['voucher_line', 'classified_range']
    readonly_fields = ['classified_range', 'measured_at', 'created_at', 'updated_at']
