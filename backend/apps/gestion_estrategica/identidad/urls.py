"""
URLs del módulo Identidad Corporativa - Dirección Estratégica

Endpoints:
- /identidad/ - Identidad corporativa (misión, visión)
- /valores/ - Valores corporativos
- /alcances/ - Alcance del sistema de gestión
- /politicas-integrales/ - Políticas integrales con versionamiento
- /politicas-especificas/ - Políticas específicas por área/módulo
- /stats/ - Estadísticas de Dirección Estratégica
- /config/ - Configuración dinámica (estados, tipos, roles)
- /workflow/ - Sistema de firmas digitales y revisión periódica
- /export/ - Exportación de documentos PDF/DOCX
- /bi/ - Valores Vividos y métricas para Business Intelligence
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    AlcanceSistemaViewSet,
    PoliticaIntegralViewSet,
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
    export_politica_integral_pdf,
    export_politica_integral_docx,
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
router.register(r'politicas-integrales', PoliticaIntegralViewSet, basename='politica-integral')
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
    # Workflow de firmas digitales y revisión periódica
    path('workflow/', include('apps.gestion_estrategica.identidad.urls_workflow')),
    # Valores Vividos y métricas para Business Intelligence
    path('bi/', include('apps.gestion_estrategica.identidad.urls_valores_vividos')),
    # Endpoints de exportación
    path('export/politica-integral/<int:pk>/pdf/', export_politica_integral_pdf, name='export-politica-integral-pdf'),
    path('export/politica-integral/<int:pk>/docx/', export_politica_integral_docx, name='export-politica-integral-docx'),
    path('export/politica-especifica/<int:pk>/pdf/', export_politica_especifica_pdf, name='export-politica-especifica-pdf'),
    path('export/politica-especifica/<int:pk>/docx/', export_politica_especifica_docx, name='export-politica-especifica-docx'),
    path('export/identidad/<int:pk>/pdf/', export_identidad_completa_pdf, name='export-identidad-pdf'),
    path('export/identidad/<int:pk>/docx/', export_identidad_completa_docx, name='export-identidad-docx'),
]
