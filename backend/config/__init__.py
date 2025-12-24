"""
Proyecto Django: Grasas y Huesos del Norte S.A.S
Sistema Integrado de Gestión para Recolección de ACU
"""

# Importar Celery app para que Django la reconozca
from .celery import app as celery_app

__all__ = ('celery_app',)
