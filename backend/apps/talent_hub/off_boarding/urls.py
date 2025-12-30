"""
URLs de Off-Boarding - Talent Hub

Configuración de rutas para la API de off-boarding.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoRetiroViewSet,
    ProcesoRetiroViewSet,
    ChecklistRetiroViewSet,
    PazSalvoViewSet,
    ExamenEgresoViewSet,
    EntrevistaRetiroViewSet,
    LiquidacionFinalViewSet
)

app_name = 'off_boarding'

router = DefaultRouter()
router.register(r'tipos-retiro', TipoRetiroViewSet, basename='tipo-retiro')
router.register(r'procesos', ProcesoRetiroViewSet, basename='proceso')
router.register(r'checklist', ChecklistRetiroViewSet, basename='checklist')
router.register(r'paz-salvos', PazSalvoViewSet, basename='paz-salvo')
router.register(r'examenes-egreso', ExamenEgresoViewSet, basename='examen-egreso')
router.register(r'entrevistas', EntrevistaRetiroViewSet, basename='entrevista')
router.register(r'liquidaciones', LiquidacionFinalViewSet, basename='liquidacion')

urlpatterns = [
    path('', include(router.urls)),
]
