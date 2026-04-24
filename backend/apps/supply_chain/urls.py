"""
URL Configuration for Supply Chain Module

Agrega las URLs de sub-apps LIVE del módulo Supply Chain:
- gestion_proveedores: Gestión de proveedores, catálogos, evaluaciones
- catalogos: TipoAlmacen, Almacen
- recepcion: VoucherRecepcion, RecepcionCalidad
- liquidaciones: Liquidacion
- almacenamiento: Inventarios, movimientos, kardex, alertas

Out-of-scope (no LIVE):
- compras: Requisiciones/cotizaciones/OC/contratos — deuda futura (S7+).
- programacion_abastecimiento: eliminada en S6 (2026-04-19 PM). Se recrea
  cuando el negocio la necesite con el modelo canónico (catalogo_productos).
"""
from django.urls import path, include


urlpatterns = [
    # Gestión de Proveedores (endpoints raíz: proveedores/, categorias-materia-prima/, etc.)
    path('', include('apps.supply_chain.gestion_proveedores.urls')),

    # Catálogos (Almacen, TipoAlmacen)
    path('catalogos/', include('apps.supply_chain.catalogos.urls')),

    # Recepción (VoucherRecepcion, RecepcionCalidad)
    path('recepcion/', include('apps.supply_chain.recepcion.urls')),

    # QC configurable (H-SC-11) — expuesto en root del SC para consumo
    # transversal (parametros-calidad/, rangos-calidad/, mediciones-calidad/,
    # voucher-lines/<id>/measurements/bulk/)
    path('', include('apps.supply_chain.recepcion.urls_qc_root')),

    # Liquidaciones — header en /liquidaciones/ + pagos en /pagos-liquidacion/ (root)
    path('liquidaciones/', include('apps.supply_chain.liquidaciones.urls')),
    path('', include('apps.supply_chain.liquidaciones.urls_pagos')),

    # Almacenamiento e Inventario
    path('almacenamiento/', include('apps.supply_chain.almacenamiento.urls')),
]
