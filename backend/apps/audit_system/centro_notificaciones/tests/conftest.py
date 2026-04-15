"""
Fixtures para tests de centro_notificaciones.

Las fixtures base (user, admin_user, empresa, cargo, area, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest
from datetime import time

from apps.audit_system.centro_notificaciones.models import (
    TipoNotificacion,
    Notificacion,
    PreferenciaNotificacion,
    NotificacionMasiva
)


@pytest.fixture
def other_user(db):
    """Segundo usuario de prueba."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(
        username='otheruser',
        email='other@example.com',
        password='testpass123',
        first_name='Other',
        last_name='User',
        document_number='8888888888',
        document_type='CC',
        is_active=True
    )


@pytest.fixture
def tipo_notificacion(empresa, user):
    """TipoNotificacion de prueba para tareas."""
    return TipoNotificacion.objects.create(
        empresa=empresa,
        codigo='TAREA_ASIGNADA',
        nombre='Tarea Asignada',
        descripcion='Notificacion cuando se asigna una tarea',
        icono='check',
        color='blue',
        categoria='tarea',
        plantilla_titulo='Nueva tarea: {titulo}',
        plantilla_mensaje='Te han asignado la tarea: {titulo}. Fecha limite: {fecha_limite}',
        url_template='/tareas/{id}',
        es_email=True,
        es_push=False,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def tipo_notificacion_alerta(empresa, user):
    """TipoNotificacion de alerta."""
    return TipoNotificacion.objects.create(
        empresa=empresa,
        codigo='ALERTA_VENCIMIENTO',
        nombre='Alerta de Vencimiento',
        descripcion='Notificacion de vencimiento proximo',
        icono='warning',
        color='red',
        categoria='alerta',
        plantilla_titulo='Alerta: {entidad} proximo a vencer',
        plantilla_mensaje='La {entidad} vence en {dias} dias',
        url_template='/alertas/{id}',
        es_email=True,
        es_push=True,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def notificacion(tipo_notificacion, user):
    """Notificacion de prueba no leida."""
    return Notificacion.objects.create(
        tipo=tipo_notificacion,
        usuario=user,
        titulo='Nueva tarea: Revisar documentos',
        mensaje='Te han asignado la tarea: Revisar documentos. Fecha limite: 2024-12-31',
        url='/tareas/1',
        datos_extra={'tarea_id': 1, 'prioridad': 'alta'},
        prioridad='alta',
        esta_leida=False,
        esta_archivada=False
    )


@pytest.fixture
def notificacion_leida(tipo_notificacion, user):
    """Notificacion leida."""
    from django.utils import timezone
    notif = Notificacion.objects.create(
        tipo=tipo_notificacion,
        usuario=user,
        titulo='Tarea completada',
        mensaje='La tarea ha sido completada',
        url='/tareas/2',
        prioridad='normal',
        esta_leida=True,
        fecha_lectura=timezone.now(),
        esta_archivada=False
    )
    return notif


@pytest.fixture
def preferencia_notificacion(user, tipo_notificacion, empresa):
    """PreferenciaNotificacion de prueba."""
    return PreferenciaNotificacion.objects.create(
        empresa=empresa,
        usuario=user,
        tipo_notificacion=tipo_notificacion,
        recibir_app=True,
        recibir_email=True,
        recibir_push=False,
        horario_inicio=time(8, 0),
        horario_fin=time(18, 0),
        is_active=True,
        created_by=user
    )


@pytest.fixture
def notificacion_masiva(tipo_notificacion, admin_user):
    """NotificacionMasiva de prueba."""
    return NotificacionMasiva.objects.create(
        tipo=tipo_notificacion,
        titulo='Mantenimiento del sistema',
        mensaje='El sistema estara en mantenimiento el sabado de 2am a 6am',
        destinatarios_tipo='todos',
        total_enviadas=0,
        total_leidas=0,
        enviada_por=admin_user
    )
