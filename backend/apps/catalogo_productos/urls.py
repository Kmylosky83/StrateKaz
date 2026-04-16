"""URLs para Catálogo de Productos."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoriaProductoViewSet, UnidadMedidaViewSet, ProductoViewSet

app_name = 'catalogo_productos'

router = DefaultRouter()
router.register('categorias', CategoriaProductoViewSet, basename='categorias')
router.register('unidades-medida', UnidadMedidaViewSet, basename='unidades-medida')
router.register('productos', ProductoViewSet, basename='productos')

urlpatterns = [
    path('', include(router.urls)),
]
