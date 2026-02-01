"""
Fixtures especificas para tests de reglamentos_internos
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal

from apps.motor_cumplimiento.reglamentos_internos.models import (
    TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento
)


@pytest.fixture
def tipo_reglamento(db):
    """Tipo de reglamento de prueba."""
    return TipoReglamento.objects.create(
        codigo='RITH',
        nombre='Reglamento Interno de Trabajo e Higiene',
        descripcion='Reglamento laboral',
        requiere_aprobacion_legal=True,
        vigencia_anios=2,
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_reglamento_sst(db):
    """Segundo tipo de reglamento."""
    return TipoReglamento.objects.create(
        codigo='RSST',
        nombre='Reglamento de Seguridad y Salud en el Trabajo',
        descripcion='Reglamento de SST',
        requiere_aprobacion_legal=False,
        vigencia_anios=1,
        orden=2,
        is_active=True
    )


@pytest.fixture
def reglamento(db, empresa, tipo_reglamento, admin_user, user):
    """Reglamento de prueba."""
    return Reglamento.objects.create(
        empresa=empresa,
        tipo=tipo_reglamento,
        codigo='RITH-2025',
        nombre='Reglamento Interno de Trabajo 2025',
        descripcion='Reglamento vigente para el año 2025',
        estado=Reglamento.Estado.VIGENTE,
        version_actual='1.0',
        fecha_aprobacion=date.today() - timedelta(days=30),
        fecha_vigencia=date.today() - timedelta(days=20),
        fecha_proxima_revision=date.today() + timedelta(days=700),
        aprobado_por=admin_user,
        aplica_sst=False,
        aplica_calidad=True,
        orden=1,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def version_reglamento(db, empresa, reglamento, user):
    """Version de reglamento."""
    return VersionReglamento.objects.create(
        empresa=empresa,
        reglamento=reglamento,
        numero_version='1.0',
        fecha_version=date.today() - timedelta(days=30),
        cambios_realizados='Version inicial del reglamento',
        motivo_cambio='Creacion inicial',
        elaborado_por=user,
        revisado_por=user,
        aprobado_por=user,
        fecha_aprobacion=date.today() - timedelta(days=30),
        is_active=True,
        created_by=user
    )


@pytest.fixture
def publicacion_reglamento(db, empresa, reglamento, user):
    """Publicacion de reglamento."""
    return PublicacionReglamento.objects.create(
        empresa=empresa,
        reglamento=reglamento,
        version_publicada='1.0',
        fecha_publicacion=date.today() - timedelta(days=15),
        medio=PublicacionReglamento.MedioPublicacion.CARTELERA,
        ubicacion='Sede Principal - Cartelera RR.HH.',
        publicado_por=user,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def socializacion_reglamento(db, empresa, reglamento, responsable_user, user):
    """Socializacion de reglamento."""
    return SocializacionReglamento.objects.create(
        empresa=empresa,
        reglamento=reglamento,
        tipo=SocializacionReglamento.TipoSocializacion.INDUCCION,
        fecha=date.today() - timedelta(days=10),
        duracion_horas=Decimal('2.0'),
        facilitador=responsable_user,
        numero_asistentes=25,
        temas_tratados='Presentacion general del reglamento',
        is_active=True,
        created_by=user
    )
