"""
Core Base Models Package - Sistema de Gestión Grasas y Huesos del Norte
========================================================================

Este paquete contiene los modelos base abstractos del sistema.

Estructura:
- base.py: Abstract models reutilizables (TimestampedModel, BaseCompanyModel, etc.)

Uso:
    # Importar abstract models
    from apps.core.base_models import TimestampedModel, BaseCompanyModel

    # O importar desde base.py directamente
    from apps.core.base_models.base import TimestampedModel

    # Para importar User, usar:
    from django.contrib.auth import get_user_model
    User = get_user_model()

    # O para ForeignKey:
    from django.conf import settings
    user = models.ForeignKey(settings.AUTH_USER_MODEL, ...)

Nota:
    Los modelos concretos están en apps.core.models.
    Para importar User usar get_user_model() o settings.AUTH_USER_MODEL.
"""

# Importar abstract models desde base.py
from .base import (
    TimestampedModel,
    SoftDeleteModel,
    AuditModel,
    BaseCompanyModel,
    HierarchicalModel,
    OrderedModel,
)

__all__ = [
    # Abstract Models
    'TimestampedModel',
    'SoftDeleteModel',
    'AuditModel',
    'BaseCompanyModel',
    'HierarchicalModel',
    'OrderedModel',
]
