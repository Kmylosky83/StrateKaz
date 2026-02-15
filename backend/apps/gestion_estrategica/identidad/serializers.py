"""
Serializers del módulo Identidad Corporativa - Dirección Estratégica

Serializers para:
- CorporateIdentity: Identidad corporativa
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
"""
from rest_framework import serializers
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
)
from apps.gestion_estrategica.organizacion.models import Area


# =============================================================================
# VALORES CORPORATIVOS
# =============================================================================

class CorporateValueSerializer(serializers.ModelSerializer):
    """Serializer para Valores Corporativos"""

    class Meta:
        model = CorporateValue
        fields = [
            'id', 'identity', 'name', 'description',
            'icon', 'orden', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# IDENTIDAD CORPORATIVA
# =============================================================================

class ProcesoAreaSerializer(serializers.ModelSerializer):
    """Serializer resumido para áreas/procesos cubiertos"""
    full_path = serializers.ReadOnlyField()
    level = serializers.ReadOnlyField()

    class Meta:
        model = Area
        fields = ['id', 'code', 'name', 'full_path', 'level', 'icon', 'color']


class CorporateIdentitySerializer(serializers.ModelSerializer):
    """
    Serializer para Identidad Corporativa

    v4.0: Las políticas se gestionan desde Gestión Documental (tipo_documento=POL).

    v4.2: Nuevo campo procesos_cubiertos (ManyToMany con Area).
    """

    values = CorporateValueSerializer(many=True, read_only=True)
    alcances = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    values_count = serializers.SerializerMethodField()
    alcances_count = serializers.SerializerMethodField()

    # Nuevo: procesos_cubiertos (ManyToMany)
    procesos_cubiertos = ProcesoAreaSerializer(many=True, read_only=True)

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision',
            'effective_date', 'version', 'is_active',
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones',
            'procesos_cubiertos',  # Nuevo: lista de áreas
            # Relaciones
            'values', 'alcances', 'values_count', 'alcances_count',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at'
        ]

    def get_alcances(self, obj):
        alcances = obj.alcances.filter(is_active=True)
        return AlcanceSistemaListSerializer(alcances, many=True).data

    def get_values_count(self, obj):
        return obj.values.filter(is_active=True).count()

    def get_alcances_count(self, obj):
        return obj.alcances.filter(is_active=True).count()


class CorporateIdentityCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Identidad Corporativa

    v3.0: Solo misión, visión y metadatos.
    La Política Integral se gestiona por separado con workflow.

    v4.0: Incluye campos de alcance del sistema integrado de gestión.
    El campo declara_alcance controla si se muestra la sección de alcance.

    v4.2: Nuevo campo procesos_cubiertos_ids para selección múltiple de áreas.
    """

    # Campo de escritura para IDs de procesos/áreas
    procesos_cubiertos_ids = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        many=True,
        write_only=True,
        source='procesos_cubiertos',
        required=False,
        help_text='IDs de las áreas/procesos cubiertos por el SIG'
    )

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision',
            'effective_date', 'version', 'is_active',
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones',
            'procesos_cubiertos_ids'  # Nuevo: escribir IDs de áreas
        ]

    def validate(self, data):
        """
        Validación: Si declara_alcance=True, alcance_general es requerido.
        """
        declara_alcance = data.get('declara_alcance', False)
        alcance_general = data.get('alcance_general')

        if declara_alcance and not alcance_general:
            raise serializers.ValidationError({
                'alcance_general': 'El alcance general es requerido cuando se declara alcance.'
            })

        return data

    def create(self, validated_data):
        """Crear identidad con procesos cubiertos"""
        procesos = validated_data.pop('procesos_cubiertos', [])
        instance = super().create(validated_data)
        if procesos:
            instance.procesos_cubiertos.set(procesos)
        return instance

    def update(self, instance, validated_data):
        """Actualizar identidad con procesos cubiertos"""
        procesos = validated_data.pop('procesos_cubiertos', None)
        instance = super().update(instance, validated_data)
        if procesos is not None:
            instance.procesos_cubiertos.set(procesos)
        return instance


# =============================================================================
# ALCANCE DEL SISTEMA
# =============================================================================

class AlcanceSistemaListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listas de alcances"""
    norma_iso_code = serializers.CharField(
        source='norma_iso.code',
        read_only=True
    )
    norma_iso_name = serializers.CharField(
        source='norma_iso.short_name',
        read_only=True
    )
    is_certificate_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

    class Meta:
        model = AlcanceSistema
        fields = [
            'id', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'is_certified', 'is_certificate_valid', 'days_until_expiry',
            'certification_body', 'expiry_date', 'is_active'
        ]


class AlcanceSistemaSerializer(serializers.ModelSerializer):
    """Serializer completo para Alcance del Sistema"""
    norma_iso_code = serializers.CharField(
        source='norma_iso.code',
        read_only=True
    )
    norma_iso_name = serializers.CharField(
        source='norma_iso.short_name',
        read_only=True
    )
    is_certificate_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = AlcanceSistema
        fields = [
            'id', 'identity', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'scope', 'exclusions', 'exclusion_justification',
            'is_certified', 'is_certificate_valid', 'certification_date',
            'certification_body', 'certificate_number', 'expiry_date',
            'days_until_expiry', 'last_audit_date', 'next_audit_date',
            'certificate_file', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'is_certificate_valid', 'days_until_expiry'
        ]


class AlcanceSistemaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Alcance del Sistema"""

    class Meta:
        model = AlcanceSistema
        fields = [
            'identity', 'norma_iso', 'scope', 'exclusions',
            'exclusion_justification', 'is_certified', 'certification_date',
            'certification_body', 'certificate_number', 'expiry_date',
            'last_audit_date', 'next_audit_date', 'certificate_file', 'is_active'
        ]
