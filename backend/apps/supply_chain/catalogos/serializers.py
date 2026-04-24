"""
Serializers para catalogos - supply_chain
"""
from rest_framework import serializers
from .models import Almacen, RutaRecoleccion, TipoAlmacen


# ==============================================================================
# SERIALIZERS DE DASHBOARD (solo lectura — agregados)
# ==============================================================================

class AlmacenDashboardHeaderSerializer(serializers.ModelSerializer):
    """Snapshot liviano del almacén para el header del dashboard."""

    tipo_almacen_nombre = serializers.CharField(
        source='tipo_almacen.nombre', read_only=True, allow_null=True,
    )
    sede_nombre = serializers.CharField(
        source='sede.nombre', read_only=True, allow_null=True,
    )

    class Meta:
        model = Almacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'tipo_almacen', 'tipo_almacen_nombre',
            'sede', 'sede_nombre',
            'capacidad_maxima', 'is_active',
        ]
        read_only_fields = fields


class CalidadPromedioParametroSerializer(serializers.Serializer):
    """Serializer ligero para promedio ponderado por parámetro QC."""

    parameter_code = serializers.CharField()
    parameter_name = serializers.CharField()
    weighted_avg = serializers.DecimalField(max_digits=12, decimal_places=4)
    unit = serializers.CharField(allow_blank=True)
    dominant_range = serializers.DictField(required=False, allow_null=True)


class InventarioPorProductoSerializer(serializers.Serializer):
    """Agregado por producto dentro del dashboard de almacén."""

    producto_id = serializers.IntegerField()
    producto_codigo = serializers.CharField()
    producto_nombre = serializers.CharField()
    cantidad_total = serializers.DecimalField(max_digits=15, decimal_places=3)
    unidad_medida = serializers.CharField(allow_blank=True)
    calidad_promedio = CalidadPromedioParametroSerializer(many=True)


class AlmacenStatsSerializer(serializers.Serializer):
    """Stats agregadas de un almacén."""

    total_cantidad = serializers.DecimalField(max_digits=15, decimal_places=3)
    ocupacion_porcentaje = serializers.DecimalField(max_digits=6, decimal_places=2)
    productos_distintos = serializers.IntegerField()
    ultima_recepcion = serializers.DateTimeField(allow_null=True)
    movimientos_30d = serializers.IntegerField()


class AlertaDashboardSerializer(serializers.Serializer):
    """Alerta activa para el dashboard."""

    id = serializers.IntegerField()
    tipo = serializers.CharField()
    producto_nombre = serializers.CharField(allow_blank=True)
    mensaje = serializers.CharField(allow_blank=True)
    criticidad = serializers.CharField(allow_blank=True)
    fecha_generacion = serializers.DateTimeField()


class AlmacenDashboardSerializer(serializers.Serializer):
    """Response global del dashboard de un almacén."""

    almacen = AlmacenDashboardHeaderSerializer()
    stats = AlmacenStatsSerializer()
    inventario_por_producto = InventarioPorProductoSerializer(many=True)
    alertas_activas = AlertaDashboardSerializer(many=True)


class KardexMovimientoSerializer(serializers.Serializer):
    """Entrada simplificada del kardex (movimiento)."""

    id = serializers.IntegerField()
    codigo = serializers.CharField()
    fecha_movimiento = serializers.DateTimeField()
    tipo_movimiento_codigo = serializers.CharField(allow_blank=True)
    tipo_movimiento_nombre = serializers.CharField(allow_blank=True)
    afecta_stock = serializers.CharField(allow_blank=True)
    producto_id = serializers.IntegerField()
    producto_codigo = serializers.CharField(allow_blank=True)
    producto_nombre = serializers.CharField(allow_blank=True)
    cantidad = serializers.DecimalField(max_digits=15, decimal_places=3)
    unidad_medida = serializers.CharField(allow_blank=True)
    almacen_origen_id = serializers.IntegerField(allow_null=True)
    almacen_origen_nombre = serializers.CharField(allow_blank=True)
    almacen_destino_id = serializers.IntegerField(allow_null=True)
    almacen_destino_nombre = serializers.CharField(allow_blank=True)
    documento_referencia = serializers.CharField(allow_blank=True)
    observaciones = serializers.CharField(allow_blank=True)
    registrado_por_nombre = serializers.CharField(allow_blank=True)


class ResumenGeneralTopProductoSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    producto_codigo = serializers.CharField(allow_blank=True)
    producto_nombre = serializers.CharField(allow_blank=True)
    cantidad_total = serializers.DecimalField(max_digits=15, decimal_places=3)
    almacenes_count = serializers.IntegerField()


class ResumenGeneralSerializer(serializers.Serializer):
    total_almacenes = serializers.IntegerField()
    total_productos_stock = serializers.IntegerField()
    total_cantidad_global = serializers.DecimalField(max_digits=18, decimal_places=3)
    alertas_pendientes = serializers.IntegerField()
    ocupacion_promedio = serializers.DecimalField(max_digits=6, decimal_places=2)
    top_productos = ResumenGeneralTopProductoSerializer(many=True)


class RutaRecoleccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RutaRecoleccion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'es_proveedor_interno', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoAlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlmacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'icono',
            'orden', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlmacenSerializer(serializers.ModelSerializer):
    tipo_almacen_nombre = serializers.CharField(
        source='tipo_almacen.nombre', read_only=True, allow_null=True
    )
    sede_nombre = serializers.CharField(
        source='sede.nombre', read_only=True, allow_null=True
    )
    # H-SC-09: codigo se auto-genera en save() si viene vacío (ALM-001...).
    codigo = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Almacen
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'direccion',
            'es_principal', 'permite_despacho', 'permite_recepcion',
            'tipo_almacen', 'tipo_almacen_nombre', 'capacidad_maxima',
            'sede', 'sede_nombre',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
