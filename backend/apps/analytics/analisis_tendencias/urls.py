"""
URLs para Análisis de Tendencias - Analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalisisKPIViewSet, TendenciaKPIViewSet, AnomaliaDetectadaViewSet

router = DefaultRouter()
router.register(r'analisis', AnalisisKPIViewSet, basename='analisis-kpi')
router.register(r'tendencias', TendenciaKPIViewSet, basename='tendencia-kpi')
router.register(r'anomalias', AnomaliaDetectadaViewSet, basename='anomalia-detectada')

urlpatterns = router.urls
