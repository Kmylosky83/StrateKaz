"""
Fixtures compartidas para tests de Firma Digital.

Diseñadas para reusar en Commits 4-7 de la Fase 1 de limpieza:
- Commit 4: content_type resolution + destinatarios desde Cargo
- Commit 5: rechazar documento con cascada de firmas
- Commit 6: iniciar_revision con batch FirmaDigital
- Commit 7: renovar_politica con versionamiento

Todas las importaciones son lazy (dentro de la fixture) para evitar
problemas con django-tenants y el orden de carga de apps.
"""

import pytest
from datetime import timedelta
from django.utils import timezone


# =============================================================================
# EMPRESA Y ESTRUCTURA ORGANIZACIONAL
# =============================================================================


@pytest.fixture
def fd_empresa(db):
    """EmpresaConfig para tests de firma digital."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig

    return EmpresaConfig.objects.create(
        nit="900111222-3",
        razon_social="Firma Digital Test S.A.S.",
    )


@pytest.fixture
def fd_area(db):
    """Area/Proceso para asociar cargos."""
    from apps.gestion_estrategica.organizacion.models import Area

    return Area.objects.create(
        code="SGI",
        name="Sistema de Gestión Integral",
        tipo="ESTRATEGICO",
        description="Proceso estratégico de gestión",
    )


@pytest.fixture
def cargo_elaborador(db, fd_area):
    """Cargo que firma como ELABORO."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code="LIDER-SST",
        name="Líder SST",
        area=fd_area,
        nivel_jerarquico="TACTICO",
    )


@pytest.fixture
def cargo_revisor(db, fd_area):
    """Cargo que firma como REVISO."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code="COORD-CALIDAD",
        name="Coordinador de Calidad",
        area=fd_area,
        nivel_jerarquico="TACTICO",
    )


@pytest.fixture
def cargo_aprobador(db, fd_area):
    """Cargo que firma como APROBO."""
    from apps.core.models import Cargo

    return Cargo.objects.create(
        code="GERENTE-GEN",
        name="Gerente General",
        area=fd_area,
        nivel_jerarquico="ESTRATEGICO",
    )


# =============================================================================
# USUARIOS CON Y SIN EMPRESA/CARGO
# =============================================================================


@pytest.fixture
def user_elaborador(db, cargo_elaborador):
    """Usuario con cargo elaborador (tiene empresa_id via schema)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="elaborador",
        email="elaborador@test.com",
        password="testpass123",
        first_name="Ana",
        last_name="Elaboradora",
        document_number="1111111111",
        document_type="CC",
        cargo=cargo_elaborador,
        is_active=True,
    )


@pytest.fixture
def user_revisor(db, cargo_revisor):
    """Usuario con cargo revisor."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="revisor",
        email="revisor@test.com",
        password="testpass123",
        first_name="Carlos",
        last_name="Revisor",
        document_number="2222222222",
        document_type="CC",
        cargo=cargo_revisor,
        is_active=True,
    )


@pytest.fixture
def user_aprobador(db, cargo_aprobador):
    """Usuario con cargo aprobador."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="aprobador",
        email="aprobador@test.com",
        password="testpass123",
        first_name="María",
        last_name="Aprobadora",
        document_number="3333333333",
        document_type="CC",
        cargo=cargo_aprobador,
        is_active=True,
    )


@pytest.fixture
def user_sin_cargo(db):
    """Usuario sin cargo asignado (edge case)."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_user(
        username="sincargo",
        email="sincargo@test.com",
        password="testpass123",
        first_name="Pedro",
        last_name="SinCargo",
        document_number="4444444444",
        document_type="CC",
        is_active=True,
    )


@pytest.fixture
def admin_fd(db):
    """Superadmin para tests de firma digital."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_superuser(
        username="admin_fd",
        email="admin_fd@test.com",
        password="adminpass123",
        first_name="Admin",
        last_name="FirmaDigital",
        document_number="8888888888",
    )


# =============================================================================
# API CLIENTS
# =============================================================================


@pytest.fixture
def client_elaborador(api_client, user_elaborador):
    """Cliente autenticado como elaborador."""
    api_client.force_authenticate(user=user_elaborador)
    return api_client


