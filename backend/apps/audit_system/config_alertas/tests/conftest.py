"""
Fixtures para tests de config_alertas.

Las fixtures base (user, admin_user, empresa, cargo, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest
from datetime import timedelta

from apps.audit_system.config_alertas.models import (
    TipoAlerta,
    ConfiguracionAlerta,
    AlertaGenerada,
    EscalamientoAlerta
)


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
