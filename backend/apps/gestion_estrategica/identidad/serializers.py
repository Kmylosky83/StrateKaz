"""
Serializers del módulo Identidad Corporativa - Dirección Estratégica

Serializers para:
- CorporateIdentity: Identidad corporativa
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaIntegral: Política integral con versionamiento
- PoliticaEspecifica: Políticas específicas por área/módulo
"""
from rest_framework import serializers
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
    PoliticaIntegral, PoliticaEspecifica
)


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

class CorporateIdentitySerializer(serializers.ModelSerializer):
    """Serializer para Identidad Corporativa"""

    values = CorporateValueSerializer(many=True, read_only=True)
    alcances = serializers.SerializerMethodField()
    is_signed = serializers.ReadOnlyField()
    policy_signed_by_name = serializers.CharField(
        source='policy_signed_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    values_count = serializers.SerializerMethodField()
    alcances_count = serializers.SerializerMethodField()
    politicas_count = serializers.SerializerMethodField()

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision', 'integral_policy',
            'policy_signed_by', 'policy_signed_by_name',
            'policy_signed_at', 'policy_signature_hash',
            'effective_date', 'version', 'is_active', 'is_signed',
            'values', 'alcances', 'values_count', 'alcances_count',
            'politicas_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'policy_signed_by', 'policy_signed_at',
            'policy_signature_hash', 'is_signed',
            'created_by', 'created_at', 'updated_at'
        ]

    def get_alcances(self, obj):
        alcances = obj.alcances.filter(is_active=True)
        return AlcanceSistemaListSerializer(alcances, many=True).data

    def get_values_count(self, obj):
        return obj.values.filter(is_active=True).count()

    def get_alcances_count(self, obj):
        return obj.alcances.filter(is_active=True).count()

    def get_politicas_count(self, obj):
        return obj.politicas_especificas.filter(is_active=True).count()


class CorporateIdentityCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Identidad Corporativa"""

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision', 'integral_policy',
            'effective_date', 'version', 'is_active'
        ]


class SignPolicySerializer(serializers.Serializer):
    """Serializer para firmar la política integral"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la firma de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la firma de la política"
            )
        return value


# =============================================================================
# ALCANCE DEL SISTEMA
# =============================================================================

class AlcanceSistemaListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listas de alcances"""
    iso_standard_display = serializers.CharField(
        source='get_iso_standard_display',
        read_only=True
    )
    is_certificate_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

    class Meta:
        model = AlcanceSistema
        fields = [
            'id', 'iso_standard', 'iso_standard_display',
            'is_certified', 'is_certificate_valid', 'days_until_expiry',
            'certification_body', 'expiry_date', 'is_active'
        ]


class AlcanceSistemaSerializer(serializers.ModelSerializer):
    """Serializer completo para Alcance del Sistema"""
    iso_standard_display = serializers.CharField(
        source='get_iso_standard_display',
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
            'id', 'identity', 'iso_standard', 'iso_standard_display',
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
            'identity', 'iso_standard', 'scope', 'exclusions',
            'exclusion_justification', 'is_certified', 'certification_date',
            'certification_body', 'certificate_number', 'expiry_date',
            'last_audit_date', 'next_audit_date', 'certificate_file', 'is_active'
        ]


# =============================================================================
# POLÍTICA INTEGRAL
# =============================================================================

class PoliticaIntegralSerializer(serializers.ModelSerializer):
    """Serializer para Política Integral"""
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    is_signed = serializers.ReadOnlyField()
    signed_by_name = serializers.CharField(
        source='signed_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = PoliticaIntegral
        fields = [
            'id', 'identity', 'version', 'title', 'content',
            'status', 'status_display', 'effective_date', 'expiry_date',
            'signed_by', 'signed_by_name', 'signed_at', 'signature_hash',
            'is_signed', 'applicable_standards', 'document_file',
            'change_reason', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'signed_by', 'signed_at', 'signature_hash',
            'is_signed', 'created_by', 'created_at', 'updated_at'
        ]


class PoliticaIntegralCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Política Integral"""

    class Meta:
        model = PoliticaIntegral
        fields = [
            'identity', 'version', 'title', 'content', 'status',
            'effective_date', 'expiry_date', 'applicable_standards',
            'document_file', 'change_reason', 'orden', 'is_active'
        ]


class SignPoliticaIntegralSerializer(serializers.Serializer):
    """Serializer para firmar la política integral"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la firma de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la firma de la política"
            )
        return value


class PublishPoliticaIntegralSerializer(serializers.Serializer):
    """Serializer para publicar la política integral"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la publicación de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la publicación de la política"
            )
        return value


# =============================================================================
# POLÍTICA ESPECÍFICA
# =============================================================================

class PoliticaEspecificaSerializer(serializers.ModelSerializer):
    """Serializer para Política Específica"""
    iso_standard_display = serializers.CharField(
        source='get_iso_standard_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    area_name = serializers.CharField(
        source='area.nombre',
        read_only=True
    )
    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.nombre',
        read_only=True
    )
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    needs_review = serializers.ReadOnlyField()

    class Meta:
        model = PoliticaEspecifica
        fields = [
            'id', 'identity', 'iso_standard', 'iso_standard_display',
            'code', 'title', 'content', 'area', 'area_name',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'version', 'status', 'status_display',
            'effective_date', 'review_date', 'needs_review',
            'approved_by', 'approved_by_name', 'approved_at',
            'document_file', 'keywords', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'approved_by', 'approved_at',
            'created_by', 'created_at', 'updated_at', 'needs_review'
        ]


class PoliticaEspecificaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Política Específica"""

    class Meta:
        model = PoliticaEspecifica
        fields = [
            'identity', 'iso_standard', 'code', 'title', 'content',
            'area', 'responsible', 'responsible_cargo', 'version',
            'status', 'effective_date', 'review_date',
            'document_file', 'keywords', 'orden', 'is_active'
        ]


class ApprovePoliticaEspecificaSerializer(serializers.Serializer):
    """Serializer para aprobar política específica"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la aprobación de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la aprobación de la política"
            )
        return value
