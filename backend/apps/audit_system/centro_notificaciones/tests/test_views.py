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

    def test_listar_tipos(self, admin_client, tipo_notificacion):
        """Test: Listar tipos de notificacion"""
        response = admin_client.get(_tipos_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, admin_client, empresa):
        """Test: Crear tipo de notificacion"""
        data = {
            'empresa': empresa.id,
            'codigo': 'NUEVO_TIPO',
            'nombre': 'Nuevo Tipo',
            'descripcion': 'Desc',
            'categoria': 'sistema',
            'plantilla_titulo': 'Titulo',
            'plantilla_mensaje': 'Mensaje',
            'is_active': True
        }
        response = admin_client.post(_tipos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_categoria(self, admin_client, tipo_notificacion, tipo_notificacion_alerta):
        """Test: Filtrar por categoria"""
        response = admin_client.get(_tipos_list() + '?categoria=tarea')
        assert response.status_code == status.HTTP_200_OK
        for tipo in response.data['results']:
            assert tipo['categoria'] == 'tarea'

    def test_filtrar_activos(self, admin_client, tipo_notificacion):
        """Test: Filtrar tipos activos"""
        response = admin_client.get(_tipos_list() + '?is_active=true')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestNotificacionViewSet:
    """Tests para NotificacionViewSet."""

    def test_listar_notificaciones(self, admin_client, notificacion):
        """Test: Listar notificaciones"""
        response = admin_client.get(_notif_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_notificacion(self, admin_client, tipo_notificacion, user):
        """Test: Crear notificacion"""
        data = {
            'tipo': tipo_notificacion.id,
            'usuario': user.id,
            'titulo': 'Nueva notif',
            'mensaje': 'Mensaje',
            'prioridad': 'normal'
        }
        response = admin_client.post(_notif_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_marcar_leida(self, admin_client, notificacion):
        """Test: Custom action marcar_leida"""
        assert notificacion.esta_leida is False
        url = _notif_detail(notificacion.id) + 'marcar-leida/'
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        notificacion.refresh_from_db()
        assert notificacion.esta_leida is True

    def test_marcar_todas_leidas(self, admin_client, notificacion, user):
        """Test: Custom action marcar_todas_leidas"""
        url = reverse('audit_system:centro_notificaciones:notificaciones-marcar-todas-leidas')
        data = {'usuario_id': user.id}
        response = admin_client.post(url, data=data)
        assert response.status_code == status.HTTP_200_OK

    def test_no_leidas(self, admin_client, tipo_notificacion, admin_user):
        """Test: Custom action no_leidas"""
        from apps.audit_system.centro_notificaciones.models import Notificacion
        Notificacion.objects.create(
            tipo=tipo_notificacion, usuario=admin_user,
            titulo='Notif admin', mensaje='Msg',
            prioridad='normal', esta_leida=False
        )
        url = reverse('audit_system:centro_notificaciones:notificaciones-no-leidas')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_filtrar_por_usuario(self, admin_client, notificacion, user):
        """Test: Filtrar por usuario"""
        response = admin_client.get(_notif_list() + f'?usuario={user.id}')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_leidas(self, admin_client, notificacion_leida):
        """Test: Filtrar leidas"""
        response = admin_client.get(_notif_list() + '?esta_leida=true')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_prioridad(self, admin_client, notificacion):
        """Test: Filtrar por prioridad"""
        response = admin_client.get(_notif_list() + '?prioridad=alta')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPreferenciaNotificacionViewSet:
    """Tests para PreferenciaNotificacionViewSet."""

    def test_listar_preferencias(self, admin_client, user):
        """Test: Listar preferencias"""
        response = admin_client.get(_prefs_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_preferencia(self, admin_client, empresa, user, tipo_notificacion):
        """Test: Crear preferencia"""
        data = {
            'empresa': empresa.id,
            'usuario': user.id,
            'tipo_notificacion': tipo_notificacion.id,
            'recibir_app': True,
            'recibir_email': False,
            'recibir_push': True
        }
        response = admin_client.post(_prefs_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestNotificacionMasivaViewSet:
    """Tests para NotificacionMasivaViewSet."""

    def test_listar_masivas(self, admin_client, notificacion_masiva):
        """Test: Listar notificaciones masivas"""
        response = admin_client.get(_masivas_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_masiva(self, admin_client, tipo_notificacion):
        """Test: Crear notificacion masiva"""
        data = {
            'tipo': tipo_notificacion.id,
            'titulo': 'Titulo masivo',
            'mensaje': 'Mensaje masivo',
            'destinatarios_tipo': 'todos'
        }
        response = admin_client.post(_masivas_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED
