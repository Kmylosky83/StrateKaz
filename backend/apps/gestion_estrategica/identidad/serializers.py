"""
Serializers del módulo Identidad Corporativa - Dirección Estratégica
"""
from rest_framework import serializers
from .models import CorporateIdentity, CorporateValue


class CorporateValueSerializer(serializers.ModelSerializer):
    """Serializer para Valores Corporativos"""

    class Meta:
        model = CorporateValue
        fields = [
            'id', 'identity', 'name', 'description',
            'icon', 'order', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CorporateIdentitySerializer(serializers.ModelSerializer):
    """Serializer para Identidad Corporativa"""

    values = CorporateValueSerializer(many=True, read_only=True)
    is_signed = serializers.ReadOnlyField()
    policy_signed_by_name = serializers.CharField(
        source='policy_signed_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision', 'integral_policy',
            'policy_signed_by', 'policy_signed_by_name',
            'policy_signed_at', 'policy_signature_hash',
            'effective_date', 'version', 'is_active', 'is_signed',
            'values', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'policy_signed_by', 'policy_signed_at',
            'policy_signature_hash', 'is_signed',
            'created_by', 'created_at', 'updated_at'
        ]


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
