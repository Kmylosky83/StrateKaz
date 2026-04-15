"""URLs para config_alertas"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoAlertaViewSet, ConfiguracionAlertaViewSet, AlertaGeneradaViewSet, EscalamientoAlertaViewSet

app_name = 'config_alertas'

router = DefaultRouter()
router.register(r'tipos', TipoAlertaViewSet, basename='tipos')
router.register(r'configuraciones', ConfiguracionAlertaViewSet, basename='configuraciones')
# Prefijos específicos ANTES del catch-all r'' para evitar que
# ^(?P<pk>[^/.]+)/$ intercepte escalamientos/
router.register(r'escalamientos', EscalamientoAlertaViewSet, basename='escalamientos')
router.register(r'', AlertaGeneradaViewSet, basename='alertas')

urlpatterns = [path('', include(router.urls))]
