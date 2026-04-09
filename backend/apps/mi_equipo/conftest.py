"""
Fixtures compartidas para tests de Mi Equipo.

Proporciona fixtures reutilizables para las 4 sub-apps:
- estructura_cargos
- seleccion_contratacion
- colaboradores
- onboarding_induccion

Las fixtures base (user, admin_user, empresa, cargo, area, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
Este archivo solo define fixtures especificas de mi_equipo.
"""
import pytest
from datetime import date
from decimal import Decimal


# ==============================================================================
# FIXTURES DE USUARIOS ADICIONALES
# ==============================================================================


@pytest.fixture
def second_user(db):
    """Segundo usuario para tests de aprobacion, testigo, etc."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username='seconduser',
        email='second@example.com',
        password='TestPass123!',
        first_name='Second',
        last_name='User',
        is_active=True,
    )


# ==============================================================================
# FIXTURES DE ESTRUCTURA ORGANIZACIONAL ADICIONALES
# ==============================================================================


@pytest.fixture
def cargo_gerente(db):
    """Cargo de gerente (nivel estrategico)."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code='GERENTE',
        name='Gerente',
        nivel_jerarquico='ESTRATEGICO',
    )


@pytest.fixture
def cargo_coordinador(db):
    """Cargo de coordinador (nivel tactico)."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code='COORDINADOR',
        name='Coordinador',
        nivel_jerarquico='TACTICO',
    )


@pytest.fixture
def area_operaciones(db):
    """Segunda area para tests de traslados."""
    from apps.gestion_estrategica.organizacion.models import Area

    return Area.objects.create(
        code='OPE',
        name='Operaciones',
        tipo='MISIONAL',
        orden=2,
    )


# ==============================================================================
# FIXTURES DE COLABORADOR
# ==============================================================================


@pytest.fixture
def colaborador(db, empresa, cargo, area, user):
    """Colaborador basico de prueba."""
    from apps.mi_equipo.colaboradores.models import Colaborador

    return Colaborador.objects.create(
        empresa=empresa,
        numero_identificacion='1234567890',
        tipo_documento='CC',
        primer_nombre='Juan',
        segundo_nombre='Carlos',
        primer_apellido='Perez',
        segundo_apellido='Lopez',
        cargo=cargo,
        area=area,
        fecha_ingreso=date(2024, 1, 15),
        estado='activo',
        tipo_contrato='indefinido',
        salario=Decimal('3500000.00'),
        email_personal='juan.perez@email.com',
        telefono_movil='3001234567',
        created_by=user,
        updated_by=user,
    )


@pytest.fixture
def colaborador_retirado(db, empresa, cargo, area, user):
    """Colaborador en estado retirado."""
    from apps.mi_equipo.colaboradores.models import Colaborador

    return Colaborador.objects.create(
        empresa=empresa,
        numero_identificacion='9876543210',
        tipo_documento='CC',
        primer_nombre='Maria',
        primer_apellido='Garcia',
        cargo=cargo,
        area=area,
        fecha_ingreso=date(2023, 3, 1),
        fecha_retiro=date(2025, 12, 31),
        estado='retirado',
        tipo_contrato='fijo',
        fecha_fin_contrato=date(2025, 12, 31),
        salario=Decimal('2800000.00'),
        motivo_retiro='Finalizacion de contrato',
        created_by=user,
        updated_by=user,
    )


# ==============================================================================
# FIXTURES DE ESTRUCTURA DE CARGOS
# ==============================================================================


@pytest.fixture
def profesiograma(db, empresa, cargo, area, user):
    """Profesiograma basico de prueba."""
    from apps.mi_equipo.estructura_cargos.models import Profesiograma

    return Profesiograma.objects.create(
        empresa=empresa,
        cargo=cargo,
        area=area,
        codigo='PROF-TEST-001',
        nombre='Profesiograma Analista',
        nivel_educativo_minimo='PROFESIONAL',
        experiencia_minima='2_ANOS',
        estado='VIGENTE',
        fecha_vigencia_inicio=date(2024, 1, 1),
        created_by=user,
        updated_by=user,
    )


@pytest.fixture
def matriz_competencia(db, empresa, profesiograma, user):
    """Competencia asociada a un profesiograma."""
    from apps.mi_equipo.estructura_cargos.models import MatrizCompetencia

    return MatrizCompetencia.objects.create(
        empresa=empresa,
        profesiograma=profesiograma,
        tipo_competencia='TECNICA',
        nombre_competencia='Excel Avanzado',
        nivel_requerido='AVANZADO',
        criticidad='REQUERIDA',
        peso_evaluacion=5,
        created_by=user,
        updated_by=user,
    )


# ==============================================================================
# FIXTURES DE ONBOARDING
# ==============================================================================


@pytest.fixture
def modulo_induccion(db, empresa, user):
    """Modulo de induccion basico."""
    from apps.mi_equipo.onboarding_induccion.models import ModuloInduccion

    return ModuloInduccion.objects.create(
        empresa=empresa,
        codigo='IND-TEST-001',
        nombre='Induccion General',
        tipo_modulo='induccion_general',
        formato_contenido='presentacion',
        duracion_minutos=60,
        es_obligatorio=True,
        orden=1,
        created_by=user,
        updated_by=user,
    )


@pytest.fixture
def item_checklist(db, empresa, user):
    """Item de checklist de ingreso."""
    from apps.mi_equipo.onboarding_induccion.models import ItemChecklist

    return ItemChecklist.objects.create(
        empresa=empresa,
        codigo='CHK-TEST-001',
        descripcion='Entrega de fotocopia de cedula',
        categoria='documentos',
        orden=1,
        aplica_a_todos=True,
        created_by=user,
        updated_by=user,
    )
