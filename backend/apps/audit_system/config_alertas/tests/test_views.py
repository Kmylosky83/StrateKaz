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

    def test_listar_tipos(self, authenticated_client, tipo_alerta):
        """Test: Listar tipos de alerta"""
        response = authenticated_client.get(_tipos_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_tipo(self, authenticated_client, empresa):
        """Test: Crear tipo de alerta"""
        data = {
            'empresa_id': empresa.id, 'codigo': 'NUEVO',
            'nombre': 'Nuevo Tipo', 'descripcion': 'Desc',
            'categoria': 'evento', 'modulo_origen': 'test',
            'is_active': True
        }
        response = authenticated_client.post(_tipos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_categoria(self, authenticated_client, tipo_alerta):
        """Test: Filtrar por categoria"""
        response = authenticated_client.get(_tipos_list() + '?categoria=vencimiento')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_modulo(self, authenticated_client, tipo_alerta):
        """Test: Filtrar por modulo origen"""
        response = authenticated_client.get(_tipos_list() + '?modulo_origen=motor_cumplimiento')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestConfiguracionAlertaViewSet:
    """Tests para ConfiguracionAlertaViewSet."""

    def test_listar_configuraciones(self, authenticated_client, configuracion_alerta):
        """Test: Listar configuraciones"""
        response = authenticated_client.get(_cfg_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_configuracion(self, authenticated_client, tipo_alerta, empresa):
        """Test: Crear configuracion"""
        data = {
            'empresa_id': empresa.id, 'tipo_alerta': tipo_alerta.id,
            'nombre': 'Nueva Config', 'condicion': {'test': True},
            'frecuencia_verificacion': 'diario',
            'notificar_a': 'responsable', 'is_active': True
        }
        response = authenticated_client.post(_cfg_list(), data=data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_tipo(self, authenticated_client, configuracion_alerta, tipo_alerta):
        """Test: Filtrar por tipo alerta"""
        response = authenticated_client.get(_cfg_list() + f'?tipo_alerta={tipo_alerta.id}')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAlertaGeneradaViewSet:
    """Tests para AlertaGeneradaViewSet."""

    def test_listar_alertas(self, authenticated_client, alerta_generada):
        """Test: Listar alertas generadas"""
        response = authenticated_client.get(_alertas_list())
        assert response.status_code == status.HTTP_200_OK

    def test_atender_alerta(self, authenticated_client, alerta_generada):
        """Test: Custom action atender"""
        data = {'accion_tomada': 'Se renovo licencia'}
        url = _alertas_detail(alerta_generada.id) + 'atender/'
        response = authenticated_client.post(url, data=data)
        assert response.status_code == status.HTTP_200_OK
        alerta_generada.refresh_from_db()
        assert alerta_generada.esta_atendida is True

    def test_pendientes(self, authenticated_client, alerta_generada):
        """Test: Custom action pendientes"""
        url = reverse('audit_system:config_alertas:alertas-pendientes')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_por_severidad(self, authenticated_client, alerta_generada):
        """Test: Custom action por_severidad"""
        url = reverse('audit_system:config_alertas:alertas-por-severidad')
        response = authenticated_client.get(url + '?severidad=warning')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_severidad(self, authenticated_client, alerta_generada):
        """Test: Filtrar por severidad"""
        response = authenticated_client.get(_alertas_list() + '?severidad=warning')
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_atendidas(self, authenticated_client, alerta_atendida):
        """Test: Filtrar atendidas"""
        response = authenticated_client.get(_alertas_list() + '?esta_atendida=true')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestEscalamientoAlertaViewSet:
    """Tests para EscalamientoAlertaViewSet."""

    def test_listar_escalamientos(self, authenticated_client, escalamiento_alerta):
        """Test: Listar escalamientos"""
        response = authenticated_client.get(_escalamientos_list())
        assert response.status_code == status.HTTP_200_OK

    def test_crear_escalamiento(self, authenticated_client, configuracion_alerta, empresa):
        """Test: Crear escalamiento"""
        data = {
            'empresa_id': empresa.id,
            'configuracion_alerta': configuracion_alerta.id,
            'nivel': 2, 'horas_espera': 48,
            'notificar_a': 'gerente_area',
            'mensaje_escalamiento': 'Msg'
        }
        response = authenticated_client.post(_escalamientos_list(), data=data)
        assert response.status_code == status.HTTP_201_CREATED
