"""
Tests para views de logs_sistema

Coverage:
- ConfiguracionAuditoriaViewSet: CRUD, filtros, busqueda
- LogAccesoViewSet: lectura, filtros, custom actions
- LogCambioViewSet: lectura, filtros, por_objeto, por_usuario
- LogConsultaViewSet: lectura, filtros
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ---- URL helpers (reverse-based, decoupled from routing) --------------------

def _cfg_list():
    return reverse('audit_system:logs_sistema:configuracion-list')


def _cfg_detail(pk):
    return reverse('audit_system:logs_sistema:configuracion-detail', args=[pk])


def _accesos_list():
    return reverse('audit_system:logs_sistema:accesos-list')


def _accesos_detail(pk):
    return reverse('audit_system:logs_sistema:accesos-detail', args=[pk])


def _cambios_list():
    return reverse('audit_system:logs_sistema:cambios-list')


def _cambios_detail(pk):
    return reverse('audit_system:logs_sistema:cambios-detail', args=[pk])


def _consultas_list():
    return reverse('audit_system:logs_sistema:consultas-list')


def _consultas_detail(pk):
    return reverse('audit_system:logs_sistema:consultas-detail', args=[pk])


@pytest.mark.django_db
class TestConfiguracionAuditoriaViewSet:
    """Tests para ConfiguracionAuditoriaViewSet."""

    def test_listar_configuraciones(self, admin_client, configuracion_auditoria):
        """
        Test: Listar configuraciones de auditoria

        Given: Configuraciones existentes
        When: GET /configuraciones-auditoria/
        Then: Debe retornar lista
        """
        response = admin_client.get(_cfg_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_configuracion(self, admin_client, empresa):
        """
        Test: Crear configuracion de auditoria

        Given: Datos validos de configuracion
        When: POST /configuraciones-auditoria/
        Then: Debe crearse exitosamente
        """
        data = {
            'empresa': empresa.id,
            'modulo': 'supply_chain',
            'modelo': 'Pedido',
            'auditar_creacion': True,
            'auditar_modificacion': True,
            'auditar_eliminacion': True,
            'auditar_consulta': False,
            'campos_sensibles': ['precio_costo'],
            'dias_retencion': 180,
            'is_active': True
        }
        response = admin_client.post(_cfg_list(), data=data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['modulo'] == 'supply_chain'
        assert response.data['modelo'] == 'Pedido'
        assert len(response.data['campos_sensibles']) == 1

    def test_actualizar_configuracion(self, admin_client, configuracion_auditoria):
        """
        Test: Actualizar configuracion existente

        Given: Una configuracion existente
        When: PUT /configuraciones-auditoria/{id}/
        Then: Debe actualizarse
        """
        data = {
            'empresa': configuracion_auditoria.empresa.id,
            'modulo': configuracion_auditoria.modulo,
            'modelo': configuracion_auditoria.modelo,
            'auditar_creacion': True,
            'auditar_modificacion': True,
            'auditar_eliminacion': True,
            'auditar_consulta': True,
            'campos_sensibles': ['password', 'token'],
            'dias_retencion': 365,
            'is_active': True
        }
        response = admin_client.put(
            _cfg_detail(configuracion_auditoria.id),
            data=data,
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['auditar_consulta'] is True

    def test_filtrar_por_modulo(self, admin_client, configuracion_auditoria, empresa, user):
        """
        Test: Filtrar configuraciones por modulo

        Given: Configuraciones de diferentes modulos
        When: GET con filtro modulo
        Then: Debe retornar solo del modulo especificado
        """
        from apps.audit_system.logs_sistema.models import ConfiguracionAuditoria
        ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='analytics',
            modelo='Indicador',
            created_by=user
        )
        response = admin_client.get(
            _cfg_list() + '?modulo=hseq_management'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['modulo'] == 'hseq_management'

    def test_buscar_configuracion(self, admin_client, configuracion_auditoria):
        """
        Test: Buscar configuracion por texto

        Given: Configuraciones existentes
        When: GET con parametro search
        Then: Debe retornar coincidencias
        """
        response = admin_client.get(
            _cfg_list() + '?search=AccionCorrectiva'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filtrar_activas(self, admin_client, configuracion_auditoria, empresa, user):
        """
        Test: Filtrar configuraciones activas

        Given: Configuraciones activas e inactivas
        When: GET con filtro is_active=True
        Then: Debe retornar solo activas
        """
        from apps.audit_system.logs_sistema.models import ConfiguracionAuditoria
        ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='analytics',
            modelo='Dashboard',
            is_active=False,
            created_by=user
        )
        response = admin_client.get(
            _cfg_list() + '?is_active=true'
        )
        assert response.status_code == status.HTTP_200_OK
        for config in response.data['results']:
            assert config['is_active'] is True

    def test_ordenar_por_modulo(self, admin_client, configuracion_auditoria):
        """
        Test: Ordenar configuraciones por modulo

        Given: Multiples configuraciones
        When: GET con ordering=modulo
        Then: Debe retornar ordenadas
        """
        response = admin_client.get(
            _cfg_list() + '?ordering=modulo'
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestLogAccesoViewSet:
    """Tests para LogAccesoViewSet (solo lectura)."""

    def test_listar_logs_acceso(self, admin_client, log_acceso):
        """
        Test: Listar logs de acceso

        Given: Logs existentes
        When: GET /logs-acceso/
        Then: Debe retornar lista
        """
        response = admin_client.get(_accesos_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_ver_detalle_log_acceso(self, admin_client, log_acceso):
        """
        Test: Ver detalle de log de acceso

        Given: Un log existente
        When: GET /logs-acceso/{id}/
        Then: Debe retornar detalle completo
        """
        response = admin_client.get(_accesos_detail(log_acceso.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tipo_evento'] == 'login'
        assert response.data['fue_exitoso'] is True

    def test_no_permite_crear_log_acceso(self, admin_client, user):
        """
        Test: No permitir creacion manual de logs

        Given: ViewSet de solo lectura
        When: POST /logs-acceso/
        Then: Debe rechazar la peticion
        """
        data = {
            'usuario': user.id,
            'tipo_evento': 'login',
            'ip_address': '192.168.1.100',
            'fue_exitoso': True
        }
        response = admin_client.post(_accesos_list(), data=data)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_filtrar_por_tipo_evento(self, admin_client, log_acceso, user):
        """
        Test: Filtrar logs por tipo de evento

        Given: Logs de diferentes tipos
        When: GET con filtro tipo_evento
        Then: Debe retornar solo del tipo especificado
        """
        from apps.audit_system.logs_sistema.models import LogAcceso
        LogAcceso.objects.create(
            usuario=user,
            tipo_evento='logout',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )
        response = admin_client.get(
            _accesos_list() + '?tipo_evento=login'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['tipo_evento'] == 'login'

    def test_filtrar_exitosos(self, admin_client, log_acceso, log_acceso_fallido):
        """
        Test: Filtrar logs exitosos

        Given: Logs exitosos y fallidos
        When: GET con filtro fue_exitoso=true
        Then: Debe retornar solo exitosos
        """
        response = admin_client.get(
            _accesos_list() + '?fue_exitoso=true'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['fue_exitoso'] is True

    def test_filtrar_fallidos(self, admin_client, log_acceso, log_acceso_fallido):
        """
        Test: Filtrar logs fallidos

        Given: Logs exitosos y fallidos
        When: GET con filtro fue_exitoso=false
        Then: Debe retornar solo fallidos
        """
        response = admin_client.get(
            _accesos_list() + '?fue_exitoso=false'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['fue_exitoso'] is False

    def test_buscar_por_ip(self, admin_client, log_acceso):
        """
        Test: Buscar logs por IP

        Given: Logs con diferentes IPs
        When: GET con search de IP
        Then: Debe retornar logs de esa IP
        """
        response = admin_client.get(
            _accesos_list() + '?search=192.168.1.100'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_custom_action_por_usuario(self, admin_client, log_acceso, user):
        """
        Test: Custom action por_usuario

        Given: Logs de un usuario
        When: GET /accesos/por-usuario/?usuario_id=X
        Then: Debe retornar logs del usuario
        """
        url = reverse('audit_system:logs_sistema:accesos-por-usuario')
        response = admin_client.get(
            url + f'?usuario_id={user.id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_ordenar_por_fecha(self, admin_client, log_acceso):
        """
        Test: Ordenar logs por fecha

        Given: Multiples logs
        When: GET con ordering=-created_at
        Then: Debe retornar ordenados
        """
        response = admin_client.get(
            _accesos_list() + '?ordering=-created_at'
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestLogCambioViewSet:
    """Tests para LogCambioViewSet (solo lectura)."""

    def test_listar_logs_cambio(self, admin_client, log_cambio):
        """
        Test: Listar logs de cambio

        Given: Logs existentes
        When: GET /logs-cambio/
        Then: Debe retornar lista
        """
        response = admin_client.get(_cambios_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_ver_detalle_log_cambio(self, admin_client, log_cambio):
        """
        Test: Ver detalle de log de cambio

        Given: Un log existente
        When: GET /logs-cambio/{id}/
        Then: Debe retornar detalle con cambios
        """
        response = admin_client.get(_cambios_detail(log_cambio.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['accion'] == 'modificar'
        assert 'cambios' in response.data
        assert 'telefono' in response.data['cambios']

    def test_filtrar_por_accion(self, admin_client, log_cambio, log_cambio_creacion):
        """
        Test: Filtrar logs por accion

        Given: Logs de diferentes acciones
        When: GET con filtro accion
        Then: Debe retornar solo de esa accion
        """
        response = admin_client.get(
            _cambios_list() + '?accion=crear'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['accion'] == 'crear'

    def test_buscar_por_object_repr(self, admin_client, log_cambio):
        """
        Test: Buscar logs por representacion de objeto

        Given: Logs con diferentes objetos
        When: GET con search
        Then: Debe retornar coincidencias
        """
        response = admin_client.get(
            _cambios_list() + '?search=StrateKaz'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_custom_action_por_objeto(self, admin_client, log_cambio):
        """
        Test: Custom action por_objeto

        Given: Logs de un objeto especifico
        When: GET /cambios/por-objeto/?content_type_id=X&object_id=Y
        Then: Debe retornar logs del objeto
        """
        url = reverse('audit_system:logs_sistema:cambios-por-objeto')
        response = admin_client.get(
            url + f'?content_type_id={log_cambio.content_type_id}&object_id={log_cambio.object_id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_custom_action_por_usuario(self, admin_client, log_cambio, user):
        """
        Test: Custom action por_usuario

        Given: Logs de un usuario
        When: GET /cambios/por-usuario/?usuario_id=X
        Then: Debe retornar logs del usuario
        """
        url = reverse('audit_system:logs_sistema:cambios-por-usuario')
        response = admin_client.get(
            url + f'?usuario_id={user.id}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_no_permite_modificar(self, admin_client, log_cambio):
        """
        Test: No permitir modificacion de logs

        Given: ViewSet de solo lectura
        When: PUT /logs-cambio/{id}/
        Then: Debe rechazar
        """
        data = {'accion': 'eliminar'}
        response = admin_client.put(
            _cambios_detail(log_cambio.id),
            data=data
        )
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_no_permite_eliminar(self, admin_client, log_cambio):
        """
        Test: No permitir eliminacion de logs

        Given: ViewSet de solo lectura
        When: DELETE /logs-cambio/{id}/
        Then: Debe rechazar
        """
        response = admin_client.delete(
            _cambios_detail(log_cambio.id)
        )
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.django_db
class TestLogConsultaViewSet:
    """Tests para LogConsultaViewSet (solo lectura)."""

    def test_listar_logs_consulta(self, admin_client, log_consulta):
        """
        Test: Listar logs de consulta

        Given: Logs existentes
        When: GET /logs-consulta/
        Then: Debe retornar lista
        """
        response = admin_client.get(_consultas_list())
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_ver_detalle_log_consulta(self, admin_client, log_consulta):
        """
        Test: Ver detalle de log de consulta

        Given: Un log existente
        When: GET /logs-consulta/{id}/
        Then: Debe retornar detalle con parametros
        """
        response = admin_client.get(_consultas_detail(log_consulta.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['modulo'] == 'hseq_management'
        assert response.data['fue_exportacion'] is True
        assert 'parametros' in response.data

    def test_filtrar_por_modulo(self, admin_client, log_consulta, log_consulta_simple):
        """
        Test: Filtrar logs por modulo

        Given: Logs de diferentes modulos
        When: GET con filtro modulo
        Then: Debe retornar solo del modulo
        """
        response = admin_client.get(
            _consultas_list() + '?modulo=hseq_management'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['modulo'] == 'hseq_management'

    def test_filtrar_exportaciones(self, admin_client, log_consulta, log_consulta_simple):
        """
        Test: Filtrar solo exportaciones

        Given: Logs con y sin exportacion
        When: GET con filtro fue_exportacion=true
        Then: Debe retornar solo exportaciones
        """
        response = admin_client.get(
            _consultas_list() + '?fue_exportacion=true'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['fue_exportacion'] is True

    def test_filtrar_consultas_normales(self, admin_client, log_consulta, log_consulta_simple):
        """
        Test: Filtrar consultas sin exportacion

        Given: Logs con y sin exportacion
        When: GET con filtro fue_exportacion=false
        Then: Debe retornar solo consultas normales
        """
        response = admin_client.get(
            _consultas_list() + '?fue_exportacion=false'
        )
        assert response.status_code == status.HTTP_200_OK
        for log in response.data['results']:
            assert log['fue_exportacion'] is False

    def test_buscar_por_endpoint(self, admin_client, log_consulta):
        """
        Test: Buscar logs por endpoint

        Given: Logs con diferentes endpoints
        When: GET con search
        Then: Debe retornar coincidencias
        """
        response = admin_client.get(
            _consultas_list() + '?search=accidentes'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_filtrar_por_usuario(self, admin_client, log_consulta, user):
        """
        Test: Filtrar logs por usuario

        Given: Logs de diferentes usuarios
        When: GET con filtro usuario
        Then: Debe retornar solo del usuario
        """
        response = admin_client.get(
            _consultas_list() + f'?usuario={user.id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_ordenar_por_modulo(self, admin_client, log_consulta):
        """
        Test: Ordenar logs por modulo

        Given: Multiples logs
        When: GET con ordering=modulo
        Then: Debe retornar ordenados
        """
        response = admin_client.get(
            _consultas_list() + '?ordering=modulo'
        )
        assert response.status_code == status.HTTP_200_OK
