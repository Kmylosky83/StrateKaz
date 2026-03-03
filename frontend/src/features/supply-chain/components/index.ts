/**
 * Índice de componentes de Supply Chain
 */

// Proveedores
export { ProveedoresTable } from './ProveedoresTable';
export { ProveedorForm } from './ProveedorForm';
export { default as ImportProveedoresModal } from './ImportProveedoresModal';

// Evaluaciones
export { EvaluacionProveedorForm } from './EvaluacionProveedorForm';

// NOTA: Pruebas de Acidez → migradas a Production Ops (features/production-ops/components/)

// Tabs - Gestión de Proveedores
export { PreciosTab } from './PreciosTab';
export { EvaluacionesTab } from './EvaluacionesTab';
export { CatalogosTab } from './CatalogosTab';
export { UnidadesNegocioTab } from './UnidadesNegocioTab';

// Tabs - Supply Chain General
export { default as ProgramacionTab } from './ProgramacionTab';
export { default as ComprasTab } from './ComprasTab';
export { default as AlmacenamientoTab } from './AlmacenamientoTab';

// Modales CRUD
export { default as RequisicionFormModal } from './RequisicionFormModal';
export { default as MovimientoInventarioFormModal } from './MovimientoInventarioFormModal';
export { default as ProgramacionFormModal } from './ProgramacionFormModal';
