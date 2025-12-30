"""
Fixtures para tests de logs_sistema

Fixtures disponibles:
- configuracion_auditoria: ConfiguracionAuditoria para SST
- log_acceso: LogAcceso exitoso
- log_cambio: LogCambio de modificacion
- log_consulta: LogConsulta de exportacion
"""
import pytest
from datetime import date
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

from apps.audit_system.logs_sistema.models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    return EmpresaConfig.objects.create(
        nombre='Grasas y Huesos del Norte',
        nit='900123456-1',
        razon_social='Grasas y Huesos del Norte S.A.S.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
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
        object_repr='Grasas y Huesos del Norte',
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
