"""
Fixtures para tests de encuestas

Fixtures disponibles:
- user: Usuario basico de prueba
- admin_user: Usuario administrador
- empresa: EmpresaConfig de prueba
- api_client: Cliente API sin autenticar
- authenticated_client: Cliente API autenticado
- pregunta_contexto_pci: PreguntaContexto tipo PCI
- pregunta_contexto_poam: PreguntaContexto tipo POAM
- encuesta_dofa: EncuestaDofa de prueba
- tema_encuesta: TemaEncuesta de prueba
- respuesta_encuesta: RespuestaEncuesta de prueba
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_encuestas',
        email='encuestas@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin_encuestas',
        email='admin_encuestas@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    return EmpresaConfig.objects.create(
        nombre='Empresa Test Encuestas',
        nit='900444555-6',
        razon_social='Empresa Test Encuestas S.A.S.',
        nombre_comercial='ETEN',
        email='info@eten.com',
        telefono='3007778899',
        direccion='Calle 50 # 15-25',
        ciudad='Barranquilla',
        departamento='Atlantico',
        pais='Colombia'
    )


@pytest.fixture
def api_client():
    """Cliente API de prueba."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado con usuario basico."""
    api_client.force_authenticate(user=user)
    return api_client


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
