/**
 * Índice de componentes de Supply Chain.
 *
 * Post refactor 2026-04-21 (Proveedor → CT):
 *   ELIMINADOS: ProveedoresTab/Table/Form, ImportProveedoresModal,
 *   EvaluacionesTab, EvaluacionProveedorForm.
 *   Proveedores ahora vive en @/features/catalogo-productos/components/.
 */

// Tabs LIVE
export { PreciosTab } from './PreciosTab';
export { CatalogosTab } from './CatalogosTab';
export { default as ComprasTab } from './ComprasTab';
export { default as AlmacenamientoTab } from './AlmacenamientoTab';
export { default as RecepcionTab } from './RecepcionTab';
export { default as LiquidacionesTab } from './LiquidacionesTab';
export { default as RutasRecoleccionTab } from './RutasRecoleccionTab';

// Modales CRUD
export { default as RequisicionFormModal } from './RequisicionFormModal';
export { default as MovimientoInventarioFormModal } from './MovimientoInventarioFormModal';