@pytest.fixture
def client_revisor(api_client, user_revisor):
    """Cliente autenticado como revisor."""
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=user_revisor)
    return client


@pytest.fixture
def client_aprobador(api_client, user_aprobador):
    """Cliente autenticado como aprobador."""
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=user_aprobador)
    return client


@pytest.fixture
def client_admin_fd(api_client, admin_fd):
    """Cliente autenticado como superadmin."""
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=admin_fd)
    return client


# =============================================================================
# DOCUMENTOS (GenericFK target)
# =============================================================================


@pytest.fixture
def content_type_documento(db):
    """ContentType para Documento de gestion_documental."""
    from django.contrib.contenttypes.models import ContentType
    from apps.gestion_estrategica.gestion_documental.models import Documento

    return ContentType.objects.get_for_model(Documento)


@pytest.fixture
def documento_borrador(db, fd_empresa, user_elaborador):
    """Documento en estado BORRADOR — listo para iniciar revisión."""
    from apps.gestion_estrategica.gestion_documental.models import (
        TipoDocumento,
        Documento,
    )

    tipo = TipoDocumento.objects.create(
        empresa_id=fd_empresa.id,
        codigo="PROC",
        nombre="Procedimiento",
        nivel_documento="OPERATIVO",
        requiere_aprobacion=True,
        requiere_firma=True,
    )
    return Documento.objects.create(
        empresa_id=fd_empresa.id,
        codigo="PROC-SGI-001",
        titulo="Procedimiento de Prueba",
        tipo_documento=tipo,
        contenido="<p>Contenido del procedimiento de prueba</p>",
        estado="BORRADOR",
        version_actual="1.0",
        elaborado_por=user_elaborador,
        created_by=user_elaborador,
    )


@pytest.fixture
def documento_publicado(db, fd_empresa, user_elaborador):
    """Documento en estado PUBLICADO — listo para renovar."""
    from apps.gestion_estrategica.gestion_documental.models import (
        TipoDocumento,
        Documento,
    )

    tipo = TipoDocumento.objects.create(
        empresa_id=fd_empresa.id,
        codigo="POL",
        nombre="Política",
        nivel_documento="ESTRATEGICO",
        requiere_aprobacion=True,
        requiere_firma=True,
    )
    return Documento.objects.create(
        empresa_id=fd_empresa.id,
        codigo="POL-SGI-001",
        titulo="Política de Calidad",
        tipo_documento=tipo,
        contenido="<p>Política de calidad de la empresa</p>",
        estado="PUBLICADO",
        version_actual="1.0.0",
        elaborado_por=user_elaborador,
        created_by=user_elaborador,
    )


# =============================================================================
# CONFIGURACION DE FLUJO DE FIRMA
# =============================================================================


@pytest.fixture
def configuracion_flujo(db, fd_empresa):
    """ConfiguracionFlujoFirma SECUENCIAL con 3 nodos (ELABORO→REVISO→APROBO)."""
    from apps.infraestructura.workflow_engine.firma_digital.models import ConfiguracionFlujoFirma

    return ConfiguracionFlujoFirma.objects.create(
        empresa_id=fd_empresa.id,
        nombre="Flujo Estándar ISO",
        codigo="FLUJO-ISO-STD",
        tipo_flujo="SECUENCIAL",
        configuracion_nodos=[
            {"orden": 1, "rol": "ELABORO", "requerido": True},
            {"orden": 2, "rol": "REVISO", "requerido": True},
            {"orden": 3, "rol": "APROBO", "requerido": True},
        ],
        permite_delegacion=True,
        dias_max_firma=5,
        requiere_comentario_rechazo=True,
        created_by=None,
    )


