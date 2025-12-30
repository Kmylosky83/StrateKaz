"""
URLs para gestion_clientes - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoClienteViewSet,
    EstadoClienteViewSet,
    CanalVentaViewSet,
    ClienteViewSet,
    ContactoClienteViewSet,
    SegmentoClienteViewSet,
    ClienteSegmentoViewSet,
    InteraccionClienteViewSet,
    ScoringClienteViewSet,
)

app_name = 'gestion_clientes'

router = DefaultRouter()

# Catálogos
router.register(r'tipos-cliente', TipoClienteViewSet, basename='tipos-cliente')
router.register(r'estados-cliente', EstadoClienteViewSet, basename='estados-cliente')
router.register(r'canales-venta', CanalVentaViewSet, basename='canales-venta')

# Entidades principales
router.register(r'clientes', ClienteViewSet, basename='clientes')
router.register(r'contactos', ContactoClienteViewSet, basename='contactos')

# Segmentación
router.register(r'segmentos', SegmentoClienteViewSet, basename='segmentos')
router.register(r'cliente-segmentos', ClienteSegmentoViewSet, basename='cliente-segmentos')

# Interacciones y Scoring
router.register(r'interacciones', InteraccionClienteViewSet, basename='interacciones')
router.register(r'scorings', ScoringClienteViewSet, basename='scorings')

urlpatterns = [
    path('', include(router.urls)),
]
