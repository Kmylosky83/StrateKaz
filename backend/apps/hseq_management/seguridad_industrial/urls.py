"""
URLs para Seguridad Industrial
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoPermisoTrabajoViewSet, PermisoTrabajoViewSet,
    TipoInspeccionViewSet, PlantillaInspeccionViewSet, InspeccionViewSet,
    TipoEPPViewSet, EntregaEPPViewSet,
    ProgramaSeguridadViewSet
)

app_name = 'seguridad_industrial'

router = DefaultRouter()

# Permisos de Trabajo
router.register(r'tipos-permiso-trabajo', TipoPermisoTrabajoViewSet, basename='tipo-permiso-trabajo')
router.register(r'permisos-trabajo', PermisoTrabajoViewSet, basename='permiso-trabajo')

# Inspecciones
router.register(r'tipos-inspeccion', TipoInspeccionViewSet, basename='tipo-inspeccion')
router.register(r'plantillas-inspeccion', PlantillaInspeccionViewSet, basename='plantilla-inspeccion')
router.register(r'inspecciones', InspeccionViewSet, basename='inspeccion')

# EPP
router.register(r'tipos-epp', TipoEPPViewSet, basename='tipo-epp')
router.register(r'entregas-epp', EntregaEPPViewSet, basename='entrega-epp')

# Programas de Seguridad
router.register(r'programas-seguridad', ProgramaSeguridadViewSet, basename='programa-seguridad')

urlpatterns = [
    path('', include(router.urls)),
]
