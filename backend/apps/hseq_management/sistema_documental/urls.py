"""
URLs para Sistema Documental - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoDocumentoViewSet,
    PlantillaDocumentoViewSet,
    DocumentoViewSet,
    VersionDocumentoViewSet,
    CampoFormularioViewSet,
    FirmaDocumentoViewSet,
    ControlDocumentalViewSet
)

app_name = 'sistema_documental'

router = DefaultRouter()

# Registrar ViewSets
router.register(r'tipos-documento', TipoDocumentoViewSet, basename='tipo-documento')
router.register(r'plantillas', PlantillaDocumentoViewSet, basename='plantilla')
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'versiones', VersionDocumentoViewSet, basename='version')
router.register(r'campos-formulario', CampoFormularioViewSet, basename='campo-formulario')
router.register(r'firmas', FirmaDocumentoViewSet, basename='firma')
router.register(r'controles', ControlDocumentalViewSet, basename='control')

urlpatterns = [
    path('', include(router.urls)),
]
