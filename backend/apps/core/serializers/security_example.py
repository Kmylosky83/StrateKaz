"""
EJEMPLO DE USO: Serializers con validación de seguridad.

Este archivo muestra cómo usar las utilidades de sanitización
en los serializers de DRF.
"""
from rest_framework import serializers
from apps.core.utils import (
    sanitize_html,
    sanitize_text,
    validate_sql_input,
    validate_email,
    validate_phone,
)


class SecureTextFieldMixin:
    """
    Mixin para agregar sanitización automática a campos de texto.
    """

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        # Validar SQL injection
        if isinstance(value, str) and not validate_sql_input(value):
            raise serializers.ValidationError(
                "El texto contiene caracteres no permitidos."
            )

        # Sanitizar texto
        if isinstance(value, str):
            value = sanitize_text(value)

        return value


class SecureCharField(SecureTextFieldMixin, serializers.CharField):
    """Campo CharField con sanitización automática."""
    pass


class SecureEmailField(serializers.EmailField):
    """Campo EmailField con validación adicional."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        if not validate_email(value):
            raise serializers.ValidationError("Formato de email inválido.")

        return value


class SecurePhoneField(serializers.CharField):
    """Campo para teléfonos con validación."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        if not validate_phone(value):
            raise serializers.ValidationError(
                "Formato de teléfono inválido. Debe tener 7 o 10 dígitos."
            )

        return value


# EJEMPLO DE USO EN SERIALIZER
class ExampleSecureSerializer(serializers.Serializer):
    """
    Ejemplo de serializer con campos seguros.
    """
    name = SecureCharField(max_length=255)
    email = SecureEmailField()
    phone = SecurePhoneField(required=False)
    description = serializers.CharField(required=False)

    def validate_description(self, value):
        """
        Validación personalizada para descripción con HTML.
        """
        # Si permite HTML, usar sanitize_html en lugar de sanitize_text
        if value:
            value = sanitize_html(value)
        return value

    def validate(self, attrs):
        """
        Validación general del serializer.
        """
        # Aquí puedes agregar validaciones cruzadas
        return attrs
