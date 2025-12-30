"""
URLs para Procesamiento de Materia Prima - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoProcesoViewSet,
    EstadoProcesoViewSet,
    LineaProduccionViewSet,
    OrdenProduccionViewSet,
    LoteProduccionViewSet,
    ConsumoMateriaPrimaViewSet,
    ControlCalidadProcesoViewSet
)

app_name = 'procesamiento'

# ==============================================================================
# ROUTER DE DRF
# ==============================================================================

router = DefaultRouter()

# Catálogos dinámicos
router.register(
    r'tipos-proceso',
    TipoProcesoViewSet,
    basename='tipoproceso'
)
router.register(
    r'estados-proceso',
    EstadoProcesoViewSet,
    basename='estadoproceso'
)

# Líneas de producción
router.register(
    r'lineas-produccion',
    LineaProduccionViewSet,
    basename='lineaproduccion'
)

# Órdenes de producción
router.register(
    r'ordenes-produccion',
    OrdenProduccionViewSet,
    basename='ordenproduccion'
)

# Lotes de producción
router.register(
    r'lotes-produccion',
    LoteProduccionViewSet,
    basename='loteproduccion'
)

# Consumos de materia prima
router.register(
    r'consumos-materia-prima',
    ConsumoMateriaPrimaViewSet,
    basename='consumomateriprima'
)

# Controles de calidad
router.register(
    r'controles-calidad',
    ControlCalidadProcesoViewSet,
    basename='controlcalidadproceso'
)

# ==============================================================================
# URL PATTERNS
# ==============================================================================

urlpatterns = [
    path('', include(router.urls)),
]

"""
ENDPOINTS DISPONIBLES:

CATÁLOGOS:
----------
GET    /api/procesamiento/tipos-proceso/                    - Listar tipos de proceso
POST   /api/procesamiento/tipos-proceso/                    - Crear tipo de proceso
GET    /api/procesamiento/tipos-proceso/{id}/               - Detalle de tipo
PUT    /api/procesamiento/tipos-proceso/{id}/               - Actualizar tipo
DELETE /api/procesamiento/tipos-proceso/{id}/               - Eliminar tipo

GET    /api/procesamiento/estados-proceso/                  - Listar estados
POST   /api/procesamiento/estados-proceso/                  - Crear estado
GET    /api/procesamiento/estados-proceso/{id}/             - Detalle de estado
PUT    /api/procesamiento/estados-proceso/{id}/             - Actualizar estado
DELETE /api/procesamiento/estados-proceso/{id}/             - Eliminar estado

LÍNEAS DE PRODUCCIÓN:
---------------------
GET    /api/procesamiento/lineas-produccion/                - Listar líneas
POST   /api/procesamiento/lineas-produccion/                - Crear línea
GET    /api/procesamiento/lineas-produccion/{id}/           - Detalle de línea
PUT    /api/procesamiento/lineas-produccion/{id}/           - Actualizar línea
DELETE /api/procesamiento/lineas-produccion/{id}/           - Eliminar línea

ÓRDENES DE PRODUCCIÓN:
----------------------
GET    /api/procesamiento/ordenes-produccion/               - Listar órdenes
POST   /api/procesamiento/ordenes-produccion/               - Crear orden
GET    /api/procesamiento/ordenes-produccion/{id}/          - Detalle de orden
PUT    /api/procesamiento/ordenes-produccion/{id}/          - Actualizar orden
DELETE /api/procesamiento/ordenes-produccion/{id}/          - Eliminar orden
POST   /api/procesamiento/ordenes-produccion/{id}/iniciar/  - Iniciar proceso
POST   /api/procesamiento/ordenes-produccion/{id}/finalizar/ - Finalizar proceso
GET    /api/procesamiento/ordenes-produccion/dashboard/     - Dashboard indicadores

LOTES DE PRODUCCIÓN:
--------------------
GET    /api/procesamiento/lotes-produccion/                 - Listar lotes
POST   /api/procesamiento/lotes-produccion/                 - Crear lote
GET    /api/procesamiento/lotes-produccion/{id}/            - Detalle de lote
PUT    /api/procesamiento/lotes-produccion/{id}/            - Actualizar lote
DELETE /api/procesamiento/lotes-produccion/{id}/            - Eliminar lote

CONSUMOS DE MATERIA PRIMA:
--------------------------
GET    /api/procesamiento/consumos-materia-prima/           - Listar consumos
POST   /api/procesamiento/consumos-materia-prima/           - Crear consumo
GET    /api/procesamiento/consumos-materia-prima/{id}/      - Detalle de consumo
PUT    /api/procesamiento/consumos-materia-prima/{id}/      - Actualizar consumo
DELETE /api/procesamiento/consumos-materia-prima/{id}/      - Eliminar consumo

CONTROLES DE CALIDAD:
---------------------
GET    /api/procesamiento/controles-calidad/                - Listar controles
POST   /api/procesamiento/controles-calidad/                - Crear control
GET    /api/procesamiento/controles-calidad/{id}/           - Detalle de control
PUT    /api/procesamiento/controles-calidad/{id}/           - Actualizar control
DELETE /api/procesamiento/controles-calidad/{id}/           - Eliminar control

FILTROS DISPONIBLES:
--------------------
Tipos de Proceso:
  ?activo=true/false
  ?requiere_temperatura=true/false
  ?requiere_presion=true/false
  ?solo_activos=true
  ?search=COCCION

Estados de Proceso:
  ?activo=true/false
  ?es_inicial=true/false
  ?es_final=true/false
  ?permite_edicion=true/false

Líneas de Producción:
  ?empresa={id}
  ?is_active=true/false
  ?solo_activas=true

Órdenes de Producción:
  ?empresa={id}
  ?tipo_proceso={id}
  ?linea_produccion={id}
  ?estado={id}
  ?prioridad=1-5
  ?responsable={id}
  ?fecha_desde=YYYY-MM-DD
  ?fecha_hasta=YYYY-MM-DD

Lotes de Producción:
  ?orden_produccion={id}
  ?fecha_produccion=YYYY-MM-DD
  ?operador={id}
  ?fecha_desde=YYYY-MM-DD
  ?fecha_hasta=YYYY-MM-DD

Consumos de Materia Prima:
  ?lote_produccion={id}
  ?tipo_materia_prima={id}

Controles de Calidad:
  ?lote_produccion={id}
  ?parametro=temperatura/presion/etc
  ?cumple=true/false
  ?verificado_por={id}
"""
