"""
Fixtures para tests de disenador_flujos (workflow_engine)

Fixtures disponibles:
- user: Usuario basico de prueba
- admin_user: Usuario administrador
- empresa: EmpresaConfig de prueba
- api_client: Cliente API sin autenticar
- authenticated_client: Cliente API autenticado
- categoria_flujo: CategoriaFlujo de prueba
- plantilla_flujo: PlantillaFlujo de prueba
- nodo_inicio: NodoFlujo tipo INICIO
- nodo_tarea: NodoFlujo tipo TAREA
- nodo_fin: NodoFlujo tipo FIN
- transicion_flujo: TransicionFlujo entre nodos
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_workflow',
        email='workflow@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin_workflow',
        email='admin_workflow@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    return EmpresaConfig.objects.create(
        nombre='Empresa Test Workflow',
        nit='900222333-4',
        razon_social='Empresa Test Workflow S.A.S.',
        nombre_comercial='ETW',
        email='info@etw.com',
        telefono='3009876543',
        direccion='Carrera 50 # 20-30',
        ciudad='Medellin',
        departamento='Antioquia',
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
def admin_client(api_client, admin_user):
    """Cliente API autenticado con usuario admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def categoria_flujo(empresa, user):
    """CategoriaFlujo de prueba."""
    from apps.workflow_engine.disenador_flujos.models import CategoriaFlujo
    return CategoriaFlujo.objects.create(
        empresa_id=empresa.pk,
        codigo='APROBACIONES',
        nombre='Aprobaciones',
        descripcion='Flujos de aprobacion general',
        color='#3B82F6',
        icono='check-circle',
        orden=1,
        activo=True,
        created_by=user
    )


@pytest.fixture
def categoria_flujo_hseq(empresa, user):
    """CategoriaFlujo para HSEQ."""
    from apps.workflow_engine.disenador_flujos.models import CategoriaFlujo
    return CategoriaFlujo.objects.create(
        empresa_id=empresa.pk,
        codigo='HSEQ',
        nombre='Procesos HSEQ',
        descripcion='Flujos de seguridad y salud',
        color='#10B981',
        icono='shield',
        orden=2,
        activo=True,
        created_by=user
    )


@pytest.fixture
def plantilla_flujo(empresa, categoria_flujo, user):
    """PlantillaFlujo de prueba."""
    from apps.workflow_engine.disenador_flujos.models import PlantillaFlujo
    return PlantillaFlujo.objects.create(
        empresa_id=empresa.pk,
        categoria=categoria_flujo,
        codigo='APROB_VACACIONES',
        nombre='Aprobacion de Vacaciones',
        descripcion='Flujo para solicitar y aprobar vacaciones',
        version=1,
        estado='BORRADOR',
        tiempo_estimado_horas=24,
        requiere_aprobacion_gerencia=False,
        permite_cancelacion=True,
        etiquetas=['vacaciones', 'rrhh'],
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
        codigo='INICIO_VACACIONES',
        nombre='Inicio Solicitud',
        posicion_x=100,
        posicion_y=200,
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
        codigo='FIN_VACACIONES',
        nombre='Fin Solicitud',
        posicion_x=500,
        posicion_y=200,
        created_by=user
    )


@pytest.fixture
def transicion_flujo(empresa, plantilla_flujo, nodo_inicio, nodo_fin, user):
    """TransicionFlujo entre nodo inicio y fin."""
    from apps.workflow_engine.disenador_flujos.models import TransicionFlujo
    return TransicionFlujo.objects.create(
        empresa_id=empresa.pk,
        plantilla=plantilla_flujo,
        nodo_origen=nodo_inicio,
        nodo_destino=nodo_fin,
        nombre='Flujo directo',
        condicion={},
        prioridad=0,
        created_by=user
    )
