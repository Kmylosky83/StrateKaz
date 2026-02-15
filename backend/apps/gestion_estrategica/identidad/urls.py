"""
URLs del módulo Identidad Corporativa - Dirección Estratégica

Endpoints:
- /identidad/ - Identidad corporativa (misión, visión)
- /valores/ - Valores corporativos
- /alcances/ - Alcance del sistema de gestión
- /stats/ - Estadísticas de Dirección Estratégica
- /config/ - Configuración dinámica (estados, tipos, roles)
- /export/ - Exportación de documentos PDF/DOCX
- /bi/ - Valores Vividos y métricas para Business Intelligence

NOTA: Las políticas se gestionan desde Gestión Documental (tipo_documento=POL).
Identidad solo muestra políticas vigentes como referencia read-only.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    AlcanceSistemaViewSet,
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
    export_identidad_completa_pdf,
    export_identidad_completa_docx,
)

app_name = 'identidad'

router = DefaultRouter()
router.register(r'identidad', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'valores', CorporateValueViewSet, basename='corporate-values')
router.register(r'alcances', AlcanceSistemaViewSet, basename='alcance-sistema')
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
    # Valores Vividos y métricas para Business Intelligence
    path('bi/', include('apps.gestion_estrategica.identidad.urls_valores_vividos')),
    # Exportación de identidad
    path('export/identidad/<int:pk>/pdf/', export_identidad_completa_pdf, name='export-identidad-pdf'),
    path('export/identidad/<int:pk>/docx/', export_identidad_completa_docx, name='export-identidad-docx'),
]
