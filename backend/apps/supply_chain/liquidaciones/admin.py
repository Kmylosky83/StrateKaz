"""
Admin para Liquidaciones — Supply Chain S3
"""
from django.contrib import admin

from .models import Liquidacion


@admin.register(Liquidacion)
class LiquidacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'linea', 'total_liquidado', 'estado', 'created_at']
    list_filter = ['estado']
    search_fields = ['linea__voucher__proveedor__nombre_comercial', 'linea__producto__nombre']
    readonly_fields = [
        'subtotal', 'ajuste_calidad_monto', 'total_liquidado',
        'created_at', 'updated_at', 'created_by', 'updated_by',
    ]
