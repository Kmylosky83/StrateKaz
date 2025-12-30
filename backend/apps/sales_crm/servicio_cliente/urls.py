"""
URLs para servicio_cliente - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoPQRSViewSet,
    EstadoPQRSViewSet,
    PrioridadPQRSViewSet,
    CanalRecepcionViewSet,
    NivelSatisfaccionViewSet,
    PQRSViewSet,
    SeguimientoPQRSViewSet,
    EncuestaSatisfaccionViewSet,
    PreguntaEncuestaViewSet,
    ProgramaFidelizacionViewSet,
    PuntosFidelizacionViewSet,
    MovimientoPuntosViewSet,
)

app_name = 'servicio_cliente'

router = DefaultRouter()

# Catálogos PQRS
router.register(r'tipos-pqrs', TipoPQRSViewSet, basename='tipos-pqrs')
router.register(r'estados-pqrs', EstadoPQRSViewSet, basename='estados-pqrs')
router.register(r'prioridades', PrioridadPQRSViewSet, basename='prioridades')
router.register(r'canales', CanalRecepcionViewSet, basename='canales')

# PQRS
router.register(r'pqrs', PQRSViewSet, basename='pqrs')
router.register(r'seguimientos-pqrs', SeguimientoPQRSViewSet, basename='seguimientos-pqrs')

# Encuestas de satisfacción
router.register(r'niveles-satisfaccion', NivelSatisfaccionViewSet, basename='niveles-satisfaccion')
router.register(r'encuestas', EncuestaSatisfaccionViewSet, basename='encuestas')
router.register(r'preguntas-encuesta', PreguntaEncuestaViewSet, basename='preguntas-encuesta')

# Programas de fidelización
router.register(r'programas-fidelizacion', ProgramaFidelizacionViewSet, basename='programas-fidelizacion')
router.register(r'puntos-fidelizacion', PuntosFidelizacionViewSet, basename='puntos-fidelizacion')
router.register(r'movimientos-puntos', MovimientoPuntosViewSet, basename='movimientos-puntos')

urlpatterns = [
    path('', include(router.urls)),
]
