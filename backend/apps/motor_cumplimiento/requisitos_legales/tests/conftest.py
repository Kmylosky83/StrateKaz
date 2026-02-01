"""
Fixtures especificas para tests de requisitos_legales
"""
import pytest
from datetime import date, timedelta
from django.utils import timezone

from apps.motor_cumplimiento.requisitos_legales.models import (
    TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento
)


@pytest.fixture
def tipo_requisito(db):
    """Tipo de requisito de prueba."""
    return TipoRequisito.objects.create(
        codigo='LIC-AMB',
        nombre='Licencia Ambiental',
        descripcion='Licencias ambientales',
        requiere_renovacion=True,
        dias_anticipacion_alerta=30,
        is_active=True
    )


@pytest.fixture
def tipo_requisito_permiso(db):
    """Segundo tipo de requisito para tests."""
    return TipoRequisito.objects.create(
        codigo='PER-SAN',
        nombre='Permiso Sanitario',
        descripcion='Permisos sanitarios',
        requiere_renovacion=True,
        dias_anticipacion_alerta=60,
        is_active=True
    )


@pytest.fixture
def requisito_legal(db, tipo_requisito, user):
    """Requisito legal de prueba."""
    return RequisitoLegal.objects.create(
        tipo=tipo_requisito,
        codigo='LIC-001',
        nombre='Licencia Ambiental Tipo A',
        descripcion='Licencia para actividades industriales',
        entidad_emisora='CAR - Corporacion Autonoma Regional',
        base_legal='Decreto 2820 de 2010',
        aplica_sst=False,
        aplica_ambiental=True,
        aplica_calidad=False,
        aplica_pesv=False,
        es_obligatorio=True,
        periodicidad_renovacion='Anual',
        is_active=True,
        created_by=user
    )


@pytest.fixture
def empresa_requisito(db, empresa, requisito_legal, responsable_user, user):
    """Empresa requisito de prueba."""
    return EmpresaRequisito.objects.create(
        empresa=empresa,
        requisito=requisito_legal,
        numero_documento='LIC-2025-001',
        fecha_expedicion=date.today() - timedelta(days=30),
        fecha_vencimiento=date.today() + timedelta(days=60),
        estado=EmpresaRequisito.Estado.VIGENTE,
        responsable=responsable_user,
        observaciones='Licencia vigente',
        is_active=True,
        created_by=user
    )


@pytest.fixture
def empresa_requisito_por_vencer(db, empresa, requisito_legal, user):
    """Empresa requisito proximo a vencer."""
    return EmpresaRequisito.objects.create(
        empresa=empresa,
        requisito=requisito_legal,
        numero_documento='LIC-2024-999',
        fecha_expedicion=date.today() - timedelta(days=350),
        fecha_vencimiento=date.today() + timedelta(days=15),
        estado=EmpresaRequisito.Estado.PROXIMO_VENCER,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def alerta_vencimiento(db, empresa_requisito):
    """Alerta de vencimiento de prueba."""
    return AlertaVencimiento.objects.create(
        empresa_requisito=empresa_requisito,
        dias_antes=30,
        tipo_alerta=AlertaVencimiento.TipoAlerta.SISTEMA,
        fecha_programada=empresa_requisito.fecha_vencimiento - timedelta(days=30),
        enviada=False
    )
