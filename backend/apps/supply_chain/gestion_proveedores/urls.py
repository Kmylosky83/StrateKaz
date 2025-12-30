"""
URLs para Gestión de Proveedores - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .viewsets import (
    # Catálogos dinámicos
    CategoriaMateriaPrimaViewSet,
    TipoMateriaPrimaViewSet,
    TipoProveedorViewSet,
    ModalidadLogisticaViewSet,
    FormaPagoViewSet,
    TipoCuentaBancariaViewSet,
    TipoDocumentoIdentidadViewSet,
    DepartamentoViewSet,
    CiudadViewSet,
    # Modelos principales
    UnidadNegocioViewSet,
    ProveedorViewSet,
    HistorialPrecioViewSet,
    CondicionComercialViewSet,
    PruebaAcidezViewSet,
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

# Tipos de Documento de Identidad
router.register(
    r'tipos-documento',
    TipoDocumentoIdentidadViewSet,
    basename='tipo-documento'
)

# Departamentos y Ciudades
router.register(
    r'departamentos',
    DepartamentoViewSet,
    basename='departamento'
)
router.register(
    r'ciudades',
    CiudadViewSet,
    basename='ciudad'
)

# ==============================================================================
# RUTAS DE MODELOS PRINCIPALES
# ==============================================================================

# Unidades de Negocio
router.register(
    r'unidades-negocio',
    UnidadNegocioViewSet,
    basename='unidad-negocio'
)

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

# Pruebas de Acidez
router.register(
    r'pruebas-acidez',
    PruebaAcidezViewSet,
    basename='prueba-acidez'
)

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
