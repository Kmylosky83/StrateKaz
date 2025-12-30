"""
Fixtures para tests de tareas_recordatorios

Fixtures disponibles:
- tarea: Tarea pendiente con alta prioridad
- recordatorio: Recordatorio una vez
- evento_calendario: Evento de reunion
- comentario_tarea: Comentario en tarea
"""
import pytest
from datetime import datetime, timedelta, time
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.audit_system.tareas_recordatorios.models import (
    Tarea, Recordatorio, EventoCalendario, ComentarioTarea
)

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser', email='test@example.com',
        password='testpass123', first_name='Test',
        last_name='User', is_active=True
    )


@pytest.fixture
def other_user(db):
    """Segundo usuario de prueba."""
    return User.objects.create_user(
        username='otheruser', email='other@example.com',
        password='testpass123', first_name='Other',
        last_name='User', is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin', email='admin@example.com',
        password='adminpass123', first_name='Admin', last_name='User'
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
def tarea(user, other_user):
    """Tarea pendiente de alta prioridad."""
    return Tarea.objects.create(
        titulo='Revisar documentos SST',
        descripcion='Revisar y aprobar documentos del sistema SST',
        tipo='manual', prioridad='alta', estado='pendiente',
        asignado_a=user, creado_por=other_user,
        fecha_limite=timezone.now() + timedelta(days=7),
        url_relacionada='/hseq/documentos/123',
        porcentaje_avance=0
    )


@pytest.fixture
def tarea_completada(user, other_user):
    """Tarea completada."""
    return Tarea.objects.create(
        titulo='Tarea completada', descripcion='Esta tarea ya fue completada',
        tipo='manual', prioridad='normal', estado='completada',
        asignado_a=user, creado_por=other_user,
        fecha_limite=timezone.now() - timedelta(days=1),
        fecha_completada=timezone.now(), porcentaje_avance=100
    )


@pytest.fixture
def recordatorio(user, tarea):
    """Recordatorio una vez."""
    return Recordatorio.objects.create(
        tarea=tarea, titulo='Recordatorio de tarea',
        mensaje='No olvides completar la tarea', usuario=user,
        fecha_recordatorio=timezone.now() + timedelta(days=5),
        repetir='una_vez', esta_activo=True
    )


@pytest.fixture
def recordatorio_recurrente(user):
    """Recordatorio recurrente diario."""
    return Recordatorio.objects.create(
        titulo='Recordatorio diario',
        mensaje='Revisar pendientes del dia', usuario=user,
        fecha_recordatorio=timezone.now() + timedelta(hours=1),
        repetir='diario', hora_repeticion=time(9, 0),
        esta_activo=True
    )


@pytest.fixture
def evento_calendario(user, other_user):
    """Evento de calendario - reunion."""
    evento = EventoCalendario.objects.create(
        titulo='Reunion de comite SST',
        descripcion='Reunion mensual del comite',
        tipo='reunion',
        fecha_inicio=timezone.now() + timedelta(days=3),
        fecha_fin=timezone.now() + timedelta(days=3, hours=2),
        todo_el_dia=False, ubicacion='Sala de juntas',
        creado_por=user, color='#3b82f6',
        recordar_antes=30
    )
    evento.participantes.add(user, other_user)
    return evento


@pytest.fixture
def comentario_tarea(tarea, user):
    """Comentario en tarea."""
    return ComentarioTarea.objects.create(
        tarea=tarea, usuario=user,
        mensaje='Este es un comentario de prueba'
    )
