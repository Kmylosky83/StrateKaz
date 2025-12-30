"""
URLs para Config Indicadores - Analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CatalogoKPIViewSet, FichaTecnicaKPIViewSet,
    MetaKPIViewSet, ConfiguracionSemaforoViewSet
)

router = DefaultRouter()
router.register(r'kpis', CatalogoKPIViewSet, basename='catalogo-kpi')
router.register(r'fichas-tecnicas', FichaTecnicaKPIViewSet, basename='ficha-tecnica-kpi')
router.register(r'metas', MetaKPIViewSet, basename='meta-kpi')
router.register(r'semaforos', ConfiguracionSemaforoViewSet, basename='configuracion-semaforo')

urlpatterns = router.urls
