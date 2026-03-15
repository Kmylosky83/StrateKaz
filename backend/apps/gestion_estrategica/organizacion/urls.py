"""
URLs para el módulo de Organización
Sistema de Gestión StrateKaz

Incluye:
- Áreas y Organigrama
- Caracterizaciones SIPOC
- Consecutivos (MC-002)
- Unidades de Medida (MC-001)
- Partes Interesadas (REORG-B3: movidas desde contexto)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AreaViewSet,
    CaracterizacionProcesoViewSet,
    OrganigramaView,
    OrganigramaNodePositionView,
)
from .viewsets_consecutivos import ConsecutivoConfigViewSet
from .viewsets_unidades import UnidadMedidaViewSet

# Partes Interesadas — modelos en contexto/, URLs montadas aquí (REORG-B3)
from apps.gestion_estrategica.contexto.views import (
    GrupoParteInteresadaViewSet,
    TipoParteInteresadaViewSet,
    ParteInteresadaViewSet,
    RequisitoParteInteresadaViewSet,
    MatrizComunicacionViewSet,
)

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'caracterizaciones', CaracterizacionProcesoViewSet, basename='caracterizacion')
router.register(r'consecutivos', ConsecutivoConfigViewSet, basename='consecutivo')
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')

# Partes Interesadas (ISO 9001:2015 §4.2)
router.register(r'grupos-parte-interesada', GrupoParteInteresadaViewSet, basename='grupo-parte-interesada')
router.register(r'tipos-parte-interesada', TipoParteInteresadaViewSet, basename='tipo-parte-interesada')
router.register(r'partes-interesadas', ParteInteresadaViewSet, basename='parte-interesada')
router.register(r'requisitos-pi', RequisitoParteInteresadaViewSet, basename='requisito-pi')
router.register(r'matriz-comunicacion', MatrizComunicacionViewSet, basename='matriz-comunicacion')

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint especial para el organigrama visual
    path('organigrama/', OrganigramaView.as_view(), name='organigrama'),
    path('organigrama/positions/', OrganigramaNodePositionView.as_view(), name='organigrama-positions'),
]
