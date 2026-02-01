"""
Fixtures compartidos para tests de Recepción de Materia Prima
==============================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoMateriaPrima, EstadoRecepcion, etc.)
- Recepciones de materia prima
- Detalles de recepción
- Control de calidad

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa

User = get_user_model()


# ==============================================================================
# FIXTURES DE EMPRESA Y USUARIOS
# ==============================================================================

@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    return EmpresaConfig.objects.create(
        nombre='StrateKaz',
        nit='900123456-1',
        razon_social='StrateKaz.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia'
    )


@pytest.fixture
def sede(db, empresa):
    """Sede de prueba."""
    return SedeEmpresa.objects.create(
        empresa=empresa,
        codigo='BOG-01',
        nombre='Sede Bogotá',
        direccion='Calle 123 # 45-67',
        ciudad='Bogotá',
        departamento='Cundinamarca',
        telefono='6012345678',
        is_active=True
    )


@pytest.fixture
def usuario(db):
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@ghn.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS - LISTOS PARA IMPLEMENTACIÓN
# ==============================================================================

# TODO: Implementar fixtures de catálogos cuando se definan los modelos
# Ejemplo:
#
# @pytest.fixture
# def tipo_materia_prima_ganado(db):
#     """Tipo de materia prima: Ganado en pie."""
#     from apps.production_ops.recepcion.models import TipoMateriaPrima
#     return TipoMateriaPrima.objects.create(
#         codigo='GANADO',
#         nombre='Ganado en pie',
#         descripcion='Ganado bovino para sacrificio',
#         is_active=True,
#         orden=1
#     )


# ==============================================================================
# FIXTURES DE RECEPCIÓN - LISTOS PARA IMPLEMENTACIÓN
# ==============================================================================

# TODO: Implementar fixtures de recepción cuando se definan los modelos
# Ejemplo:
#
# @pytest.fixture
# def recepcion_materia_prima(db, empresa, sede, usuario, estado_recepcion_pendiente):
#     """Recepción de materia prima de prueba."""
#     from apps.production_ops.recepcion.models import RecepcionMateriaPrima
#     return RecepcionMateriaPrima.objects.create(
#         empresa=empresa,
#         sede=sede,
#         numero_recepcion='REC-2025-001',
#         fecha_recepcion=timezone.now(),
#         estado=estado_recepcion_pendiente,
#         created_by=usuario
#     )
