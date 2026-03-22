"""
Root conftest.py — Fixtures compartidas para todos los tests de StrateKaz.

Provee fixtures reutilizables que eliminan la duplicacion entre apps:
- user / admin_user / responsable_user: Usuarios de prueba
- empresa: EmpresaConfig minima para tenant
- area: Proceso organizacional
- cargo: Cargo con codigo unico
- api_client / authenticated_client / admin_client: Clientes DRF

Todas las importaciones son lazy (dentro de la fixture) para evitar
problemas con django-tenants y el orden de carga de apps.
"""

import pytest


# =============================================================================
# API CLIENTS
# =============================================================================


@pytest.fixture
def api_client():
    """Cliente API de prueba (sin autenticacion)."""
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


# =============================================================================
# USUARIOS
# =============================================================================


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
        document_number="1234567890",
        document_type="CC",
        is_active=True,
    )


@pytest.fixture
def admin_user(db):
    """Usuario superadmin de prueba."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="adminpass123",
        first_name="Admin",
        last_name="User",
        document_number="9999999999",
    )


@pytest.fixture
def responsable_user(db):
    """Usuario responsable (para asignaciones de tareas, cumplimiento, etc.)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="responsable",
        email="responsable@example.com",
        password="testpass123",
        first_name="Responsable",
        last_name="Cumplimiento",
        document_number="5555555555",
        document_type="CC",
        is_active=True,
    )


# =============================================================================
# EMPRESA (TENANT DATA)
# =============================================================================


@pytest.fixture
def empresa(db):
    """EmpresaConfig minima — requerida por BaseCompanyModel."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig

    return EmpresaConfig.objects.create(
        nit="900123456-1",
        razon_social="Empresa de Prueba S.A.S.",
    )


@pytest.fixture
def empresa_secundaria(db):
    """Segunda empresa para tests de multi-tenancy o aislamiento."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig

    return EmpresaConfig.objects.create(
        nit="900987654-2",
        razon_social="Empresa Secundaria S.A.S.",
    )


# =============================================================================
# ESTRUCTURA ORGANIZACIONAL
# =============================================================================


@pytest.fixture
def area(db, user):
    """Proceso/Area organizacional de prueba."""
    from apps.gestion_estrategica.organizacion.models import Area

    return Area.objects.create(
        code="ADM",
        name="Administracion",
        tipo="APOYO",
        description="Proceso de apoyo administrativo",
        created_by=user,
    )


@pytest.fixture
def cargo(db, area):
    """Cargo de prueba con area asignada."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code="AUX-ADM",
        name="Auxiliar Administrativo",
        area=area,
        nivel_jerarquico="OPERATIVO",
    )


# =============================================================================
# COLABORADOR (MI EQUIPO)
# =============================================================================


@pytest.fixture
def colaborador(db, empresa, user):
    """Colaborador vinculado a usuario y empresa."""
    from apps.mi_equipo.colaboradores.models import Colaborador

    return Colaborador.objects.create(
        empresa=empresa,
        numero_identificacion="1234567890",
        tipo_documento="CC",
        primer_nombre="Carlos",
        primer_apellido="Garcia",
        usuario=user,
        created_by=user,
    )


# =============================================================================
# FACTORY SHORTCUTS (importar factories como fixtures)
# =============================================================================


@pytest.fixture
def user_factory(db):
    """Acceso a UserFactory para crear multiples usuarios."""
    from tests.factories import UserFactory

    return UserFactory


@pytest.fixture
def empresa_factory(db):
    """Acceso a EmpresaConfigFactory para crear multiples empresas."""
    from tests.factories import EmpresaConfigFactory

    return EmpresaConfigFactory


@pytest.fixture
def area_factory(db):
    """Acceso a AreaFactory para crear multiples areas."""
    from tests.factories import AreaFactory

    return AreaFactory


@pytest.fixture
def cargo_factory(db):
    """Acceso a CargoFactory para crear multiples cargos."""
    from tests.factories import CargoFactory

    return CargoFactory


@pytest.fixture
def colaborador_factory(db):
    """Acceso a ColaboradorFactory para crear multiples colaboradores."""
    from tests.factories import ColaboradorFactory

    return ColaboradorFactory
