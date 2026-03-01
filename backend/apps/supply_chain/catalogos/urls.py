"""
URLs para catalogos - supply_chain
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UnidadMedidaViewSet, AlmacenViewSet

app_name = 'catalogos'

router = DefaultRouter()
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')
router.register(r'almacenes', AlmacenViewSet, basename='almacen')

urlpatterns = [
    path('', include(router.urls)),
]
