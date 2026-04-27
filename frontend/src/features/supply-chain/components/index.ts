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
// H-SC-RUTA-02
export { default as VoucherRecoleccionTab } from './VoucherRecoleccionTab';
export { default as VoucherRecoleccionFormModal } from './VoucherRecoleccionFormModal';
export { default as RutaParadasModal } from './RutaParadasModal';
// Fase 1 QC + Inventario
export { default as ParametrosCalidadTab } from './ParametrosCalidadTab';
export { default as InventarioTab } from './InventarioTab';

// Almacenes (CRUD global, H-SC-E2E-01)
export { default as AlmacenesTab } from './AlmacenesTab';
export { default as AlmacenFormModal } from './AlmacenFormModal';

// Modales CRUD
export { default as RequisicionFormModal } from './RequisicionFormModal';
export { default as MovimientoInventarioFormModal } from './MovimientoInventarioFormModal';
export { default as ParametroCalidadFormModal } from './ParametroCalidadFormModal';
export { default as RangoCalidadFormModal } from './RangoCalidadFormModal';
export { default as AlmacenDashboardModal } from './AlmacenDashboardModal';
export { default as QcLineaSection } from './QcLineaSection';

// Liquidaciones (H-SC-12)
export { default as LiquidacionDetailModal } from './LiquidacionDetailModal';
export { default as LiquidacionAjustesModal } from './LiquidacionAjustesModal';
export { default as PagoLiquidacionFormModal } from './PagoLiquidacionFormModal';
