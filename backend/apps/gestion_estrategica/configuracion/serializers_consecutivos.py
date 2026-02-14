"""
MC-002: Serializers para Configuración de Consecutivos
Sistema de Gestión StrateKaz

NOTA: Este archivo se mantiene para backward compatibility.
Los modelos fueron migrados a organizacion.
"""
from rest_framework import serializers

# Modelo migrado a organizacion
from apps.gestion_estrategica.organizacion.models_consecutivos import (
    ConsecutivoConfig,
    CATEGORIA_CONSECUTIVO_CHOICES,
    SEPARADOR_CHOICES,
)


class ConsecutivoConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para ConsecutivoConfig - Lectura y Escritura
    """
    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )
    separator_display = serializers.CharField(
        source='get_separator_display',
        read_only=True
    )
    ejemplo_formato = serializers.SerializerMethodField()

    class Meta:
        model = ConsecutivoConfig
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'categoria',
            'categoria_display',
            'prefix',
            'suffix',
            'separator',
            'separator_display',
            'current_number',
            'padding',
            'numero_inicial',
            'include_year',
            'include_month',
            'include_day',
            'reset_yearly',
            'reset_monthly',
            'last_reset_date',
            'es_sistema',
            'is_active',
            'ejemplo_formato',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'current_number',
            'last_reset_date',
            'es_sistema',
            'ejemplo_formato',
            'created_at',
            'updated_at',
        ]

    def get_ejemplo_formato(self, obj):
        """Retorna un ejemplo del formato actual."""
        return obj.get_ejemplo_formato()

    def validate_codigo(self, value):
        """Valida que el código sea único y esté en mayúsculas."""
        value = value.upper().strip()

        # Validar caracteres permitidos
        import re
        if not re.match(r'^[A-Z0-9_]+$', value):
            raise serializers.ValidationError(
                'El código solo puede contener letras mayúsculas, números y guiones bajos.'
            )

        # Verificar unicidad (considerando empresa_id si está disponible)
        request = self.context.get('request')
        queryset = ConsecutivoConfig.objects.filter(codigo=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                f'Ya existe un consecutivo con el código "{value}".'
            )

        return value

    def validate_prefix(self, value):
        """Normaliza el prefijo a mayúsculas."""
        return value.upper().strip() if value else ''

    def validate_suffix(self, value):
        """Normaliza el sufijo a mayúsculas."""
        return value.upper().strip() if value else ''

    def validate(self, attrs):
        """Validaciones cruzadas entre campos."""
        include_year = attrs.get('include_year', self.instance.include_year if self.instance else True)
        include_month = attrs.get('include_month', self.instance.include_month if self.instance else False)
        include_day = attrs.get('include_day', self.instance.include_day if self.instance else False)

        # Si tiene día, debe tener año o mes
        if include_day and not include_month and not include_year:
            raise serializers.ValidationError({
                'include_day': 'Si incluye día, debe incluir al menos año o mes.'
            })

        # Validar que padding sea razonable
        padding = attrs.get('padding', self.instance.padding if self.instance else 5)
        if padding < 1 or padding > 10:
            raise serializers.ValidationError({
                'padding': 'El padding debe estar entre 1 y 10 dígitos.'
            })

        return attrs

    def create(self, validated_data):
        """Asigna empresa del tenant actual."""
        from apps.core.base_models.mixins import get_tenant_empresa
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            if not validated_data.get('empresa_id'):
                empresa = get_tenant_empresa()
                if empresa:
                    validated_data['empresa_id'] = empresa.id
        return super().create(validated_data)


class ConsecutivoConfigListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados (menos campos, más rápido)
    """
    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )
    ejemplo_formato = serializers.SerializerMethodField()

    class Meta:
        model = ConsecutivoConfig
        fields = [
            'id',
            'codigo',
            'nombre',
            'categoria',
            'categoria_display',
            'prefix',
            'current_number',
            'es_sistema',
            'is_active',
            'ejemplo_formato',
        ]

    def get_ejemplo_formato(self, obj):
        """Retorna un ejemplo del formato actual."""
        return obj.get_ejemplo_formato()


class ConsecutivoConfigChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer las opciones de choices al frontend.
    """
    categorias = serializers.SerializerMethodField()
    separadores = serializers.SerializerMethodField()
    consecutivos = serializers.SerializerMethodField()

    def get_categorias(self, obj):
        """Retorna las categorías disponibles."""
        return [
            {'value': choice[0], 'label': choice[1]}
            for choice in CATEGORIA_CONSECUTIVO_CHOICES
        ]

    def get_separadores(self, obj):
        """Retorna los separadores disponibles."""
        return [
            {'value': choice[0], 'label': choice[1]}
            for choice in SEPARADOR_CHOICES
        ]

    def get_consecutivos(self, obj):
        """Retorna consecutivos activos para selección."""
        queryset = ConsecutivoConfig.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        ).order_by('categoria', 'codigo')

        return [
            {
                'value': c.id,
                'label': f"{c.codigo} - {c.nombre}",
                'codigo': c.codigo,
                'categoria': c.categoria,
                'ejemplo': c.get_ejemplo_formato()
            }
            for c in queryset
        ]


class GenerarConsecutivoSerializer(serializers.Serializer):
    """
    Serializer para la acción de generar un nuevo consecutivo.
    """
    codigo = serializers.CharField(
        max_length=50,
        required=False,
        help_text='Código del consecutivo a generar'
    )
    consecutivo_id = serializers.IntegerField(
        required=False,
        help_text='ID del consecutivo a generar'
    )

    def validate(self, attrs):
        """Valida que se proporcione código o ID."""
        codigo = attrs.get('codigo')
        consecutivo_id = attrs.get('consecutivo_id')

        if not codigo and not consecutivo_id:
            raise serializers.ValidationError(
                'Debe proporcionar el código o el ID del consecutivo.'
            )

        return attrs


class PreviewConsecutivoSerializer(serializers.Serializer):
    """
    Serializer para previsualizar formato de consecutivo.
    """
    prefix = serializers.CharField(max_length=20, required=True)
    suffix = serializers.CharField(max_length=20, required=False, default='')
    separator = serializers.ChoiceField(
        choices=[c[0] for c in SEPARADOR_CHOICES],
        default='-'
    )
    padding = serializers.IntegerField(min_value=1, max_value=10, default=5)
    numero = serializers.IntegerField(min_value=1, default=1)
    include_year = serializers.BooleanField(default=True)
    include_month = serializers.BooleanField(default=False)
    include_day = serializers.BooleanField(default=False)
