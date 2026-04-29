"""
Serializers para Gestión de Almacenamiento e Inventario — Supply Chain

Producto se expone como FK al catálogo maestro (catalogo_productos.Producto).
Los campos legacy `producto_codigo` y `producto_nombre` se exponen como
read-only derivados de la FK para retro-compatibilidad con el frontend.
"""
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from apps.infraestructura.catalogo_productos.models import Producto, UnidadMedida

from .models import (
    AlertaStock,
    ConfiguracionStock,
    EstadoInventario,
    Inventario,
    Kardex,
    MovimientoInventario,
    TipoAlerta,
    TipoMovimientoInventario,
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoMovimientoInventarioSerializer(serializers.ModelSerializer):
    signo = serializers.CharField(source='signo_afectacion', read_only=True)
    afecta_stock_display = serializers.CharField(
        source='get_afecta_stock_display', read_only=True,
    )

    class Meta:
        model = TipoMovimientoInventario
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'afecta_stock', 'afecta_stock_display', 'signo',
            'requiere_origen', 'requiere_destino', 'requiere_documento',
            'orden', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoMovimientoInventarioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMovimientoInventario
        fields = ['id', 'codigo', 'nombre', 'afecta_stock', 'signo_afectacion']


class EstadoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoInventario
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'permite_uso',
            'color_hex', 'orden', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EstadoInventarioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoInventario
        fields = ['id', 'codigo', 'nombre', 'color_hex', 'permite_uso']


class TipoAlertaSerializer(serializers.ModelSerializer):
    prioridad_display = serializers.CharField(
        source='get_prioridad_display', read_only=True,
    )

    class Meta:
        model = TipoAlerta
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'prioridad', 'prioridad_display',
            'color_hex', 'dias_anticipacion',
            'orden', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoAlertaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlerta
        fields = ['id', 'codigo', 'nombre', 'prioridad', 'color_hex']


class UnidadMedidaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    # simbolo mantenido como alias de abreviatura para retro-compat con frontend
    simbolo = serializers.CharField(source='abreviatura', read_only=True)

    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'nombre', 'abreviatura', 'simbolo',
            'tipo', 'tipo_display', 'factor_conversion', 'es_base',
            'orden', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UnidadMedidaListSerializer(serializers.ModelSerializer):
    simbolo = serializers.CharField(source='abreviatura', read_only=True)

    class Meta:
        model = UnidadMedida
        fields = ['id', 'abreviatura', 'simbolo', 'nombre']


# ==============================================================================
# SERIALIZERS PRINCIPALES
# ==============================================================================

class InventarioSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    unidad_medida_abrev = serializers.CharField(source='unidad_medida.abreviatura', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color_hex', read_only=True)

    # Read-only derivados de la FK Producto (retro-compatibilidad frontend)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_tipo = serializers.CharField(source='producto.tipo', read_only=True)
    producto_tipo_display = serializers.CharField(
        source='producto.get_tipo_display', read_only=True,
    )

    cantidad_total_calculada = serializers.DecimalField(
        source='cantidad_total', max_digits=12, decimal_places=3, read_only=True,
    )
    esta_vencido_flag = serializers.BooleanField(source='esta_vencido', read_only=True)
    dias_vencimiento = serializers.IntegerField(source='dias_para_vencer', read_only=True)

    class Meta:
        model = Inventario
        fields = [
            'id',
            'almacen', 'almacen_nombre',
            'producto',
            'producto_codigo', 'producto_nombre',
            'producto_tipo', 'producto_tipo_display',
            'tipo_epp_id', 'tipo_epp_nombre',
            'lote', 'fecha_vencimiento', 'fecha_ingreso',
            'cantidad_disponible', 'cantidad_reservada', 'cantidad_en_transito',
            'cantidad_total_calculada',
            'unidad_medida', 'unidad_medida_abrev',
            'costo_unitario', 'costo_promedio', 'valor_total',
            'estado', 'estado_nombre', 'estado_color',
            'ubicacion_fisica', 'zona',
            'observaciones',
            'esta_vencido_flag', 'dias_vencimiento',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'valor_total', 'created_at', 'updated_at']


class InventarioListSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    unidad_medida_abrev = serializers.CharField(source='unidad_medida.abreviatura', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color_hex', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = Inventario
        fields = [
            'id', 'almacen_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'cantidad_disponible', 'unidad_medida_abrev',
            'estado_nombre', 'estado_color', 'valor_total', 'lote',
        ]


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    almacen_origen_nombre = serializers.CharField(
        source='almacen_origen.nombre', read_only=True,
    )
    almacen_destino_nombre = serializers.CharField(
        source='almacen_destino.nombre', read_only=True,
    )
    tipo_movimiento_nombre = serializers.CharField(
        source='tipo_movimiento.nombre', read_only=True,
    )
    tipo_movimiento_afecta = serializers.CharField(
        source='tipo_movimiento.afecta_stock', read_only=True,
    )
    unidad_medida_abrev = serializers.CharField(source='unidad_medida.abreviatura', read_only=True)
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name', read_only=True,
    )
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id',
            'almacen_origen', 'almacen_origen_nombre',
            'almacen_destino', 'almacen_destino_nombre',
            'codigo', 'tipo_movimiento', 'tipo_movimiento_nombre',
            'tipo_movimiento_afecta',
            'fecha_movimiento',
            'producto', 'producto_codigo', 'producto_nombre',
            'lote',
            'cantidad', 'unidad_medida', 'unidad_medida_abrev',
            'costo_unitario', 'costo_total',
            'documento_referencia', 'origen_tipo', 'origen_id',
            'observaciones',
            'registrado_por', 'registrado_por_nombre',
            'created_at',
        ]
        read_only_fields = ['id', 'codigo', 'costo_total', 'created_at']

    def validate(self, data):
        tipo_movimiento = data.get('tipo_movimiento')
        if tipo_movimiento:
            if tipo_movimiento.requiere_origen and not data.get('almacen_origen'):
                raise serializers.ValidationError({
                    'almacen_origen': 'Este tipo de movimiento requiere almacén origen',
                })
            if tipo_movimiento.requiere_destino and not data.get('almacen_destino'):
                raise serializers.ValidationError({
                    'almacen_destino': 'Este tipo de movimiento requiere almacén destino',
                })
            if tipo_movimiento.requiere_documento and not data.get('documento_referencia'):
                raise serializers.ValidationError({
                    'documento_referencia': 'Este tipo de movimiento requiere documento de referencia',
                })
        return data


class MovimientoInventarioListSerializer(serializers.ModelSerializer):
    tipo_movimiento_nombre = serializers.CharField(
        source='tipo_movimiento.nombre', read_only=True,
    )
    almacen_destino_nombre = serializers.CharField(
        source='almacen_destino.nombre', read_only=True,
    )
    unidad_medida_abrev = serializers.CharField(source='unidad_medida.abreviatura', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'codigo', 'tipo_movimiento_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'almacen_destino_nombre',
            'cantidad', 'unidad_medida_abrev',
            'fecha_movimiento', 'costo_total',
        ]


class KardexSerializer(serializers.ModelSerializer):
    inventario_producto = serializers.CharField(
        source='inventario.producto.nombre', read_only=True,
    )
    movimiento_codigo = serializers.CharField(source='movimiento.codigo', read_only=True)
    tipo_movimiento = serializers.CharField(
        source='movimiento.tipo_movimiento.nombre', read_only=True,
    )

    class Meta:
        model = Kardex
        fields = [
            'id', 'inventario', 'inventario_producto',
            'movimiento', 'movimiento_codigo', 'tipo_movimiento',
            'fecha',
            'cantidad_entrada', 'cantidad_salida', 'saldo_cantidad',
            'costo_entrada', 'costo_salida', 'saldo_costo',
            'costo_unitario',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AlertaStockSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    inventario_producto = serializers.CharField(
        source='inventario.producto.nombre', read_only=True,
    )
    inventario_cantidad = serializers.DecimalField(
        source='inventario.cantidad_disponible',
        max_digits=12, decimal_places=3, read_only=True,
    )
    tipo_alerta_nombre = serializers.CharField(
        source='tipo_alerta.nombre', read_only=True,
    )
    tipo_alerta_color = serializers.CharField(
        source='tipo_alerta.color_hex', read_only=True,
    )
    criticidad_display = serializers.CharField(
        source='get_criticidad_display', read_only=True,
    )
    resuelta_por_nombre = serializers.CharField(
        source='resuelta_por.get_full_name', read_only=True,
    )

    class Meta:
        model = AlertaStock
        fields = [
            'id',
            'almacen', 'almacen_nombre',
            'inventario', 'inventario_producto', 'inventario_cantidad',
            'tipo_alerta', 'tipo_alerta_nombre', 'tipo_alerta_color',
            'fecha_generacion', 'fecha_lectura', 'fecha_resolucion',
            'mensaje', 'criticidad', 'criticidad_display',
            'leida', 'resuelta',
            'resuelta_por', 'resuelta_por_nombre',
            'observaciones',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'fecha_generacion', 'created_at', 'updated_at']


class AlertaStockListSerializer(serializers.ModelSerializer):
    tipo_alerta_nombre = serializers.CharField(source='tipo_alerta.nombre', read_only=True)
    tipo_alerta_color = serializers.CharField(source='tipo_alerta.color_hex', read_only=True)
    inventario_producto = serializers.CharField(
        source='inventario.producto.nombre', read_only=True,
    )
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)

    class Meta:
        model = AlertaStock
        fields = [
            'id', 'tipo_alerta_nombre', 'tipo_alerta_color',
            'inventario_producto', 'almacen_nombre',
            'mensaje', 'criticidad', 'leida', 'resuelta',
            'fecha_generacion',
        ]


class ConfiguracionStockSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    requiere_reorden_flag = serializers.BooleanField(
        source='requiere_reorden', read_only=True,
    )
    inventario_actual = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionStock
        fields = [
            'id',
            'almacen', 'almacen_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'stock_minimo', 'stock_maximo', 'punto_reorden',
            'dias_alerta_vencimiento', 'lead_time_dias',
            'cantidad_economica_pedido',
            'activo',
            'inventario_actual', 'requiere_reorden_flag',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_inventario_actual(self, obj):
        try:
            total = Inventario.objects.filter(
                almacen=obj.almacen,
                producto=obj.producto,
            ).aggregate(total=Sum('cantidad_disponible'))['total']
            return float(total) if total else 0.0
        except (TypeError, ValueError, AttributeError):
            return 0.0

    def validate(self, data):
        stock_minimo = data.get('stock_minimo', Decimal('0'))
        punto_reorden = data.get('punto_reorden', Decimal('0'))
        stock_maximo = data.get('stock_maximo', Decimal('0'))

        if stock_minimo > punto_reorden:
            raise serializers.ValidationError({
                'punto_reorden': 'El punto de reorden debe ser mayor o igual al stock mínimo',
            })
        if punto_reorden > stock_maximo:
            raise serializers.ValidationError({
                'stock_maximo': 'El stock máximo debe ser mayor o igual al punto de reorden',
            })
        return data


class ConfiguracionStockListSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = ConfiguracionStock
        fields = [
            'id', 'almacen_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'stock_minimo', 'punto_reorden', 'stock_maximo', 'activo',
        ]


# ==============================================================================
# SERIALIZERS PARA ACCIONES ESPECIALES
# ==============================================================================

class RegistrarMovimientoSerializer(serializers.Serializer):
    """Serializer para registrar movimientos y actualizar inventario."""

    tipo_movimiento = serializers.PrimaryKeyRelatedField(
        queryset=TipoMovimientoInventario.objects.filter(is_active=True),
    )
    almacen_origen = serializers.IntegerField(required=False, allow_null=True)
    almacen_destino = serializers.IntegerField(required=False, allow_null=True)
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    lote = serializers.CharField(max_length=50, required=False, allow_blank=True)
    cantidad = serializers.DecimalField(max_digits=12, decimal_places=3)
    unidad_medida = serializers.PrimaryKeyRelatedField(
        queryset=UnidadMedida.objects.all(),
    )
    costo_unitario = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
    )
    documento_referencia = serializers.CharField(
        max_length=50, required=False, allow_blank=True,
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_almacen_origen(self, value):
        if value is None:
            return None
        from apps.supply_chain.catalogos.models import Almacen
        try:
            return Almacen.objects.get(pk=value, is_active=True)
        except Almacen.DoesNotExist:
            raise serializers.ValidationError("Almacén origen no encontrado o inactivo")

    def validate_almacen_destino(self, value):
        if value is None:
            return None
        from apps.supply_chain.catalogos.models import Almacen
        try:
            return Almacen.objects.get(pk=value, is_active=True)
        except Almacen.DoesNotExist:
            raise serializers.ValidationError("Almacén destino no encontrado o inactivo")

    def validate(self, data):
        tipo = data.get('tipo_movimiento')

        if tipo.requiere_origen and not data.get('almacen_origen'):
            raise serializers.ValidationError({
                'almacen_origen': 'Este tipo de movimiento requiere almacén origen',
            })
        if tipo.requiere_destino and not data.get('almacen_destino'):
            raise serializers.ValidationError({
                'almacen_destino': 'Este tipo de movimiento requiere almacén destino',
            })

        cantidad = data.get('cantidad')
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero',
            })
        return data


