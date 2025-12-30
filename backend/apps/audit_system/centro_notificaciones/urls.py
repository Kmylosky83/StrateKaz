"""URLs para centro_notificaciones"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoNotificacionViewSet, NotificacionViewSet, PreferenciaNotificacionViewSet, NotificacionMasivaViewSet

app_name = 'centro_notificaciones'

router = DefaultRouter()
router.register(r'tipos', TipoNotificacionViewSet, basename='tipos')
router.register(r'', NotificacionViewSet, basename='notificaciones')
router.register(r'preferencias', PreferenciaNotificacionViewSet, basename='preferencias')
router.register(r'masivas', NotificacionMasivaViewSet, basename='masivas')

urlpatterns = [path('', include(router.urls))]
