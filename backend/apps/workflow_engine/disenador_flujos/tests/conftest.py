"""
Fixtures para tests de disenador_flujos (workflow_engine).

Las fixtures base (user, admin_user, empresa, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest


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
