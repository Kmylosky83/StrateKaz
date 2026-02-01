"""
URLs para Compras - Supply Chain
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Catálogos dinámicos
    EstadoRequisicionViewSet,
    EstadoCotizacionViewSet,
    EstadoOrdenCompraViewSet,
    TipoContratoViewSet,
    PrioridadRequisicionViewSet,
    MonedaViewSet,
    EstadoContratoViewSet,
    EstadoMaterialViewSet,
    # Modelos principales
    RequisicionViewSet,
    CotizacionViewSet,
    OrdenCompraViewSet,
    ContratoViewSet,
    RecepcionCompraViewSet,
)

app_name = 'compras'

router = DefaultRouter()

# ==============================================================================
# RUTAS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

# Estados
router.register(
    r'estados-requisicion',
    EstadoRequisicionViewSet,
    basename='estado-requisicion'
)
router.register(
    r'estados-cotizacion',
    EstadoCotizacionViewSet,
    basename='estado-cotizacion'
)
router.register(
    r'estados-orden-compra',
    EstadoOrdenCompraViewSet,
    basename='estado-orden-compra'
)
router.register(
    r'estados-contrato',
    EstadoContratoViewSet,
    basename='estado-contrato'
)
router.register(
    r'estados-material',
    EstadoMaterialViewSet,
    basename='estado-material'
)

# Otros catálogos
router.register(
    r'prioridades-requisicion',
    PrioridadRequisicionViewSet,
    basename='prioridad-requisicion'
)
router.register(
    r'tipos-contrato',
    TipoContratoViewSet,
    basename='tipo-contrato'
)
router.register(
    r'monedas',
    MonedaViewSet,
    basename='moneda'
)

# ==============================================================================
# RUTAS DE MODELOS PRINCIPALES
# ==============================================================================

# Requisiciones de Compra
router.register(
    r'requisiciones',
    RequisicionViewSet,
    basename='requisicion'
)

# Cotizaciones
router.register(
    r'cotizaciones',
    CotizacionViewSet,
    basename='cotizacion'
)

# Órdenes de Compra
router.register(
    r'ordenes-compra',
    OrdenCompraViewSet,
    basename='orden-compra'
)

# Contratos
router.register(
    r'contratos',
    ContratoViewSet,
    basename='contrato'
)

# Recepciones de Compra
router.register(
    r'recepciones',
    RecepcionCompraViewSet,
    basename='recepcion'
)

urlpatterns = [
    path('', include(router.urls)),
]
