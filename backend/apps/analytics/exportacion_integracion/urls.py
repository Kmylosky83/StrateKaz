"""URLs para Exportación e Integración"""
from rest_framework.routers import DefaultRouter
from .views import ConfiguracionExportacionViewSet, LogExportacionViewSet

router = DefaultRouter()
router.register(r'configuraciones', ConfiguracionExportacionViewSet, basename='configuracion-exportacion')
router.register(r'logs', LogExportacionViewSet, basename='log-exportacion')

urlpatterns = router.urls
