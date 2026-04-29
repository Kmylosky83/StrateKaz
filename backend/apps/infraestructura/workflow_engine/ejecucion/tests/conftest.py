"""
Fixtures para tests de ejecucion (workflow_engine).

Las fixtures base (user, admin_user, empresa, api_client,
authenticated_client) se heredan del root conftest.py.
"""
import pytest
from django.utils import timezone
from datetime import timedelta


@pytest.fixture
def categoria_flujo(empresa, user):
    """CategoriaFlujo de prueba."""
    from apps.infraestructura.workflow_engine.disenador_flujos.models import CategoriaFlujo
    return CategoriaFlujo.objects.create(
        empresa_id=empresa.pk,
        codigo='APROBACIONES',
        nombre='Aprobaciones',
        created_by=user
    )


@pytest.fixture
def plantilla_flujo(empresa, categoria_flujo, user):
    """PlantillaFlujo de prueba."""
    from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo
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
    from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo
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
    from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo
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
    from apps.infraestructura.workflow_engine.ejecucion.models import InstanciaFlujo
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
    from apps.infraestructura.workflow_engine.ejecucion.models import TareaActiva
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
