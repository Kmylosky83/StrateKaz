"""
Serializers para Producto Terminado - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

Serializers para API REST de gestión de producto terminado,
liberación de calidad y certificados.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal

from .models import (
    TipoProducto,
    EstadoLote,
    ProductoTerminado,
    StockProducto,
    Liberacion,
    CertificadoCalidad
)

User = get_user_model()


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS
# ==============================================================================

class TipoProductoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de producto terminado."""

    class Meta:
        model = TipoProducto
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'unidad_medida',
            'requiere_certificado',
            'requiere_ficha_tecnica',
            'vida_util_dias',
            'temperatura_almacenamiento_min',
            'temperatura_almacenamiento_max',
            'activo',
            'orden',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class EstadoLoteSerializer(serializers.ModelSerializer):
    """Serializer para estados de lote PT."""

    class Meta:
        model = EstadoLote
        fields = [
            'id',
            'codigo',
            'nombre',
            'color',
            'descripcion',
            'permite_despacho',
            'requiere_liberacion',
            'activo',
            'orden',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS PRINCIPALES
# ==============================================================================

class ProductoTerminadoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de productos terminados."""

    tipo_producto_nombre = serializers.CharField(source='tipo_producto.nombre', read_only=True)
    unidad_medida = serializers.CharField(source='tipo_producto.unidad_medida', read_only=True)
    stock_total = serializers.SerializerMethodField()

    class Meta:
        model = ProductoTerminado
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'tipo_producto',
            'tipo_producto_nombre',
            'unidad_medida',
            'precio_base',
            'moneda',
            'stock_total',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def get_stock_total(self, obj):
        """Obtiene el stock total disponible."""
        return float(obj.get_stock_total())


class ProductoTerminadoSerializer(serializers.ModelSerializer):
    """Serializer completo para producto terminado."""

    tipo_producto_data = TipoProductoSerializer(source='tipo_producto', read_only=True)
    stock_total = serializers.SerializerMethodField()
    stock_por_estado = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = ProductoTerminado
        fields = [
            'id',
            'empresa',
            'codigo',
            'nombre',
            'descripcion',
            'tipo_producto',
            'tipo_producto_data',
            'especificaciones_tecnicas',
            'precio_base',
            'moneda',
            'ficha_tecnica_url',
            'imagen_url',
            'stock_total',
            'stock_por_estado',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_stock_total(self, obj):
        """Obtiene el stock total disponible."""
        return float(obj.get_stock_total())

    def get_stock_por_estado(self, obj):
        """Obtiene el stock agrupado por estado."""
        return list(obj.get_stock_por_estado())


class StockProductoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de stocks."""

    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    estado_lote_nombre = serializers.CharField(source='estado_lote.nombre', read_only=True)
    estado_lote_color = serializers.CharField(source='estado_lote.color', read_only=True)
    unidad_medida = serializers.CharField(source='producto.tipo_producto.unidad_medida', read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = StockProducto
        fields = [
            'id',
            'producto',
            'producto_codigo',
            'producto_nombre',
            'codigo_lote_pt',
            'cantidad_disponible',
            'cantidad_reservada',
            'unidad_medida',
            'estado_lote',
            'estado_lote_nombre',
            'estado_lote_color',
            'fecha_produccion',
            'fecha_vencimiento',
            'dias_para_vencer',
            'esta_vencido',
            'ubicacion_almacen',
            'valor_total',
        ]


class StockProductoSerializer(serializers.ModelSerializer):
    """Serializer completo para stock de producto."""

    producto_data = ProductoTerminadoListSerializer(source='producto', read_only=True)
    estado_lote_data = EstadoLoteSerializer(source='estado_lote', read_only=True)
    lote_produccion_codigo = serializers.CharField(source='lote_produccion.codigo_lote', read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    porcentaje_consumido = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = StockProducto
        fields = [
            'id',
            'empresa',
            'producto',
            'producto_data',
            'estado_lote',
            'estado_lote_data',
            'lote_produccion',
            'lote_produccion_codigo',
            'codigo_lote_pt',
            'cantidad_inicial',
            'cantidad_disponible',
            'cantidad_reservada',
            'fecha_produccion',
            'fecha_vencimiento',
            'dias_para_vencer',
            'esta_vencido',
            'porcentaje_consumido',
            'ubicacion_almacen',
            'costo_unitario',
            'valor_total',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = ['codigo_lote_pt', 'valor_total', 'created_at', 'updated_at', 'created_by', 'updated_by']


class StockProductoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de stock de producto."""

    class Meta:
        model = StockProducto
        fields = [
            'empresa',
            'producto',
            'estado_lote',
            'lote_produccion',
            'cantidad_inicial',
            'cantidad_disponible',
            'fecha_produccion',
            'fecha_vencimiento',
            'ubicacion_almacen',
            'costo_unitario',
        ]

    def validate(self, attrs):
        """Validaciones personalizadas."""
        # Validar que cantidad_disponible no exceda cantidad_inicial
        if attrs.get('cantidad_disponible', 0) > attrs.get('cantidad_inicial', 0):
            raise serializers.ValidationError({
                'cantidad_disponible': 'La cantidad disponible no puede exceder la cantidad inicial.'
            })

        return attrs


class ReservarCantidadSerializer(serializers.Serializer):
    """Serializer para reservar cantidad de stock."""

    cantidad = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal('0.001'))

    def validate_cantidad(self, value):
        """Validar que hay suficiente cantidad disponible."""
        stock = self.context.get('stock')
        if stock and value > stock.cantidad_disponible:
            raise serializers.ValidationError(
                f"No hay suficiente cantidad disponible. Disponible: {stock.cantidad_disponible}"
            )
        return value


class LiberarReservaSerializer(serializers.Serializer):
    """Serializer para liberar cantidad reservada."""

    cantidad = serializers.DecimalField(max_digits=12, decimal_places=3, min_value=Decimal('0.001'))

    def validate_cantidad(self, value):
        """Validar que hay suficiente cantidad reservada."""
        stock = self.context.get('stock')
        if stock and value > stock.cantidad_reservada:
            raise serializers.ValidationError(
                f"No hay suficiente cantidad reservada. Reservada: {stock.cantidad_reservada}"
            )
        return value


# ==============================================================================
# SERIALIZERS DE LIBERACIÓN
# ==============================================================================

class LiberacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de liberaciones."""

    stock_codigo_lote = serializers.CharField(source='stock_producto.codigo_lote_pt', read_only=True)
    producto_nombre = serializers.CharField(source='stock_producto.producto.nombre', read_only=True)
    solicitado_por_name = serializers.CharField(source='solicitado_por.get_full_name', read_only=True)
    aprobado_por_name = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    permite_despacho = serializers.BooleanField(read_only=True)

    class Meta:
        model = Liberacion
        fields = [
            'id',
            'stock_producto',
            'stock_codigo_lote',
            'producto_nombre',
            'fecha_solicitud',
            'fecha_liberacion',
            'resultado',
            'resultado_display',
            'permite_despacho',
            'solicitado_por',
            'solicitado_por_name',
            'aprobado_por',
            'aprobado_por_name',
        ]


class LiberacionSerializer(serializers.ModelSerializer):
    """Serializer completo para liberación."""

    stock_producto_data = StockProductoListSerializer(source='stock_producto', read_only=True)
    solicitado_por_data = serializers.SerializerMethodField()
    aprobado_por_data = serializers.SerializerMethodField()
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    permite_despacho = serializers.BooleanField(read_only=True)
    esta_pendiente = serializers.BooleanField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Liberacion
        fields = [
            'id',
            'empresa',
            'stock_producto',
            'stock_producto_data',
            'fecha_solicitud',
            'fecha_liberacion',
            'resultado',
            'resultado_display',
            'permite_despacho',
            'esta_pendiente',
            'solicitado_por',
            'solicitado_por_data',
            'aprobado_por',
            'aprobado_por_data',
            'parametros_evaluados',
            'observaciones',
            'certificado_url',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = ['fecha_solicitud', 'fecha_liberacion', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_solicitado_por_data(self, obj):
        """Datos del usuario solicitante."""
        if obj.solicitado_por:
            return {
                'id': obj.solicitado_por.id,
                'full_name': obj.solicitado_por.get_full_name(),
                'email': obj.solicitado_por.email,
            }
        return None

    def get_aprobado_por_data(self, obj):
        """Datos del usuario aprobador."""
        if obj.aprobado_por:
            return {
                'id': obj.aprobado_por.id,
                'full_name': obj.aprobado_por.get_full_name(),
                'email': obj.aprobado_por.email,
            }
        return None


class LiberacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitud de liberación."""

    class Meta:
        model = Liberacion
        fields = [
            'empresa',
            'stock_producto',
            'solicitado_por',
            'observaciones',
        ]


class AprobarLiberacionSerializer(serializers.Serializer):
    """Serializer para aprobar liberación."""

    parametros_evaluados = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text='Lista de parámetros evaluados [{parametro, valor, cumple, observacion}]'
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)


class RechazarLiberacionSerializer(serializers.Serializer):
    """Serializer para rechazar liberación."""

    parametros_evaluados = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text='Lista de parámetros evaluados [{parametro, valor, cumple, observacion}]'
    )
    observaciones = serializers.CharField(required=True)


# ==============================================================================
# SERIALIZERS DE CERTIFICADOS
# ==============================================================================

class CertificadoCalidadListSerializer(serializers.ModelSerializer):
    """Serializer para listado de certificados."""

    producto_nombre = serializers.CharField(source='liberacion.stock_producto.producto.nombre', read_only=True)
    codigo_lote = serializers.CharField(source='liberacion.stock_producto.codigo_lote_pt', read_only=True)
    emitido_por_name = serializers.CharField(source='emitido_por.get_full_name', read_only=True)

    class Meta:
        model = CertificadoCalidad
        fields = [
            'id',
            'numero_certificado',
            'liberacion',
            'producto_nombre',
            'codigo_lote',
            'cliente_nombre',
            'fecha_emision',
            'fecha_vencimiento',
            'emitido_por',
            'emitido_por_name',
            'pdf_url',
        ]


class CertificadoCalidadSerializer(serializers.ModelSerializer):
    """Serializer completo para certificado de calidad."""

    liberacion_data = LiberacionListSerializer(source='liberacion', read_only=True)
    emitido_por_data = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = CertificadoCalidad
        fields = [
            'id',
            'empresa',
            'numero_certificado',
            'liberacion',
            'liberacion_data',
            'cliente_nombre',
            'fecha_emision',
            'fecha_vencimiento',
            'parametros_certificados',
            'observaciones',
            'emitido_por',
            'emitido_por_data',
            'pdf_url',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = ['numero_certificado', 'fecha_emision', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_emitido_por_data(self, obj):
        """Datos del usuario emisor."""
        if obj.emitido_por:
            return {
                'id': obj.emitido_por.id,
                'full_name': obj.emitido_por.get_full_name(),
                'email': obj.emitido_por.email,
            }
        return None

    def validate_liberacion(self, value):
        """Validar que la liberación esté aprobada."""
        if not value.permite_despacho:
            raise serializers.ValidationError(
                'Solo se pueden emitir certificados para liberaciones aprobadas.'
            )
        return value


class CertificadoCalidadCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear certificado de calidad."""

    class Meta:
        model = CertificadoCalidad
        fields = [
            'empresa',
            'liberacion',
            'cliente_nombre',
            'fecha_vencimiento',
            'parametros_certificados',
            'observaciones',
            'emitido_por',
        ]

    def validate_liberacion(self, value):
        """Validar que la liberación esté aprobada."""
        if not value.permite_despacho:
            raise serializers.ValidationError(
                'Solo se pueden emitir certificados para liberaciones aprobadas.'
            )
        return value
