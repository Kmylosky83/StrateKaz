"""
URLs para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .viewsets import (
    # Catálogos dinámicos (propios de Supply Chain)
    CategoriaMateriaPrimaViewSet,
    TipoMateriaPrimaViewSet,
    TipoProveedorViewSet,
    ModalidadLogisticaViewSet,
    FormaPagoViewSet,
    TipoCuentaBancariaViewSet,
    # NOTA: TipoDocumentoIdentidad, Departamento, Ciudad → migrados a Core (C0)
    # NOTA: PruebaAcidez → migrada a Production Ops Recepción
    # NOTA: UnidadNegocioViewSet → Migrado a Fundación (configuracion)
    # Modelos principales
    ProveedorViewSet,
    HistorialPrecioViewSet,
    CondicionComercialViewSet,
    # Evaluación
    CriterioEvaluacionViewSet,
    EvaluacionProveedorViewSet,
    DetalleEvaluacionViewSet,
)

app_name = 'gestion_proveedores'

router = DefaultRouter()

# ==============================================================================
# RUTAS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

# Categorías y Tipos de Materia Prima
router.register(
    r'categorias-materia-prima',
    CategoriaMateriaPrimaViewSet,
    basename='categoria-materia-prima'
)
router.register(
    r'tipos-materia-prima',
    TipoMateriaPrimaViewSet,
    basename='tipo-materia-prima'
)

# Tipos de Proveedor
router.register(
    r'tipos-proveedor',
    TipoProveedorViewSet,
    basename='tipo-proveedor'
)

# Modalidades Logísticas
router.register(
    r'modalidades-logistica',
    ModalidadLogisticaViewSet,
    basename='modalidad-logistica'
)

# Formas de Pago
router.register(
    r'formas-pago',
    FormaPagoViewSet,
    basename='forma-pago'
)

# Tipos de Cuenta Bancaria
router.register(
    r'tipos-cuenta-bancaria',
    TipoCuentaBancariaViewSet,
    basename='tipo-cuenta-bancaria'
)

# NOTA: tipos-documento, departamentos, ciudades → /api/core/ (migrados a C0)

# ==============================================================================
# RUTAS DE MODELOS PRINCIPALES
# ==============================================================================

# NOTA: Unidades de Negocio → Migrado a /api/fundacion/configuracion/unidades-negocio/

# Proveedores
router.register(
    r'proveedores',
    ProveedorViewSet,
    basename='proveedor'
)

# Historial de Precios (solo lectura)
router.register(
    r'historial-precios',
    HistorialPrecioViewSet,
    basename='historial-precio'
)

# Condiciones Comerciales
router.register(
    r'condiciones-comerciales',
    CondicionComercialViewSet,
    basename='condicion-comercial'
)

# NOTA: pruebas-acidez → /api/production-ops/recepcion/ (migrada a Production Ops)

# ==============================================================================
# RUTAS DE EVALUACIÓN DE PROVEEDORES
# ==============================================================================

# Criterios de Evaluación
router.register(
    r'criterios-evaluacion',
    CriterioEvaluacionViewSet,
    basename='criterio-evaluacion'
)

# Evaluaciones de Proveedor
router.register(
    r'evaluaciones-proveedor',
    EvaluacionProveedorViewSet,
    basename='evaluacion-proveedor'
)

# Detalles de Evaluación
router.register(
    r'detalles-evaluacion',
    DetalleEvaluacionViewSet,
    basename='detalle-evaluacion'
)

urlpatterns = [
    path('', include(router.urls)),
]
