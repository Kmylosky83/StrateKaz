"""
Serializers para Unidades de Medida
Sistema de Gestión StrateKaz

Ubicación: organizacion (catálogo transversal de la organización)
"""
from rest_framework import serializers
from decimal import Decimal

from .models_unidades import UnidadMedida


class UnidadMedidaSerializer(serializers.ModelSerializer):
    """
    Serializer para UnidadMedida - Lectura y Escritura
    """

    # Read-only computed fields
    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )
    unidad_base_nombre = serializers.CharField(
        source='unidad_base.nombre',
        read_only=True,
        allow_null=True
    )
    unidad_base_simbolo = serializers.CharField(
        source='unidad_base.simbolo',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = UnidadMedida
        fields = [
            'id',
            'codigo',
            'nombre',
            'nombre_plural',
            'simbolo',
            'categoria',
            'categoria_display',
            'unidad_base',
            'unidad_base_nombre',
            'unidad_base_simbolo',
            'factor_conversion',
            'decimales_display',
            'prefiere_notacion_cientifica',
            'usar_separador_miles',
            'descripcion',
            'es_sistema',
            'orden_display',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_codigo(self, value):
        """Validar que el código sea único y en mayúsculas."""
        value = value.upper().strip()

        # Verificar unicidad (excepto en update)
        instance = self.instance
        exists = UnidadMedida.objects.filter(codigo=value).exclude(
            pk=instance.pk if instance else None
        ).exists()

        if exists:
            raise serializers.ValidationError(
                f'Ya existe una unidad con el código "{value}"'
            )

        return value

    def validate_factor_conversion(self, value):
        """Validar que el factor sea positivo."""
        if value <= 0:
            raise serializers.ValidationError(
                'El factor de conversión debe ser positivo'
            )
        return value

    def validate_decimales_display(self, value):
        """Validar rango de decimales."""
        if value < 0 or value > 6:
            raise serializers.ValidationError(
                'Los decimales deben estar entre 0 y 6'
            )
        return value

    def validate(self, attrs):
        """Validaciones a nivel de objeto."""
        # Validar que si no tiene unidad_base, factor debe ser 1
        unidad_base = attrs.get('unidad_base')
        factor = attrs.get('factor_conversion', Decimal('1.0'))

        if not unidad_base and factor != Decimal('1.0'):
            raise serializers.ValidationError({
                'factor_conversion': 'Una unidad sin base debe tener factor 1'
            })

        # Validar que unidad_base sea de la misma categoría
        if unidad_base:
            categoria = attrs.get('categoria')
            if unidad_base.categoria != categoria:
                raise serializers.ValidationError({
                    'unidad_base': 'La unidad base debe ser de la misma categoría'
                })

        return attrs


class UnidadMedidaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados (menos campos, más rápido)
    """

    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )

    class Meta:
        model = UnidadMedida
        fields = [
            'id',
            'codigo',
            'nombre',
            'simbolo',
            'categoria',
            'categoria_display',
            'decimales_display',
            'es_sistema',
            'is_active',
        ]


class ConversionRequestSerializer(serializers.Serializer):
    """
    Serializer para requests de conversión de unidades
    """

    valor = serializers.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text='Valor a convertir'
    )
    unidad_origen = serializers.CharField(
        max_length=20,
        help_text='Código de la unidad origen (ej: TON)'
    )
    unidad_destino = serializers.CharField(
        max_length=20,
        help_text='Código de la unidad destino (ej: KG)'
    )

    def validate_unidad_origen(self, value):
        """Validar que la unidad origen exista."""
        unidad = UnidadMedida.obtener_por_codigo(value.upper())
        if not unidad:
            raise serializers.ValidationError(
                f'Unidad origen "{value}" no encontrada'
            )
        return value.upper()

    def validate_unidad_destino(self, value):
        """Validar que la unidad destino exista."""
        unidad = UnidadMedida.obtener_por_codigo(value.upper())
        if not unidad:
            raise serializers.ValidationError(
                f'Unidad destino "{value}" no encontrada'
            )
        return value.upper()

    def validate(self, attrs):
        """Validar que las unidades sean compatibles."""
        unidad_origen = UnidadMedida.obtener_por_codigo(attrs['unidad_origen'])
        unidad_destino = UnidadMedida.obtener_por_codigo(attrs['unidad_destino'])

        if unidad_origen.categoria != unidad_destino.categoria:
            raise serializers.ValidationError(
                f'No se puede convertir {unidad_origen.categoria} a {unidad_destino.categoria}'
            )

        return attrs


class FormateoRequestSerializer(serializers.Serializer):
    """
    Serializer para requests de formateo de valores
    """

    valor = serializers.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text='Valor a formatear'
    )
    unidad = serializers.CharField(
        max_length=20,
        help_text='Código de la unidad (ej: KG)'
    )
    incluir_simbolo = serializers.BooleanField(
        default=True,
        help_text='Si incluir el símbolo de la unidad'
    )
    auto_escalar = serializers.BooleanField(
        default=False,
        help_text='Si auto-escalar a la unidad más apropiada'
    )

    def validate_unidad(self, value):
        """Validar que la unidad exista."""
        unidad = UnidadMedida.obtener_por_codigo(value.upper())
        if not unidad:
            raise serializers.ValidationError(
                f'Unidad "{value}" no encontrada'
            )
        return value.upper()


class CapacidadSedeSerializer(serializers.Serializer):
    """
    Serializer para capacidad de sede con formateo
    """

    capacidad_almacenamiento = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        allow_null=True
    )
    unidad_capacidad = UnidadMedidaListSerializer(read_only=True)
    unidad_capacidad_id = serializers.IntegerField(
        write_only=True,
        allow_null=True,
        required=False
    )
    capacidad_formateada = serializers.CharField(
        read_only=True,
        help_text='Capacidad formateada con unidad'
    )

    def validate_capacidad_almacenamiento(self, value):
        """Validar que la capacidad sea positiva."""
        if value is not None and value < 0:
            raise serializers.ValidationError(
                'La capacidad debe ser positiva'
            )
        return value

    def validate(self, attrs):
        """Validar que si hay capacidad, haya unidad."""
        capacidad = attrs.get('capacidad_almacenamiento')
        unidad_id = attrs.get('unidad_capacidad_id')

        if capacidad is not None and unidad_id is None:
            raise serializers.ValidationError({
                'unidad_capacidad_id': 'Debe especificar la unidad de la capacidad'
            })

        # Validar que la unidad exista
        if unidad_id:
            try:
                UnidadMedida.objects.get(pk=unidad_id, is_active=True)
            except UnidadMedida.DoesNotExist:
                raise serializers.ValidationError({
                    'unidad_capacidad_id': f'Unidad con ID {unidad_id} no encontrada'
                })

        return attrs