@pytest.fixture
def nodos_flujo(db, configuracion_flujo, cargo_elaborador, cargo_revisor, cargo_aprobador):
    """3 FlowNode para el flujo secuencial estándar."""
    from apps.infraestructura.workflow_engine.firma_digital.models import FlowNode

    nodos = [
        FlowNode.objects.create(
            empresa_id=configuracion_flujo.empresa_id,
            configuracion_flujo=configuracion_flujo,
            orden=1,
            rol_firma="ELABORO",
            cargo=cargo_elaborador,
            es_requerido=True,
            permite_rechazo=True,
            created_by=None,
        ),
        FlowNode.objects.create(
            empresa_id=configuracion_flujo.empresa_id,
            configuracion_flujo=configuracion_flujo,
            orden=2,
            rol_firma="REVISO",
            cargo=cargo_revisor,
            es_requerido=True,
            permite_rechazo=True,
            created_by=None,
        ),
        FlowNode.objects.create(
            empresa_id=configuracion_flujo.empresa_id,
            configuracion_flujo=configuracion_flujo,
            orden=3,
            rol_firma="APROBO",
            cargo=cargo_aprobador,
            es_requerido=True,
            permite_rechazo=True,
            created_by=None,
        ),
    ]
    return nodos


# =============================================================================
# FIRMAS DIGITALES EN DISTINTOS ESTADOS
# =============================================================================


@pytest.fixture
def firma_pendiente(db, fd_empresa, content_type_documento, documento_borrador, user_elaborador, cargo_elaborador):
    """FirmaDigital en estado PENDIENTE — esperando firma."""
    from apps.infraestructura.workflow_engine.firma_digital.models import FirmaDigital

    return FirmaDigital.objects.create(
        empresa_id=fd_empresa.id,
        content_type=content_type_documento,
        object_id=str(documento_borrador.id),
        usuario=user_elaborador,
        cargo=cargo_elaborador,
        rol_firma="ELABORO",
        firma_imagen="",
        documento_hash="pending",
        firma_hash="pending",
        ip_address="127.0.0.1",
        user_agent="pytest",
        estado="PENDIENTE",
        orden=1,
        created_by=user_elaborador,
    )


@pytest.fixture
def firma_completada(db, fd_empresa, content_type_documento, documento_borrador, user_elaborador, cargo_elaborador):
    """FirmaDigital en estado FIRMADO — ya firmada."""
    from apps.infraestructura.workflow_engine.firma_digital.models import FirmaDigital
    import hashlib

    doc_hash = hashlib.sha256(b"contenido test").hexdigest()
    return FirmaDigital.objects.create(
        empresa_id=fd_empresa.id,
        content_type=content_type_documento,
        object_id=str(documento_borrador.id),
        usuario=user_elaborador,
        cargo=cargo_elaborador,
        rol_firma="ELABORO",
        firma_imagen="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
        documento_hash=doc_hash,
        firma_hash="",
        ip_address="127.0.0.1",
        user_agent="pytest",
        estado="FIRMADO",
        orden=1,
        created_by=user_elaborador,
    )


@pytest.fixture
def firma_pendiente_revisor(db, fd_empresa, content_type_documento, documento_borrador, user_revisor, cargo_revisor):
    """Segunda firma PENDIENTE para el revisor (para tests de cascada)."""
    from apps.infraestructura.workflow_engine.firma_digital.models import FirmaDigital

    return FirmaDigital.objects.create(
        empresa_id=fd_empresa.id,
        content_type=content_type_documento,
        object_id=str(documento_borrador.id),
        usuario=user_revisor,
        cargo=cargo_revisor,
        rol_firma="REVISO",
        firma_imagen="",
        documento_hash="pending",
        firma_hash="pending",
        ip_address="127.0.0.1",
        user_agent="pytest",
        estado="PENDIENTE",
        orden=2,
        created_by=user_revisor,
    )


# =============================================================================
# CONFIGURACION DE REVISION (para Commits 4 y 7)
# =============================================================================


@pytest.fixture
def configuracion_revision(db, fd_empresa, cargo_revisor, cargo_aprobador, configuracion_flujo):
    """ConfiguracionRevision con responsables y flujo asociado."""
    from apps.infraestructura.workflow_engine.firma_digital.models import ConfiguracionRevision

    return ConfiguracionRevision.objects.create(
        empresa_id=fd_empresa.id,
        nombre="Revisión Anual Políticas",
        frecuencia="ANUAL",
        dias_alerta_1=30,
        dias_alerta_2=15,
        dias_alerta_3=7,
        responsable_revision=cargo_revisor,
        responsable_escalamiento=cargo_aprobador,
        flujo_firma_renovacion=configuracion_flujo,
        requiere_revision_contenido=True,
        created_by=None,
    )
