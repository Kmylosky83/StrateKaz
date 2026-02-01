"""
Tests para views de centro_notificaciones

Coverage:
- TipoNotificacionViewSet: CRUD, filtros
- NotificacionViewSet: CRUD, marcar_leida, marcar_todas_leidas, no_leidas
- PreferenciaNotificacionViewSet: CRUD
- NotificacionMasivaViewSet: CRUD
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestTipoNotificacionViewSet:
    """Tests para TipoNotificacionViewSet."""

    def test_listar_tipos(self, authenticated_client, tipo_notificacion):
        """Test: Listar tipos de notificacion"""
        response = authenticated_client.get('/api/audit/notificaciones/tipos-notificacion/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, authenticated_client, empresa):
        """Test: Crear tipo de notificacion"""
        data = {
            'empresa_id': empresa.id,
            'codigo': 'NUEVO_TIPO',
            'nombre': 'Nuevo Tipo',
            'descripcion': 'Desc',
            'categoria': 'sistema',
            'plantilla_titulo': 'Titulo',
            'plantilla_mensaje': 'Mensaje',
            'is_active': True
        }
        response = authenticated_client.post('/api/audit/notificaciones/tipos-notificacion/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_categoria(self, authenticated_client, tipo_notificacion, tipo_notificacion_alerta):
        """Test: Filtrar por categoria"""
        response = authenticated_client.get('/api/audit/notificaciones/tipos-notificacion/?categoria=tarea')
        assert response.status_code == status.HTTP_200_OK
        for tipo in response.data['results']:
            assert tipo['categoria'] == 'tarea'

    def test_filtrar_activos(self, authenticated_client, tipo_notificacion):
        """Test: Filtrar tipos activos"""
        response = authenticated_client.get('/api/audit/notificaciones/tipos-notificacion/?is_active=true')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestNotificacionViewSet:
    """Tests para NotificacionViewSet."""

    def test_listar_notificaciones(self, authenticated_client, notificacion):
        """Test: Listar notificaciones"""
        response = authenticated_client.get('/api/audit/notificaciones/notificaciones/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_notificacion(self, authenticated_client, tipo_notificacion, user):
        """Test: Crear notificacion"""
        data = {
            'tipo': tipo_notificacion.id,
            'usuario': user.id,
            'titulo': 'Nueva notif',
            'mensaje': 'Mensaje',
            'prioridad': 'normal'
        }
        response = authenticated_client.post('/api/audit/notificaciones/notificaciones/', data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_marcar_leida(self, authenticated_client, notificacion):
        """Test: Custom action marcar_leida"""
        assert notificacion.esta_leida is False
        response = authenticated_client.post(f'/api/audit/notificaciones/notificaciones/{notificacion.id}/marcar_leida/')
        assert response.status_code == status.HTTP_200_OK
        notificacion.refresh_from_db()
        assert notificacion.esta_leida is True

    def test_marcar_todas_leidas(self, authenticated_client, notificacion, user):
        """Test: Custom action marcar_todas_leidas"""
        data = {'usuario_id': user.id}
        response = authenticated_client.post('/api/audit/notificaciones/notificaciones/marcar_todas_leidas/', data=data)
        assert response.status_code == status.HTTP_200_OK

    def test_no_leidas(self, authenticated_client, notificacion, user):
        """Test: Custom action no_leidas"""
        response = authenticated_client.get(f'/api/audit/notificaciones/notificaciones/no_leidas/?usuario_id={user.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_filtrar_por_usuario(self, authenticated_client, notificacion, user):
        """Test: Filtrar por usuario"""
        response = authenticated_client.get(f'/api/audit/notificaciones/notificaciones/?usuario={user.id}')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_leidas(self, authenticated_client, notificacion_leida):
        """Test: Filtrar leidas"""
        response = authenticated_client.get('/api/audit/notificaciones/notificaciones/?esta_leida=true')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_prioridad(self, authenticated_client, notificacion):
        """Test: Filtrar por prioridad"""
        response = authenticated_client.get('/api/audit/notificaciones/notificaciones/?prioridad=alta')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPreferenciaNotificacionViewSet:
    """Tests para PreferenciaNotificacionViewSet."""

    def test_listar_preferencias(self, authenticated_client, user):
        """Test: Listar preferencias"""
        response = authenticated_client.get('/api/audit/notificaciones/preferencias-notificacion/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_preferencia(self, authenticated_client, empresa, user, tipo_notificacion):
        """Test: Crear preferencia"""
        data = {
            'empresa_id': empresa.id,
            'usuario': user.id,
            'tipo_notificacion': tipo_notificacion.id,
            'recibir_app': True,
            'recibir_email': False,
            'recibir_push': True
        }
        response = authenticated_client.post('/api/audit/notificaciones/preferencias-notificacion/', data=data)
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestNotificacionMasivaViewSet:
    """Tests para NotificacionMasivaViewSet."""

    def test_listar_masivas(self, authenticated_client, notificacion_masiva):
        """Test: Listar notificaciones masivas"""
        response = authenticated_client.get('/api/audit/notificaciones/notificaciones-masivas/')
        assert response.status_code == status.HTTP_200_OK

    def test_crear_masiva(self, authenticated_client, tipo_notificacion):
        """Test: Crear notificacion masiva"""
        data = {
            'tipo': tipo_notificacion.id,
            'titulo': 'Titulo masivo',
            'mensaje': 'Mensaje masivo',
            'destinatarios_tipo': 'todos'
        }
        response = authenticated_client.post('/api/audit/notificaciones/notificaciones-masivas/', data=data)
        assert response.status_code == status.HTTP_201_CREATED
