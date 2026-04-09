"""
Fixtures para tests de encuestas.

Las fixtures base (user, admin_user, empresa, api_client,
authenticated_client) se heredan del root conftest.py.
"""
import pytest
from django.utils import timezone
from datetime import timedelta


@pytest.fixture
def pregunta_contexto_pci(db):
    """PreguntaContexto tipo PCI."""
    from apps.gestion_estrategica.encuestas.models import PreguntaContexto
    return PreguntaContexto.objects.create(
        codigo='PCI-01',
        texto='La empresa cuenta con una estructura organizacional definida',
        perfil='pci',
        capacidad_pci='directiva',
        clasificacion_esperada='fd',
        es_sistema=True,
        orden=1
    )


@pytest.fixture
def pregunta_contexto_poam(db):
    """PreguntaContexto tipo POAM."""
    from apps.gestion_estrategica.encuestas.models import PreguntaContexto
    return PreguntaContexto.objects.create(
        codigo='POAM-01',
        texto='Las condiciones economicas del mercado son favorables',
        perfil='poam',
        factor_poam='economico',
        clasificacion_esperada='oa',
        dimension_pestel='economico',
        es_sistema=True,
        orden=1
    )


@pytest.fixture
def analisis_dofa(empresa, user):
    """AnalisisDOFA de prueba (dependencia externa)."""
    from apps.gestion_estrategica.contexto.models import AnalisisDOFA
    from datetime import date
    return AnalisisDOFA.objects.create(
        empresa=empresa,
        nombre='Analisis DOFA 2025',
        fecha_analisis=date(2025, 1, 15),
        periodo='2025 Anual',
        estado='borrador',
        created_by=user
    )


@pytest.fixture
def encuesta_dofa(empresa, analisis_dofa, user):
    """EncuestaDofa de prueba."""
    from apps.gestion_estrategica.encuestas.models import EncuestaDofa
    return EncuestaDofa.objects.create(
        empresa=empresa,
        tipo_encuesta='libre',
        analisis_dofa=analisis_dofa,
        titulo='Encuesta de Diagnostico 2025',
        descripcion='Encuesta para identificar fortalezas y debilidades',
        fecha_inicio=timezone.now() - timedelta(days=1),
        fecha_cierre=timezone.now() + timedelta(days=30),
        estado='activa',
        responsable=user,
        total_invitados=10,
        created_by=user
    )


@pytest.fixture
def encuesta_dofa_borrador(empresa, analisis_dofa, user):
    """EncuestaDofa en estado borrador."""
    from apps.gestion_estrategica.encuestas.models import EncuestaDofa
    return EncuestaDofa.objects.create(
        empresa=empresa,
        tipo_encuesta='pci_poam',
        analisis_dofa=analisis_dofa,
        titulo='Encuesta PCI-POAM Borrador',
        descripcion='Encuesta tipo PCI-POAM',
        fecha_inicio=timezone.now() + timedelta(days=5),
        fecha_cierre=timezone.now() + timedelta(days=35),
        estado='borrador',
        responsable=user,
        created_by=user
    )


@pytest.fixture
def tema_encuesta(empresa, encuesta_dofa, user):
    """TemaEncuesta de prueba."""
    from apps.gestion_estrategica.encuestas.models import TemaEncuesta
    return TemaEncuesta.objects.create(
        empresa=empresa,
        encuesta=encuesta_dofa,
        titulo='Gestion del conocimiento organizacional',
        descripcion='Evaluar la gestion del conocimiento en la empresa',
        orden=1,
        created_by=user
    )


@pytest.fixture
def respuesta_encuesta(tema_encuesta, user):
    """RespuestaEncuesta de prueba."""
    from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta
    return RespuestaEncuesta.objects.create(
        tema=tema_encuesta,
        respondente=user,
        clasificacion='fortaleza',
        justificacion='La empresa tiene buenos procesos de gestion del conocimiento',
        impacto_percibido='alto',
        ip_address='192.168.1.100'
    )
