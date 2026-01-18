"""
URLs para Gestión Documental - Gestión Estratégica (N1)

Endpoints:
- /tipos-documento/ - Catálogo de tipos de documentos
- /plantillas/ - Plantillas de documentos
- /campos-formulario/ - Form builder dinámico
- /documentos/ - Documentos del sistema
- /versiones/ - Historial de versiones
- /controles/ - Control documental (distribución, obsolescencia)

NOTA: Las firmas digitales están en /api/workflows/firma-digital/
(workflow_engine.firma_digital) usando GenericForeignKey.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoDocumentoViewSet,
    PlantillaDocumentoViewSet,
    CampoFormularioViewSet,
    DocumentoViewSet,
    VersionDocumentoViewSet,
    ControlDocumentalViewSet,
)

app_name = 'gestion_documental'

router = DefaultRouter()

# Catálogos
router.register(r'tipos-documento', TipoDocumentoViewSet, basename='tipo-documento')
router.register(r'plantillas', PlantillaDocumentoViewSet, basename='plantilla')
router.register(r'campos-formulario', CampoFormularioViewSet, basename='campo-formulario')

# Documentos
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'versiones', VersionDocumentoViewSet, basename='version')

# Control Documental
router.register(r'controles', ControlDocumentalViewSet, basename='control')

urlpatterns = [
    path('', include(router.urls)),
]
