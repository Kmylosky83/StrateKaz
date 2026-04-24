"""
Serializers para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from rest_framework import serializers

from .models import Liquidacion, LiquidacionLinea, PagoLiquidacion


class LiquidacionLineaSerializer(serializers.ModelSerializer):
    voucher_linea_producto_nombre = serializers.CharField(
        source='voucher_linea.producto.nombre',
        read_only=True,
    )
    voucher_linea_peso = serializers.DecimalField(
        source='voucher_linea.peso_neto_kg',
        max_digits=12,
        decimal_places=3,
        read_only=True,
    )

    class Meta:
        model = LiquidacionLinea
        fields = [
            'id',
            'liquidacion',
            'voucher_linea',
            'voucher_linea_producto_nombre',
            'voucher_linea_peso',
            'cantidad',
            'precio_unitario',
            'monto_base',
            'ajuste_calidad_pct',
            'ajuste_calidad_monto',
            'monto_final',
            'observaciones',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'liquidacion',
            'voucher_linea',
            'cantidad',
            'precio_unitario',
            'monto_base',
            'ajuste_calidad_monto',
            'monto_final',
            'created_at',
            'updated_at',
        ]


class LiquidacionListSerializer(serializers.ModelSerializer):
    """Serializer ligero para el listado (sin nested lineas)."""

    voucher_proveedor_nombre = serializers.CharField(
        source='voucher.proveedor.nombre_comercial',
        read_only=True,
    )
    voucher_fecha_viaje = serializers.DateField(
        source='voucher.fecha_viaje',
        read_only=True,
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True,
    )

    class Meta:
        model = Liquidacion
        fields = [
            'id',
            'codigo',
            'numero',
            'voucher',
            'voucher_proveedor_nombre',
            'voucher_fecha_viaje',
            'subtotal',
            'ajuste_calidad_total',
            'total',
            'estado',
            'estado_display',
            'fecha_aprobacion',
            'created_at',
        ]


class LiquidacionSerializer(serializers.ModelSerializer):
    """Serializer detail con nested lineas_liquidacion."""

    lineas_liquidacion = LiquidacionLineaSerializer(many=True, read_only=True)
    voucher_proveedor_nombre = serializers.CharField(
        source='voucher.proveedor.nombre_comercial',
        read_only=True,
    )
    voucher_fecha_viaje = serializers.DateField(
        source='voucher.fecha_viaje',
        read_only=True,
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True,
    )

    class Meta:
        model = Liquidacion
        fields = [
            'id',
            'codigo',
            'numero',
            'voucher',
            'voucher_proveedor_nombre',
            'voucher_fecha_viaje',
            'subtotal',
            'ajuste_calidad_total',
            'total',
            'estado',
            'estado_display',
            'fecha_aprobacion',
            'aprobado_por',
            'observaciones',
            'lineas_liquidacion',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'codigo',
            'numero',
            'voucher',
            'subtotal',
            'ajuste_calidad_total',
            'total',
            'fecha_aprobacion',
            'aprobado_por',
            'created_at',
            'updated_at',
        ]


class PagoLiquidacionSerializer(serializers.ModelSerializer):
    metodo_display = serializers.CharField(
        source='get_metodo_display',
        read_only=True,
    )
    liquidacion_codigo = serializers.CharField(
        source='liquidacion.codigo',
        read_only=True,
    )

    class Meta:
        model = PagoLiquidacion
        fields = [
            'id',
            'liquidacion',
            'liquidacion_codigo',
            'fecha_pago',
            'metodo',
            'metodo_display',
            'referencia',
            'monto_pagado',
            'observaciones',
            'registrado_por',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'registrado_por',
            'created_at',
            'updated_at',
        ]
