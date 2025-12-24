from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FactorExternoViewSet,
    FactorInternoViewSet,
    AnalisisDOFAViewSet,
    EstrategiaDOFAViewSet
)

router = DefaultRouter()
router.register(r'factores-externos', FactorExternoViewSet, basename='factor-externo')
router.register(r'factores-internos', FactorInternoViewSet, basename='factor-interno')
router.register(r'analisis-dofa', AnalisisDOFAViewSet, basename='analisis-dofa')
router.register(r'estrategias-dofa', EstrategiaDOFAViewSet, basename='estrategia-dofa')

urlpatterns = [
    path('', include(router.urls)),
]
