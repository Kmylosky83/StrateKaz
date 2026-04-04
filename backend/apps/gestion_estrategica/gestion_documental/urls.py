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
    AceptacionDocumentalViewSet,
    TablaRetencionDocumentalViewSet,
)
from .views_export import export_documento_pdf, export_documento_docx

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

# Aceptación Documental (Lectura Verificada — Mejora 3)
router.register(r'aceptaciones', AceptacionDocumentalViewSet, basename='aceptacion')

# Tabla de Retención Documental (TRD — Sprint 2)
router.register(r'trd', TablaRetencionDocumentalViewSet, basename='trd')

urlpatterns = [
    # Export endpoints
    path('export/documento/<int:pk>/pdf/', export_documento_pdf, name='export-documento-pdf'),
    path('export/documento/<int:pk>/docx/', export_documento_docx, name='export-documento-docx'),
    # Router
    path('', include(router.urls)),
]
