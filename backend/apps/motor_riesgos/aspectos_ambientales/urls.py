from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaAspectoViewSet,
    AspectoAmbientalViewSet,
    ImpactoAmbientalViewSet,
    ProgramaAmbientalViewSet,
    MonitoreoAmbientalViewSet
)

app_name = 'aspectos_ambientales'

router = DefaultRouter()
router.register(r'categorias', CategoriaAspectoViewSet, basename='categoria')
router.register(r'aspectos', AspectoAmbientalViewSet, basename='aspecto')
router.register(r'impactos', ImpactoAmbientalViewSet, basename='impacto')
router.register(r'programas', ProgramaAmbientalViewSet, basename='programa')
router.register(r'monitoreos', MonitoreoAmbientalViewSet, basename='monitoreo')

urlpatterns = [
    path('', include(router.urls)),
]
