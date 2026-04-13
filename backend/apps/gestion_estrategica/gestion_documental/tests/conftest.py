"""
Fixtures para tests de gestion_documental.

Las fixtures base (user, admin_user, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest


@pytest.fixture
def tipo_documento(user):
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
        tiempo_retencion_años=5,
        campos_obligatorios=['titulo', 'contenido'],
        color_identificacion='#3498db',
        orden=1,
        created_by=user
    )


@pytest.fixture
def tipo_documento_manual(user):
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
        tiempo_retencion_años=10,
        campos_obligatorios=[],
        color_identificacion='#e74c3c',
        orden=2,
        created_by=user
    )


@pytest.fixture
def plantilla_documento(tipo_documento, user):
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
        created_by=user
    )


@pytest.fixture
def documento(tipo_documento, plantilla_documento, user):
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
        creado_por=user,
    )
