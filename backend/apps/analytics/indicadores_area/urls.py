"""
URLs para Indicadores Área - Analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ValorKPIViewSet, AccionPorKPIViewSet, AlertaKPIViewSet

router = DefaultRouter()
router.register(r'valores', ValorKPIViewSet, basename='valor-kpi')
router.register(r'acciones', AccionPorKPIViewSet, basename='accion-kpi')
router.register(r'alertas', AlertaKPIViewSet, basename='alerta-kpi')

urlpatterns = router.urls
