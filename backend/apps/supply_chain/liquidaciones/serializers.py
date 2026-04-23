"""
Serializers para Liquidaciones — Supply Chain S3
"""
from rest_framework import serializers

from .models import Liquidacion


class LiquidacionSerializer(serializers.ModelSerializer):
    voucher_proveedor = serializers.CharField(
        source='linea.voucher.proveedor.nombre_comercial', read_only=True
    )
    voucher_producto = serializers.CharField(
        source='linea.producto.nombre', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Liquidacion
        fields = [
            'id',
            'linea', 'voucher_proveedor', 'voucher_producto',
            'precio_kg_aplicado', 'peso_neto_kg',
            'subtotal',
            'ajuste_calidad_pct', 'ajuste_calidad_monto',
            'total_liquidado',
            'estado', 'estado_display',
            'observaciones',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'subtotal', 'ajuste_calidad_monto', 'total_liquidado',
            'created_at', 'updated_at',
        ]
