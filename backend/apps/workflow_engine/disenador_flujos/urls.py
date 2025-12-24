from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaFlujoViewSet,
    PlantillaFlujoViewSet,
    NodoFlujoViewSet,
    TransicionFlujoViewSet,
    CampoFormularioViewSet,
    RolFlujoViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaFlujoViewSet, basename='categoria-flujo')
router.register(r'plantillas', PlantillaFlujoViewSet, basename='plantilla-flujo')
router.register(r'nodos', NodoFlujoViewSet, basename='nodo-flujo')
router.register(r'transiciones', TransicionFlujoViewSet, basename='transicion-flujo')
router.register(r'campos-formulario', CampoFormularioViewSet, basename='campo-formulario')
router.register(r'roles', RolFlujoViewSet, basename='rol-flujo')

urlpatterns = [
    path('', include(router.urls)),
]
