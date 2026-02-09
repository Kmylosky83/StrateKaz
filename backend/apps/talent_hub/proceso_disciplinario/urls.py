"""
URLs para Proceso Disciplinario - Talent Hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'proceso_disciplinario'

router = DefaultRouter()
router.register(r'tipos-falta', views.TipoFaltaViewSet, basename='tipofalta')
router.register(r'llamados-atencion', views.LlamadoAtencionViewSet, basename='llamadoatencion')
router.register(r'descargos', views.DescargoViewSet, basename='descargo')
router.register(r'memorandos', views.MemorandoViewSet, basename='memorando')
router.register(r'historial', views.HistorialDisciplinarioViewSet, basename='historial')
router.register(r'notificaciones-disciplinarias', views.NotificacionDisciplinariaViewSet, basename='notificaciondisciplinaria')
router.register(r'pruebas-disciplinarias', views.PruebaDisciplinariaViewSet, basename='pruebadisciplinaria')
router.register(r'denuncias-acoso', views.DenunciaAcosoLaboralViewSet, basename='denunciaacoso')

urlpatterns = [
    path('', include(router.urls)),
]
