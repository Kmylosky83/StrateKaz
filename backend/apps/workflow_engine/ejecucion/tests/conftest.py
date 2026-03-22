"""
Fixtures para tests de ejecucion (workflow_engine)

Fixtures disponibles:
- user: Usuario basico de prueba
- admin_user: Usuario administrador
- empresa: EmpresaConfig de prueba
- api_client: Cliente API sin autenticar
- authenticated_client: Cliente API autenticado
- categoria_flujo: CategoriaFlujo de prueba
- plantilla_flujo: PlantillaFlujo de prueba
- nodo_inicio: NodoFlujo tipo INICIO
- nodo_tarea: NodoFlujo tipo TAREA (sin rol para tests)
- nodo_fin: NodoFlujo tipo FIN
- instancia_flujo: InstanciaFlujo de prueba
- tarea_activa: TareaActiva de prueba
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
        username='testuser_ejecucion',
        email='ejecucion@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin_ejecucion',
        email='admin_ejecucion@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    return EmpresaConfig.objects.create(
        nombre='Empresa Test Ejecucion',
        nit='900333444-5',
        razon_social='Empresa Test Ejecucion S.A.S.',
        nombre_comercial='ETE',
        email='info@ete.com',
        telefono='3005551234',
        direccion='Avenida 68 # 30-40',
        ciudad='Cali',
        departamento='Valle del Cauca',
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
def categoria_flujo(empresa, user):
    """CategoriaFlujo de prueba."""
    from apps.workflow_engine.disenador_flujos.models import CategoriaFlujo
    return CategoriaFlujo.objects.create(
        empresa_id=empresa.pk,
        codigo='APROBACIONES',
        nombre='Aprobaciones',
        created_by=user
    )


@pytest.fixture
def plantilla_flujo(empresa, categoria_flujo, user):
    """PlantillaFlujo de prueba."""
    from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
    return PlantillaFlujo.objects.create(
        empresa_id=empresa.pk,
        categoria=categoria_flujo,
        codigo='APROB_COMPRA',
        nombre='Aprobacion de Compra',
        version=1,
        estado='ACTIVO',
        created_by=user
    )


@pytest.fixture
def nodo_inicio(empresa, plantilla_flujo, user):
    """NodoFlujo tipo INICIO."""
    from apps.workflow_engine.disenador_flujos.models import NodoFlujo
    return NodoFlujo.objects.create(
        empresa_id=empresa.pk,
        plantilla=plantilla_flujo,
        tipo='INICIO',
        codigo='INICIO',
        nombre='Inicio',
        created_by=user
    )


@pytest.fixture
def nodo_fin(empresa, plantilla_flujo, user):
    """NodoFlujo tipo FIN."""
    from apps.workflow_engine.disenador_flujos.models import NodoFlujo
    return NodoFlujo.objects.create(
        empresa_id=empresa.pk,
        plantilla=plantilla_flujo,
        tipo='FIN',
        codigo='FIN',
        nombre='Fin',
        created_by=user
    )


@pytest.fixture
def instancia_flujo(empresa, plantilla_flujo, nodo_inicio, user):
    """InstanciaFlujo de prueba."""
    from apps.workflow_engine.ejecucion.models import InstanciaFlujo
    return InstanciaFlujo.objects.create(
        codigo_instancia='WF-SC-2025-0001',
        titulo='Solicitud de Compra - Materiales',
        descripcion='Compra de materiales de limpieza',
        plantilla=plantilla_flujo,
        nodo_actual=nodo_inicio,
        estado='INICIADO',
        prioridad='NORMAL',
        data_contexto={'tipo': 'compra', 'monto': 500000},
        iniciado_por=user,
        empresa_id=empresa.pk,
        created_by=user
    )


@pytest.fixture
def tarea_activa(empresa, instancia_flujo, nodo_inicio, user):
    """TareaActiva de prueba."""
    from apps.workflow_engine.ejecucion.models import TareaActiva
    return TareaActiva.objects.create(
        instancia=instancia_flujo,
        nodo=nodo_inicio,
        codigo_tarea='TK-2025-0001-001',
        nombre_tarea='Revisar Solicitud',
        tipo_tarea='REVISION',
        estado='PENDIENTE',
        asignado_a=user,
        fecha_vencimiento=timezone.now() + timedelta(days=3),
        empresa_id=empresa.pk,
        created_by=user
    )
