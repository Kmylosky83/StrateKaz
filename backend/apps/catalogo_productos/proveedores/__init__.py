"""
Sub-paquete de Proveedores dentro de Catálogo de Productos (CT-layer).

Los modelos viven en el app `catalogo_productos` (app_label único).
Este sub-paquete es SOLO organización de código, no una sub-app.

Decisión arquitectónica 2026-04-21 (Refactor Proveedor a CT):
  Proveedor es dato maestro multi-industria que varios C2 consumen
  (supply_chain, sales_crm, accounting). Por eso vive en CT, no en SC.

Ver: docs/history/2026-04-21-refactor-proveedor-a-ct.md
"""
