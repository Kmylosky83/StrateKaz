"""
Admin para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from django.contrib import admin

from .models import Liquidacion, LiquidacionLinea, PagoLiquidacion


class LiquidacionLineaInline(admin.TabularInline):
    model = LiquidacionLinea
    extra = 0
    fields = [
        'voucher_linea',
        'cantidad',
        'precio_unitario',
        'monto_base',
        'ajuste_calidad_pct',
        'ajuste_calidad_monto',
        'monto_final',
    ]
    readonly_fields = ['monto_base', 'ajuste_calidad_monto', 'monto_final']


@admin.register(Liquidacion)
class LiquidacionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo',
        'voucher',
        'total',
        'estado',
        'fecha_aprobacion',
        'created_at',
    ]
    list_filter = ['estado']
    search_fields = [
        'codigo',
        'voucher__proveedor__nombre_comercial',
    ]
    readonly_fields = [
        'codigo',
        'numero',
        'subtotal',
        'ajuste_calidad_total',
        'total',
        'fecha_aprobacion',
        'aprobado_por',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    inlines = [LiquidacionLineaInline]


@admin.register(PagoLiquidacion)
class PagoLiquidacionAdmin(admin.ModelAdmin):
    list_display = [
        'liquidacion',
        'fecha_pago',
        'metodo',
        'monto_pagado',
        'referencia',
    ]
    list_filter = ['metodo', 'fecha_pago']
    search_fields = [
        'liquidacion__codigo',
        'referencia',
    ]
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
