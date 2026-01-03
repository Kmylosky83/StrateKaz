"""
Serializers para Servicios Generales - Admin Finance
Sistema de Gestión StrateKaz

Serializa datos de:
- Mantenimiento Locativo
- Servicios Públicos
- Contratos de Servicio

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    MantenimientoLocativo,
    ServicioPublico,
    ContratoServicio
)


# ==============================================================================
# SERIALIZER: MANTENIMIENTO LOCATIVO
# ==============================================================================

class MantenimientoLocativoSerializer(serializers.ModelSerializer):
    """
    Serializer para MantenimientoLocativo.

    Incluye campos calculados y validaciones de negocio.
    """

    # Campos calculados (read-only)
    variacion_costo = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    porcentaje_variacion = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    dias_hasta_programacion = serializers.IntegerField(read_only=True)

    # Campos relacionados
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='proveedor.razon_social',
        read_only=True,
        allow_null=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Display fields
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = MantenimientoLocativo
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'ubicacion',
            'descripcion_trabajo', 'fecha_solicitud', 'fecha_programada',
            'fecha_ejecucion', 'responsable', 'responsable_nombre',
            'proveedor', 'proveedor_nombre', 'costo_estimado', 'costo_real',
            'variacion_costo', 'porcentaje_variacion', 'estado',
            'estado_display', 'observaciones', 'dias_hasta_programacion',
            'empresa', 'empresa_nombre', 'created_at', 'updated_at',
            'created_by', 'updated_by', 'is_active'
        ]
        read_only_fields = [
            'id', 'codigo', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones a nivel de serializer."""
        # Validar fechas
        fecha_solicitud = data.get('fecha_solicitud')
        fecha_programada = data.get('fecha_programada')
        fecha_ejecucion = data.get('fecha_ejecucion')

        if fecha_programada and fecha_solicitud:
            if fecha_programada < fecha_solicitud:
                raise serializers.ValidationError({
                    'fecha_programada': 'La fecha programada debe ser posterior a la fecha de solicitud.'
                })

        if fecha_ejecucion and fecha_solicitud:
            if fecha_ejecucion < fecha_solicitud:
                raise serializers.ValidationError({
                    'fecha_ejecucion': 'La fecha de ejecución debe ser posterior a la fecha de solicitud.'
                })

        # Validar costos
        costo_estimado = data.get('costo_estimado', Decimal('0.00'))
        costo_real = data.get('costo_real', Decimal('0.00'))

        if costo_estimado < 0 or costo_real < 0:
            raise serializers.ValidationError('Los costos no pueden ser negativos.')

        return data


class MantenimientoLocativoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado."""

    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='proveedor.razon_social',
        read_only=True,
        allow_null=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = MantenimientoLocativo
        fields = [
            'id', 'codigo', 'tipo', 'tipo_display', 'ubicacion',
            'fecha_solicitud', 'fecha_programada', 'responsable_nombre',
            'proveedor_nombre', 'costo_estimado', 'costo_real',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZER: SERVICIO PÚBLICO
# ==============================================================================

class ServicioPublicoSerializer(serializers.ModelSerializer):
    """
    Serializer para ServicioPublico.

    Incluye campos calculados y validaciones de negocio.
    """

    # Campos calculados (read-only)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)

    # Campos relacionados
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Display fields
    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    estado_pago_display = serializers.CharField(
        source='get_estado_pago_display',
        read_only=True
    )

    class Meta:
        model = ServicioPublico
        fields = [
            'id', 'codigo', 'tipo_servicio', 'tipo_servicio_display',
            'proveedor_nombre', 'numero_cuenta', 'ubicacion',
            'periodo_mes', 'periodo_anio', 'fecha_vencimiento',
            'valor', 'estado_pago', 'estado_pago_display',
            'consumo', 'unidad_medida', 'observaciones',
            'dias_para_vencimiento', 'esta_vencido', 'proximo_a_vencer',
            'empresa', 'empresa_nombre', 'created_at', 'updated_at',
            'created_by', 'updated_by', 'is_active'
        ]
        read_only_fields = [
            'id', 'codigo', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones a nivel de serializer."""
        # Validar mes
        periodo_mes = data.get('periodo_mes')
        if periodo_mes and not (1 <= periodo_mes <= 12):
            raise serializers.ValidationError({
                'periodo_mes': 'El mes debe estar entre 1 y 12.'
            })

        # Validar valor
        valor = data.get('valor')
        if valor and valor <= 0:
            raise serializers.ValidationError({
                'valor': 'El valor debe ser mayor a cero.'
            })

        # Validar consumo
        consumo = data.get('consumo')
        if consumo and consumo < 0:
            raise serializers.ValidationError({
                'consumo': 'El consumo no puede ser negativo.'
            })

        return data


class ServicioPublicoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado."""

    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    estado_pago_display = serializers.CharField(
        source='get_estado_pago_display',
        read_only=True
    )
    esta_vencido = serializers.BooleanField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)

    class Meta:
        model = ServicioPublico
        fields = [
            'id', 'codigo', 'tipo_servicio', 'tipo_servicio_display',
            'proveedor_nombre', 'periodo_mes', 'periodo_anio',
            'fecha_vencimiento', 'valor', 'estado_pago',
            'estado_pago_display', 'esta_vencido', 'proximo_a_vencer'
        ]


# ==============================================================================
# SERIALIZER: CONTRATO DE SERVICIO
# ==============================================================================

class ContratoServicioSerializer(serializers.ModelSerializer):
    """
    Serializer para ContratoServicio.

    Incluye campos calculados y validaciones de negocio.
    """

    # Campos calculados (read-only)
    dias_para_vencimiento = serializers.IntegerField(read_only=True)
    contrato_vigente = serializers.BooleanField(read_only=True)
    contrato_vencido = serializers.BooleanField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)
    duracion_dias = serializers.IntegerField(read_only=True)

    # Campos relacionados
    proveedor_nombre = serializers.CharField(
        source='proveedor.razon_social',
        read_only=True,
        allow_null=True
    )
    proveedor_nit = serializers.CharField(
        source='proveedor.nit',
        read_only=True,
        allow_null=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )

    # Display fields
    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    frecuencia_pago_display = serializers.CharField(
        source='get_frecuencia_pago_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = ContratoServicio
        fields = [
            'id', 'codigo', 'proveedor', 'proveedor_nombre', 'proveedor_nit',
            'tipo_servicio', 'tipo_servicio_display', 'objeto',
            'fecha_inicio', 'fecha_fin', 'valor_mensual', 'valor_total',
            'frecuencia_pago', 'frecuencia_pago_display', 'estado',
            'estado_display', 'observaciones', 'dias_para_vencimiento',
            'contrato_vigente', 'contrato_vencido', 'proximo_a_vencer',
            'duracion_dias', 'empresa', 'empresa_nombre',
            'created_at', 'updated_at', 'created_by', 'updated_by', 'is_active'
        ]
        read_only_fields = [
            'id', 'codigo', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones a nivel de serializer."""
        # Validar fechas
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')

        if fecha_inicio and fecha_fin:
            if fecha_fin <= fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })

        # Validar valores
        valor_mensual = data.get('valor_mensual', Decimal('0.00'))
        valor_total = data.get('valor_total', Decimal('0.00'))

        if valor_mensual < 0 or valor_total < 0:
            raise serializers.ValidationError('Los valores no pueden ser negativos.')

        if valor_mensual > valor_total:
            raise serializers.ValidationError({
                'valor_mensual': 'El valor mensual no puede ser mayor al valor total.'
            })

        return data


class ContratoServicioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado."""

    proveedor_nombre = serializers.CharField(
        source='proveedor.razon_social',
        read_only=True,
        allow_null=True
    )
    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    contrato_vigente = serializers.BooleanField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)

    class Meta:
        model = ContratoServicio
        fields = [
            'id', 'codigo', 'proveedor_nombre', 'tipo_servicio',
            'tipo_servicio_display', 'fecha_inicio', 'fecha_fin',
            'valor_mensual', 'valor_total', 'estado', 'estado_display',
            'contrato_vigente', 'proximo_a_vencer'
        ]
