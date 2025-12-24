"""
URLs del módulo Identidad Corporativa - Dirección Estratégica

Endpoints:
- /identidad/ - Identidad corporativa (misión, visión)
- /valores/ - Valores corporativos
- /alcances/ - Alcance del sistema de gestión
- /politicas-integrales/ - Políticas integrales con versionamiento
- /politicas-especificas/ - Políticas específicas por área/módulo
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    AlcanceSistemaViewSet,
    PoliticaIntegralViewSet,
    PoliticaEspecificaViewSet,
)

app_name = 'identidad'

router = DefaultRouter()
router.register(r'identidad', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'valores', CorporateValueViewSet, basename='corporate-values')
router.register(r'alcances', AlcanceSistemaViewSet, basename='alcance-sistema')
router.register(r'politicas-integrales', PoliticaIntegralViewSet, basename='politica-integral')
router.register(r'politicas-especificas', PoliticaEspecificaViewSet, basename='politica-especifica')

urlpatterns = [
    path('', include(router.urls)),
]
