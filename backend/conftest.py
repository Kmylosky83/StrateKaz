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
# TENANT MULTI-SCHEMA SETUP — Bridge entre pytest-django y django-tenants
# =============================================================================
# Schema unificado: tanto pytest (via este fixture) como BaseTenantTestCase
# (unittest-style) usan schema "test". Esto garantiza que ambos frameworks
# operen sobre las mismas tablas de TENANT_APPS.
#
# El fixture tenant_test_schema (session scope) crea el schema una sola vez
# por corrida y fuerza migrate_schemas para asegurar que TODAS las tablas
# de TENANT_APPS actuales existan (fix del pitfall check_if_exists).
#
# El fixture enable_tenant_db (autouse) envuelve cada test que use `db`
# en schema_context("test") para que las operaciones ORM caigan en el
# schema del tenant de test, no en public.


@pytest.fixture(scope="session")
def tenant_test_schema(django_db_setup, django_db_blocker):
    """
    Crea (o reutiliza) un tenant de test con schema 'test' una sola vez
    por corrida. Fuerza migrate_schemas para garantizar que todas las tablas
    de TENANT_APPS actuales existan en el schema.
    """
    from django_tenants.utils import get_tenant_domain_model, get_tenant_model
    from django.core.management import call_command

    TenantModel = get_tenant_model()
    DomainModel = get_tenant_domain_model()

    with django_db_blocker.unblock():
        tenant, _ = TenantModel.objects.get_or_create(
            schema_name="test",
            defaults={
                "code": "test",
                "name": "Test Tenant",
            },
        )
        # noqa: TENANT-LIFECYCLE
        # Test infrastructure fuera del TenantLifecycleService. Usa
        # django-tenants create_schema() directo porque:
        # 1. El schema 'test' es efímero (session scope, no producción).
        # 2. El servicio carga seeds que encarecen el setup (~10 min).
        #    create_schema + migrate_schemas es más rápido (~7 min).
        # 3. Los tests necesitan un schema base sin las garantías de
        #    producción del servicio (locks, invariante, callbacks).
        tenant.create_schema(check_if_exists=True, sync_schema=True, verbosity=0)

        # Forzar migraciones para asegurar que TODAS las tablas de
        # TENANT_APPS actuales existan (fix pitfall check_if_exists).
        call_command('migrate_schemas', schema_name='test', verbosity=0)

        DomainModel.objects.get_or_create(
            tenant=tenant,
            domain="tenant.test.com",
            defaults={"is_primary": True},
        )

        # Seed SystemModule rows para que ModuleAccessMiddleware no bloquee
        # requests en tests. Sin esto, todas las APIs de módulos LIVE
        # retornan 403 porque el middleware verifica is_enabled en DB.
        from django_tenants.utils import schema_context
        with schema_context("test"):
            from apps.core.models import SystemModule

            _LIVE_MODULES = [
                ("fundacion", "Fundación", "STRATEGIC"),
                ("infra_gestion_documental", "Gestión Documental", "INFRASTRUCTURE"),
                ("infra_catalogo_productos", "Catálogos Maestros", "INFRASTRUCTURE"),
                ("infra_workflow_engine", "Flujos de Trabajo", "INFRASTRUCTURE"),
                ("audit_system", "Centro de Control", "INTELLIGENCE"),
                ("mi_equipo", "Gestión de Personas", "OPERATIONAL"),
                ("analytics", "Analítica", "INTELLIGENCE"),
                ("planeacion_estrategica", "Planificación Estratégica", "STRATEGIC"),
                ("motor_cumplimiento", "Motor de Cumplimiento", "COMPLIANCE"),
                ("motor_riesgos", "Motor de Riesgos", "COMPLIANCE"),
                ("hseq_management", "Gestión HSEQ", "INTEGRATED"),
                ("talent_hub", "Talent Hub", "OPERATIONAL"),
            ]
            for code, name, category in _LIVE_MODULES:
                SystemModule.objects.get_or_create(
                    code=code,
                    defaults={
                        "name": name,
                        "category": category,
                        "is_enabled": True,
                    },
                )

    return tenant


@pytest.fixture(autouse=True)
def enable_tenant_db(request, tenant_test_schema):
    """
    Envuelve cada test que use el fixture `db` en schema_context del tenant
    de test. Tests que NO usan db (unit tests puros sin acceso a modelos)
    no se ven afectados — yield directo sin entrar al schema_context.
    """
    from django_tenants.utils import schema_context

    db_fixtures = {
        "db",
        "transactional_db",
        "django_db_setup",
        "django_db_reset_sequences",
    }
    needs_db = bool(db_fixtures.intersection(request.fixturenames))

    if not needs_db:
        yield
        return

    with schema_context(tenant_test_schema.schema_name):
        yield


# =============================================================================
# API CLIENTS
# =============================================================================


@pytest.fixture
def api_client(tenant_test_schema):
    """Cliente API de prueba (sin autenticacion).

    Setea HTTP_HOST al dominio del tenant de test para que
    TenantMainMiddleware resuelva el schema correcto. Sin esto,
    APIClient envia Host: testserver y las requests caen a schema
    'public' donde las tablas de TENANT_APPS no existen.
    """
    from rest_framework.test import APIClient

    client = APIClient()
    client.defaults['HTTP_HOST'] = 'tenant.test.com'
    return client


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
