"""
URLs para Contexto Organizacional - Gestión Estratégica
=======================================================

Configuración de rutas para los ViewSets de análisis estratégico.

Rutas base: /api/gestion-estrategica/contexto/

Endpoints disponibles:
- /analisis-dofa/          - Análisis DOFA consolidado
- /factores-dofa/          - Factores DOFA individuales
- /estrategias-tows/       - Estrategias TOWS (matriz cruzada)
- /analisis-pestel/        - Análisis PESTEL
- /factores-pestel/        - Factores PESTEL individuales
- /fuerzas-porter/         - Análisis de 5 Fuerzas de Porter
- /tipos-parte-interesada/ - Catálogo de tipos de stakeholders
- /partes-interesadas/     - Partes interesadas (stakeholders)
- /requisitos-pi/          - Requisitos de partes interesadas
- /matriz-comunicacion/    - Matriz de comunicación

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
Actualizado: 2026-01-24 - Migrado a app independiente
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
    GrupoParteInteresadaViewSet,
    TipoParteInteresadaViewSet,
    ParteInteresadaViewSet,
    RequisitoParteInteresadaViewSet,
    MatrizComunicacionViewSet
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

# Partes Interesadas (Stakeholders) - ISO 9001:2015 Cláusula 4.2
router.register(r'grupos-parte-interesada', GrupoParteInteresadaViewSet, basename='grupo-parte-interesada')
router.register(r'tipos-parte-interesada', TipoParteInteresadaViewSet, basename='tipo-parte-interesada')
router.register(r'partes-interesadas', ParteInteresadaViewSet, basename='parte-interesada')
router.register(r'requisitos-pi', RequisitoParteInteresadaViewSet, basename='requisito-pi')
router.register(r'matriz-comunicacion', MatrizComunicacionViewSet, basename='matriz-comunicacion')

# URLs finales
urlpatterns = [
    path('', include(router.urls)),
]
