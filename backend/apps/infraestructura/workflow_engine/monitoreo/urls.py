from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MetricaFlujoViewSet,
    AlertaFlujoViewSet,
    ReglaSLAViewSet,
    DashboardWidgetViewSet,
    ReporteAutomaticoViewSet
)

app_name = 'monitoreo'

router = DefaultRouter()
router.register(r'metricas', MetricaFlujoViewSet, basename='metrica')
router.register(r'alertas', AlertaFlujoViewSet, basename='alerta')
router.register(r'reglas-sla', ReglaSLAViewSet, basename='regla-sla')
router.register(r'widgets', DashboardWidgetViewSet, basename='widget')
router.register(r'reportes', ReporteAutomaticoViewSet, basename='reporte')

urlpatterns = [
    path('', include(router.urls)),
]
