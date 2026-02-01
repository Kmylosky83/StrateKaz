"""
URLs para Gestión de Flota - Logistics Fleet Management
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'gestion_flota'

# Router DRF
router = DefaultRouter()

# Catálogos
router.register(r'tipos-vehiculo', views.TipoVehiculoViewSet, basename='tipo-vehiculo')
router.register(r'estados-vehiculo', views.EstadoVehiculoViewSet, basename='estado-vehiculo')

# Vehículos
router.register(r'vehiculos', views.VehiculoViewSet, basename='vehiculo')

# Documentos y legales
router.register(r'documentos', views.DocumentoVehiculoViewSet, basename='documento-vehiculo')
router.register(r'hoja-vida', views.HojaVidaVehiculoViewSet, basename='hoja-vida')

# Mantenimiento
router.register(r'mantenimientos', views.MantenimientoVehiculoViewSet, basename='mantenimiento')

# Costos
router.register(r'costos', views.CostoOperacionViewSet, basename='costo-operacion')

# PESV - Verificaciones
router.register(r'verificaciones', views.VerificacionTerceroViewSet, basename='verificacion')

urlpatterns = [
    path('', include(router.urls)),
]
