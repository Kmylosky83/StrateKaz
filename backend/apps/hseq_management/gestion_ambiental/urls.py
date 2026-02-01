"""
URLs para Gestión Ambiental - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoResiduoViewSet,
    GestorAmbientalViewSet,
    RegistroResiduoViewSet,
    VertimientoViewSet,
    FuenteEmisionViewSet,
    RegistroEmisionViewSet,
    TipoRecursoViewSet,
    ConsumoRecursoViewSet,
    CalculoHuellaCarbonoViewSet,
    CertificadoAmbientalViewSet,
)

app_name = 'gestion_ambiental'

router = DefaultRouter()

# Residuos
router.register(r'tipos-residuos', TipoResiduoViewSet, basename='tipo-residuo')
router.register(r'gestores', GestorAmbientalViewSet, basename='gestor-ambiental')
router.register(r'residuos', RegistroResiduoViewSet, basename='registro-residuo')

# Vertimientos
router.register(r'vertimientos', VertimientoViewSet, basename='vertimiento')

# Emisiones
router.register(r'fuentes-emision', FuenteEmisionViewSet, basename='fuente-emision')
router.register(r'emisiones', RegistroEmisionViewSet, basename='registro-emision')

# Consumo de Recursos
router.register(r'tipos-recursos', TipoRecursoViewSet, basename='tipo-recurso')
router.register(r'consumos', ConsumoRecursoViewSet, basename='consumo-recurso')

# Huella de Carbono
router.register(r'huella-carbono', CalculoHuellaCarbonoViewSet, basename='huella-carbono')

# Certificados
router.register(r'certificados', CertificadoAmbientalViewSet, basename='certificado-ambiental')

urlpatterns = [
    path('', include(router.urls)),
]
