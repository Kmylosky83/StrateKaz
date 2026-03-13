"""
Serializers para configuración dinámica de Identidad Corporativa

Expone los modelos de configuración para que el frontend
pueda consumirlos dinámicamente.
"""
from rest_framework import serializers
from .models_config import EstadoPolitica, TipoPolitica, RolFirmante, EstadoFirma


class EstadoPoliticaSerializer(serializers.ModelSerializer):
    """Serializer para estados de política."""

    class Meta:
        model = EstadoPolitica
        fields = [
            'id',
            'code',
            'label',
            'description',
            'color',
            'bg_color',
            'icon',
            'es_editable',
            'es_estado_inicial',
            'es_estado_final',
            'permite_firma',
            'requiere_firma_completa',
            'transiciones_permitidas',
            'orden',
            'is_active',
        ]
        read_only_fields = ['id']


class TipoPoliticaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de política."""
    normas_iso_default_ids = serializers.PrimaryKeyRelatedField(
        source='normas_iso_default',
        many=True,
        read_only=True
    )

    class Meta:
        model = TipoPolitica
        fields = [
            'id',
            'code',
            'name',
            'description',
            'prefijo_codigo',
            'requiere_firma',
            'normas_iso_default_ids',
            'icon',
            'color',
            'orden',
            'is_active',
        ]
        read_only_fields = ['id']


class TipoPoliticaOptionSerializer(serializers.ModelSerializer):
    """Serializer simplificado para selects."""

    class Meta:
        model = TipoPolitica
        fields = ['id', 'code', 'name', 'icon', 'color', 'requiere_firma']


class RolFirmanteSerializer(serializers.ModelSerializer):
    """Serializer para roles de firmante."""

    class Meta:
        model = RolFirmante
        fields = [
            'id',
            'code',
            'label',
            'description',
            'tipo_firma_documental',
            'es_obligatorio',
            'puede_delegar',
            'icon',
            'color',
            'orden',
            'is_active',
        ]
        read_only_fields = ['id']


class EstadoFirmaSerializer(serializers.ModelSerializer):
    """Serializer para estados de firma."""

    class Meta:
        model = EstadoFirma
        fields = [
            'id',
            'code',
            'label',
            'description',
            'color',
            'bg_color',
            'icon',
            'es_estado_final',
            'es_positivo',
            'es_negativo',
            'orden',
            'is_active',
        ]
        read_only_fields = ['id']


class ConfiguracionIdentidadSerializer(serializers.Serializer):
    """
    Serializer combinado que retorna toda la configuración
    de Identidad en un solo request.

    Útil para cargar toda la configuración al iniciar la app.
    """
    estados_politica = EstadoPoliticaSerializer(many=True)
    tipos_politica = TipoPoliticaSerializer(many=True)
    roles_firmante = RolFirmanteSerializer(many=True)
    estados_firma = EstadoFirmaSerializer(many=True)
