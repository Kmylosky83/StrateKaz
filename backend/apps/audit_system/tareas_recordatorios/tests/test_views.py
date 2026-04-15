"""
Tests para views de tareas_recordatorios

Coverage: TareaViewSet (completar, cancelar, reasignar, mis_tareas, vencidas),
          RecordatorioViewSet (activar, desactivar),
          EventoCalendarioViewSet (por_mes, mis_eventos),
          ComentarioTareaViewSet
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ---- URL helpers (reverse-based) -------------------------------------------

def _tareas_list():
    return reverse('audit_system:tareas_recordatorios:tareas-list')


def _tareas_detail(pk):
    return reverse('audit_system:tareas_recordatorios:tareas-detail', args=[pk])


def _recordatorios_list():
    return reverse('audit_system:tareas_recordatorios:recordatorios-list')


def _recordatorios_detail(pk):
    return reverse('audit_system:tareas_recordatorios:recordatorios-detail', args=[pk])


def _eventos_list():
    return reverse('audit_system:tareas_recordatorios:eventos-list')


def _comentarios_list():
    return reverse('audit_system:tareas_recordatorios:comentarios-list')


@pytest.mark.django_db
class TestTareaViewSet:
    """Tests para TareaViewSet."""

    def test_listar_tareas(self, admin_client, tarea):
        """Test: Listar tareas"""
        response = admin_client.get(_tareas_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_tarea(self, admin_client, user):
        """Test: Crear tarea"""
        from django.utils import timezone
        data = {
            'titulo': 'Nueva tarea', 'descripcion': 'Desc',
            'tipo': 'manual', 'prioridad': 'normal',
            'estado': 'pendiente', 'asignado_a': user.id,
            'fecha_limite': (timezone.now() + timezone.timedelta(days=5)).isoformat()
        }
        response = admin_client.post(_tareas_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_completar_tarea(self, admin_client, tarea):
        """Test: Custom action completar"""
        assert tarea.estado == 'pendiente'
        url = reverse('audit_system:tareas_recordatorios:tareas-completar', args=[tarea.id])
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.estado == 'completada'

    def test_cancelar_tarea(self, admin_client, tarea):
        """Test: Custom action cancelar"""
        url = reverse('audit_system:tareas_recordatorios:tareas-cancelar', args=[tarea.id])
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.estado == 'cancelada'

    def test_reasignar_tarea(self, admin_client, tarea, other_user):
        """Test: Custom action reasignar"""
        url = reverse('audit_system:tareas_recordatorios:tareas-reasignar', args=[tarea.id])
        data = {'nuevo_usuario_id': other_user.id}
        response = admin_client.post(url, data=data)
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.asignado_a == other_user

    def test_mis_tareas(self, admin_client, tarea):
        """Test: Custom action mis_tareas"""
        url = reverse('audit_system:tareas_recordatorios:tareas-mis-tareas')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_vencidas(self, admin_client):
        """Test: Custom action vencidas"""
        url = reverse('audit_system:tareas_recordatorios:tareas-vencidas')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_estado(self, admin_client, tarea):
        """Test: Filtrar por estado"""
        response = admin_client.get(_tareas_list() + '?estado=pendiente')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_prioridad(self, admin_client, tarea):
        """Test: Filtrar por prioridad"""
        response = admin_client.get(_tareas_list() + '?prioridad=alta')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_tipo(self, admin_client, tarea):
        """Test: Filtrar por tipo"""
        response = admin_client.get(_tareas_list() + '?tipo=manual')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestRecordatorioViewSet:
    """Tests para RecordatorioViewSet."""

    def test_listar_recordatorios(self, admin_client, recordatorio):
        """Test: Listar recordatorios"""
        response = admin_client.get(_recordatorios_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_recordatorio(self, admin_client, user):
        """Test: Crear recordatorio"""
        from django.utils import timezone
        data = {
            'titulo': 'Nuevo recordatorio', 'mensaje': 'Mensaje',
            'usuario': user.id,
            'fecha_recordatorio': (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            'repetir': 'una_vez', 'esta_activo': True
        }
        response = admin_client.post(_recordatorios_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_activar_recordatorio(self, admin_client, recordatorio):
        """Test: Custom action activar"""
        recordatorio.esta_activo = False
        recordatorio.save()
        url = reverse('audit_system:tareas_recordatorios:recordatorios-activar', args=[recordatorio.id])
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        recordatorio.refresh_from_db()
        assert recordatorio.esta_activo is True

    def test_desactivar_recordatorio(self, admin_client, recordatorio):
        """Test: Custom action desactivar"""
        url = reverse('audit_system:tareas_recordatorios:recordatorios-desactivar', args=[recordatorio.id])
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        recordatorio.refresh_from_db()
        assert recordatorio.esta_activo is False

    def test_filtrar_activos(self, admin_client, recordatorio):
        """Test: Filtrar recordatorios activos"""
        response = admin_client.get(_recordatorios_list() + '?esta_activo=true')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_repetir(self, admin_client, recordatorio):
        """Test: Filtrar por tipo de repeticion"""
        response = admin_client.get(_recordatorios_list() + '?repetir=una_vez')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestEventoCalendarioViewSet:
    """Tests para EventoCalendarioViewSet."""

    def test_listar_eventos(self, admin_client, evento_calendario):
        """Test: Listar eventos"""
        response = admin_client.get(_eventos_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_evento(self, admin_client, admin_user):
        """Test: Crear evento"""
        from django.utils import timezone
        data = {
            'titulo': 'Nueva reunion', 'tipo': 'reunion',
            'fecha_inicio': (timezone.now() + timezone.timedelta(days=2)).isoformat(),
            'fecha_fin': (timezone.now() + timezone.timedelta(days=2, hours=1)).isoformat(),
            'todo_el_dia': False,
            'participantes': [admin_user.id]
        }
        response = admin_client.post(_eventos_list(), data=data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_por_mes(self, admin_client, evento_calendario):
        """Test: Custom action por_mes"""
        url = reverse('audit_system:tareas_recordatorios:eventos-por-mes')
        now = evento_calendario.fecha_inicio
        response = admin_client.get(
            url + f'?mes={now.month}&anio={now.year}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_mis_eventos(self, admin_client):
        """Test: Custom action mis_eventos"""
        url = reverse('audit_system:tareas_recordatorios:eventos-mis-eventos')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_tipo(self, admin_client, evento_calendario):
        """Test: Filtrar por tipo"""
        response = admin_client.get(_eventos_list() + '?tipo=reunion')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestComentarioTareaViewSet:
    """Tests para ComentarioTareaViewSet."""

    def test_listar_comentarios(self, admin_client, comentario_tarea):
        """Test: Listar comentarios"""
        response = admin_client.get(_comentarios_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_comentario(self, admin_client, tarea):
        """Test: Crear comentario"""
        data = {
            'tarea': tarea.id,
            'mensaje': 'Nuevo comentario de prueba'
        }
        response = admin_client.post(_comentarios_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_tarea(self, admin_client, comentario_tarea, tarea):
        """Test: Filtrar comentarios por tarea"""
        response = admin_client.get(_comentarios_list() + f'?tarea={tarea.id}')
        assert response.status_code == status.HTTP_200_OK
