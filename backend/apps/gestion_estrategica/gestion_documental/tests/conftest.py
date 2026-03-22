"""
Fixtures para tests de gestion_documental

Fixtures disponibles:
- user: Usuario basico de prueba
- admin_user: Usuario administrador
- empresa: EmpresaConfig de prueba
- api_client: Cliente API sin autenticar
- authenticated_client: Cliente API autenticado
- tipo_documento: TipoDocumento de prueba
- plantilla_documento: PlantillaDocumento de prueba
- documento: Documento de prueba
- version_documento: VersionDocumento de prueba
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_documental',
        email='documental@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin_documental',
        email='admin_documental@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    return EmpresaConfig.objects.create(
        nombre='Empresa Test Documental',
        nit='900111222-3',
        razon_social='Empresa Test Documental S.A.S.',
        nombre_comercial='ETD',
        email='info@etd.com',
        telefono='3001234567',
        direccion='Calle 100 # 10-20',
        ciudad='Bogota',
        departamento='Cundinamarca',
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
def tipo_documento(empresa, user):
    """TipoDocumento de prueba."""
    from apps.gestion_estrategica.gestion_documental.models import TipoDocumento
    return TipoDocumento.objects.create(
        codigo='PR',
        nombre='Procedimiento',
        descripcion='Procedimiento estandar',
        nivel_documento='OPERATIVO',
        prefijo_codigo='PR-',
        requiere_aprobacion=True,
        requiere_firma=True,
        tiempo_retencion_anos=5,
        campos_obligatorios=['titulo', 'contenido'],
        color_identificacion='#3498db',
        is_active=True,
        orden=1,
        empresa_id=empresa.pk,
        created_by=user
    )


@pytest.fixture
def tipo_documento_manual(empresa, user):
    """TipoDocumento tipo Manual."""
    from apps.gestion_estrategica.gestion_documental.models import TipoDocumento
    return TipoDocumento.objects.create(
        codigo='MA',
        nombre='Manual',
        descripcion='Manual del sistema',
        nivel_documento='ESTRATEGICO',
        prefijo_codigo='MA-',
        requiere_aprobacion=True,
        requiere_firma=True,
        tiempo_retencion_anos=10,
        campos_obligatorios=[],
        color_identificacion='#e74c3c',
        is_active=True,
        orden=2,
        empresa_id=empresa.pk,
        created_by=user
    )


@pytest.fixture
def plantilla_documento(empresa, tipo_documento, user):
    """PlantillaDocumento de prueba."""
    from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento
    return PlantillaDocumento.objects.create(
        codigo='PLT-PR-001',
        nombre='Plantilla Procedimiento Base',
        descripcion='Plantilla base para procedimientos',
        tipo_documento=tipo_documento,
        tipo_plantilla='HTML',
        contenido_plantilla='<h1>{{titulo}}</h1><p>{{contenido}}</p>',
        variables_disponibles=['titulo', 'contenido', 'fecha'],
        version='1.0',
        estado='ACTIVA',
        es_por_defecto=True,
        empresa_id=empresa.pk,
        created_by=user
    )


@pytest.fixture
def documento(empresa, tipo_documento, plantilla_documento, user):
    """Documento de prueba."""
    from apps.gestion_estrategica.gestion_documental.models import Documento
    return Documento.objects.create(
        codigo='PR-001',
        titulo='Procedimiento de Control de Documentos',
        tipo_documento=tipo_documento,
        plantilla=plantilla_documento,
        contenido='<h1>Control de Documentos</h1><p>Este procedimiento establece...</p>',
        version_actual='1.0',
        numero_revision=0,
        estado='BORRADOR',
        clasificacion='INTERNO',
        elaborado_por=user,
        empresa_id=empresa.pk
    )


@pytest.fixture
def version_documento(documento, user):
    """VersionDocumento de prueba."""
    from apps.gestion_estrategica.gestion_documental.models import VersionDocumento
    return VersionDocumento.objects.create(
        documento=documento,
        numero_version='1.0',
        tipo_cambio='CREACION',
        contenido_snapshot=documento.contenido,
        descripcion_cambios='Creacion inicial del documento',
        creado_por=user
    )
