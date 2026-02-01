"""
Tests de Permissions para Gestión de Proveedores - Supply Chain
================================================================

Tests unitarios para:
- CanManageCatalogos
- CanManageProveedores
- CanModifyPrecioProveedor (CRÍTICO: Solo Gerente)
- CanManageUnidadesNegocio
- CanManageCondicionesComerciales

Total de tests: 30+
Cobertura: Todos los permisos y sus niveles

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.supply_chain.gestion_proveedores.permissions import (
    CanManageCatalogos,
    CanManageProveedores,
    CanModifyPrecioProveedor,
    CanManageUnidadesNegocio,
    CanManageCondicionesComerciales,
)


@pytest.fixture
def api_client():
    """Cliente de API de DRF."""
    return APIClient()


# ==============================================================================
# TESTS DE CanManageCatalogos
# ==============================================================================

@pytest.mark.django_db
class TestCanManageCatalogos:
    """Tests para permiso CanManageCatalogos."""

    def test_lectura_catalogos_cualquier_usuario(
        self,
        api_client,
        usuario_operativo,
        tipo_hueso_crudo
    ):
        """
        Test: Cualquier usuario autenticado puede leer catálogos.

        Given: Usuario nivel operativo (nivel 1)
        When: Intenta listar catálogos (GET)
        Then: Debe permitir acceso
        """
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:tipo-materia-prima-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_crear_catalogo_superadmin(
        self,
        api_client,
        superadmin,
        categoria_hueso
    ):
        """Test: SuperAdmin puede crear catálogos."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'HUESO_TEST',
            'nombre': 'Hueso Test',
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_crear_catalogo_gerente(
        self,
        api_client,
        usuario_gerente,
        categoria_hueso
    ):
        """Test: Gerente (nivel 3) puede crear catálogos."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'HUESO_GERENTE',
            'nombre': 'Hueso Gerente',
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_crear_catalogo_coordinador_denegado(
        self,
        api_client,
        usuario_coordinador,
        categoria_hueso
    ):
        """Test: Coordinador (nivel 2) NO puede crear catálogos."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'HUESO_COORD',
            'nombre': 'Hueso Coord',
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_crear_catalogo_operativo_denegado(
        self,
        api_client,
        usuario_operativo,
        categoria_hueso
    ):
        """Test: Operativo (nivel 1) NO puede crear catálogos."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:tipo-materia-prima-list')
        data = {
            'categoria': categoria_hueso.id,
            'codigo': 'HUESO_OP',
            'nombre': 'Hueso Op',
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_actualizar_catalogo_gerente(
        self,
        api_client,
        usuario_gerente,
        tipo_hueso_crudo
    ):
        """Test: Gerente puede actualizar catálogos."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:tipo-materia-prima-detail', args=[tipo_hueso_crudo.id])
        data = {
            'nombre': 'Hueso Actualizado'
        }

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_eliminar_catalogo_gerente(
        self,
        api_client,
        usuario_gerente,
        tipo_hueso_crudo
    ):
        """Test: Gerente puede eliminar catálogos."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:tipo-materia-prima-detail', args=[tipo_hueso_crudo.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT


# ==============================================================================
# TESTS DE CanManageProveedores
# ==============================================================================

@pytest.mark.django_db
class TestCanManageProveedores:
    """Tests para permiso CanManageProveedores."""

    def test_lectura_proveedores_coordinador(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Coordinador (nivel 2+) puede leer proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_lectura_proveedores_operativo_denegado(
        self,
        api_client,
        usuario_operativo,
        proveedor_materia_prima
    ):
        """Test: Operativo (nivel 1) NO puede leer proveedores."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:proveedor-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_crear_proveedor_coordinador(
        self,
        api_client,
        usuario_coordinador,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca,
        forma_pago_contado
    ):
        """Test: Coordinador (nivel 2) puede crear proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-list')
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Proveedor Coordinador',
            'razon_social': 'Proveedor Coordinador SAS',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900777888',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id,
            'formas_pago': [forma_pago_contado.id],
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_crear_proveedor_operativo_denegado(
        self,
        api_client,
        usuario_operativo,
        tipo_proveedor_materia_prima,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """Test: Operativo NO puede crear proveedores."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:proveedor-list')
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900666777',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_actualizar_proveedor_coordinador(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Coordinador puede actualizar proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        data = {
            'nombre_comercial': 'Proveedor Actualizado'
        }

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_eliminar_proveedor_gerente(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima
    ):
        """Test: Gerente (nivel 3) puede eliminar proveedores."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_eliminar_proveedor_coordinador_denegado(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima
    ):
        """Test: Coordinador NO puede eliminar proveedores."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-detail', args=[proveedor_materia_prima.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN


# ==============================================================================
# TESTS DE CanModifyPrecioProveedor (CRÍTICO)
# ==============================================================================

