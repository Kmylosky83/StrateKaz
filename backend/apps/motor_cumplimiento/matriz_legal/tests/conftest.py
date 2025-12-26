"""
Fixtures especificas para tests de matriz_legal
"""
import pytest
from datetime import date

from apps.motor_cumplimiento.matriz_legal.models import (
    TipoNorma, NormaLegal, EmpresaNorma
)


@pytest.fixture
def tipo_norma(db):
    """Tipo de norma de prueba."""
    return TipoNorma.objects.create(
        codigo='LEY',
        nombre='Ley',
        descripcion='Normas tipo ley de la Republica',
        is_active=True
    )


@pytest.fixture
def tipo_norma_decreto(db):
    """Segundo tipo de norma para tests."""
    return TipoNorma.objects.create(
        codigo='DEC',
        nombre='Decreto',
        descripcion='Normas tipo decreto',
        is_active=True
    )


@pytest.fixture
def norma_legal(db, tipo_norma):
    """Norma legal de prueba."""
    return NormaLegal.objects.create(
        tipo_norma=tipo_norma,
        numero='1072',
        anio=2015,
        titulo='Decreto Unico Reglamentario del Sector Trabajo',
        entidad_emisora='Ministerio del Trabajo',
        fecha_expedicion=date(2015, 5, 26),
        fecha_vigencia=date(2015, 5, 26),
        url_original='https://www.mintrabajo.gov.co',
        resumen='Decreto que compila la normatividad del sector trabajo',
        aplica_sst=True,
        aplica_ambiental=False,
        aplica_calidad=False,
        aplica_pesv=False,
        vigente=True,
        is_active=True
    )


@pytest.fixture
def norma_ambiental(db, tipo_norma_decreto):
    """Norma ambiental de prueba."""
    return NormaLegal.objects.create(
        tipo_norma=tipo_norma_decreto,
        numero='2811',
        anio=1974,
        titulo='Codigo de Recursos Naturales',
        entidad_emisora='Ministerio de Ambiente',
        fecha_expedicion=date(1974, 12, 18),
        fecha_vigencia=date(1974, 12, 18),
        aplica_sst=False,
        aplica_ambiental=True,
        aplica_calidad=False,
        aplica_pesv=False,
        vigente=True,
        is_active=True
    )


@pytest.fixture
def empresa_norma(db, empresa, norma_legal, responsable_user, user):
    """Relacion empresa-norma de prueba."""
    return EmpresaNorma.objects.create(
        empresa=empresa,
        norma=norma_legal,
        responsable=responsable_user,
        aplica=True,
        porcentaje_cumplimiento=75,
        fecha_evaluacion=date.today(),
        observaciones='En proceso de implementacion',
        is_active=True,
        created_by=user
    )