class AjustarInventarioSerializer(serializers.Serializer):
    inventario = serializers.PrimaryKeyRelatedField(queryset=Inventario.objects.all())
    tipo_ajuste = serializers.ChoiceField(choices=[
        ('CANTIDAD', 'Ajuste de Cantidad'),
        ('COSTO', 'Ajuste de Costo'),
        ('ESTADO', 'Cambio de Estado'),
    ])
    nueva_cantidad = serializers.DecimalField(
        max_digits=12, decimal_places=3, required=False,
    )
    nuevo_costo = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False,
    )
    nuevo_estado = serializers.PrimaryKeyRelatedField(
        queryset=EstadoInventario.objects.all(), required=False,
    )
    motivo = serializers.CharField()

    def validate(self, data):
        tipo = data.get('tipo_ajuste')
        if tipo == 'CANTIDAD' and 'nueva_cantidad' not in data:
            raise serializers.ValidationError({
                'nueva_cantidad': 'Debe especificar la nueva cantidad para ajuste de cantidad',
            })
        if tipo == 'COSTO' and 'nuevo_costo' not in data:
            raise serializers.ValidationError({
                'nuevo_costo': 'Debe especificar el nuevo costo para ajuste de costo',
            })
        if tipo == 'ESTADO' and 'nuevo_estado' not in data:
            raise serializers.ValidationError({
                'nuevo_estado': 'Debe especificar el nuevo estado para cambio de estado',
            })
        return data


class DashboardInventarioSerializer(serializers.Serializer):
    total_productos = serializers.IntegerField()
    valor_total_inventario = serializers.DecimalField(max_digits=20, decimal_places=2)
    productos_bajo_stock = serializers.IntegerField()
    productos_vencidos = serializers.IntegerField()
    productos_por_vencer = serializers.IntegerField()
    alertas_pendientes = serializers.IntegerField()
    movimientos_mes = serializers.IntegerField()


class ConsultaKardexSerializer(serializers.Serializer):
    almacen = serializers.IntegerField(required=False, allow_null=True)
    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), required=False,
    )
    fecha_inicio = serializers.DateField(required=False)
    fecha_fin = serializers.DateField(required=False)

    def validate_almacen(self, value):
        if value is None:
            return None
        from apps.supply_chain.catalogos.models import Almacen
        try:
            return Almacen.objects.get(pk=value, is_active=True)
        except Almacen.DoesNotExist:
            raise serializers.ValidationError("Almacén no encontrado o inactivo")
