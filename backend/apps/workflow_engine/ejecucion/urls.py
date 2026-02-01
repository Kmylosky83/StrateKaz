from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InstanciaFlujoViewSet,
    TareaActivaViewSet,
    HistorialTareaViewSet,
    ArchivoAdjuntoViewSet,
    NotificacionFlujoViewSet
)

router = DefaultRouter()
router.register(r'instancias', InstanciaFlujoViewSet, basename='instancia-flujo')
router.register(r'tareas', TareaActivaViewSet, basename='tarea-activa')
router.register(r'historial', HistorialTareaViewSet, basename='historial-tarea')
router.register(r'archivos', ArchivoAdjuntoViewSet, basename='archivo-adjunto')
router.register(r'notificaciones', NotificacionFlujoViewSet, basename='notificacion-flujo')

urlpatterns = [
    path('', include(router.urls)),
]
