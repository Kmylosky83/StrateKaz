"""
Core Serializers - Two Factor Authentication (2FA)

Serializadores para el sistema de autenticación de dos factores.
"""

from rest_framework import serializers
from apps.core.models import TwoFactorAuth, User
from django.contrib.auth.hashers import check_password


class TwoFactorStatusSerializer(serializers.ModelSerializer):
    """Serializer para verificar el estado 2FA de un usuario"""
    backup_codes_remaining = serializers.SerializerMethodField()

    class Meta:
        model = TwoFactorAuth
        fields = [
            'is_enabled',
            'verified_at',
            'backup_codes_remaining',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['verified_at', 'created_at', 'updated_at']

    def get_backup_codes_remaining(self, obj):
        """Retorna la cantidad de códigos de backup restantes"""
        return obj.get_remaining_backup_codes_count()


class TwoFactorSetupSerializer(serializers.Serializer):
    """Serializer para iniciar la configuración de 2FA"""
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        """Valida que la contraseña sea correcta"""
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Contraseña incorrecta")
        return value


class TwoFactorEnableSerializer(serializers.Serializer):
    """Serializer para habilitar 2FA después de verificar el código"""
    token = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="Código TOTP de 6 dígitos"
    )

    def validate_token(self, value):
        """Valida que el token sea numérico"""
        if not value.isdigit():
            raise serializers.ValidationError("El código debe ser numérico")
        return value


class TwoFactorVerifySerializer(serializers.Serializer):
    """Serializer para verificar un código 2FA durante el login"""
    username = serializers.CharField(required=True)
    token = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="Código TOTP de 6 dígitos"
    )
    use_backup_code = serializers.BooleanField(
        default=False,
        help_text="Si es True, el token se trata como código de backup"
    )

    def validate_token(self, value):
        """Valida que el token sea numérico"""
        if not value.isdigit():
            raise serializers.ValidationError("El código debe ser numérico")
        return value


class TwoFactorDisableSerializer(serializers.Serializer):
    """Serializer para deshabilitar 2FA"""
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        """Valida que la contraseña sea correcta"""
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Contraseña incorrecta")
        return value


class BackupCodesSerializer(serializers.Serializer):
    """Serializer para retornar códigos de backup"""
    codes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    message = serializers.CharField(read_only=True)


class TwoFactorSetupResponseSerializer(serializers.Serializer):
    """Serializer para la respuesta de setup de 2FA"""
    qr_code = serializers.CharField(
        read_only=True,
        help_text="QR code en formato data:image/png;base64"
    )
    secret_key = serializers.CharField(
        read_only=True,
        help_text="Secret key en formato base32 (para entrada manual)"
    )
    message = serializers.CharField(read_only=True)


class TwoFactorRegenerateBackupCodesSerializer(serializers.Serializer):
    """Serializer para regenerar códigos de backup"""
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        """Valida que la contraseña sea correcta"""
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Contraseña incorrecta")
        return value
