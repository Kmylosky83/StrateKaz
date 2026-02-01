"""
Fixtures para tests de Revision por la Direccion
"""
import pytest
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, time, timedelta

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.gestion_estrategica.revision_direccion.models import (
    ProgramaRevision, ParticipanteRevision, TemaRevision,
    ActaRevision, AnalisisTemaActa, CompromisoRevision,
    SeguimientoCompromiso
)

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba"""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba"""
    return EmpresaConfig.objects.create(
        nombre='Empresa Test',
        nit='900123456-1',
        razon_social='Empresa Test S.A.S.'
    )


@pytest.fixture
def programa_revision(db, empresa, user):
    """Programa de revision de prueba"""
    return ProgramaRevision.objects.create(
        empresa=empresa,
        anio=2025,
        periodo='Primer Semestre 2025',
        frecuencia='semestral',
        fecha_programada=date.today() + timedelta(days=30),
        hora_inicio=time(9, 0),
        duracion_estimada_horas=Decimal('2.0'),
        lugar='Sala de Juntas',
        estado='programada',
        responsable_convocatoria=user,
        incluye_calidad=True,
        incluye_sst=True,
        incluye_ambiental=True,
        created_by=user
    )


@pytest.fixture
def participante_revision(db, programa_revision, user):
    """Participante de revision de prueba"""
    return ParticipanteRevision.objects.create(
        programa=programa_revision,
        usuario=user,
        rol='direccion',
        es_obligatorio=True
    )


@pytest.fixture
def tema_revision(db, programa_revision, user):
    """Tema de revision de prueba"""
    return TemaRevision.objects.create(
        programa=programa_revision,
        categoria='objetivos',
        titulo='Grado de cumplimiento de objetivos',
        descripcion='Analisis del cumplimiento de objetivos del periodo',
        responsable=user,
        orden=1
    )


@pytest.fixture
def acta_revision(db, programa_revision, user):
    """Acta de revision de prueba"""
    return ActaRevision.objects.create(
        programa=programa_revision,
        numero_acta='ACTA-RXD-2025-001',
        fecha=date.today(),
        hora_inicio=time(9, 0),
        hora_fin=time(11, 0),
        lugar='Sala de Juntas',
        introduccion='Revision por la direccion del primer semestre',
        conclusiones_generales='Sistema de gestion adecuado',
        evaluacion_sistema='adecuado',
        elaborado_por=user,
        fecha_elaboracion=date.today(),
        created_by=user
    )


@pytest.fixture
def compromiso_revision(db, acta_revision, tema_revision, user):
    """Compromiso de revision de prueba"""
    return CompromisoRevision.objects.create(
        acta=acta_revision,
        tema_relacionado=tema_revision,
        consecutivo='COMP-RXD-2025-001',
        tipo='mejora',
        descripcion='Implementar mejora en proceso de produccion',
        resultado_esperado='Reducir tiempos de ciclo en 10%',
        responsable=user,
        fecha_compromiso=date.today() + timedelta(days=60),
        estado='pendiente',
        prioridad='alta',
        created_by=user
    )


@pytest.fixture
def seguimiento_compromiso(db, compromiso_revision, user):
    """Seguimiento de compromiso de prueba"""
    return SeguimientoCompromiso.objects.create(
        compromiso=compromiso_revision,
        fecha=date.today(),
        porcentaje_avance=25,
        descripcion_avance='Se ha iniciado el analisis de tiempos',
        registrado_por=user
    )


@pytest.fixture
def api_client():
    """Cliente API de prueba"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado"""
    api_client.force_authenticate(user=user)
    return api_client
