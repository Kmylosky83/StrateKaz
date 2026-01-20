"""URLs para centro_notificaciones"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoNotificacionViewSet, NotificacionViewSet, PreferenciaNotificacionViewSet, NotificacionMasivaViewSet

app_name = 'centro_notificaciones'

router = DefaultRouter()
# IMPORTANTE: Registrar rutas específicas ANTES de la ruta vacía
# para evitar que '' capture todas las peticiones
router.register(r'tipos', TipoNotificacionViewSet, basename='tipos')
router.register(r'preferencias', PreferenciaNotificacionViewSet, basename='preferencias')
router.register(r'masivas', NotificacionMasivaViewSet, basename='masivas')
# Ruta vacía al final - captura /api/audit/notificaciones/
router.register(r'', NotificacionViewSet, basename='notificaciones')

urlpatterns = [path('', include(router.urls))]
