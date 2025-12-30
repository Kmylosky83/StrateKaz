"""
Tests de Views - Riesgos de Procesos
====================================

Tests de integracion para los ViewSets de riesgos de procesos.
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ============================================================================
# Tests de CategoriaRiesgoViewSet
# ============================================================================

@pytest.mark.django_db
class TestCategoriaRiesgoViewSet:
    """Tests para CategoriaRiesgoViewSet."""

    def test_listar_categorias_sin_auth(self, api_client):
        """Verifica que se requiere autenticacion para listar."""
        url = '/api/motor-riesgos/riesgos/categorias/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_listar_categorias(self, authenticated_client, categoria_riesgo):
        """Verifica que se pueden listar las categorias."""
        url = '/api/motor-riesgos/riesgos/categorias/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_crear_categoria(self, authenticated_client):
        """Verifica que se puede crear una categoria."""
        url = '/api/motor-riesgos/riesgos/categorias/'
        data = {
            'codigo': 'FIN',
            'nombre': 'Financiero',
            'descripcion': 'Riesgos financieros',
            'color': '#10B981',
            'orden': 3
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'FIN'

    def test_detalle_categoria(self, authenticated_client, categoria_riesgo):
        """Verifica que se puede obtener el detalle de una categoria."""
        url = f'/api/motor-riesgos/riesgos/categorias/{categoria_riesgo.pk}/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == 'EST'

    def test_reorder_categorias(self, authenticated_client, categoria_riesgo, categoria_riesgo_operativo):
        """Verifica la accion reorder para reordenar categorias."""
        url = '/api/motor-riesgos/riesgos/categorias/reorder/'
        data = {
            'orders': [
                {'id': categoria_riesgo_operativo.pk, 'orden': 0},
                {'id': categoria_riesgo.pk, 'orden': 1}
            ]
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True


# ============================================================================
# Tests de RiesgoProcesoViewSet
# ============================================================================

@pytest.mark.django_db
class TestRiesgoProcesoViewSet:
    """Tests para RiesgoProcesoViewSet."""

    def test_listar_riesgos_sin_auth(self, api_client):
        """Verifica que se requiere autenticacion."""
        url = '/api/motor-riesgos/riesgos/riesgos/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_listar_riesgos(self, authenticated_client, riesgo_proceso):
        """Verifica que se pueden listar los riesgos."""
        url = '/api/motor-riesgos/riesgos/riesgos/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_crear_riesgo(self, authenticated_client, empresa, categoria_riesgo):
        """Verifica que se puede crear un riesgo."""
        url = '/api/motor-riesgos/riesgos/riesgos/'
        data = {
            'empresa': empresa.pk,
            'codigo': 'R-NEW',
            'nombre': 'Nuevo riesgo',
            'descripcion': 'Descripcion del nuevo riesgo',
            'tipo': 'operativo',
            'categoria': categoria_riesgo.pk,
            'proceso': 'Proceso nuevo',
            'causa_raiz': 'Causa del riesgo',
            'consecuencia': 'Consecuencia del riesgo',
            'probabilidad_inherente': 3,
            'impacto_inherente': 4,
            'probabilidad_residual': 2,
            'impacto_residual': 2,
            'estado': 'identificado'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'R-NEW'

    def test_detalle_riesgo(self, authenticated_client, riesgo_proceso):
        """Verifica que se puede obtener el detalle de un riesgo."""
        url = f'/api/motor-riesgos/riesgos/riesgos/{riesgo_proceso.pk}/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == 'R-001'

    def test_resumen_riesgos(self, authenticated_client, riesgo_proceso, riesgo_critico):
        """Verifica la accion resumen de estadisticas."""
        url = '/api/motor-riesgos/riesgos/riesgos/resumen/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'por_estado' in response.data
        assert 'por_tipo' in response.data

    def test_riesgos_criticos(self, authenticated_client, riesgo_proceso, riesgo_critico):
        """Verifica la accion criticos que lista riesgos criticos/altos."""
        url = '/api/motor-riesgos/riesgos/riesgos/criticos/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'riesgos' in response.data
        # El riesgo_critico deberia estar en la lista
        assert response.data['total'] >= 1

    def test_mapa_calor(self, authenticated_client, riesgo_proceso):
        """Verifica la accion mapa_calor que genera matriz 5x5."""
        url = '/api/motor-riesgos/riesgos/riesgos/mapa-calor/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'matriz' in response.data
        assert 'total_riesgos' in response.data
        assert len(response.data['matriz']) == 5  # Matriz 5x5

    def test_mapa_calor_inherente(self, authenticated_client, riesgo_proceso):
        """Verifica mapa de calor con evaluacion inherente."""
        url = '/api/motor-riesgos/riesgos/riesgos/mapa-calor/?tipo_evaluacion=inherente'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tipo_evaluacion'] == 'inherente'

    def test_cambiar_estado_riesgo(self, authenticated_client, riesgo_proceso):
        """Verifica la accion cambiar_estado."""
        url = f'/api/motor-riesgos/riesgos/riesgos/{riesgo_proceso.pk}/cambiar-estado/'
        data = {
            'estado': 'en_analisis',
            'observaciones': 'Iniciando analisis del riesgo'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'en_analisis' in response.data['mensaje']

    def test_cambiar_estado_invalido(self, authenticated_client, riesgo_proceso):
        """Verifica que no se puede cambiar a un estado invalido."""
        url = f'/api/motor-riesgos/riesgos/riesgos/{riesgo_proceso.pk}/cambiar-estado/'
        data = {'estado': 'estado_invalido'}
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_filtrar_por_tipo(self, authenticated_client, riesgo_proceso):
        """Verifica el filtrado por tipo de riesgo."""
        url = '/api/motor-riesgos/riesgos/riesgos/?tipo=estrategico'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_filtrar_por_estado(self, authenticated_client, riesgo_proceso):
        """Verifica el filtrado por estado."""
        url = '/api/motor-riesgos/riesgos/riesgos/?estado=identificado'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# Tests de TratamientoRiesgoViewSet
# ============================================================================

@pytest.mark.django_db
class TestTratamientoRiesgoViewSet:
    """Tests para TratamientoRiesgoViewSet."""

    def test_listar_tratamientos(self, authenticated_client, tratamiento_riesgo):
        """Verifica que se pueden listar los tratamientos."""
        url = '/api/motor-riesgos/riesgos/tratamientos/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_crear_tratamiento(self, authenticated_client, empresa, riesgo_proceso):
        """Verifica que se puede crear un tratamiento."""
        url = '/api/motor-riesgos/riesgos/tratamientos/'
        data = {
            'empresa': empresa.pk,
            'riesgo': riesgo_proceso.pk,
            'tipo': 'evitar',
            'descripcion': 'Evitar la actividad de riesgo',
            'control_propuesto': 'Eliminar proceso',
            'estado': 'pendiente'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_actualizar_avance(self, authenticated_client, tratamiento_riesgo):
        """Verifica la accion actualizar_avance."""
        url = f'/api/motor-riesgos/riesgos/tratamientos/{tratamiento_riesgo.pk}/actualizar-avance/'
        data = {
            'estado': 'completado',
            'efectividad': 'Alta'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_actualizar_avance_estado_invalido(self, authenticated_client, tratamiento_riesgo):
        """Verifica que no acepta estado invalido."""
        url = f'/api/motor-riesgos/riesgos/tratamientos/{tratamiento_riesgo.pk}/actualizar-avance/'
        data = {'estado': 'estado_falso'}
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# Tests de ControlOperacionalViewSet
# ============================================================================

@pytest.mark.django_db
class TestControlOperacionalViewSet:
    """Tests para ControlOperacionalViewSet."""

    def test_listar_controles(self, authenticated_client, control_operacional):
        """Verifica que se pueden listar los controles."""
        url = '/api/motor-riesgos/riesgos/controles/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_crear_control(self, authenticated_client, empresa, riesgo_proceso):
        """Verifica que se puede crear un control."""
        url = '/api/motor-riesgos/riesgos/controles/'
        data = {
            'empresa': empresa.pk,
            'riesgo': riesgo_proceso.pk,
            'nombre': 'Control detectivo',
            'descripcion': 'Detecta anomalias',
            'tipo_control': 'detectivo',
            'frecuencia': 'Semanal'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_filtrar_por_tipo_control(self, authenticated_client, control_operacional):
        """Verifica el filtrado por tipo de control."""
        url = '/api/motor-riesgos/riesgos/controles/?tipo_control=preventivo'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# Tests de OportunidadViewSet
# ============================================================================

@pytest.mark.django_db
class TestOportunidadViewSet:
    """Tests para OportunidadViewSet."""

    def test_listar_oportunidades(self, authenticated_client, oportunidad):
        """Verifica que se pueden listar las oportunidades."""
        url = '/api/motor-riesgos/riesgos/oportunidades/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_crear_oportunidad(self, authenticated_client, empresa):
        """Verifica que se puede crear una oportunidad."""
        url = '/api/motor-riesgos/riesgos/oportunidades/'
        data = {
            'empresa': empresa.pk,
            'codigo': 'O-NEW',
            'nombre': 'Nueva oportunidad',
            'descripcion': 'Descripcion de la oportunidad',
            'fuente': 'Tecnologia',
            'impacto_potencial': 'Alto',
            'viabilidad': 'Media',
            'estado': 'identificada'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_cambiar_estado_oportunidad(self, authenticated_client, oportunidad):
        """Verifica la accion cambiar_estado."""
        url = f'/api/motor-riesgos/riesgos/oportunidades/{oportunidad.pk}/cambiar-estado/'
        data = {
            'estado': 'aprobada',
            'observaciones': 'Aprobada por direccion'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_cambiar_estado_oportunidad_invalido(self, authenticated_client, oportunidad):
        """Verifica que no acepta estado invalido."""
        url = f'/api/motor-riesgos/riesgos/oportunidades/{oportunidad.pk}/cambiar-estado/'
        data = {'estado': 'estado_invalido'}
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_filtrar_por_estado(self, authenticated_client, oportunidad):
        """Verifica el filtrado por estado."""
        url = '/api/motor-riesgos/riesgos/oportunidades/?estado=identificada'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
