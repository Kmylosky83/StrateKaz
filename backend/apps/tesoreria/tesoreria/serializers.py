"""
Serializers para Tesorería - Admin Finance
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    Banco, CuentaPorPagar, CuentaPorCobrar,
    FlujoCaja, Pago, Recaudo
)


# ==============================================================================
# SERIALIZERS DE BANCO
# ==============================================================================

class BancoSerializer(serializers.ModelSerializer):
    """Serializer para Banco."""

    saldo_comprometido = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_cuenta_display = serializers.CharField(source='get_tipo_cuenta_display', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Banco
        fields = [
            'id', 'empresa', 'entidad_bancaria', 'tipo_cuenta', 'tipo_cuenta_display',
            'numero_cuenta', 'nombre_cuenta', 'saldo_actual', 'saldo_disponible',
            'saldo_comprometido', 'estado', 'estado_display', 'sucursal',
            'responsable', 'responsable_nombre', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def validate(self, data):
        """Validaciones generales."""
        # Validar saldo disponible
        if 'saldo_disponible' in data and 'saldo_actual' in data:
            if data['saldo_disponible'] > data['saldo_actual']:
                raise serializers.ValidationError({
                    'saldo_disponible': 'El saldo disponible no puede ser mayor al saldo actual.'
                })
        return data


class BancoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de bancos."""

    tipo_cuenta_display = serializers.CharField(source='get_tipo_cuenta_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Banco
        fields = [
            'id', 'entidad_bancaria', 'tipo_cuenta', 'tipo_cuenta_display',
            'numero_cuenta', 'nombre_cuenta', 'saldo_actual', 'saldo_disponible',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE CUENTA POR PAGAR
# ==============================================================================

class CuentaPorPagarSerializer(serializers.ModelSerializer):
    """Serializer para Cuenta Por Pagar."""

    saldo_pendiente = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # proveedor_nombre, orden_compra_codigo, liquidacion_nomina_codigo
    # vienen del modelo directamente (campos cache — Sprint M1 Modularización)

    class Meta:
        model = CuentaPorPagar
        fields = [
            'id', 'empresa', 'codigo', 'concepto',
            'proveedor_id', 'proveedor_nombre',
            'orden_compra_id', 'orden_compra_codigo',
            'liquidacion_nomina_id', 'liquidacion_nomina_codigo',
            'monto_total', 'monto_pagado', 'saldo_pendiente',
            'fecha_documento', 'fecha_vencimiento', 'dias_para_vencimiento',
            'estado', 'estado_display', 'esta_vencida', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo', 'saldo_pendiente', 'esta_vencida',
            'dias_para_vencimiento', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que al menos uno de los orígenes esté presente
        if not any([data.get('proveedor_id'), data.get('orden_compra_id'), data.get('liquidacion_nomina_id')]):
            raise serializers.ValidationError(
                'Debe especificar al menos un origen (proveedor, orden de compra o liquidación de nómina).'
            )

        # Validar fechas
        if 'fecha_documento' in data and 'fecha_vencimiento' in data:
            if data['fecha_vencimiento'] < data['fecha_documento']:
                raise serializers.ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha del documento.'
                })

        # Validar montos
        if 'monto_pagado' in data and 'monto_total' in data:
            if data['monto_pagado'] > data['monto_total']:
                raise serializers.ValidationError({
                    'monto_pagado': 'El monto pagado no puede ser mayor al monto total.'
                })

        return data


class CuentaPorPagarListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de cuentas por pagar."""

    saldo_pendiente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    # proveedor_nombre viene del modelo directamente (campo cache)

    class Meta:
        model = CuentaPorPagar
        fields = [
            'id', 'codigo', 'concepto', 'proveedor_nombre',
            'monto_total', 'monto_pagado', 'saldo_pendiente',
            'fecha_vencimiento', 'dias_para_vencimiento',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE CUENTA POR COBRAR
# ==============================================================================

class CuentaPorCobrarSerializer(serializers.ModelSerializer):
    """Serializer para Cuenta Por Cobrar."""

    saldo_pendiente = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # cliente_nombre, factura_codigo vienen del modelo directamente (campos cache — Sprint M1)

    class Meta:
        model = CuentaPorCobrar
        fields = [
            'id', 'empresa', 'codigo', 'concepto',
            'cliente_id', 'cliente_nombre',
            'factura_id', 'factura_codigo',
            'monto_total', 'monto_cobrado', 'saldo_pendiente',
            'fecha_documento', 'fecha_vencimiento', 'dias_para_vencimiento',
            'estado', 'estado_display', 'esta_vencida', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo', 'saldo_pendiente', 'esta_vencida',
            'dias_para_vencimiento', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que al menos uno de los orígenes esté presente
        if not any([data.get('cliente_id'), data.get('factura_id')]):
            raise serializers.ValidationError(
                'Debe especificar al menos un origen (cliente o factura).'
            )

        # Validar fechas
        if 'fecha_documento' in data and 'fecha_vencimiento' in data:
            if data['fecha_vencimiento'] < data['fecha_documento']:
                raise serializers.ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha del documento.'
                })

        # Validar montos
        if 'monto_cobrado' in data and 'monto_total' in data:
            if data['monto_cobrado'] > data['monto_total']:
                raise serializers.ValidationError({
                    'monto_cobrado': 'El monto cobrado no puede ser mayor al monto total.'
                })

        return data


class CuentaPorCobrarListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de cuentas por cobrar."""

    saldo_pendiente = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    # cliente_nombre viene del modelo directamente (campo cache)

    class Meta:
        model = CuentaPorCobrar
        fields = [
            'id', 'codigo', 'concepto', 'cliente_nombre',
            'monto_total', 'monto_cobrado', 'saldo_pendiente',
            'fecha_vencimiento', 'dias_para_vencimiento',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE FLUJO DE CAJA
# ==============================================================================

class FlujoCajaSerializer(serializers.ModelSerializer):
    """Serializer para Flujo de Caja."""

    variacion = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    porcentaje_cumplimiento = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    # Relaciones nested (read only)
    banco_nombre = serializers.CharField(
        source='banco.nombre_cuenta',
        read_only=True,
        allow_null=True
    )
    cuenta_pagar_codigo = serializers.CharField(
        source='cuenta_por_pagar.codigo',
        read_only=True,
        allow_null=True
    )
    cuenta_cobrar_codigo = serializers.CharField(
        source='cuenta_por_cobrar.codigo',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = FlujoCaja
        fields = [
            'id', 'empresa', 'codigo', 'tipo', 'tipo_display', 'concepto',
            'banco', 'banco_nombre',
            'cuenta_por_pagar', 'cuenta_pagar_codigo',
            'cuenta_por_cobrar', 'cuenta_cobrar_codigo',
            'fecha', 'monto_proyectado', 'monto_real',
            'variacion', 'porcentaje_cumplimiento', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo', 'variacion', 'porcentaje_cumplimiento',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar coherencia de tipo con cuenta asociada
        if data.get('tipo') == 'egreso' and data.get('cuenta_por_cobrar'):
            raise serializers.ValidationError({
                'cuenta_por_cobrar': 'Un egreso no puede estar asociado a una cuenta por cobrar.'
            })

        if data.get('tipo') == 'ingreso' and data.get('cuenta_por_pagar'):
            raise serializers.ValidationError({
                'cuenta_por_pagar': 'Un ingreso no puede estar asociado a una cuenta por pagar.'
            })

        return data


class FlujoCajaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de flujos de caja."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    variacion = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = FlujoCaja
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'concepto',
            'fecha', 'monto_proyectado', 'monto_real', 'variacion'
        ]


# ==============================================================================
# SERIALIZERS DE PAGO
# ==============================================================================

class PagoSerializer(serializers.ModelSerializer):
    """Serializer para Pago."""

    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    # Relaciones nested (read only)
    cuenta_por_pagar_codigo = serializers.CharField(
        source='cuenta_por_pagar.codigo',
        read_only=True
    )
    cuenta_por_pagar_concepto = serializers.CharField(
        source='cuenta_por_pagar.concepto',
        read_only=True
    )
    banco_nombre = serializers.CharField(
        source='banco.nombre_cuenta',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='cuenta_por_pagar.proveedor_nombre',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Pago
        fields = [
            'id', 'empresa', 'codigo',
            'cuenta_por_pagar', 'cuenta_por_pagar_codigo', 'cuenta_por_pagar_concepto',
            'banco', 'banco_nombre', 'proveedor_nombre',
            'fecha_pago', 'monto', 'metodo_pago', 'metodo_pago_display',
            'referencia', 'comprobante', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        cuenta = data.get('cuenta_por_pagar')
        monto = data.get('monto')

        if cuenta and monto:
            # Validar que no exceda el saldo pendiente
            if monto > cuenta.saldo_pendiente:
                raise serializers.ValidationError({
                    'monto': f'El monto ({monto}) excede el saldo pendiente de la cuenta ({cuenta.saldo_pendiente})'
                })

        banco = data.get('banco')
        if banco and monto:
            # Validar saldo suficiente
            if monto > banco.saldo_disponible:
                raise serializers.ValidationError({
                    'monto': f'Saldo insuficiente en la cuenta bancaria. Disponible: {banco.saldo_disponible}'
                })

        return data


class PagoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de pagos."""

    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    cuenta_concepto = serializers.CharField(source='cuenta_por_pagar.concepto', read_only=True)
    proveedor_nombre = serializers.CharField(
        source='cuenta_por_pagar.proveedor_nombre',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Pago
        fields = [
            'id', 'codigo', 'fecha_pago', 'monto',
            'cuenta_concepto', 'proveedor_nombre',
            'metodo_pago', 'metodo_pago_display', 'referencia'
        ]


# ==============================================================================
# SERIALIZERS DE RECAUDO
# ==============================================================================

class RecaudoSerializer(serializers.ModelSerializer):
    """Serializer para Recaudo."""

    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    # Relaciones nested (read only)
    cuenta_por_cobrar_codigo = serializers.CharField(
        source='cuenta_por_cobrar.codigo',
        read_only=True
    )
    cuenta_por_cobrar_concepto = serializers.CharField(
        source='cuenta_por_cobrar.concepto',
        read_only=True
    )
    banco_nombre = serializers.CharField(
        source='banco.nombre_cuenta',
        read_only=True
    )
    cliente_nombre = serializers.CharField(
        source='cuenta_por_cobrar.cliente_nombre',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Recaudo
        fields = [
            'id', 'empresa', 'codigo',
            'cuenta_por_cobrar', 'cuenta_por_cobrar_codigo', 'cuenta_por_cobrar_concepto',
            'banco', 'banco_nombre', 'cliente_nombre',
            'fecha_recaudo', 'monto', 'metodo_pago', 'metodo_pago_display',
            'referencia', 'comprobante', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        cuenta = data.get('cuenta_por_cobrar')
        monto = data.get('monto')

        if cuenta and monto:
            # Validar que no exceda el saldo pendiente
            if monto > cuenta.saldo_pendiente:
                raise serializers.ValidationError({
                    'monto': f'El monto ({monto}) excede el saldo pendiente de la cuenta ({cuenta.saldo_pendiente})'
                })

        return data


class RecaudoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de recaudos."""

    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    cuenta_concepto = serializers.CharField(source='cuenta_por_cobrar.concepto', read_only=True)
    cliente_nombre = serializers.CharField(
        source='cuenta_por_cobrar.cliente_nombre',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Recaudo
        fields = [
            'id', 'codigo', 'fecha_recaudo', 'monto',
            'cuenta_concepto', 'cliente_nombre',
            'metodo_pago', 'metodo_pago_display', 'referencia'
        ]
