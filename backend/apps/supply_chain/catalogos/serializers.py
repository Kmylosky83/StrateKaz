"""
Serializers para catalogos - supply_chain
"""
from rest_framework import serializers
from .models import (
    Almacen, RutaRecoleccion, RutaParada, PrecioRutaSemiAutonoma, TipoAlmacen,
)


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


class ResumenGeneralAlmacenItemSerializer(serializers.Serializer):
    """Item de lista de almacenes en el resumen general."""

    id = serializers.IntegerField()
    codigo = serializers.CharField()
    nombre = serializers.CharField()
    is_active = serializers.BooleanField()
    tipo_almacen_nombre = serializers.CharField(allow_null=True, allow_blank=True)
    sede_nombre = serializers.CharField(allow_null=True, allow_blank=True)
    cantidad_total = serializers.DecimalField(max_digits=15, decimal_places=3)
    capacidad_maxima = serializers.DecimalField(
        max_digits=14, decimal_places=2, allow_null=True,
    )
    ocupacion_pct = serializers.DecimalField(
        max_digits=6, decimal_places=2, allow_null=True,
    )
    productos_distintos = serializers.IntegerField()
    ultima_recepcion = serializers.DateTimeField(allow_null=True)
    dias_desde_ultima_recepcion = serializers.IntegerField(allow_null=True)
    alertas_activas = serializers.IntegerField()


class ResumenGeneralSerializer(serializers.Serializer):
    total_almacenes = serializers.IntegerField()
    total_productos_stock = serializers.IntegerField()
    total_cantidad_global = serializers.DecimalField(max_digits=18, decimal_places=3)
    alertas_pendientes = serializers.IntegerField()
    ocupacion_promedio = serializers.DecimalField(max_digits=6, decimal_places=2)
    top_productos = ResumenGeneralTopProductoSerializer(many=True)
    almacenes = ResumenGeneralAlmacenItemSerializer(many=True)


class RutaRecoleccionSerializer(serializers.ModelSerializer):
    # H-SC-RUTA-01: codigo se auto-genera en save() si viene vacío (RUTA-001...).
    codigo = serializers.CharField(required=False, allow_blank=True)
    modo_operacion_display = serializers.CharField(
        source='get_modo_operacion_display', read_only=True
    )
    paradas_count = serializers.IntegerField(
        source='paradas.count', read_only=True
    )

    class Meta:
        model = RutaRecoleccion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'modo_operacion', 'modo_operacion_display',
            'paradas_count',
            'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RutaParadaSerializer(serializers.ModelSerializer):
    """Parada de Ruta — vínculo Ruta ↔ Proveedor con orden sugerido."""

    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True
    )
    proveedor_documento = serializers.CharField(
        source='proveedor.numero_documento', read_only=True
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True
    )
    ruta_codigo = serializers.CharField(source='ruta.codigo', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = RutaParada
        fields = [
            'id',
            'ruta', 'ruta_codigo', 'ruta_nombre',
            'proveedor', 'proveedor_nombre', 'proveedor_documento', 'proveedor_codigo',
            'orden',
            'is_active', 'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """
        Un proveedor solo puede ser parada de una ruta. La constraint a nivel DB
        lo garantiza, pero damos un error legible aquí en lugar de IntegrityError.
        """
        proveedor = attrs.get('proveedor')
        ruta = attrs.get('ruta')
        if proveedor and ruta:
            qs = RutaParada.objects.filter(
                proveedor=proveedor, is_deleted=False
            )
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            existente = qs.first()
            if existente:
                raise serializers.ValidationError({
                    'proveedor': (
                        f'Este proveedor ya es parada de la ruta '
                        f'"{existente.ruta.codigo} — {existente.ruta.nombre}". '
                        f'Un proveedor solo puede pertenecer a una ruta.'
                    )
                })
        return attrs


class PrecioRutaSemiAutonomaSerializer(serializers.ModelSerializer):
    """Precio interno de Ruta SEMI_AUTONOMA — doble precio."""

    ruta_codigo = serializers.CharField(source='ruta.codigo', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    margen_ruta = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = PrecioRutaSemiAutonoma
        fields = [
            'id',
            'ruta', 'ruta_codigo', 'ruta_nombre',
            'proveedor', 'proveedor_codigo', 'proveedor_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'precio_ruta_paga_proveedor', 'precio_empresa_paga_ruta',
            'margen_ruta',
            'is_active', 'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'margen_ruta']

    def validate(self, attrs):
        """
        Validaciones de negocio replicadas del modelo (clean) para dar errores
        legibles vía DRF en lugar de IntegrityError/ValidationError genérico.
        """
        precio_ruta = attrs.get('precio_ruta_paga_proveedor')
        precio_empresa = attrs.get('precio_empresa_paga_ruta')
        ruta = attrs.get('ruta')

        if precio_ruta is not None and precio_ruta < 0:
            raise serializers.ValidationError({
                'precio_ruta_paga_proveedor': 'El precio no puede ser negativo.',
            })
        if precio_empresa is not None and precio_empresa < 0:
            raise serializers.ValidationError({
                'precio_empresa_paga_ruta': 'El precio no puede ser negativo.',
            })
        if (
            precio_ruta is not None and precio_empresa is not None
            and precio_empresa < precio_ruta
        ):
            raise serializers.ValidationError({
                'precio_empresa_paga_ruta': (
                    'Debe ser >= al precio que la ruta paga al productor '
                    '(la diferencia es el ingreso operativo de la ruta).'
                ),
            })
        if ruta and ruta.modo_operacion != RutaRecoleccion.ModoOperacion.SEMI_AUTONOMA:
            raise serializers.ValidationError({
                'ruta': (
                    f'Esta tabla solo aplica a rutas SEMI_AUTONOMA. '
                    f'La ruta "{ruta.codigo}" está en modo '
                    f'{ruta.get_modo_operacion_display()}.'
                ),
            })
        return attrs


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
