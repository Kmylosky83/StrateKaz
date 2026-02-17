"""
Configuración inicial del proyecto Django
Sistema de Gestión Integral - StrateKaz

Este archivo se ejecuta al importar el módulo 'config'.
Se usa para configurar aspectos que deben estar disponibles antes de cargar settings.

Hosting: VPS Hostinger con PostgreSQL + Redis + Celery
"""

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE CELERY
# ═══════════════════════════════════════════════════════════════════════════
# VPS Hostinger: Redis y Celery workers están disponibles.
# Celery se importa siempre para procesamiento asíncrono.

try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Si Celery no está instalado (ej: entorno de testing ligero)
    __all__ = ()
