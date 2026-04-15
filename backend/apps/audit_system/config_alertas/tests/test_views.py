"""
Tests para views de config_alertas

Coverage: TipoAlertaViewSet, ConfiguracionAlertaViewSet,
          AlertaGeneradaViewSet (atender, pendientes, por_severidad),
          EscalamientoAlertaViewSet
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ---- URL helpers (reverse-based) -------------------------------------------

def _tipos_list():
    return reverse('audit_system:config_alertas:tipos-list')


def _cfg_list():
    return reverse('audit_system:config_alertas:configuraciones-list')


def _alertas_list():
    return reverse('audit_system:config_alertas:alertas-list')


def _alertas_detail(pk):
    return reverse('audit_system:config_alertas:alertas-detail', args=[pk])


def _escalamientos_list():
    return reverse('audit_system:config_alertas:escalamientos-list')


@pytest.mark.django_db
class TestTipoAlertaViewSet:
    """Tests para TipoAlertaViewSet."""

    def test_listar_tipos(self, admin_client, tipo_alerta):
        """Test: Listar tipos de alerta"""
        response = admin_client.get(_tipos_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, admin_client, empresa):
        """Test: Crear tipo de alerta"""
        data = {
            'empresa': empresa.id, 'codigo': 'NUEVO',
            'nombre': 'Nuevo Tipo', 'descripcion': 'Desc',
            'categoria': 'evento', 'modulo_origen': 'test',
            'is_active': True
        }
        response = admin_client.post(_tipos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_categoria(self, admin_client, tipo_alerta):
        """Test: Filtrar por categoria"""
        response = admin_client.get(_tipos_list() + '?categoria=vencimiento')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_modulo(self, admin_client, tipo_alerta):
        """Test: Filtrar por modulo origen"""
        response = admin_client.get(_tipos_list() + '?modulo_origen=motor_cumplimiento')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestConfiguracionAlertaViewSet:
    """Tests para ConfiguracionAlertaViewSet."""

    def test_listar_configuraciones(self, admin_client, configuracion_alerta):
        """Test: Listar configuraciones"""
        response = admin_client.get(_cfg_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_configuracion(self, admin_client, tipo_alerta, empresa):
        """Test: Crear configuracion"""
        data = {
            'empresa': empresa.id, 'tipo_alerta': tipo_alerta.id,
            'nombre': 'Nueva Config', 'condicion': {'test': True},
            'frecuencia_verificacion': 'diario',
            'notificar_a': 'responsable', 'is_active': True
        }
        response = admin_client.post(_cfg_list(), data=data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_tipo(self, admin_client, configuracion_alerta, tipo_alerta):
        """Test: Filtrar por tipo alerta"""
        response = admin_client.get(_cfg_list() + f'?tipo_alerta={tipo_alerta.id}')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAlertaGeneradaViewSet:
    """Tests para AlertaGeneradaViewSet."""

    def test_listar_alertas(self, admin_client, alerta_generada):
        """Test: Listar alertas generadas"""
        response = admin_client.get(_alertas_list())
        assert response.status_code == status.HTTP_200_OK

    def test_atender_alerta(self, admin_client, alerta_generada):
        """Test: Custom action atender"""
        data = {'accion_tomada': 'Se renovo licencia'}
        url = _alertas_detail(alerta_generada.id) + 'atender/'
        response = admin_client.post(url, data=data)
        assert response.status_code == status.HTTP_200_OK
        alerta_generada.refresh_from_db()
        assert alerta_generada.esta_atendida is True

    def test_pendientes(self, admin_client, alerta_generada):
        """Test: Custom action pendientes"""
        url = reverse('audit_system:config_alertas:alertas-pendientes')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_por_severidad(self, admin_client, alerta_generada):
        """Test: Custom action por_severidad"""
        url = reverse('audit_system:config_alertas:alertas-por-severidad')
        response = admin_client.get(url + '?severidad=warning')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_severidad(self, admin_client, alerta_generada):
        """Test: Filtrar por severidad"""
        response = admin_client.get(_alertas_list() + '?severidad=warning')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_atendidas(self, admin_client, alerta_atendida):
        """Test: Filtrar atendidas"""
        response = admin_client.get(_alertas_list() + '?esta_atendida=true')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestEscalamientoAlertaViewSet:
    """Tests para EscalamientoAlertaViewSet."""

    def test_listar_escalamientos(self, admin_client, escalamiento_alerta):
        """Test: Listar escalamientos"""
        response = admin_client.get(_escalamientos_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_escalamiento(self, admin_client, configuracion_alerta, empresa):
        """Test: Crear escalamiento"""
        data = {
            'empresa': empresa.id,
            'configuracion_alerta': configuracion_alerta.id,
            'nivel': 2, 'horas_espera': 48,
            'notificar_a': 'gerente_area',
            'mensaje_escalamiento': 'Msg'
        }
        response = admin_client.post(_escalamientos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED
