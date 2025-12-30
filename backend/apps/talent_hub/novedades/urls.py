"""
URLs para Novedades - Talent Hub

Configuración de rutas para incapacidades, licencias, permisos y vacaciones.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoIncapacidadViewSet,
    IncapacidadViewSet,
    TipoLicenciaViewSet,
    LicenciaViewSet,
    PermisoViewSet,
    PeriodoVacacionesViewSet,
    SolicitudVacacionesViewSet,
)

app_name = 'novedades'

router = DefaultRouter()

# Tipos
router.register(r'tipos-incapacidad', TipoIncapacidadViewSet, basename='tipo-incapacidad')
router.register(r'tipos-licencia', TipoLicenciaViewSet, basename='tipo-licencia')

# Incapacidades
router.register(r'incapacidades', IncapacidadViewSet, basename='incapacidad')

# Licencias
router.register(r'licencias', LicenciaViewSet, basename='licencia')

# Permisos
router.register(r'permisos', PermisoViewSet, basename='permiso')

# Vacaciones
router.register(r'periodos-vacaciones', PeriodoVacacionesViewSet, basename='periodo-vacaciones')
router.register(r'solicitudes-vacaciones', SolicitudVacacionesViewSet, basename='solicitud-vacaciones')

urlpatterns = [
    path('', include(router.urls)),
]
