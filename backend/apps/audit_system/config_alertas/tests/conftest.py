"""
Fixtures para tests de config_alertas

Fixtures disponibles:
- tipo_alerta: TipoAlerta de vencimiento
- configuracion_alerta: ConfiguracionAlerta con dias anticipacion
- alerta_generada: AlertaGenerada pendiente
- escalamiento_alerta: EscalamientoAlerta de nivel 1
"""
import pytest
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

from apps.audit_system.config_alertas.models import (
    TipoAlerta,
    ConfiguracionAlerta,
    AlertaGenerada,
    EscalamientoAlerta
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
def cargo(db):
    """Cargo de prueba."""
    from apps.core.models import Cargo
    return Cargo.objects.create(
        codigo='RESP_HSE',
        nombre='Responsable HSE',
        descripcion='Responsable de HSE',
        is_active=True
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
def tipo_alerta(empresa, user):
    """TipoAlerta de vencimiento."""
    return TipoAlerta.objects.create(
        empresa=empresa,
        codigo='VENC_LICENCIA',
        nombre='Vencimiento de Licencia',
        descripcion='Alerta de vencimiento de licencias y permisos',
        categoria='vencimiento',
        severidad_default='warning',
        modulo_origen='motor_cumplimiento',
        modelo_origen='RequisitoLegal',
        is_active=True,
        created_by=user
    )


@pytest.fixture
def tipo_alerta_umbral(empresa, user):
    """TipoAlerta de umbral."""
    return TipoAlerta.objects.create(
        empresa=empresa,
        codigo='UMBRAL_STOCK',
        nombre='Stock Bajo',
        descripcion='Alerta cuando stock baja del umbral',
        categoria='umbral',
        severidad_default='danger',
        modulo_origen='supply_chain',
        modelo_origen='Producto',
        is_active=True,
        created_by=user
    )


@pytest.fixture
def configuracion_alerta(tipo_alerta, empresa, user):
    """ConfiguracionAlerta con dias anticipacion."""
    return ConfiguracionAlerta.objects.create(
        empresa=empresa,
        tipo_alerta=tipo_alerta,
        nombre='Alertar 30 dias antes de vencimiento',
        condicion={'campo': 'fecha_vencimiento', 'operador': '<=', 'dias': 30},
        dias_anticipacion=30,
        frecuencia_verificacion='diario',
        notificar_a='responsable',
        crear_tarea=True,
        enviar_email=True,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def alerta_generada(configuracion_alerta, user):
    """AlertaGenerada pendiente."""
    from django.utils import timezone
    return AlertaGenerada.objects.create(
        configuracion=configuracion_alerta,
        titulo='Licencia proximo a vencer',
        mensaje='La licencia ambiental vence en 25 dias',
        severidad='warning',
        fecha_vencimiento=timezone.now() + timedelta(days=25),
        esta_atendida=False
    )


@pytest.fixture
def alerta_atendida(configuracion_alerta, user):
    """AlertaGenerada ya atendida."""
    from django.utils import timezone
    return AlertaGenerada.objects.create(
        configuracion=configuracion_alerta,
        titulo='Alerta atendida',
        mensaje='Esta alerta ya fue atendida',
        severidad='info',
        esta_atendida=True,
        atendida_por=user,
        fecha_atencion=timezone.now(),
        accion_tomada='Se renovo la licencia'
    )


@pytest.fixture
def escalamiento_alerta(configuracion_alerta, empresa, user):
    """EscalamientoAlerta de nivel 1."""
    return EscalamientoAlerta.objects.create(
        empresa=empresa,
        configuracion_alerta=configuracion_alerta,
        nivel=1,
        horas_espera=24,
        notificar_a='jefe_inmediato',
        mensaje_escalamiento='La alerta no ha sido atendida en 24 horas',
        is_active=True,
        created_by=user
    )
