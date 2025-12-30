"""
Tests para views de tareas_recordatorios

Coverage: TareaViewSet (completar, cancelar, reasignar, mis_tareas, vencidas),
          RecordatorioViewSet (activar, desactivar),
          EventoCalendarioViewSet (por_mes, mis_eventos),
          ComentarioTareaViewSet
"""
import pytest
from rest_framework import status
from datetime import datetime


@pytest.mark.django_db
class TestTareaViewSet:
    """Tests para TareaViewSet."""

    def test_listar_tareas(self, authenticated_client, tarea):
        """Test: Listar tareas"""
        response = authenticated_client.get('/api/audit/tareas/tareas/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_tarea(self, authenticated_client, user):
        """Test: Crear tarea"""
        from django.utils import timezone
        data = {
            'titulo': 'Nueva tarea', 'descripcion': 'Desc',
            'tipo': 'manual', 'prioridad': 'normal',
            'estado': 'pendiente', 'asignado_a': user.id,
            'fecha_limite': (timezone.now() + timezone.timedelta(days=5)).isoformat()
        }
        response = authenticated_client.post('/api/audit/tareas/tareas/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_completar_tarea(self, authenticated_client, tarea):
        """Test: Custom action completar"""
        assert tarea.estado == 'pendiente'
        response = authenticated_client.post(f'/api/audit/tareas/tareas/{tarea.id}/completar/')
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.estado == 'completada'

    def test_cancelar_tarea(self, authenticated_client, tarea):
        """Test: Custom action cancelar"""
        response = authenticated_client.post(f'/api/audit/tareas/tareas/{tarea.id}/cancelar/')
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.estado == 'cancelada'

    def test_reasignar_tarea(self, authenticated_client, tarea, other_user):
        """Test: Custom action reasignar"""
        data = {'nuevo_usuario_id': other_user.id}
        response = authenticated_client.post(f'/api/audit/tareas/tareas/{tarea.id}/reasignar/', data=data)
        assert response.status_code == status.HTTP_200_OK
        tarea.refresh_from_db()
        assert tarea.asignado_a == other_user

    def test_mis_tareas(self, authenticated_client, tarea):
        """Test: Custom action mis_tareas"""
        response = authenticated_client.get('/api/audit/tareas/tareas/mis_tareas/')
        assert response.status_code == status.HTTP_200_OK

    def test_vencidas(self, authenticated_client):
        """Test: Custom action vencidas"""
        response = authenticated_client.get('/api/audit/tareas/tareas/vencidas/')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_estado(self, authenticated_client, tarea):
        """Test: Filtrar por estado"""
        response = authenticated_client.get('/api/audit/tareas/tareas/?estado=pendiente')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_prioridad(self, authenticated_client, tarea):
        """Test: Filtrar por prioridad"""
        response = authenticated_client.get('/api/audit/tareas/tareas/?prioridad=alta')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_tipo(self, authenticated_client, tarea):
        """Test: Filtrar por tipo"""
        response = authenticated_client.get('/api/audit/tareas/tareas/?tipo=manual')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestRecordatorioViewSet:
    """Tests para RecordatorioViewSet."""

    def test_listar_recordatorios(self, authenticated_client, recordatorio):
        """Test: Listar recordatorios"""
        response = authenticated_client.get('/api/audit/tareas/recordatorios/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_recordatorio(self, authenticated_client, user):
        """Test: Crear recordatorio"""
        from django.utils import timezone
        data = {
            'titulo': 'Nuevo recordatorio', 'mensaje': 'Mensaje',
            'usuario': user.id,
            'fecha_recordatorio': (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            'repetir': 'una_vez', 'esta_activo': True
        }
        response = authenticated_client.post('/api/audit/tareas/recordatorios/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_activar_recordatorio(self, authenticated_client, recordatorio):
        """Test: Custom action activar"""
        recordatorio.esta_activo = False
        recordatorio.save()

        response = authenticated_client.post(f'/api/audit/tareas/recordatorios/{recordatorio.id}/activar/')
        assert response.status_code == status.HTTP_200_OK
        recordatorio.refresh_from_db()
        assert recordatorio.esta_activo is True

    def test_desactivar_recordatorio(self, authenticated_client, recordatorio):
        """Test: Custom action desactivar"""
        response = authenticated_client.post(f'/api/audit/tareas/recordatorios/{recordatorio.id}/desactivar/')
        assert response.status_code == status.HTTP_200_OK
        recordatorio.refresh_from_db()
        assert recordatorio.esta_activo is False

    def test_filtrar_activos(self, authenticated_client, recordatorio):
        """Test: Filtrar recordatorios activos"""
        response = authenticated_client.get('/api/audit/tareas/recordatorios/?esta_activo=true')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_repetir(self, authenticated_client, recordatorio):
        """Test: Filtrar por tipo de repeticion"""
        response = authenticated_client.get('/api/audit/tareas/recordatorios/?repetir=una_vez')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestEventoCalendarioViewSet:
    """Tests para EventoCalendarioViewSet."""

    def test_listar_eventos(self, authenticated_client, evento_calendario):
        """Test: Listar eventos"""
        response = authenticated_client.get('/api/audit/tareas/eventos-calendario/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_evento(self, authenticated_client, user):
        """Test: Crear evento"""
        from django.utils import timezone
        data = {
            'titulo': 'Nueva reunion', 'tipo': 'reunion',
            'fecha_inicio': (timezone.now() + timezone.timedelta(days=2)).isoformat(),
            'fecha_fin': (timezone.now() + timezone.timedelta(days=2, hours=1)).isoformat(),
            'todo_el_dia': False
        }
        response = authenticated_client.post('/api/audit/tareas/eventos-calendario/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_por_mes(self, authenticated_client, evento_calendario):
        """Test: Custom action por_mes"""
        now = evento_calendario.fecha_inicio
        response = authenticated_client.get(
            f'/api/audit/tareas/eventos-calendario/por_mes/?mes={now.month}&anio={now.year}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_mis_eventos(self, authenticated_client):
        """Test: Custom action mis_eventos"""
        response = authenticated_client.get('/api/audit/tareas/eventos-calendario/mis_eventos/')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_tipo(self, authenticated_client, evento_calendario):
        """Test: Filtrar por tipo"""
        response = authenticated_client.get('/api/audit/tareas/eventos-calendario/?tipo=reunion')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestComentarioTareaViewSet:
    """Tests para ComentarioTareaViewSet."""

    def test_listar_comentarios(self, authenticated_client, comentario_tarea):
        """Test: Listar comentarios"""
        response = authenticated_client.get('/api/audit/tareas/comentarios-tarea/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_comentario(self, authenticated_client, tarea):
        """Test: Crear comentario"""
        data = {
            'tarea': tarea.id,
            'mensaje': 'Nuevo comentario de prueba'
        }
        response = authenticated_client.post('/api/audit/tareas/comentarios-tarea/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_tarea(self, authenticated_client, comentario_tarea, tarea):
        """Test: Filtrar comentarios por tarea"""
        response = authenticated_client.get(f'/api/audit/tareas/comentarios-tarea/?tarea={tarea.id}')
        assert response.status_code == status.HTTP_200_OK
