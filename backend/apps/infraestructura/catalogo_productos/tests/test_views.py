"""Tests de endpoints para Catálogo de Productos."""
import pytest

from django.urls import reverse
from rest_framework import status

from apps.infraestructura.catalogo_productos.models import CategoriaProducto, UnidadMedida, Producto


pytestmark = pytest.mark.django_db


class TestProductoViewSet:
    """Tests CRUD para /api/catalogo-productos/productos/."""

    def test_list(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_create(self, admin_client, unidad_medida, categoria):
        url = reverse('catalogo_productos:productos-list')
        data = {
            'codigo': 'MP-002',
            'nombre': 'Aceite Vegetal',
            'tipo': 'MATERIA_PRIMA',
            'unidad_medida': unidad_medida.pk,
            'categoria': categoria.pk,
            'precio_referencia': '3500.00',
        }
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Producto.objects.filter(codigo='MP-002').exists()

    def test_update(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-detail', args=[producto.pk])
        response = admin_client.patch(url, {'nombre': 'Grasa Modificada'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        producto.refresh_from_db()
        assert producto.nombre == 'Grasa Modificada'

    def test_delete_soft(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-detail', args=[producto.pk])
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        producto.refresh_from_db()
        assert producto.is_deleted is True

    def test_filter_por_tipo(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-list')
        response = admin_client.get(url, {'tipo': 'MATERIA_PRIMA'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filter_por_categoria(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-list')
        response = admin_client.get(url, {'categoria': producto.categoria.pk})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_estadisticas(self, admin_client, producto):
        url = reverse('catalogo_productos:productos-estadisticas')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total' in response.data
        assert 'por_tipo' in response.data

    def test_unauthenticated_rejected(self, api_client):
        url = reverse('catalogo_productos:productos-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCategoriaProductoViewSet:
    """Tests CRUD para /api/catalogo-productos/categorias/."""

    def test_list(self, admin_client, categoria):
        url = reverse('catalogo_productos:categorias-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_create(self, admin_client):
        url = reverse('catalogo_productos:categorias-list')
        data = {'nombre': 'Insumos', 'orden': 2}
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_jerarquica(self, admin_client, categoria):
        url = reverse('catalogo_productos:categorias-list')
        data = {'nombre': 'Sub-Grasas', 'parent': categoria.pk, 'orden': 1}
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['parent'] == categoria.pk


class TestUnidadMedidaViewSet:
    """Tests CRUD para /api/catalogo-productos/unidades-medida/."""

    def test_list(self, admin_client, unidad_medida):
        url = reverse('catalogo_productos:unidades-medida-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_create(self, admin_client):
        url = reverse('catalogo_productos:unidades-medida-list')
        data = {
            'nombre': 'Gramo',
            'abreviatura': 'g',
            'tipo': 'PESO',
            'factor_conversion': '1000.000000',
            'es_base': False,
        }
        response = admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
