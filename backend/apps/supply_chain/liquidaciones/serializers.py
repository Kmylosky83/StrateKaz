"""
Serializers para Liquidaciones — Supply Chain (H-SC-12 header+líneas + H-SC-02).
"""
from rest_framework import serializers

from .models import (
    HistorialAjusteLiquidacion,
    Liquidacion,
    LiquidacionLinea,
    LiquidacionPeriodica,
    PagoLiquidacion,
)


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
            'precio_kg_sugerido',
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
            'precio_kg_sugerido',
            'monto_base',
            'ajuste_calidad_monto',
            'monto_final',
            'created_at',
            'updated_at',
        ]


class HistorialAjusteLiquidacionSerializer(serializers.ModelSerializer):
    tipo_ajuste_display = serializers.CharField(
        source='get_tipo_ajuste_display',
        read_only=True,
    )
    origen_display = serializers.CharField(
        source='get_origen_display',
        read_only=True,
    )
    modificado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialAjusteLiquidacion
        fields = [
            'id',
            'liquidacion',
            'linea',
            'tipo_ajuste',
            'tipo_ajuste_display',
            'valor_anterior',
            'valor_nuevo',
            'motivo',
            'origen',
            'origen_display',
            'modificado_por',
            'modificado_por_nombre',
            'created_at',
        ]
        read_only_fields = fields

    def get_modificado_por_nombre(self, obj):
        user = obj.modificado_por
        if user is None:
            return ''
        get_full_name = getattr(user, 'get_full_name', None)
        if callable(get_full_name):
            nombre = get_full_name()
            if nombre:
                return nombre
        return getattr(user, 'username', '') or getattr(user, 'email', '') or ''


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
    # H-SC-E2E-05: conteo de líneas para badge en listado.
    lineas_count = serializers.IntegerField(
        source='lineas_liquidacion.count',
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
            'documento_archivado_id',
            'lineas_count',
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
    lineas_count = serializers.IntegerField(
        source='lineas_liquidacion.count',
        read_only=True,
    )
    # H-SC-RUTA-03: detalle agrupado por productor en modalidad RECOLECCION.
    detalle_por_productor = serializers.SerializerMethodField()
    historial_ajustes = HistorialAjusteLiquidacionSerializer(
        many=True,
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
            'documento_archivado_id',
            'lineas_count',
            'lineas_liquidacion',
            'historial_ajustes',
            'detalle_por_productor',
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
            'documento_archivado_id',
            'created_at',
            'updated_at',
        ]

    def get_detalle_por_productor(self, obj):
        return obj.detalle_por_productor


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


class LiquidacionPeriodicaSerializer(serializers.ModelSerializer):
    """Serializer del agregado periódico H-SC-06 (preservado de upstream)."""

    proveedor_nombre = serializers.CharField(
        source='proveedor.razon_social', read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display', read_only=True
    )
    liquidaciones_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Liquidacion.objects.all(),
        source='liquidaciones',
        required=False,
    )

    class Meta:
        model = LiquidacionPeriodica
        fields = '__all__'
        read_only_fields = [
            'subtotal',
            'ajuste_calidad_total',
            'total',
            'fecha_aprobacion',
            'aprobado_por',
        ]
