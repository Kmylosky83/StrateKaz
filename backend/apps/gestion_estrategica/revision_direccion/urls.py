"""
URLs para Revisión por la Dirección
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramaRevisionViewSet, ParticipanteRevisionViewSet,
    TemaRevisionViewSet, ActaRevisionViewSet,
    AnalisisTemaActaViewSet, CompromisoRevisionViewSet,
    SeguimientoCompromisoViewSet, RevisionDireccionStatsViewSet
)
from .views_export import export_acta_pdf, export_informe_gerencial_pdf

router = DefaultRouter()

# Programación
router.register(r'programaciones', ProgramaRevisionViewSet)
router.register(r'participantes', ParticipanteRevisionViewSet)
router.register(r'temas', TemaRevisionViewSet)

# Actas de Revisión
router.register(r'actas', ActaRevisionViewSet)
router.register(r'analisis-temas', AnalisisTemaActaViewSet)

# Seguimiento Compromisos
router.register(r'compromisos', CompromisoRevisionViewSet)
router.register(r'seguimientos', SeguimientoCompromisoViewSet)

# Estadísticas y Dashboard
router.register(r'stats', RevisionDireccionStatsViewSet, basename='stats')

# Crear instancia del ViewSet para usar en URLs manuales
stats_view = RevisionDireccionStatsViewSet.as_view({'get': 'list'})
dashboard_view = RevisionDireccionStatsViewSet.as_view({'get': 'dashboard'})
informe_consolidado_view = RevisionDireccionStatsViewSet.as_view({'get': 'informe_consolidado'})

urlpatterns = [
    # Export endpoints
    path('export/acta/<int:pk>/pdf/', export_acta_pdf, name='export-acta-pdf'),
    path('export/informe-gerencial/<int:pk>/pdf/', export_informe_gerencial_pdf, name='export-informe-gerencial-pdf'),
    # Router
    path('', include(router.urls)),
    # URLs adicionales para compatibilidad con frontend
    path('dashboard/', dashboard_view, name='revision-dashboard'),
    # Informe consolidado para Revisión por la Dirección (C3 aggregator)
    path('informe-consolidado/', informe_consolidado_view, name='informe-consolidado'),
]
