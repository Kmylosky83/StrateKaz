"""
URLs para logs_sistema - audit_system
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConfiguracionAuditoriaViewSet,
    LogAccesoViewSet,
    LogCambioViewSet,
    LogConsultaViewSet
)

app_name = 'logs_sistema'

router = DefaultRouter()
router.register(r'configuracion', ConfiguracionAuditoriaViewSet, basename='configuracion')
router.register(r'accesos', LogAccesoViewSet, basename='accesos')
router.register(r'cambios', LogCambioViewSet, basename='cambios')
router.register(r'consultas', LogConsultaViewSet, basename='consultas')

urlpatterns = [
    path('', include(router.urls)),
]
