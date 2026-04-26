"""
Signals de Catalogos — Supply Chain.

REFACTOR 2026-04-25 (H-SC-RUTA-02): el signal `sincronizar_proveedor_espejo_ruta`
fue eliminado. Creaba Proveedores espejo automáticos con NITs sintéticos
('RUTA-RUTA-XXX') que contaminaban el catálogo de proveedores y confundían
dos conceptos distintos:
  - La Ruta (recurso logístico de la empresa) NO es un Proveedor.
  - Los Proveedores son entidades externas con NIT real, vinculadas a
    una Ruta vía el modelo M2M `RutaParada`.

Este archivo se mantiene vacío por compatibilidad con `CatalogosConfig.ready()`.
"""
