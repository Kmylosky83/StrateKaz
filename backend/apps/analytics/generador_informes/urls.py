"""
URLs para Generador de Informes - Analytics
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlantillaInformeViewSet, InformeDinamicoViewSet,
    ProgramacionInformeViewSet, HistorialInformeViewSet
)

router = DefaultRouter()
router.register(r'plantillas', PlantillaInformeViewSet, basename='plantilla-informe')
router.register(r'informes', InformeDinamicoViewSet, basename='informe-dinamico')
router.register(r'programaciones', ProgramacionInformeViewSet, basename='programacion-informe')
router.register(r'historial', HistorialInformeViewSet, basename='historial-informe')

urlpatterns = router.urls
