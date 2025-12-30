"""
Serializers de Nómina - Talent Hub

Serializers para la gestión de liquidación de nómina según legislación colombiana.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    ConfiguracionNomina,
    ConceptoNomina,
    PeriodoNomina,
    LiquidacionNomina,
    DetalleLiquidacion,
    Prestacion,
    PagoNomina
)


# =============================================================================
# CONFIGURACIÓN DE NÓMINA
# =============================================================================

class ConfiguracionNominaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de configuraciones de nómina."""

    total_seguridad_social_empleado = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    total_seguridad_social_empresa = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    total_parafiscales = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = ConfiguracionNomina
        fields = [
            'id', 'anio', 'salario_minimo', 'auxilio_transporte',
            'total_seguridad_social_empleado', 'total_seguridad_social_empresa',
            'total_parafiscales', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ConfiguracionNominaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para configuración de nómina."""

    total_seguridad_social_empleado = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    total_seguridad_social_empresa = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    total_parafiscales = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = ConfiguracionNomina
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ConfiguracionNominaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de configuración de nómina."""

    class Meta:
        model = ConfiguracionNomina
        fields = [
            'anio', 'salario_minimo', 'auxilio_transporte',
            'porcentaje_salud_empleado', 'porcentaje_pension_empleado',
            'porcentaje_salud_empresa', 'porcentaje_pension_empresa',
            'porcentaje_arl', 'porcentaje_caja_compensacion',
            'porcentaje_icbf', 'porcentaje_sena',
            'dias_base_cesantias', 'porcentaje_intereses_cesantias',
            'dias_base_prima', 'dias_vacaciones_por_anio',
            'salario_base_solidaridad', 'porcentaje_solidaridad_empleado',
            'observaciones'
        ]

    def validate_anio(self, value):
        """Validar que no exista configuración para el mismo año."""
        empresa = self.context['request'].user.empresa
        if ConfiguracionNomina.objects.filter(empresa=empresa, anio=value, is_active=True).exists():
            raise serializers.ValidationError(
                f"Ya existe una configuración de nómina para el año {value}."
            )
        return value


# =============================================================================
# CONCEPTO DE NÓMINA
# =============================================================================

class ConceptoNominaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de conceptos de nómina."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = ConceptoNomina
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'categoria', 'categoria_display', 'es_fijo',
            'es_base_seguridad_social', 'es_base_parafiscales',
            'es_base_prestaciones', 'orden'
        ]
        read_only_fields = ['id']


class ConceptoNominaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para concepto de nómina."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = ConceptoNomina
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ConceptoNominaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de conceptos de nómina."""

    class Meta:
        model = ConceptoNomina
        fields = [
            'codigo', 'nombre', 'descripcion', 'tipo', 'categoria',
            'es_fijo', 'es_base_seguridad_social', 'es_base_parafiscales',
            'es_base_prestaciones', 'formula', 'orden'
        ]

    def validate_codigo(self, value):
        """Validar que el código sea único por empresa."""
        empresa = self.context['request'].user.empresa
        if ConceptoNomina.objects.filter(empresa=empresa, codigo=value, is_active=True).exists():
            raise serializers.ValidationError(
                f"Ya existe un concepto con el código '{value}'."
            )
        return value


# =============================================================================
# PERIODO DE NÓMINA
# =============================================================================

class PeriodoNominaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de periodos de nómina."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nombre_periodo = serializers.CharField(read_only=True)
    esta_abierto = serializers.BooleanField(read_only=True)

    class Meta:
        model = PeriodoNomina
        fields = [
            'id', 'anio', 'mes', 'tipo', 'tipo_display', 'nombre_periodo',
            'fecha_inicio', 'fecha_fin', 'fecha_pago', 'estado', 'estado_display',
            'esta_abierto', 'total_neto', 'numero_colaboradores', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PeriodoNominaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para periodo de nómina."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nombre_periodo = serializers.CharField(read_only=True)
    cerrado_por_nombre = serializers.CharField(source='cerrado_por.get_full_name', read_only=True)

    class Meta:
        model = PeriodoNomina
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'total_devengados', 'total_deducciones',
            'total_neto', 'numero_colaboradores', 'cerrado_por', 'fecha_cierre',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class PeriodoNominaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de periodos de nómina."""

    class Meta:
        model = PeriodoNomina
        fields = [
            'anio', 'mes', 'tipo', 'fecha_inicio', 'fecha_fin',
            'fecha_pago', 'observaciones'
        ]

    def validate(self, data):
        """Validar que no exista periodo duplicado."""
        empresa = self.context['request'].user.empresa
        if PeriodoNomina.objects.filter(
            empresa=empresa,
            anio=data['anio'],
            mes=data['mes'],
            tipo=data['tipo'],
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "Ya existe un periodo de nómina con estos parámetros."
            )
        return data


# =============================================================================
# LIQUIDACIÓN DE NÓMINA
# =============================================================================

class DetalleLiquidacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de detalles de liquidación."""

    concepto_nombre = serializers.CharField(source='concepto.nombre', read_only=True)
    concepto_codigo = serializers.CharField(source='concepto.codigo', read_only=True)

    class Meta:
        model = DetalleLiquidacion
        fields = [
            'id', 'concepto', 'concepto_codigo', 'concepto_nombre',
            'cantidad', 'valor_unitario', 'valor_total',
            'es_devengado', 'observaciones'
        ]
        read_only_fields = ['id', 'valor_total', 'es_devengado']


class DetalleLiquidacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de detalles de liquidación."""

    class Meta:
        model = DetalleLiquidacion
        fields = ['concepto', 'cantidad', 'valor_unitario', 'observaciones']


class LiquidacionNominaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de liquidaciones de nómina."""

    periodo_nombre = serializers.CharField(source='periodo.nombre_periodo', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    colaborador_identificacion = serializers.CharField(source='colaborador.numero_identificacion', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)
    esta_pagada = serializers.BooleanField(read_only=True)

    class Meta:
        model = LiquidacionNomina
        fields = [
            'id', 'periodo', 'periodo_nombre', 'colaborador',
            'colaborador_nombre', 'colaborador_identificacion',
            'salario_base', 'dias_trabajados', 'total_devengados',
            'total_deducciones', 'neto_pagar', 'estado', 'estado_display',
            'esta_aprobada', 'esta_pagada', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LiquidacionNominaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para liquidación de nómina."""

    periodo_nombre = serializers.CharField(source='periodo.nombre_periodo', read_only=True)
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    colaborador_identificacion = serializers.CharField(source='colaborador.numero_identificacion', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    detalles = DetalleLiquidacionListSerializer(many=True, read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    class Meta:
        model = LiquidacionNomina
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'total_devengados', 'total_deducciones',
            'neto_pagar', 'aprobado_por', 'fecha_aprobacion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class LiquidacionNominaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de liquidaciones de nómina."""

    detalles = DetalleLiquidacionCreateSerializer(many=True, required=False)

    class Meta:
        model = LiquidacionNomina
        fields = [
            'periodo', 'colaborador', 'salario_base', 'dias_trabajados',
            'observaciones', 'detalles'
        ]

    def validate(self, data):
        """Validar que no exista liquidación duplicada."""
        empresa = self.context['request'].user.empresa
        if LiquidacionNomina.objects.filter(
            empresa=empresa,
            periodo=data['periodo'],
            colaborador=data['colaborador'],
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "Ya existe una liquidación para este colaborador en el periodo seleccionado."
            )
        return data

    def create(self, validated_data):
        """Crear liquidación con detalles."""
        detalles_data = validated_data.pop('detalles', [])
        liquidacion = LiquidacionNomina.objects.create(**validated_data)

        # Crear detalles
        for detalle_data in detalles_data:
            DetalleLiquidacion.objects.create(
                liquidacion=liquidacion,
                empresa=liquidacion.empresa,
                **detalle_data
            )

        # Calcular totales
        liquidacion.calcular_totales()

        return liquidacion


# =============================================================================
# PRESTACIÓN SOCIAL
# =============================================================================

class PrestacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de prestaciones sociales."""

    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Prestacion
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'anio',
            'tipo', 'tipo_display', 'valor_provisionado', 'valor_pagado',
            'saldo_pendiente', 'estado', 'estado_display', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PrestacionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para prestación social."""

    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Prestacion
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class PrestacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de prestaciones sociales."""

    class Meta:
        model = Prestacion
        fields = [
            'colaborador', 'anio', 'tipo', 'valor_base', 'dias_causados',
            'valor_provisionado', 'valor_pagado', 'estado',
            'fecha_inicio', 'fecha_fin', 'fecha_pago', 'observaciones'
        ]


# =============================================================================
# PAGO DE NÓMINA
# =============================================================================

class PagoNominaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de pagos de nómina."""

    liquidacion_colaborador = serializers.CharField(
        source='liquidacion.colaborador.get_nombre_completo',
        read_only=True
    )
    liquidacion_periodo = serializers.CharField(
        source='liquidacion.periodo.nombre_periodo',
        read_only=True
    )
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    class Meta:
        model = PagoNomina
        fields = [
            'id', 'liquidacion', 'liquidacion_colaborador', 'liquidacion_periodo',
            'fecha_pago', 'metodo_pago', 'metodo_pago_display',
            'valor_pagado', 'referencia_pago', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PagoNominaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para pago de nómina."""

    liquidacion_colaborador = serializers.CharField(
        source='liquidacion.colaborador.get_nombre_completo',
        read_only=True
    )
    liquidacion_periodo = serializers.CharField(
        source='liquidacion.periodo.nombre_periodo',
        read_only=True
    )
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    class Meta:
        model = PagoNomina
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class PagoNominaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de pagos de nómina."""

    class Meta:
        model = PagoNomina
        fields = [
            'liquidacion', 'fecha_pago', 'metodo_pago', 'banco',
            'numero_cuenta', 'referencia_pago', 'valor_pagado',
            'comprobante', 'observaciones'
        ]

    def validate_valor_pagado(self, value):
        """Validar que el valor pagado no exceda el neto a pagar."""
        liquidacion = self.initial_data.get('liquidacion')
        if liquidacion:
            try:
                liquidacion_obj = LiquidacionNomina.objects.get(id=liquidacion)
                if value > liquidacion_obj.neto_pagar:
                    raise serializers.ValidationError(
                        f"El valor pagado no puede exceder el neto a pagar (${liquidacion_obj.neto_pagar})."
                    )
            except LiquidacionNomina.DoesNotExist:
                pass
        return value
