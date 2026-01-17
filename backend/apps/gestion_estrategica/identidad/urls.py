"""
URLs del módulo Identidad Corporativa - Dirección Estratégica

Endpoints:
- /identidad/ - Identidad corporativa (misión, visión)
- /valores/ - Valores corporativos
- /alcances/ - Alcance del sistema de gestión
- /politicas-especificas/ - Políticas (integrales y específicas) - v3.1 unificado
- /stats/ - Estadísticas de Dirección Estratégica
- /config/ - Configuración dinámica (estados, tipos, roles)
- /export/ - Exportación de documentos PDF/DOCX
- /bi/ - Valores Vividos y métricas para Business Intelligence

NOTA v3.1: /politicas-integrales/ ha sido eliminado.
Use /politicas-especificas/?is_integral_policy=true para políticas integrales.

NOTA Fase 0.3.4: /workflow/ ha sido eliminado. Los endpoints de firma digital
están centralizados en /api/workflow-engine/firma-digital/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    AlcanceSistemaViewSet,
    PoliticaEspecificaViewSet,
)
from .views_stats import StrategicStatsViewSet
from .views_config import (
    EstadoPoliticaViewSet,
    TipoPoliticaViewSet,
    RolFirmanteViewSet,
    EstadoFirmaViewSet,
    ConfiguracionIdentidadViewSet,
)
from .views_export import (
    export_politica_especifica_pdf,
    export_politica_especifica_docx,
    export_identidad_completa_pdf,
    export_identidad_completa_docx,
)

app_name = 'identidad'

router = DefaultRouter()
router.register(r'identidad', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'valores', CorporateValueViewSet, basename='corporate-values')
router.register(r'alcances', AlcanceSistemaViewSet, basename='alcance-sistema')
router.register(r'politicas-especificas', PoliticaEspecificaViewSet, basename='politica-especifica')
router.register(r'stats', StrategicStatsViewSet, basename='strategic-stats')

# Router para configuración dinámica
config_router = DefaultRouter()
config_router.register(r'estados-politica', EstadoPoliticaViewSet, basename='estado-politica')
config_router.register(r'tipos-politica', TipoPoliticaViewSet, basename='tipo-politica')
config_router.register(r'roles-firmante', RolFirmanteViewSet, basename='rol-firmante')
config_router.register(r'estados-firma', EstadoFirmaViewSet, basename='estado-firma')
config_router.register(r'all', ConfiguracionIdentidadViewSet, basename='config-all')

urlpatterns = [
    path('', include(router.urls)),
    # Configuración dinámica (estados, tipos, roles)
    path('config/', include(config_router.urls)),
    # Fase 0.3.4: Workflow de firmas ahora en workflow_engine (rutas centralizadas)
    # Los endpoints de firma están en /api/workflow-engine/firma-digital/
    # Valores Vividos y métricas para Business Intelligence
    path('bi/', include('apps.gestion_estrategica.identidad.urls_valores_vividos')),
    # Endpoints de exportación (v3.1: politica-integral eliminado, usar politica-especifica)
    path('export/politica-especifica/<int:pk>/pdf/', export_politica_especifica_pdf, name='export-politica-especifica-pdf'),
    path('export/politica-especifica/<int:pk>/docx/', export_politica_especifica_docx, name='export-politica-especifica-docx'),
    path('export/identidad/<int:pk>/pdf/', export_identidad_completa_pdf, name='export-identidad-pdf'),
    path('export/identidad/<int:pk>/docx/', export_identidad_completa_docx, name='export-identidad-docx'),
]
