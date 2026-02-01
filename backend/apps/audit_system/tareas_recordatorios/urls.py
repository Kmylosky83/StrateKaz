"""URLs para tareas_recordatorios"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TareaViewSet, RecordatorioViewSet, EventoCalendarioViewSet, ComentarioTareaViewSet

app_name = 'tareas_recordatorios'

router = DefaultRouter()
router.register(r'', TareaViewSet, basename='tareas')
router.register(r'recordatorios', RecordatorioViewSet, basename='recordatorios')
router.register(r'eventos', EventoCalendarioViewSet, basename='eventos')
router.register(r'comentarios', ComentarioTareaViewSet, basename='comentarios')

urlpatterns = [path('', include(router.urls))]
