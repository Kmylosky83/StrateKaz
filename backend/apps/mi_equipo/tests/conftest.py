"""
Fixtures compartidas para tests de Mi Equipo.

Proporciona fixtures reutilizables para las 4 sub-apps:
- estructura_cargos
- seleccion_contratacion
- colaboradores
- onboarding_induccion

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model

User = get_user_model()


# ==============================================================================
# FIXTURES DE USUARIOS
# ==============================================================================


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_mi_equipo',
        email='testuser_miequipo@example.com',
        password='TestPass123!',
        first_name='Test',
        last_name='User',
        is_active=True,
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin_mi_equipo',
        email='admin_miequipo@example.com',
        password='AdminPass123!',
        first_name='Admin',
        last_name='User',
    )


@pytest.fixture
def second_user(db):
    """Segundo usuario para tests de aprobacion, testigo, etc."""
    return User.objects.create_user(
        username='seconduser',
        email='second@example.com',
        password='TestPass123!',
        first_name='Second',
        last_name='User',
        is_active=True,
    )


# ==============================================================================
# FIXTURES DE EMPRESA
# ==============================================================================


@pytest.fixture
def empresa(db):
    """Empresa de prueba (EmpresaConfig)."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig

    return EmpresaConfig.objects.create(
        nombre='StrateKaz Test',
        nit='900123456-1',
        razon_social='StrateKaz Test S.A.S.',
        nombre_comercial='SKT',
        email='info@stratekaz-test.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia',
    )


# ==============================================================================
# FIXTURES DE ESTRUCTURA ORGANIZACIONAL
# ==============================================================================


@pytest.fixture
def cargo(db):
    """Cargo basico de prueba."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code='ANALISTA',
        name='Analista',
        nivel_jerarquico=1,
    )


@pytest.fixture
def cargo_gerente(db):
    """Cargo de gerente (nivel 3)."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code='GERENTE',
        name='Gerente',
        nivel_jerarquico=3,
    )


@pytest.fixture
def cargo_coordinador(db):
    """Cargo de coordinador (nivel 2)."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code='COORDINADOR',
        name='Coordinador',
        nivel_jerarquico=2,
    )


@pytest.fixture
def area(db):
    """Area organizacional de prueba."""
    from apps.gestion_estrategica.organizacion.models import Area

    return Area.objects.create(
        code='ADM',
        name='Administracion',
        tipo='APOYO',
        orden=1,
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
# FIXTURES DE API CLIENT
# ==============================================================================


@pytest.fixture
def api_client():
    """Cliente API sin autenticar."""
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
