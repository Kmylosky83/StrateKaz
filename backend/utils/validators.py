"""
Validadores personalizados del sistema
"""
import re
from django.core.exceptions import ValidationError


def validate_colombian_phone(value):
    """
    Valida formato de teléfono colombiano.
    Formato: 3001234567 (10 dígitos empezando por 3)
    """
    pattern = r'^3\d{9}$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Número de teléfono inválido. Debe tener 10 dígitos y empezar por 3.'
        )


def validate_nit(value):
    """
    Valida formato de NIT colombiano.
    Formato: 123456789-0
    """
    pattern = r'^\d{9}-\d$'
    if not re.match(pattern, value):
        raise ValidationError(
            'NIT inválido. Formato esperado: 123456789-0'
        )
