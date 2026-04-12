"""
Tests para views de centro_notificaciones

Coverage:
- TipoNotificacionViewSet: CRUD, filtros
- NotificacionViewSet: CRUD, marcar_leida, marcar_todas_leidas, no_leidas
- PreferenciaNotificacionViewSet: CRUD
- NotificacionMasivaViewSet: CRUD
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ---- URL helpers (reverse-based) -------------------------------------------

def _tipos_list():
    return reverse('audit_system:centro_notificaciones:tipos-list')


def _notif_list():
    return reverse('audit_system:centro_notificaciones:notificaciones-list')


def _notif_detail(pk):
    return reverse('audit_system:centro_notificaciones:notificaciones-detail', args=[pk])


def _prefs_list():
    return reverse('audit_system:centro_notificaciones:preferencias-list')


def _masivas_list():
    return reverse('audit_system:centro_notificaciones:masivas-list')


@pytest.mark.django_db
class TestTipoNotificacionViewSet:
    """Tests para TipoNotificacionViewSet."""

    def test_listar_tipos(self, authenticated_client, tipo_notificacion):
        """Test: Listar tipos de notificacion"""
        response = authenticated_client.get(_tipos_list())
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
        response = authenticated_client.post(_tipos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_categoria(self, authenticated_client, tipo_notificacion, tipo_notificacion_alerta):
        """Test: Filtrar por categoria"""
        response = authenticated_client.get(_tipos_list() + '?categoria=tarea')
        assert response.status_code == status.HTTP_200_OK
        for tipo in response.data['results']:
            assert tipo['categoria'] == 'tarea'

    def test_filtrar_activos(self, authenticated_client, tipo_notificacion):
        """Test: Filtrar tipos activos"""
        response = authenticated_client.get(_tipos_list() + '?is_active=true')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestNotificacionViewSet:
    """Tests para NotificacionViewSet."""

    def test_listar_notificaciones(self, authenticated_client, notificacion):
        """Test: Listar notificaciones"""
        response = authenticated_client.get(_notif_list())
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
        response = authenticated_client.post(_notif_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_marcar_leida(self, authenticated_client, notificacion):
        """Test: Custom action marcar_leida"""
        assert notificacion.esta_leida is False
        url = _notif_detail(notificacion.id) + 'marcar-leida/'
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        notificacion.refresh_from_db()
        assert notificacion.esta_leida is True

    def test_marcar_todas_leidas(self, authenticated_client, notificacion, user):
        """Test: Custom action marcar_todas_leidas"""
        url = reverse('audit_system:centro_notificaciones:notificaciones-marcar-todas-leidas')
        data = {'usuario_id': user.id}
        response = authenticated_client.post(url, data=data)
        assert response.status_code == status.HTTP_200_OK

    def test_no_leidas(self, authenticated_client, notificacion, user):
        """Test: Custom action no_leidas"""
        url = reverse('audit_system:centro_notificaciones:notificaciones-no-leidas')
        response = authenticated_client.get(url + f'?usuario_id={user.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_filtrar_por_usuario(self, authenticated_client, notificacion, user):
        """Test: Filtrar por usuario"""
        response = authenticated_client.get(_notif_list() + f'?usuario={user.id}')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_leidas(self, authenticated_client, notificacion_leida):
        """Test: Filtrar leidas"""
        response = authenticated_client.get(_notif_list() + '?esta_leida=true')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_prioridad(self, authenticated_client, notificacion):
        """Test: Filtrar por prioridad"""
        response = authenticated_client.get(_notif_list() + '?prioridad=alta')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPreferenciaNotificacionViewSet:
    """Tests para PreferenciaNotificacionViewSet."""

    def test_listar_preferencias(self, authenticated_client, user):
        """Test: Listar preferencias"""
        response = authenticated_client.get(_prefs_list())
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
        response = authenticated_client.post(_prefs_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestNotificacionMasivaViewSet:
    """Tests para NotificacionMasivaViewSet."""

    def test_listar_masivas(self, authenticated_client, notificacion_masiva):
        """Test: Listar notificaciones masivas"""
        response = authenticated_client.get(_masivas_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_masiva(self, authenticated_client, tipo_notificacion):
        """Test: Crear notificacion masiva"""
        data = {
            'tipo': tipo_notificacion.id,
            'titulo': 'Titulo masivo',
            'mensaje': 'Mensaje masivo',
            'destinatarios_tipo': 'todos'
        }
        response = authenticated_client.post(_masivas_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED
