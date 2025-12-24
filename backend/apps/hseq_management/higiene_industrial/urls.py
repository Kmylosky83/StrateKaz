"""
URLs para Higiene Industrial - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoAgenteViewSet,
    AgenteRiesgoViewSet,
    GrupoExposicionSimilarViewSet,
    PuntoMedicionViewSet,
    MedicionAmbientalViewSet,
    ControlExposicionViewSet,
    MonitoreoBiologicoViewSet
)

app_name = 'higiene_industrial'

router = DefaultRouter()

# Registrar ViewSets
router.register(r'tipos-agente', TipoAgenteViewSet, basename='tipo-agente')
router.register(r'agentes-riesgo', AgenteRiesgoViewSet, basename='agente-riesgo')
router.register(r'grupos-exposicion', GrupoExposicionSimilarViewSet, basename='grupo-exposicion')
router.register(r'puntos-medicion', PuntoMedicionViewSet, basename='punto-medicion')
router.register(r'mediciones-ambientales', MedicionAmbientalViewSet, basename='medicion-ambiental')
router.register(r'controles-exposicion', ControlExposicionViewSet, basename='control-exposicion')
router.register(r'monitoreo-biologico', MonitoreoBiologicoViewSet, basename='monitoreo-biologico')

urlpatterns = [
    path('', include(router.urls)),
]