@pytest.mark.django_db
class TestCanModifyPrecioProveedor:
    """Tests para permiso CanModifyPrecioProveedor (CRÍTICO)."""

    def test_cambiar_precio_gerente(
        self,
        api_client,
        usuario_gerente,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso
    ):
        """
        Test: SOLO Gerente puede cambiar precio.

        Given: Usuario con cargo GERENTE (nivel 3)
        When: Intenta cambiar precio
        Then: Debe permitir acceso
        """
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3000.00',
            'motivo': 'Ajuste autorizado'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_cambiar_precio_superadmin(
        self,
        api_client,
        superadmin,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso
    ):
        """Test: SuperAdmin puede cambiar precio."""
        api_client.force_authenticate(user=superadmin)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3200.00',
            'motivo': 'Ajuste SuperAdmin'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_cambiar_precio_coordinador_denegado(
        self,
        api_client,
        usuario_coordinador,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso
    ):
        """
        Test: Coordinador NO puede cambiar precio (CRÍTICO).

        Given: Usuario coordinador (nivel 2)
        When: Intenta cambiar precio
        Then: Debe denegar acceso (403 FORBIDDEN)
        """
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3000.00',
            'motivo': 'Intento no autorizado'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cambiar_precio_operativo_denegado(
        self,
        api_client,
        usuario_operativo,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso
    ):
        """Test: Operativo NO puede cambiar precio."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3000.00',
            'motivo': 'Intento no autorizado'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN


# ==============================================================================
# TESTS DE CanManageUnidadesNegocio
# ==============================================================================

@pytest.mark.django_db
class TestCanManageUnidadesNegocio:
    """Tests para permiso CanManageUnidadesNegocio."""

    def test_lectura_unidades_coordinador(
        self,
        api_client,
        usuario_coordinador,
        unidad_negocio_planta
    ):
        """Test: Coordinador (nivel 2) puede leer unidades de negocio."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:unidad-negocio-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_lectura_unidades_operativo_denegado(
        self,
        api_client,
        usuario_operativo,
        unidad_negocio_planta
    ):
        """Test: Operativo NO puede leer unidades de negocio."""
        api_client.force_authenticate(user=usuario_operativo)

        url = reverse('supply_chain:unidad-negocio-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_crear_unidad_negocio_gerente(
        self,
        api_client,
        usuario_gerente,
        departamento_cundinamarca
    ):
        """Test: Gerente (nivel 3) puede crear unidades de negocio."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:unidad-negocio-list')
        data = {
            'codigo': 'UNIDAD_TEST',
            'nombre': 'Unidad Test',
            'tipo_unidad': 'PLANTA',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id,
            'is_active': True
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_crear_unidad_negocio_coordinador_denegado(
        self,
        api_client,
        usuario_coordinador,
        departamento_cundinamarca
    ):
        """Test: Coordinador NO puede crear unidades de negocio."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:unidad-negocio-list')
        data = {
            'codigo': 'UNIDAD_COORD',
            'nombre': 'Unidad Coord',
            'tipo_unidad': 'PLANTA',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_actualizar_unidad_negocio_gerente(
        self,
        api_client,
        usuario_gerente,
        unidad_negocio_planta
    ):
        """Test: Gerente puede actualizar unidades de negocio."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:unidad-negocio-detail', args=[unidad_negocio_planta.id])
        data = {
            'nombre': 'Planta Actualizada'
        }

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_eliminar_unidad_negocio_gerente(
        self,
        api_client,
        usuario_gerente,
        unidad_negocio_planta
    ):
        """Test: Gerente puede eliminar unidades de negocio."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:unidad-negocio-detail', args=[unidad_negocio_planta.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT


# ==============================================================================
# TESTS DE CanManageCondicionesComerciales
# ==============================================================================

@pytest.mark.django_db
class TestCanManageCondicionesComerciales:
    """Tests para permiso CanManageCondicionesComerciales."""

    def test_lectura_condiciones_coordinador(
        self,
        api_client,
        usuario_coordinador,
        condicion_comercial
    ):
        """Test: Coordinador puede leer condiciones comerciales."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:condicion-comercial-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_crear_condicion_comercial_coordinador(
        self,
        api_client,
        usuario_coordinador,
        proveedor_servicio
    ):
        """Test: Coordinador (nivel 2) puede crear condiciones comerciales."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:condicion-comercial-list')
        data = {
            'proveedor': proveedor_servicio.id,
            'descripcion': 'Condición Test',
            'valor_acordado': 'Test',
            'vigencia_desde': '2025-01-01'
        }

        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_actualizar_condicion_comercial_coordinador(
        self,
        api_client,
        usuario_coordinador,
        condicion_comercial
    ):
        """Test: Coordinador puede actualizar condiciones comerciales."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:condicion-comercial-detail', args=[condicion_comercial.id])
        data = {
            'descripcion': 'Condición Actualizada'
        }

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_eliminar_condicion_comercial_gerente(
        self,
        api_client,
        usuario_gerente,
        condicion_comercial
    ):
        """Test: Gerente (nivel 3) puede eliminar condiciones comerciales."""
        api_client.force_authenticate(user=usuario_gerente)

        url = reverse('supply_chain:condicion-comercial-detail', args=[condicion_comercial.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_eliminar_condicion_comercial_coordinador_denegado(
        self,
        api_client,
        usuario_coordinador,
        condicion_comercial
    ):
        """Test: Coordinador NO puede eliminar condiciones comerciales."""
        api_client.force_authenticate(user=usuario_coordinador)

        url = reverse('supply_chain:condicion-comercial-detail', args=[condicion_comercial.id])
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN


# ==============================================================================
# TESTS DE USUARIO NO AUTENTICADO
# ==============================================================================

@pytest.mark.django_db
class TestSinAutenticacion:
    """Tests para verificar que endpoints requieren autenticación."""

    def test_list_proveedores_sin_auth(self, api_client):
        """Test: Listar proveedores requiere autenticación."""
        url = reverse('supply_chain:proveedor-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_crear_proveedor_sin_auth(self, api_client):
        """Test: Crear proveedor requiere autenticación."""
        url = reverse('supply_chain:proveedor-list')
        data = {}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cambiar_precio_sin_auth(self, api_client, proveedor_materia_prima):
        """Test: Cambiar precio requiere autenticación."""
        url = reverse('supply_chain:proveedor-cambiar-precio', args=[proveedor_materia_prima.id])
        data = {}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
