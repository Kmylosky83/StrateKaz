"""
URLs para Contexto Organizacional - Gestión Estratégica
=======================================================

Configuración de rutas para análisis estratégico.

Rutas base: /api/gestion-estrategica/contexto/

Endpoints disponibles:
- /analisis-dofa/          - Análisis DOFA consolidado
- /factores-dofa/          - Factores DOFA individuales
- /estrategias-tows/       - Estrategias TOWS (matriz cruzada)
- /analisis-pestel/        - Análisis PESTEL
- /factores-pestel/        - Factores PESTEL individuales
- /fuerzas-porter/         - Análisis de 5 Fuerzas de Porter

NOTA: Partes Interesadas se movieron a /api/organizacion/ (REORG-B3).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoAnalisisDOFAViewSet,
    AnalisisDOFAViewSet,
    FactorDOFAViewSet,
    EstrategiaTOWSViewSet,
    TipoAnalisisPESTELViewSet,
    AnalisisPESTELViewSet,
    FactorPESTELViewSet,
    FuerzaPorterViewSet,
)

# Router para registrar automáticamente los ViewSets
router = DefaultRouter()

# Catálogos Globales
router.register(r'tipos-analisis-dofa', TipoAnalisisDOFAViewSet, basename='tipo-analisis-dofa')
router.register(r'tipos-analisis-pestel', TipoAnalisisPESTELViewSet, basename='tipo-analisis-pestel')

# Análisis Estratégico
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
