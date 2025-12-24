"""
URLs del módulo Planeación Estratégica - Dirección Estratégica

Endpoints:
- /planes/ - Planes estratégicos
- /objetivos/ - Objetivos estratégicos
- /mapas/ - Mapas estratégicos con perspectivas BSC
- /causa-efecto/ - Relaciones causa-efecto
- /kpis/ - Indicadores clave de desempeño
- /mediciones/ - Mediciones de KPI
- /cambios/ - Gestión de cambios organizacionales
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
    MapaEstrategicoViewSet,
    CausaEfectoViewSet,
    KPIObjetivoViewSet,
    MedicionKPIViewSet,
    GestionCambioViewSet,
)

app_name = 'planeacion'

router = DefaultRouter()
router.register(r'planes', StrategicPlanViewSet, basename='strategic-plans')
router.register(r'objetivos', StrategicObjectiveViewSet, basename='strategic-objectives')
router.register(r'mapas', MapaEstrategicoViewSet, basename='mapa-estrategico')
router.register(r'causa-efecto', CausaEfectoViewSet, basename='causa-efecto')
router.register(r'kpis', KPIObjetivoViewSet, basename='kpi-objetivo')
router.register(r'mediciones', MedicionKPIViewSet, basename='medicion-kpi')
router.register(r'cambios', GestionCambioViewSet, basename='gestion-cambio')

urlpatterns = [
    path('', include(router.urls)),
]
