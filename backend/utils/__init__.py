"""
Utilidades globales para StrateKaz.

Este paquete contiene:
- Modelos base (TenantModel, SharedModel)
- Excepciones personalizadas
- Validadores
- Permisos base
"""

from .models import (
    TimeStampedModel,
    SoftDeleteModel,
    AuditModel,
    TenantModel,
    SharedModel,
    OrderedModel,
    SlugModel,
    ActivableModel,
    CodeModel,
    DescriptionModel,
)

__all__ = [
    'TimeStampedModel',
    'SoftDeleteModel',
    'AuditModel',
    'TenantModel',
    'SharedModel',
    'OrderedModel',
    'SlugModel',
    'ActivableModel',
    'CodeModel',
    'DescriptionModel',
]
