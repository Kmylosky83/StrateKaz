"""
URLs para Contexto Organizacional - Gestion Estrategica - Planeacion
===================================================

Configuración de rutas para los ViewSets de análisis estratégico.

Rutas base: /api/gestion-estrategica/planeacion/contexto/

Endpoints disponibles:
- /analisis-dofa/          - Análisis DOFA consolidado
- /factores-dofa/          - Factores DOFA individuales
- /estrategias-tows/       - Estrategias TOWS (matriz cruzada)
- /analisis-pestel/        - Análisis PESTEL
- /factores-pestel/        - Factores PESTEL individuales
- /fuerzas-porter/         - Análisis de 5 Fuerzas de Porter

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalisisDOFAViewSet,
    FactorDOFAViewSet,
    EstrategiaTOWSViewSet,
    AnalisisPESTELViewSet,
    FactorPESTELViewSet,
    FuerzaPorterViewSet
)

# Router para registrar automáticamente los ViewSets
router = DefaultRouter()

# Registro de ViewSets con sus respectivas rutas base
router.register(r'analisis-dofa', AnalisisDOFAViewSet, basename='analisis-dofa')
router.register(r'factores-dofa', FactorDOFAViewSet, basename='factor-dofa')
router.register(r'estrategias-tows', EstrategiaTOWSViewSet, basename='estrategia-tows')
router.register(r'analisis-pestel', AnalisisPESTELViewSet, basename='analisis-pestel')
router.register(r'factores-pestel', FactorPESTELViewSet, basename='factor-pestel')
router.register(r'fuerzas-porter', FuerzaPorterViewSet, basename='fuerza-porter')

# URLs finales
urlpatterns = [
    path('', include(router.urls)),
]
