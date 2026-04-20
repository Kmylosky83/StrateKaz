"""URLs para Catálogo de Productos."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoriaProductoViewSet, UnidadMedidaViewSet, ProductoViewSet
from .proveedores.viewsets import ProveedorViewSet, TipoProveedorViewSet

app_name = 'catalogo_productos'

router = DefaultRouter()
router.register('categorias', CategoriaProductoViewSet, basename='categorias')
router.register('unidades-medida', UnidadMedidaViewSet, basename='unidades-medida')
router.register('productos', ProductoViewSet, basename='productos')
# Proveedores: dato maestro multi-industria (2026-04-21 refactor a CT).
router.register('tipos-proveedor', TipoProveedorViewSet, basename='tipos-proveedor')
router.register('proveedores', ProveedorViewSet, basename='proveedores')

urlpatterns = [
    path('', include(router.urls)),
]
