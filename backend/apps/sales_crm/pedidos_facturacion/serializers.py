"""
Serializers para Pedidos y Facturación - Sales CRM
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone

from .models import (
    EstadoPedido,
    MetodoPago,
    CondicionPago,
    Pedido,
    DetallePedido,
    Factura,
    PagoFactura
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS
# ==============================================================================

class EstadoPedidoSerializer(serializers.ModelSerializer):
    """Serializer para estados de pedido"""

    class Meta:
        model = EstadoPedido
        fields = [
            'id', 'codigo', 'nombre', 'color', 'descripcion',
            'es_inicial', 'es_final', 'permite_modificacion', 'permite_facturar',
            'activo', 'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MetodoPagoSerializer(serializers.ModelSerializer):
    """Serializer para métodos de pago"""

    class Meta:
        model = MetodoPago
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'requiere_referencia', 'requiere_autorizacion',
            'activo', 'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CondicionPagoSerializer(serializers.ModelSerializer):
    """Serializer para condiciones de pago"""

    class Meta:
        model = CondicionPago
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'dias_plazo',
            'aplica_descuento', 'porcentaje_descuento',
            'activo', 'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS DE DETALLE DE PEDIDO
# ==============================================================================

class DetallePedidoSerializer(serializers.ModelSerializer):
    """Serializer para detalles de pedido"""

    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'pedido', 'producto', 'producto_nombre', 'producto_codigo',
            'descripcion', 'cantidad', 'unidad_medida', 'precio_unitario',
            'descuento_linea', 'subtotal', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa', 'subtotal', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones de detalle"""

        # Si está editando, obtener la instancia actual
        if self.instance:
            producto = attrs.get('producto', self.instance.producto)
            cantidad = attrs.get('cantidad', self.instance.cantidad)
            precio_unitario = attrs.get('precio_unitario', self.instance.precio_unitario)
        else:
            producto = attrs.get('producto')
            cantidad = attrs.get('cantidad')
            precio_unitario = attrs.get('precio_unitario')

        # Copiar descripción del producto si no se proporciona
        if not attrs.get('descripcion') and producto:
            attrs['descripcion'] = producto.nombre

        # Copiar unidad de medida del producto si no se proporciona
        if not attrs.get('unidad_medida') and producto:
            attrs['unidad_medida'] = producto.unidad_medida

        # Validar cantidad positiva
        if cantidad and cantidad <= 0:
            raise serializers.ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero'
            })

        # Validar precio no negativo
        if precio_unitario and precio_unitario < 0:
            raise serializers.ValidationError({
                'precio_unitario': 'El precio no puede ser negativo'
            })

        return attrs


# ==============================================================================
# SERIALIZERS DE PEDIDO
# ==============================================================================

class PedidoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de pedidos"""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    cliente_nit = serializers.CharField(source='cliente.numero_documento', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color', read_only=True)
    condicion_pago_nombre = serializers.CharField(source='condicion_pago.nombre', read_only=True)

    # Campos calculados
    puede_modificar = serializers.BooleanField(read_only=True)
    puede_facturar = serializers.BooleanField(read_only=True)
    tiene_factura = serializers.BooleanField(read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'codigo', 'cliente', 'cliente_nombre', 'cliente_nit',
            'vendedor', 'vendedor_nombre', 'estado', 'estado_nombre', 'estado_color',
            'condicion_pago', 'condicion_pago_nombre', 'fecha_pedido',
            'fecha_entrega_estimada', 'total', 'puede_modificar', 'puede_facturar',
            'tiene_factura', 'created_at', 'updated_at'
        ]


class PedidoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de pedido"""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color', read_only=True)
    condicion_pago_nombre = serializers.CharField(source='condicion_pago.nombre', read_only=True)
    cotizacion_codigo = serializers.CharField(source='cotizacion.codigo', read_only=True, allow_null=True)

    # Campos calculados
    puede_modificar = serializers.BooleanField(read_only=True)
    puede_facturar = serializers.BooleanField(read_only=True)
    tiene_factura = serializers.BooleanField(read_only=True)

    # Relaciones anidadas
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    facturas_count = serializers.IntegerField(source='facturas.count', read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'codigo', 'cliente', 'cliente_nombre', 'cotizacion', 'cotizacion_codigo',
            'vendedor', 'vendedor_nombre', 'estado', 'estado_nombre', 'estado_color',
            'condicion_pago', 'condicion_pago_nombre', 'fecha_pedido',
            'fecha_entrega_estimada', 'direccion_entrega', 'observaciones',
            'subtotal', 'descuento_porcentaje', 'descuento_valor', 'impuestos', 'total',
            'puede_modificar', 'puede_facturar', 'tiene_factura',
            'detalles', 'facturas_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'empresa', 'subtotal', 'descuento_valor', 'total',
            'created_at', 'updated_at'
        ]


class PedidoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/editar pedidos"""

    detalles = DetallePedidoSerializer(many=True, required=False)

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cotizacion', 'vendedor', 'estado', 'condicion_pago',
            'fecha_pedido', 'fecha_entrega_estimada', 'direccion_entrega',
            'observaciones', 'descuento_porcentaje', 'impuestos', 'detalles'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """Validaciones de pedido"""

        # Validar fecha de pedido no en el futuro
        fecha_pedido = attrs.get('fecha_pedido', timezone.now().date())
        if fecha_pedido > timezone.now().date():
            raise serializers.ValidationError({
                'fecha_pedido': 'La fecha de pedido no puede ser en el futuro'
            })

        # Validar fecha de entrega estimada
        if attrs.get('fecha_entrega_estimada'):
            if attrs['fecha_entrega_estimada'] < fecha_pedido:
                raise serializers.ValidationError({
                    'fecha_entrega_estimada': 'La fecha de entrega no puede ser anterior a la fecha del pedido'
                })

        # Validar descuento
        descuento = attrs.get('descuento_porcentaje', Decimal('0.00'))
        if descuento < 0 or descuento > 100:
            raise serializers.ValidationError({
                'descuento_porcentaje': 'El descuento debe estar entre 0 y 100'
            })

        # Validar impuestos
        impuestos = attrs.get('impuestos', Decimal('19.00'))
        if impuestos < 0 or impuestos > 100:
            raise serializers.ValidationError({
                'impuestos': 'Los impuestos deben estar entre 0 y 100'
            })

        return attrs

    def create(self, validated_data):
        """Crear pedido con detalles"""

        detalles_data = validated_data.pop('detalles', [])
        pedido = Pedido.objects.create(**validated_data)

        # Crear detalles
        for i, detalle_data in enumerate(detalles_data):
            detalle_data['orden'] = i + 1
            DetallePedido.objects.create(
                pedido=pedido,
                empresa=pedido.empresa,
                **detalle_data
            )

        # Recalcular totales (se hace automáticamente en DetallePedido.save())

        return pedido

    def update(self, instance, validated_data):
        """Actualizar pedido"""

        detalles_data = validated_data.pop('detalles', None)

        # Validar que el pedido pueda modificarse
        if not instance.puede_modificar:
            raise serializers.ValidationError(
                'El pedido no puede modificarse en su estado actual'
            )

        # Actualizar campos de pedido
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionan detalles, reemplazar todos
        if detalles_data is not None:
            # Eliminar detalles existentes
            instance.detalles.all().delete()

            # Crear nuevos detalles
            for i, detalle_data in enumerate(detalles_data):
                detalle_data['orden'] = i + 1
                DetallePedido.objects.create(
                    pedido=instance,
                    empresa=instance.empresa,
                    **detalle_data
                )

            # Recalcular totales
            instance.calcular_totales()

        return instance


# ==============================================================================
# SERIALIZERS DE FACTURA
# ==============================================================================

class FacturaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de facturas"""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    cliente_nit = serializers.CharField(source='cliente.numero_documento', read_only=True)
    pedido_codigo = serializers.CharField(source='pedido.codigo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Campos calculados
    saldo_pendiente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_vencimiento = serializers.IntegerField(read_only=True)
    total_pagos = serializers.IntegerField(source='pagos.count', read_only=True)

    class Meta:
        model = Factura
        fields = [
            'id', 'codigo', 'pedido', 'pedido_codigo', 'cliente', 'cliente_nombre', 'cliente_nit',
            'fecha_factura', 'fecha_vencimiento', 'estado', 'estado_display',
            'total', 'saldo_pendiente', 'esta_vencida', 'dias_vencimiento',
            'total_pagos', 'created_at', 'updated_at'
        ]


class FacturaDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de factura con pagos anidados"""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    pedido_codigo = serializers.CharField(source='pedido.codigo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Campos calculados
    saldo_pendiente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_vencimiento = serializers.IntegerField(read_only=True)

    # Relación anidada (se carga lazy en vista)
    # pagos se incluyen en el viewset con prefetch

    class Meta:
        model = Factura
        fields = [
            'id', 'codigo', 'pedido', 'pedido_codigo', 'cliente', 'cliente_nombre',
            'fecha_factura', 'fecha_vencimiento', 'estado', 'estado_display',
            'subtotal', 'descuento_valor', 'impuestos', 'total',
            'saldo_pendiente', 'esta_vencida', 'dias_vencimiento',
            'cufe', 'xml_url', 'pdf_url', 'observaciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'empresa', 'created_at', 'updated_at'
        ]


# ==============================================================================
# SERIALIZERS DE PAGO
# ==============================================================================

class PagoFacturaSerializer(serializers.ModelSerializer):
    """Serializer para pagos de factura"""

    factura_codigo = serializers.CharField(source='factura.codigo', read_only=True)
    metodo_pago_nombre = serializers.CharField(source='metodo_pago.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = PagoFactura
        fields = [
            'id', 'codigo', 'factura', 'factura_codigo', 'fecha_pago', 'monto',
            'metodo_pago', 'metodo_pago_nombre', 'referencia_pago',
            'observaciones', 'registrado_por', 'registrado_por_nombre',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'empresa', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones de pago"""

        factura = attrs.get('factura', self.instance.factura if self.instance else None)
        monto = attrs.get('monto')

        # Validar que la factura no esté anulada
        if factura and factura.estado == 'ANULADA':
            raise serializers.ValidationError({
                'factura': 'No se puede registrar pago en una factura anulada'
            })

        # Validar que la factura no esté completamente pagada
        if factura and factura.estado == 'PAGADA' and not self.instance:
            raise serializers.ValidationError({
                'factura': 'La factura ya está completamente pagada'
            })

        # Validar que el monto no exceda el saldo pendiente
        if factura and monto:
            saldo_pendiente = factura.saldo_pendiente
            if monto > saldo_pendiente:
                raise serializers.ValidationError({
                    'monto': f'El monto ({monto}) excede el saldo pendiente ({saldo_pendiente})'
                })

        # Validar referencia si el método lo requiere
        metodo_pago = attrs.get('metodo_pago', self.instance.metodo_pago if self.instance else None)
        referencia = attrs.get('referencia_pago', '')

        if metodo_pago and metodo_pago.requiere_referencia and not referencia:
            raise serializers.ValidationError({
                'referencia_pago': f'El método {metodo_pago.nombre} requiere número de referencia'
            })

        return attrs


# ==============================================================================
# SERIALIZERS DE ACCIONES
# ==============================================================================

class AprobarPedidoSerializer(serializers.Serializer):
    """Serializer para aprobar pedido"""

    observaciones = serializers.CharField(required=False, allow_blank=True)


class CancelarPedidoSerializer(serializers.Serializer):
    """Serializer para cancelar pedido"""

    motivo = serializers.CharField(required=True)


class GenerarFacturaSerializer(serializers.Serializer):
    """Serializer para generar factura desde pedido"""

    pedido_id = serializers.UUIDField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_pedido_id(self, value):
        """Validar que el pedido existe y puede facturarse"""
        try:
            pedido = Pedido.objects.get(pk=value)
        except Pedido.DoesNotExist:
            raise serializers.ValidationError('Pedido no encontrado')

        if not pedido.puede_facturar:
            raise serializers.ValidationError(
                f'El pedido {pedido.codigo} no puede ser facturado en su estado actual'
            )

        if pedido.tiene_factura:
            raise serializers.ValidationError(
                f'El pedido {pedido.codigo} ya tiene factura asociada'
            )

        return value


class RegistrarPagoSerializer(serializers.Serializer):
    """Serializer para registrar pago en factura"""

    factura_id = serializers.UUIDField(required=True)
    monto = serializers.DecimalField(max_digits=15, decimal_places=2, required=True)
    metodo_pago_id = serializers.UUIDField(required=True)
    referencia_pago = serializers.CharField(required=False, allow_blank=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_factura_id(self, value):
        """Validar que la factura existe"""
        try:
            factura = Factura.objects.get(pk=value)
        except Factura.DoesNotExist:
            raise serializers.ValidationError('Factura no encontrada')

        if factura.estado == 'ANULADA':
            raise serializers.ValidationError('No se puede registrar pago en una factura anulada')

        if factura.estado == 'PAGADA':
            raise serializers.ValidationError('La factura ya está completamente pagada')

        return value

    def validate_metodo_pago_id(self, value):
        """Validar que el método de pago existe"""
        try:
            MetodoPago.objects.get(pk=value, activo=True)
        except MetodoPago.DoesNotExist:
            raise serializers.ValidationError('Método de pago no encontrado o inactivo')

        return value


class DashboardFacturacionSerializer(serializers.Serializer):
    """Serializer para dashboard de facturación"""

    # Resumen general
    total_pedidos = serializers.IntegerField()
    total_facturas = serializers.IntegerField()
    total_pagos = serializers.IntegerField()

    # Valores
    valor_total_pedidos = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_total_facturas = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_total_pagado = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_pendiente_cobro = serializers.DecimalField(max_digits=15, decimal_places=2)

    # Por estado
    pedidos_por_estado = serializers.ListField(child=serializers.DictField())
    facturas_por_estado = serializers.ListField(child=serializers.DictField())

    # Facturas vencidas
    facturas_vencidas = serializers.IntegerField()
    valor_facturas_vencidas = serializers.DecimalField(max_digits=15, decimal_places=2)

    # Top clientes
    top_clientes = serializers.ListField(child=serializers.DictField())
