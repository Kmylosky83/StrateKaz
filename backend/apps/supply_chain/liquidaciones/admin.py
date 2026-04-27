"""
Admin para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from django.contrib import admin

from .models import (
    HistorialAjusteLiquidacion,
    Liquidacion,
    LiquidacionLinea,
    PagoLiquidacion,
)


class LiquidacionLineaInline(admin.TabularInline):
    model = LiquidacionLinea
    extra = 0
    fields = [
        'voucher_linea',
        'cantidad',
        'precio_unitario',
        'precio_kg_sugerido',
        'monto_base',
        'ajuste_calidad_pct',
        'ajuste_calidad_monto',
        'monto_final',
    ]
    readonly_fields = [
        'precio_kg_sugerido',
        'monto_base',
        'ajuste_calidad_monto',
        'monto_final',
    ]


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
        'documento_archivado_id',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    inlines = [LiquidacionLineaInline]


@admin.register(HistorialAjusteLiquidacion)
class HistorialAjusteLiquidacionAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'liquidacion',
        'linea',
        'tipo_ajuste',
        'valor_anterior',
        'valor_nuevo',
        'origen',
        'modificado_por',
        'created_at',
    ]
    list_filter = ['tipo_ajuste', 'origen']
    search_fields = ['liquidacion__codigo', 'motivo']
    readonly_fields = [
        f.name for f in HistorialAjusteLiquidacion._meta.fields
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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
