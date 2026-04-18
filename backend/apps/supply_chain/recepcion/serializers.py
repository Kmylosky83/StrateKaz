"""
Serializers para Recepción — Supply Chain S3
"""
from rest_framework import serializers

from .models import RecepcionCalidad, VoucherRecepcion


class VoucherRecepcionListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados."""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    modalidad_entrega_display = serializers.CharField(
        source='get_modalidad_entrega_display', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    valor_total_estimado = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = VoucherRecepcion
        fields = [
            'id',
            'proveedor', 'proveedor_nombre',
            'producto', 'producto_nombre',
            'modalidad_entrega', 'modalidad_entrega_display',
            'fecha_viaje',
            'peso_neto_kg', 'precio_kg_snapshot', 'valor_total_estimado',
            'almacen_destino', 'almacen_nombre',
            'estado', 'estado_display',
            'created_at',
        ]


class VoucherRecepcionSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle / create / update."""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    uneg_transportista_nombre = serializers.CharField(
        source='uneg_transportista.nombre', read_only=True
    )
    almacen_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    operador_nombre = serializers.CharField(source='operador_bascula.get_full_name', read_only=True)
    modalidad_entrega_display = serializers.CharField(
        source='get_modalidad_entrega_display', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    valor_total_estimado = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = VoucherRecepcion
        fields = [
            'id',
            # Partes
            'proveedor', 'proveedor_nombre',
            'producto', 'producto_nombre',
            # Logística
            'modalidad_entrega', 'modalidad_entrega_display',
            'uneg_transportista', 'uneg_transportista_nombre',
            'fecha_viaje',
            # OC opcional
            'orden_compra',
            # Pesaje
            'peso_bruto_kg', 'peso_tara_kg', 'peso_neto_kg',
            # Precio snapshot
            'precio_kg_snapshot',
            # Destino
            'almacen_destino', 'almacen_nombre',
            # Operador
            'operador_bascula', 'operador_nombre',
            # Estado
            'estado', 'estado_display',
            'observaciones',
            # Calculado
            'valor_total_estimado',
            # Auditoría
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'peso_neto_kg', 'valor_total_estimado',
            'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        instance = VoucherRecepcion(**{
            k: v for k, v in attrs.items()
            if k in {f.name for f in VoucherRecepcion._meta.get_fields() if not f.many_to_many}
        })
        instance.clean()
        return attrs


class RecepcionCalidadSerializer(serializers.ModelSerializer):
    """Resultado de control de calidad aplicado al voucher."""
    voucher_codigo = serializers.IntegerField(source='voucher.pk', read_only=True)
    analista_nombre = serializers.CharField(source='analista.get_full_name', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)

    class Meta:
        model = RecepcionCalidad
        fields = [
            'id',
            'voucher', 'voucher_codigo',
            'parametros_medidos',
            'resultado', 'resultado_display',
            'analista', 'analista_nombre',
            'fecha_analisis',
            'observaciones',
            'created_at',
        ]
        read_only_fields = ['created_at']
