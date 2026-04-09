"""
Fixtures para tests de logs_sistema.

Las fixtures base (user, admin_user, empresa, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest
from django.contrib.contenttypes.models import ContentType

from apps.audit_system.logs_sistema.models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)


@pytest.fixture
def configuracion_auditoria(empresa, user):
    """ConfiguracionAuditoria de prueba para SST."""
    return ConfiguracionAuditoria.objects.create(
        empresa=empresa,
        modulo='hseq_management',
        modelo='AccionCorrectiva',
        auditar_creacion=True,
        auditar_modificacion=True,
        auditar_eliminacion=True,
        auditar_consulta=False,
        campos_sensibles=['password', 'token'],
        dias_retencion=365,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def configuracion_auditoria_consultas(empresa, user):
    """ConfiguracionAuditoria con auditoria de consultas activa."""
    return ConfiguracionAuditoria.objects.create(
        empresa=empresa,
        modulo='motor_cumplimiento',
        modelo='RequisitoLegal',
        auditar_creacion=True,
        auditar_modificacion=True,
        auditar_eliminacion=True,
        auditar_consulta=True,
        campos_sensibles=[],
        dias_retencion=180,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def log_acceso(user):
    """LogAcceso exitoso de login."""
    return LogAcceso.objects.create(
        usuario=user,
        tipo_evento='login',
        ip_address='192.168.1.100',
        user_agent='Mozilla/5.0',
        ubicacion='Bogota, Colombia',
        dispositivo='desktop',
        navegador='Chrome',
        fue_exitoso=True
    )


@pytest.fixture
def log_acceso_fallido():
    """LogAcceso fallido de login."""
    return LogAcceso.objects.create(
        usuario=None,
        tipo_evento='login_fallido',
        ip_address='192.168.1.200',
        user_agent='Mozilla/5.0',
        fue_exitoso=False,
        mensaje_error='Credenciales invalidas'
    )


@pytest.fixture
def log_cambio(user):
    """LogCambio de modificacion."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    content_type = ContentType.objects.get_for_model(EmpresaConfig)

    return LogCambio.objects.create(
        usuario=user,
        content_type=content_type,
        object_id='1',
        object_repr='StrateKaz',
        accion='modificar',
        cambios={
            'telefono': {
                'old': '3001234567',
                'new': '3009876543'
            }
        },
        ip_address='192.168.1.100'
    )


@pytest.fixture
def log_cambio_creacion(user):
    """LogCambio de creacion."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    content_type = ContentType.objects.get_for_model(EmpresaConfig)

    return LogCambio.objects.create(
        usuario=user,
        content_type=content_type,
        object_id='2',
        object_repr='Nueva Empresa',
        accion='crear',
        cambios={
            'nombre': {
                'old': None,
                'new': 'Nueva Empresa'
            }
        },
        ip_address='192.168.1.100'
    )


@pytest.fixture
def log_consulta(user):
    """LogConsulta de exportacion."""
    return LogConsulta.objects.create(
        usuario=user,
        modulo='hseq_management',
        endpoint='/api/hseq/accidentes/',
        parametros={'fecha_desde': '2024-01-01', 'fecha_hasta': '2024-12-31'},
        registros_accedidos=150,
        fue_exportacion=True,
        formato_exportacion='excel',
        ip_address='192.168.1.100'
    )


@pytest.fixture
def log_consulta_simple(user):
    """LogConsulta simple sin exportacion."""
    return LogConsulta.objects.create(
        usuario=user,
        modulo='motor_cumplimiento',
        endpoint='/api/cumplimiento/requisitos/',
        parametros={'estado': 'vigente'},
        registros_accedidos=25,
        fue_exportacion=False,
        ip_address='192.168.1.100'
    )
