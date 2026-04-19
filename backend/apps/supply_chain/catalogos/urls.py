"""
URLs para catalogos - supply_chain
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlmacenViewSet, TipoAlmacenViewSet

app_name = 'catalogos'

router = DefaultRouter()
router.register(r'tipos-almacen', TipoAlmacenViewSet, basename='tipo-almacen')
router.register(r'almacenes', AlmacenViewSet, basename='almacen')

urlpatterns = [
    path('', include(router.urls)),
]
